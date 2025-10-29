/**
 * D1-Backed Authorization Code Storage Implementation
 *
 * Provides persistent, secure storage for OAuth 2.1 authorization codes
 * with PKCE challenge support and automatic expiration handling.
 *
 * Security Features:
 * - Atomic retrieve-and-delete operations
 * - PKCE challenge persistence
 * - TTL-based automatic expiration
 * - Tenant isolation
 * - SQL injection prevention via parameterized queries
 */
export interface AuthorizationCodeData {
    clientId: string;
    redirectUri: string;
    userId: string;
    scopes: string[];
    expiresAt: number;
    codeChallenge?: string;
    challengeMethod?: string;
    tenantId: string;
}
export interface AuthorizationCodeStorage {
    storeCode(code: string, clientId: string, redirectUri: string, userId: string, scopes: string[], expiresAt: number, codeChallenge?: string, challengeMethod?: string, tenantId?: string): Promise<void>;
    retrieveAndDeleteCode(code: string, tenantId?: string): Promise<AuthorizationCodeData | null>;
}
/**
 * D1 Database Implementation of Authorization Code Storage
 *
 * Uses Cloudflare D1 for persistent, durable storage with proper
 * transaction semantics and automatic cleanup.
 */
export declare class AuthorizationCodeStorageD1 implements AuthorizationCodeStorage {
    private db;
    constructor(db: D1Database);
    /**
     * Store authorization code with PKCE challenge
     *
     * Security measures:
     * - Parameterized query prevents SQL injection
     * - PKCE challenge and method stored with code
     * - TTL enforced via expires_at timestamp
     * - Tenant isolation through tenant_id
     */
    storeCode(code: string, clientId: string, redirectUri: string, userId: string, scopes: string[], expiresAt: number, codeChallenge?: string, challengeMethod?: string, tenantId?: string): Promise<void>;
    /**
     * Retrieve and delete authorization code atomically
     *
     * Security measures:
     * - Atomic retrieve-and-delete prevents replay attacks
     * - Automatic expiration check
     * - Tenant isolation enforced
     * - Returns null for expired or non-existent codes
     *
     * Implementation note:
     * D1 doesn't support true transactions, so we use batch operations
     * to approximate atomic behavior. The window between SELECT and DELETE
     * is minimized but not zero.
     */
    retrieveAndDeleteCode(code: string, tenantId?: string): Promise<AuthorizationCodeData | null>;
    /**
     * Delete authorization code
     *
     * Private helper method for code cleanup
     */
    private deleteCode;
    /**
     * Cleanup expired authorization codes
     *
     * Should be called periodically to remove expired codes
     * and prevent database bloat.
     */
    cleanupExpiredCodes(): Promise<number>;
    /**
     * Generate unique ID for database record
     */
    private generateId;
}
/**
 * Factory function to create D1 storage instance
 */
export declare function createAuthorizationCodeStorage(db: D1Database): AuthorizationCodeStorage;
