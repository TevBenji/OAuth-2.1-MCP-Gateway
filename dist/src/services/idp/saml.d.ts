/**
 * SAML Federation Handler
 *
 * Handles SAML 2.0 federation with external identity providers.
 */
import { IdPConfig } from '../../types/idp';
/**
 * SAML Federation Service
 */
export declare class SAMLFederationService {
    /**
     * Build SAML authentication request (AuthnRequest)
     */
    buildAuthnRequest(config: IdPConfig, requestId: string, redirectUri: string, relayState?: string): string;
    /**
     * Encode SAML AuthnRequest for HTTP-Redirect binding
     */
    private encodeAuthnRequest;
    /**
     * Build SAML authentication URL
     */
    buildAuthenticationUrl(config: IdPConfig, requestId: string, redirectUri: string, relayState?: string): string;
    /**
     * Parse SAML response
     */
    parseSAMLResponse(samlResponse: string): Promise<Record<string, any>>;
    /**
     * Extract attributes from SAML response
     * Note: This is a simplified implementation. In production, use a proper XML parser.
     */
    private extractSAMLAttributes;
    /**
     * Verify SAML response signature
     * Note: This is a placeholder. In production, implement proper XML signature verification.
     */
    verifySAMLSignature(samlResponse: string, certificate: string): Promise<boolean>;
    /**
     * Process SAML callback
     */
    processCallback(config: IdPConfig, samlResponse: string, relayState?: string): Promise<Record<string, any>>;
    /**
     * Normalize SAML attributes to standard format
     */
    private normalizeSAMLAttributes;
    /**
     * Build SAML logout request
     */
    buildLogoutRequest(config: IdPConfig, requestId: string, nameId: string, sessionIndex?: string): string;
    /**
     * Build SAML logout URL
     */
    buildLogoutUrl(config: IdPConfig, requestId: string, nameId: string, sessionIndex?: string, relayState?: string): string;
}
