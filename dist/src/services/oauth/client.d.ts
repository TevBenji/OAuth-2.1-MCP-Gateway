/**
 * OAuth Client Management Service
 *
 * Handles client registration, validation, and management for OAuth 2.1
 * with multi-tenant support and security features.
 */
import type { ClientRegistrationRequest, ClientRegistrationResponse, OAuthClient } from '@/types/oauth';
/**
 * OAuth Client Service
 */
export declare class ClientService {
    private db;
    constructor(db: D1Database);
    /**
     * Register a new OAuth client with secure ID generation
     */
    registerClient(request: ClientRegistrationRequest, tenantId: string): Promise<ClientRegistrationResponse>;
    /**
     * Retrieve client by client_id with tenant isolation
     */
    getClient(clientId: string, tenantId?: string): Promise<OAuthClient | null>;
    /**
     * Validate client credentials
     */
    validateClient(clientId: string, clientSecret?: string, tenantId?: string): Promise<boolean>;
    /**
     * Check if redirect URI is registered for client
     */
    isValidRedirectUri(clientId: string, redirectUri: string, tenantId?: string): Promise<boolean>;
    /**
     * Update client registration (for future use)
     */
    updateClient(clientId: string, updates: Partial<ClientRegistrationRequest>, tenantId: string): Promise<ClientRegistrationResponse | null>;
    /**
     * Delete client registration
     */
    deleteClient(clientId: string, tenantId: string): Promise<boolean>;
    /**
     * Generate secure client_id with prefix
     */
    private generateClientId;
    /**
     * Generate secure client_secret
     */
    private generateClientSecret;
    /**
     * Store client in database
     */
    private storeClient;
    /**
     * Constant-time string comparison to prevent timing attacks
     */
    private constantTimeCompare;
}
