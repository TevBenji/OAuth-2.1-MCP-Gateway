/**
 * OAuth Client Management Service
 * 
 * Handles client registration, validation, and management for OAuth 2.1
 * with multi-tenant support and security features.
 */

import { and, eq } from 'drizzle-orm';
import { oauthClients, type Db } from '@oauth-mcp-gateway/db';
import type { ClientRegistrationRequest, ClientRegistrationResponse, OAuthClient } from '@/types/oauth';
import { OAUTH_CONSTANTS } from '@/utils/constants';

/**
 * OAuth Client Service
 */
export class ClientService {
  constructor(private db: Db) {}

  /**
   * Register a new OAuth client with secure ID generation
   */
  async registerClient(
    request: ClientRegistrationRequest,
    tenantId: string
  ): Promise<ClientRegistrationResponse> {
    const now = Math.floor(Date.now() / 1000);
    
    // Generate secure client_id
    const clientId = this.generateClientId();
    
    // Determine if client_secret is needed
    const authMethod = request.token_endpoint_auth_method || 'client_secret_post';
    const clientSecret = authMethod !== 'none' ? this.generateClientSecret() : undefined;
    
    // Set default values
    const grantTypes = request.grant_types || [
      OAUTH_CONSTANTS.GRANT_TYPES.AUTHORIZATION_CODE,
      OAUTH_CONSTANTS.GRANT_TYPES.REFRESH_TOKEN
    ];
    
    const responseTypes = request.response_types || [OAUTH_CONSTANTS.RESPONSE_TYPES.CODE];
    
    // Calculate client_secret expiration (optional, set to 1 year if secret exists)
    const clientSecretExpiresAt = clientSecret ? now + (365 * 24 * 60 * 60) : undefined;
    
    // Prepare client data
    const clientData: Omit<OAuthClient, 'created_at' | 'updated_at'> = {
      client_id: clientId,
      client_secret: clientSecret,
      tenant_id: tenantId,
      redirect_uris: request.redirect_uris,
      grant_types: grantTypes,
      response_types: responseTypes,
      scope: request.scope,
      client_name: request.client_name,
      client_uri: request.client_uri,
      logo_uri: request.logo_uri,
      contacts: request.contacts,
      tos_uri: request.tos_uri,
      policy_uri: request.policy_uri,
      token_endpoint_auth_method: authMethod,
      client_id_issued_at: now,
      client_secret_expires_at: clientSecretExpiresAt
    };
    
    // Store client in database
    await this.storeClient(clientData);
    
    // Return registration response
    const response: ClientRegistrationResponse = {
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: now,
      client_secret_expires_at: clientSecretExpiresAt,
      redirect_uris: request.redirect_uris,
      grant_types: grantTypes,
      response_types: responseTypes,
      client_name: request.client_name,
      client_uri: request.client_uri,
      logo_uri: request.logo_uri,
      scope: request.scope,
      contacts: request.contacts,
      tos_uri: request.tos_uri,
      policy_uri: request.policy_uri,
      token_endpoint_auth_method: authMethod
    };
    
    return response;
  }

  /**
   * Retrieve client by client_id with tenant isolation
   */
  async getClient(clientId: string, tenantId?: string): Promise<OAuthClient | null> {
    const where = tenantId
      ? and(eq(oauthClients.clientId, clientId), eq(oauthClients.tenantId, tenantId))
      : eq(oauthClients.clientId, clientId);

    const [row] = await this.db.select().from(oauthClients).where(where).limit(1);
    if (!row) {
      return null;
    }

    return {
      client_id: row.clientId,
      client_secret: row.clientSecret ?? undefined,
      tenant_id: row.tenantId,
      redirect_uris: row.redirectUris,
      grant_types: row.grantTypes,
      response_types: row.responseTypes,
      scope: row.scope ?? undefined,
      client_name: row.clientName ?? undefined,
      client_uri: row.clientUri ?? undefined,
      logo_uri: row.logoUri ?? undefined,
      contacts: row.contacts ?? undefined,
      tos_uri: row.tosUri ?? undefined,
      policy_uri: row.policyUri ?? undefined,
      token_endpoint_auth_method: row.tokenEndpointAuthMethod,
      client_id_issued_at: Math.floor(row.clientIdIssuedAt.getTime() / 1000),
      client_secret_expires_at: row.clientSecretExpiresAt
        ? Math.floor(row.clientSecretExpiresAt.getTime() / 1000)
        : undefined,
      created_at: row.createdAt.toISOString(),
      updated_at: row.updatedAt.toISOString(),
    };
  }

  /**
   * Validate client credentials
   */
  async validateClient(
    clientId: string,
    clientSecret?: string,
    tenantId?: string
  ): Promise<boolean> {
    const client = await this.getClient(clientId, tenantId);
    
    if (!client) {
      return false;
    }
    
    // Check if client_secret is required
    if (client.token_endpoint_auth_method !== 'none') {
      if (!clientSecret || !client.client_secret) {
        return false;
      }
      
      // Constant-time comparison to prevent timing attacks
      return await this.constantTimeCompare(clientSecret, client.client_secret);
    }
    
    return true;
  }

  /**
   * Check if redirect URI is registered for client
   */
  async isValidRedirectUri(clientId: string, redirectUri: string, tenantId?: string): Promise<boolean> {
    const client = await this.getClient(clientId, tenantId);
    
    if (!client) {
      return false;
    }
    
    return client.redirect_uris.includes(redirectUri);
  }

  /**
   * Update client registration (for future use)
   */
  async updateClient(
    clientId: string,
    updates: Partial<ClientRegistrationRequest>,
    tenantId: string
  ): Promise<ClientRegistrationResponse | null> {
    const existingClient = await this.getClient(clientId, tenantId);
    
    if (!existingClient) {
      return null;
    }
    
    // Update fields
    const updatedClient = {
      ...existingClient,
      ...updates,
      updated_at: new Date()
    };
    
    await this.storeClient(updatedClient);
    
    // Return updated response
    return {
      client_id: updatedClient.client_id,
      client_secret: updatedClient.client_secret,
      client_id_issued_at: updatedClient.client_id_issued_at,
      client_secret_expires_at: updatedClient.client_secret_expires_at,
      redirect_uris: updatedClient.redirect_uris,
      grant_types: updatedClient.grant_types,
      response_types: updatedClient.response_types,
      client_name: updatedClient.client_name,
      client_uri: updatedClient.client_uri,
      logo_uri: updatedClient.logo_uri,
      scope: updatedClient.scope,
      contacts: updatedClient.contacts,
      tos_uri: updatedClient.tos_uri,
      policy_uri: updatedClient.policy_uri,
      token_endpoint_auth_method: updatedClient.token_endpoint_auth_method
    };
  }

  /**
   * Delete client registration
   */
  async deleteClient(clientId: string, tenantId: string): Promise<boolean> {
    const rows = await this.db
      .delete(oauthClients)
      .where(and(eq(oauthClients.clientId, clientId), eq(oauthClients.tenantId, tenantId)))
      .returning({ clientId: oauthClients.clientId });
    return rows.length > 0;
  }

  /**
   * Generate secure client_id with prefix
   */
  private generateClientId(): string {
    const uuid = crypto.randomUUID().replace(/-/g, '');
    return `mcp_client_${uuid}`;
  }

  /**
   * Generate secure client_secret
   */
  private generateClientSecret(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    
    // Convert to base64url
    let binary = '';
    for (let i = 0; i < array.length; i++) {
      const byte = array[i];
      if (byte !== undefined) {
        binary += String.fromCharCode(byte);
      }
    }
    
    const base64 = btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return `mcp_secret_${base64}`;
  }

  /**
   * Store client in database
   */
  private async storeClient(client: Omit<OAuthClient, 'created_at' | 'updated_at'>): Promise<void> {
    const values = {
      clientId: client.client_id,
      clientSecret: client.client_secret ?? null,
      tenantId: client.tenant_id,
      redirectUris: client.redirect_uris,
      grantTypes: client.grant_types,
      responseTypes: client.response_types,
      scope: client.scope ?? null,
      clientName: client.client_name ?? null,
      clientUri: client.client_uri ?? null,
      logoUri: client.logo_uri ?? null,
      contacts: client.contacts ?? null,
      tosUri: client.tos_uri ?? null,
      policyUri: client.policy_uri ?? null,
      tokenEndpointAuthMethod:
        client.token_endpoint_auth_method as 'none' | 'client_secret_post' | 'client_secret_basic',
      clientType: (client.token_endpoint_auth_method === 'none'
        ? 'public'
        : 'confidential') as 'public' | 'confidential',
      clientIdIssuedAt: new Date(client.client_id_issued_at * 1000),
      clientSecretExpiresAt: client.client_secret_expires_at
        ? new Date(client.client_secret_expires_at * 1000)
        : null,
    };

    await this.db
      .insert(oauthClients)
      .values(values)
      .onConflictDoUpdate({ target: oauthClients.clientId, set: values });
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private async constantTimeCompare(a: string, b: string): Promise<boolean> {
    if (a.length !== b.length) {
      return false;
    }
    
    // Use Web Crypto API for constant-time comparison
    const encoder = new TextEncoder();
    const aBytes = encoder.encode(a);
    const bBytes = encoder.encode(b);
    
    // Simple XOR comparison (not cryptographically secure but better than ===)
    let result = 0;
    for (let i = 0; i < aBytes.length; i++) {
      result |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
    }
    
    return result === 0;
  }
}