/**
 * OIDC Federation Handler
 *
 * Handles OpenID Connect federation with external identity providers.
 */
import { type JWTPayload } from 'jose';
import { IdPConfig, IdPAuthRequest, OIDCDiscoveryMetadata, IdPProvider } from '../../types/idp';
/**
 * OIDC Federation Service
 */
export declare class OIDCFederationService {
    /**
     * Discover OIDC configuration from issuer
     */
    discoverConfiguration(issuer: string): Promise<OIDCDiscoveryMetadata>;
    /**
     * Build authorization URL
     */
    buildAuthorizationUrl(config: IdPConfig, request: IdPAuthRequest): string;
    /**
     * Exchange authorization code for tokens
     */
    exchangeCode(config: IdPConfig, code: string, redirectUri: string, codeVerifier?: string): Promise<{
        access_token: string;
        id_token: string;
        refresh_token?: string;
        expires_in: number;
    }>;
    /**
     * Verify and decode ID token
     */
    verifyIdToken(config: IdPConfig, idToken: string, nonce?: string): Promise<JWTPayload>;
    /**
     * Fetch user info from userinfo endpoint
     */
    fetchUserInfo(config: IdPConfig, accessToken: string): Promise<Record<string, any>>;
    /**
     * Process OIDC callback and return user claims
     */
    processCallback(config: IdPConfig, code: string, redirectUri: string, state: string, nonce?: string, codeVerifier?: string): Promise<Record<string, any>>;
    /**
     * Provider-specific claim extraction
     */
    extractProviderClaims(provider: IdPProvider, claims: Record<string, any>): Record<string, any>;
    /**
     * Extract Auth0-specific claims
     */
    private extractAuth0Claims;
    /**
     * Extract Okta-specific claims
     */
    private extractOktaClaims;
    /**
     * Extract Microsoft Entra (Azure AD) claims
     */
    private extractMicrosoftEntraClaims;
}
