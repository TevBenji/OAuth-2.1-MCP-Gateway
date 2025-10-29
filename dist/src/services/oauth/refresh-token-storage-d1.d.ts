/**
 * D1-Backed Refresh Token Storage Implementation
 *
 * Provides persistent, secure storage for OAuth 2.1 refresh tokens
 * with automatic rotation and expiration handling.
 *
 * Security Features:
 * - Atomic retrieve-and-delete for token rotation
 * - TTL-based automatic expiration
 * - Tenant isolation
 * - SQL injection prevention via parameterized queries
 * - Refresh token rotation support
 */
export interface RefreshTokenData {
    clientId: string;
    userId: string;
    scopes: string[];
    expiresAt: number;
    tenantId: string;
    rotatedRefreshToken?: string;
}
export interface RefreshTokenStorage {
    storeRefreshToken(refreshToken: string, accessToken: string, clientId: string, userId: string, scopes: string[], expiresAt: number, tenantId?: string): Promise<void>;
    retrieveAndDeleteRefreshToken(refreshToken: string, tenantId?: string): Promise<RefreshTokenData | null>;
    revokeRefreshToken(refreshToken: string, tenantId?: string): Promise<boolean>;
}
/**
 * D1 Database Implementation of Refresh Token Storage
 *
 * Uses Cloudflare D1 for persistent, durable storage with proper
 * token rotation semantics and automatic cleanup.
 */
export declare class RefreshTokenStorageD1 implements RefreshTokenStorage {
    private db;
    constructor(db: D1Database);
    /**
     * Store refresh token
     *
     * Security measures:
     * - Parameterized query prevents SQL injection
     * - Access token ID stored for audit trail
     * - TTL enforced via expires_at timestamp
     * - Tenant isolation through tenant_id
     */
    storeRefreshToken(refreshToken: string, accessToken: string, clientId: string, userId: string, scopes: string[], expiresAt: number, tenantId?: string): Promise<void>;
    /**
     * Retrieve and delete refresh token atomically
     *
     * Security measures:
     * - Atomic retrieve-and-delete implements token rotation
     * - Automatic expiration check
     * - Tenant isolation enforced
     * - Returns null for expired or non-existent tokens
     *
     * Implementation note:
     * Implements OAuth 2.1 refresh token rotation by deleting
     * the old token immediately upon use.
     */
    retrieveAndDeleteRefreshToken(refreshToken: string, tenantId?: string): Promise<RefreshTokenData | null>;
    /**
     * Revoke refresh token
     *
     * Allows explicit token revocation for logout or security purposes
     */
    revokeRefreshToken(refreshToken: string, tenantId?: string): Promise<boolean>;
    /**
     * Delete refresh token
     *
     * Private helper method for token cleanup
     */
    private deleteRefreshToken;
    /**
     * Revoke all refresh tokens for a user
     *
     * Useful for logout-all-sessions functionality
     */
    revokeUserRefreshTokens(userId: string, tenantId?: string): Promise<number>;
    /**
     * Cleanup expired refresh tokens
     *
     * Should be called periodically to remove expired tokens
     * and prevent database bloat.
     */
    cleanupExpiredTokens(): Promise<number>;
    /**
     * Generate unique ID for database record
     */
    private generateId;
    /**
     * Hash token for storage reference
     *
     * Creates a SHA-256 hash of the token for secure reference storage
     */
    private hashToken;
}
/**
 * Factory function to create D1 storage instance
 */
export declare function createRefreshTokenStorage(db: D1Database): RefreshTokenStorage;
