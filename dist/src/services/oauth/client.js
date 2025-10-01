/**
 * OAuth Client Management Service
 *
 * Handles client registration, validation, and management for OAuth 2.1
 * with multi-tenant support and security features.
 */
// UUID v4 generation using Web Crypto API (edge-compatible)
function generateUUID() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    // Set version (4) and variant bits
    array[6] = (array[6] & 0x0f) | 0x40; // Version 4
    array[8] = (array[8] & 0x3f) | 0x80; // Variant 10
    // Convert to hex string with hyphens
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
import { OAUTH_CONSTANTS, DATABASE_CONSTANTS } from '../../utils/constants';
export class ClientService {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Register a new OAuth client with secure ID generation
     */
    async registerClient(request, tenantId) {
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
        const clientData = {
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
        const response = {
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
    async getClient(clientId, tenantId) {
        let query = `
      SELECT * FROM ${DATABASE_CONSTANTS.TABLES.OAUTH_CLIENTS}
      WHERE client_id = ?
    `;
        const params = [clientId];
        if (tenantId) {
            query += ' AND tenant_id = ?';
            params.push(tenantId);
        }
        const result = await this.db.prepare(query).bind(...params).first();
        if (!result) {
            return null;
        }
        // Parse JSON arrays
        return {
            ...result,
            redirect_uris: JSON.parse(result.redirect_uris),
            grant_types: JSON.parse(result.grant_types),
            response_types: JSON.parse(result.response_types),
            contacts: result.contacts ? JSON.parse(result.contacts) : undefined
        };
    }
    /**
     * Validate client credentials
     */
    async validateClient(clientId, clientSecret, tenantId) {
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
    async isValidRedirectUri(clientId, redirectUri, tenantId) {
        const client = await this.getClient(clientId, tenantId);
        if (!client) {
            return false;
        }
        return client.redirect_uris.includes(redirectUri);
    }
    /**
     * Update client registration (for future use)
     */
    async updateClient(clientId, updates, tenantId) {
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
    async deleteClient(clientId, tenantId) {
        const result = await this.db
            .prepare(`DELETE FROM ${DATABASE_CONSTANTS.TABLES.OAUTH_CLIENTS} WHERE client_id = ? AND tenant_id = ?`)
            .bind(clientId, tenantId)
            .run();
        return result.changes > 0;
    }
    /**
     * Generate secure client_id with prefix
     */
    generateClientId() {
        const uuid = generateUUID().replace(/-/g, '');
        return `mcp_client_${uuid}`;
    }
    /**
     * Generate secure client_secret
     */
    generateClientSecret() {
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
    async storeClient(client) {
        const now = new Date().toISOString();
        await this.db
            .prepare(`
        INSERT OR REPLACE INTO ${DATABASE_CONSTANTS.TABLES.OAUTH_CLIENTS} (
          client_id, client_secret, tenant_id, redirect_uris, grant_types,
          response_types, scope, client_name, client_uri, logo_uri,
          contacts, tos_uri, policy_uri, token_endpoint_auth_method,
          client_id_issued_at, client_secret_expires_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
            .bind(client.client_id, client.client_secret, client.tenant_id, JSON.stringify(client.redirect_uris), JSON.stringify(client.grant_types), JSON.stringify(client.response_types), client.scope, client.client_name, client.client_uri, client.logo_uri, client.contacts ? JSON.stringify(client.contacts) : null, client.tos_uri, client.policy_uri, client.token_endpoint_auth_method, client.client_id_issued_at, client.client_secret_expires_at, now, now)
            .run();
    }
    /**
     * Constant-time string comparison to prevent timing attacks
     */
    async constantTimeCompare(a, b) {
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
