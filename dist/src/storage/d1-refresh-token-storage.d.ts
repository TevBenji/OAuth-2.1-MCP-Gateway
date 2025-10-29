/**
 * D1 Database Refresh Token Storage
 *
 * Production-ready implementation with:
 * - Token rotation support
 * - Secure token hashing
 * - Atomic operations
 * - Automatic expiry handling
 */
export interface RefreshTokenData {
    clientId: string;
    userId: string;
    scopes: string[];
    expiresAt: number;
    rotatedRefreshToken?: string;
}
export interface RefreshTokenStorage {
    storeRefreshToken(refreshToken: string, accessToken: string, clientId: string, userId: string, scopes: string[], expiresAt: number): Promise<void>;
    retrieveAndDeleteRefreshToken(refreshToken: string): Promise<RefreshTokenData | null>;
}
/**
 * D1 Database Implementation of Refresh Token Storage
 *
 * Security Features:
 * - Token hashing (SHA-256) before storage
 * - Atomic retrieve and delete
 * - Refresh token rotation support
 * - Automatic expiry validation
 */
export declare class D1RefreshTokenStorage implements RefreshTokenStorage {
    private db;
    private tenantId;
    constructor(db: D1Database, tenantId?: string);
    /**
     * Store refresh token with secure hashing
     *
     * Security: Tokens are hashed before storage to prevent leakage
     */
    storeRefreshToken(refreshToken: string, accessToken: string, clientId: string, userId: string, scopes: string[], expiresAt: number): Promise<void>;
    /**
     * Retrieve and delete refresh token atomically
     *
     * Security: Atomic operation prevents reuse attacks
     */
    retrieveAndDeleteRefreshToken(refreshToken: string): Promise<RefreshTokenData | null>;
    /**
     * Revoke a refresh token (for logout/security)
     */
    revokeRefreshToken(refreshToken: string): Promise<boolean>;
    /**
     * Cleanup expired refresh tokens (maintenance)
     */
    cleanupExpiredTokens(): Promise<number>;
    /**
     * Hash token using SHA-256
     * Security: Prevents token leakage from database
     */
    private hashToken;
}
