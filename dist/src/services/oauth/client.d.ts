/**
 * OAuth Client Management Service
 *
 * Handles client registration, validation, and management for OAuth 2.1
 * with multi-tenant support and security features.
 */
import type { ClientRegistrationRequest, ClientRegistrationResponse } from '../../types/oauth';
export interface OAuthClient {
    client_id: string;
    client_secret?: string;
    tenant_id: string;
    redirect_uris: string[];
    grant_types: string[];
    response_types: string[];
    scope?: string;
    client_name?: string;
    client_uri?: string;
    logo_uri?: string;
    contacts?: string[];
    tos_uri?: string;
    policy_uri?: string;
    token_endpoint_auth_method: string;
    client_id_issued_at: number;
    client_secret_expires_at?: number;
    created_at: Date;
    updated_at: Date;
}
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
