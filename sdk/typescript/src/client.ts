/**
 * OAuth 2.1 MCP Gateway Client
 */

import {
  OAuthClientConfig,
  AuthorizeOptions,
  TokenResponse,
  TokenIntrospection,
  ClientRegistrationRequest,
  ClientRegistrationResponse,
  MCPRequestOptions,
  MCPResponse,
  DiscoveryMetadata,
} from './types';
import { parseOAuthError, NetworkError, TokenExpiredError } from './errors';
import { generatePKCEPair, generateState } from './pkce';

/**
 * OAuth 2.1 MCP Gateway Client
 */
export class OAuthMCPClient {
  private config: OAuthClientConfig;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiry?: number;
  private codeVerifier?: string;

  constructor(config: OAuthClientConfig) {
    this.config = {
      scopes: ['mcp:read', 'mcp:write'],
      ...config,
    };
  }

  /**
   * Discover OAuth server metadata
   */
  async discover(): Promise<DiscoveryMetadata> {
    try {
      const url = `${this.config.gatewayUrl}/.well-known/oauth-authorization-server`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Discovery failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new NetworkError(
        'Failed to discover OAuth metadata',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get authorization URL for browser redirect
   */
  async getAuthorizationUrl(options: AuthorizeOptions = {}): Promise<{
    url: string;
    state: string;
    codeVerifier: string;
  }> {
    // Generate PKCE parameters
    const { verifier, challenge } = await generatePKCEPair();
    this.codeVerifier = verifier;

    // Generate state
    const state = options.state || generateState();

    // Build authorization URL
    const scopes = [
      ...(this.config.scopes || []),
      ...(options.additionalScopes || []),
    ];

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: scopes.join(' '),
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    if (options.resource) {
      params.set('resource', options.resource);
    }

    if (this.config.tenantId) {
      params.set('tenant_id', this.config.tenantId);
    }

    const metadata = await this.discover();
    const url = `${metadata.authorization_endpoint}?${params.toString()}`;

    return { url, state, codeVerifier: verifier };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(
    code: string,
    codeVerifier?: string
  ): Promise<TokenResponse> {
    const verifier = codeVerifier || this.codeVerifier;
    if (!verifier) {
      throw new Error('Code verifier is required');
    }

    try {
      const metadata = await this.discover();
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        code_verifier: verifier,
      });

      if (this.config.clientSecret) {
        body.set('client_secret', this.config.clientSecret);
      }

      const response = await fetch(metadata.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw parseOAuthError(data);
      }

      // Store tokens
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;

      return data;
    } catch (error) {
      if (error instanceof Error && error.name.includes('Error')) {
        throw error;
      }
      throw new NetworkError(
        'Failed to exchange authorization code',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken?: string): Promise<TokenResponse> {
    const token = refreshToken || this.refreshToken;
    if (!token) {
      throw new Error('Refresh token is required');
    }

    try {
      const metadata = await this.discover();
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token,
        client_id: this.config.clientId,
      });

      if (this.config.clientSecret) {
        body.set('client_secret', this.config.clientSecret);
      }

      const response = await fetch(metadata.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw parseOAuthError(data);
      }

      // Update stored tokens
      this.accessToken = data.access_token;
      if (data.refresh_token) {
        this.refreshToken = data.refresh_token;
      }
      this.tokenExpiry = Date.now() + data.expires_in * 1000;

      return data;
    } catch (error) {
      if (error instanceof Error && error.name.includes('Error')) {
        throw error;
      }
      throw new NetworkError(
        'Failed to refresh access token',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Revoke token
   */
  async revokeToken(token?: string, tokenTypeHint?: 'access_token' | 'refresh_token'): Promise<void> {
    const tokenToRevoke = token || this.accessToken;
    if (!tokenToRevoke) {
      throw new Error('Token is required');
    }

    try {
      const metadata = await this.discover();
      if (!metadata.revocation_endpoint) {
        throw new Error('Revocation endpoint not available');
      }

      const body = new URLSearchParams({
        token: tokenToRevoke,
        client_id: this.config.clientId,
      });

      if (tokenTypeHint) {
        body.set('token_type_hint', tokenTypeHint);
      }

      if (this.config.clientSecret) {
        body.set('client_secret', this.config.clientSecret);
      }

      const response = await fetch(metadata.revocation_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw parseOAuthError(data);
      }

      // Clear stored tokens if revoking current token
      if (token === this.accessToken || !token) {
        this.accessToken = undefined;
        this.tokenExpiry = undefined;
      }
      if (tokenTypeHint === 'refresh_token' || token === this.refreshToken) {
        this.refreshToken = undefined;
      }
    } catch (error) {
      if (error instanceof Error && error.name.includes('Error')) {
        throw error;
      }
      throw new NetworkError(
        'Failed to revoke token',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Introspect token
   */
  async introspectToken(token?: string): Promise<TokenIntrospection> {
    const tokenToIntrospect = token || this.accessToken;
    if (!tokenToIntrospect) {
      throw new Error('Token is required');
    }

    try {
      const metadata = await this.discover();
      if (!metadata.introspection_endpoint) {
        throw new Error('Introspection endpoint not available');
      }

      const body = new URLSearchParams({
        token: tokenToIntrospect,
        client_id: this.config.clientId,
      });

      if (this.config.clientSecret) {
        body.set('client_secret', this.config.clientSecret);
      }

      const response = await fetch(metadata.introspection_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw parseOAuthError(data);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name.includes('Error')) {
        throw error;
      }
      throw new NetworkError(
        'Failed to introspect token',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Register new OAuth client dynamically
   */
  static async register(
    gatewayUrl: string,
    registration: ClientRegistrationRequest
  ): Promise<ClientRegistrationResponse> {
    try {
      const discoveryUrl = `${gatewayUrl}/.well-known/oauth-authorization-server`;
      const discoveryResponse = await fetch(discoveryUrl);
      const metadata = await discoveryResponse.json();

      if (!metadata.registration_endpoint) {
        throw new Error('Dynamic client registration not supported');
      }

      const response = await fetch(metadata.registration_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registration),
      });

      const data = await response.json();

      if (!response.ok) {
        throw parseOAuthError(data);
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name.includes('Error')) {
        throw error;
      }
      throw new NetworkError(
        'Failed to register client',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Make authenticated MCP request
   */
  async mcpRequest<T = any>(options: MCPRequestOptions): Promise<MCPResponse<T>> {
    // Ensure we have a valid token
    await this.ensureValidToken();

    const url = options.server
      ? `${this.config.gatewayUrl}/mcp/${options.server}`
      : `${this.config.gatewayUrl}/mcp`;

    try {
      const controller = new AbortController();
      const timeout = options.timeout || 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          method: options.method,
          params: options.params,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new TokenExpiredError();
        }
        throw parseOAuthError(data);
      }

      return data;
    } catch (error) {
      if (error instanceof Error && error.name.includes('Error')) {
        throw error;
      }
      throw new NetworkError(
        'MCP request failed',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Set access token manually
   */
  setAccessToken(token: string, expiresIn?: number): void {
    this.accessToken = token;
    if (expiresIn) {
      this.tokenExpiry = Date.now() + expiresIn * 1000;
    }
  }

  /**
   * Set refresh token manually
   */
  setRefreshToken(token: string): void {
    this.refreshToken = token;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | undefined {
    return this.accessToken;
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | undefined {
    return this.refreshToken;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (!this.tokenExpiry) {
      return true;
    }
    // Add 60 second buffer
    return Date.now() >= this.tokenExpiry - 60000;
  }

  /**
   * Ensure valid token (refresh if needed)
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('No access token available. Please authenticate first.');
    }

    if (this.isTokenExpired() && this.refreshToken) {
      await this.refreshAccessToken();
    } else if (this.isTokenExpired()) {
      throw new TokenExpiredError();
    }
  }
}
