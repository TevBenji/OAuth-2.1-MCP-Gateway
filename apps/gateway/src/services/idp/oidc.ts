/**
 * OIDC Federation Handler
 *
 * Handles OpenID Connect federation with external identity providers.
 */

import { jwtVerify, createRemoteJWKSet, type JWTPayload } from 'jose';
import {
  IdPConfig,
  IdPAuthRequest,
  IdPAuthResponse,
  OIDCDiscoveryMetadata,
  IdPError,
  IdPErrorCode,
  IdPProvider,
} from '../../types/idp';

/**
 * OIDC Federation Service
 */
export class OIDCFederationService {
  /**
   * Discover OIDC configuration from issuer
   */
  async discoverConfiguration(issuer: string): Promise<OIDCDiscoveryMetadata> {
    try {
      // Normalize issuer URL
      const issuerUrl = issuer.endsWith('/') ? issuer.slice(0, -1) : issuer;
      const discoveryUrl = `${issuerUrl}/.well-known/openid-configuration`;

      const response = await fetch(discoveryUrl);

      if (!response.ok) {
        throw new IdPError(
          IdPErrorCode.DISCOVERY_FAILED,
          `Failed to fetch OIDC discovery document: ${response.statusText}`
        );
      }

      const metadata = (await response.json()) as OIDCDiscoveryMetadata;

      // Validate required fields
      if (
        !metadata.issuer ||
        !metadata.authorization_endpoint ||
        !metadata.token_endpoint ||
        !metadata.jwks_uri
      ) {
        throw new IdPError(
          IdPErrorCode.DISCOVERY_FAILED,
          'Invalid OIDC discovery document: missing required fields'
        );
      }

      return metadata;
    } catch (error) {
      if (error instanceof IdPError) {
        throw error;
      }
      throw new IdPError(
        IdPErrorCode.DISCOVERY_FAILED,
        `OIDC discovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { issuer }
      );
    }
  }

  /**
   * Build authorization URL
   */
  buildAuthorizationUrl(config: IdPConfig, request: IdPAuthRequest): string {
    if (!config.oidc_config) {
      throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, 'OIDC configuration not found');
    }

    const oidcConfig = config.oidc_config;
    const params = new URLSearchParams({
      client_id: oidcConfig.client_id,
      redirect_uri: request.redirect_uri,
      response_type: oidcConfig.response_type,
      scope: (request.scope || oidcConfig.scopes).join(' '),
      state: request.state,
    });

    if (request.nonce) {
      params.set('nonce', request.nonce);
    }

    if (request.code_challenge && request.code_challenge_method) {
      params.set('code_challenge', request.code_challenge);
      params.set('code_challenge_method', request.code_challenge_method);
    }

    if (oidcConfig.response_mode) {
      params.set('response_mode', oidcConfig.response_mode);
    }

    // Provider-specific parameters
    if (config.provider === IdPProvider.AUTH0) {
      params.set('audience', oidcConfig.issuer);
    }

    const authEndpoint = oidcConfig.authorization_endpoint || `${oidcConfig.issuer}/authorize`;
    return `${authEndpoint}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(
    config: IdPConfig,
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<{
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {
    if (!config.oidc_config) {
      throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, 'OIDC configuration not found');
    }

    const oidcConfig = config.oidc_config;
    const tokenEndpoint = oidcConfig.token_endpoint || `${oidcConfig.issuer}/oauth/token`;

    try {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: oidcConfig.client_id,
        client_secret: oidcConfig.client_secret,
      });

      if (codeVerifier) {
        body.set('code_verifier', codeVerifier);
      }

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as { error_description?: string };
        throw new IdPError(
          IdPErrorCode.TOKEN_EXCHANGE_FAILED,
          `Token exchange failed: ${error.error_description || response.statusText}`,
          error as Record<string, any>
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof IdPError) {
        throw error;
      }
      throw new IdPError(
        IdPErrorCode.TOKEN_EXCHANGE_FAILED,
        `Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify and decode ID token
   */
  async verifyIdToken(config: IdPConfig, idToken: string, nonce?: string): Promise<JWTPayload> {
    if (!config.oidc_config) {
      throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, 'OIDC configuration not found');
    }

    const oidcConfig = config.oidc_config;

    try {
      const jwksUri = oidcConfig.jwks_uri || `${oidcConfig.issuer}/.well-known/jwks.json`;
      const JWKS = createRemoteJWKSet(new URL(jwksUri));

      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: oidcConfig.issuer,
        audience: oidcConfig.client_id,
      });

      // Verify nonce if provided
      if (nonce && payload.nonce !== nonce) {
        throw new IdPError(IdPErrorCode.INVALID_TOKEN, 'ID token nonce mismatch');
      }

      // Verify expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        throw new IdPError(IdPErrorCode.INVALID_TOKEN, 'ID token expired');
      }

      return payload;
    } catch (error) {
      if (error instanceof IdPError) {
        throw error;
      }
      throw new IdPError(
        IdPErrorCode.INVALID_TOKEN,
        `ID token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetch user info from userinfo endpoint
   */
  async fetchUserInfo(config: IdPConfig, accessToken: string): Promise<Record<string, any>> {
    if (!config.oidc_config) {
      throw new IdPError(IdPErrorCode.INVALID_CONFIGURATION, 'OIDC configuration not found');
    }

    const oidcConfig = config.oidc_config;
    const userinfoEndpoint = oidcConfig.userinfo_endpoint || `${oidcConfig.issuer}/userinfo`;

    try {
      const response = await fetch(userinfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new IdPError(
          IdPErrorCode.USERINFO_FAILED,
          `Userinfo request failed: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof IdPError) {
        throw error;
      }
      throw new IdPError(
        IdPErrorCode.USERINFO_FAILED,
        `Userinfo fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Process OIDC callback and return user claims
   */
  async processCallback(
    config: IdPConfig,
    code: string,
    redirectUri: string,
    state: string,
    nonce?: string,
    codeVerifier?: string
  ): Promise<Record<string, any>> {
    // Exchange code for tokens
    const tokens = await this.exchangeCode(config, code, redirectUri, codeVerifier);

    // Verify and decode ID token
    const idTokenClaims = await this.verifyIdToken(config, tokens.id_token, nonce);

    // Fetch additional user info if available
    let userInfo: Record<string, any> = {};
    if (config.oidc_config?.userinfo_endpoint || config.oidc_config?.issuer) {
      try {
        userInfo = await this.fetchUserInfo(config, tokens.access_token);
      } catch (error) {
        // Userinfo is optional, continue with ID token claims only
        console.warn('Failed to fetch userinfo:', error);
      }
    }

    // Merge claims (userinfo takes precedence)
    return {
      ...idTokenClaims,
      ...userInfo,
    };
  }

  /**
   * Provider-specific claim extraction
   */
  extractProviderClaims(provider: IdPProvider, claims: Record<string, any>): Record<string, any> {
    switch (provider) {
      case IdPProvider.AUTH0:
        return this.extractAuth0Claims(claims);
      case IdPProvider.OKTA:
        return this.extractOktaClaims(claims);
      case IdPProvider.MICROSOFT_ENTRA:
        return this.extractMicrosoftEntraClaims(claims);
      default:
        return claims;
    }
  }

  /**
   * Extract Auth0-specific claims
   */
  private extractAuth0Claims(claims: Record<string, any>): Record<string, any> {
    return {
      user_id: claims.sub,
      email: claims.email,
      email_verified: claims.email_verified || false,
      name: claims.name,
      given_name: claims.given_name,
      family_name: claims.family_name,
      picture: claims.picture,
      roles: claims['https://your-app.com/roles'] || claims.roles || [],
      metadata: claims['https://your-app.com/user_metadata'] || {},
    };
  }

  /**
   * Extract Okta-specific claims
   */
  private extractOktaClaims(claims: Record<string, any>): Record<string, any> {
    return {
      user_id: claims.sub,
      email: claims.email,
      email_verified: claims.email_verified || false,
      name: claims.name,
      given_name: claims.given_name,
      family_name: claims.family_name,
      picture: claims.picture,
      roles: claims.groups || [],
      preferred_username: claims.preferred_username,
    };
  }

  /**
   * Extract Microsoft Entra (Azure AD) claims
   */
  private extractMicrosoftEntraClaims(claims: Record<string, any>): Record<string, any> {
    return {
      user_id: claims.oid || claims.sub,
      email: claims.email || claims.preferred_username,
      email_verified: true, // Microsoft validates emails
      name: claims.name,
      given_name: claims.given_name,
      family_name: claims.family_name,
      picture: claims.picture,
      roles: claims.roles || [],
      tenant_id: claims.tid,
      unique_name: claims.unique_name,
    };
  }
}
