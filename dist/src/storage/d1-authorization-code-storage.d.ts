/**
 * D1 Database Authorization Code Storage
 *
 * Production-ready implementation using Cloudflare D1 with:
 * - Atomic operations
 * - PKCE challenge persistence
 * - Prepared statements
 * - Automatic expiry handling
 */
export interface AuthorizationCodeData {
    clientId: string;
    redirectUri: string;
    userId: string;
    scopes: string[];
    expiresAt: number;
    codeChallenge?: string;
    challengeMethod?: string;
}
export interface AuthorizationCodeStorage {
    storeCode(code: string, clientId: string, redirectUri: string, userId: string, scopes: string[], expiresAt: number, codeChallenge?: string, challengeMethod?: string): Promise<void>;
    retrieveAndDeleteCode(code: string): Promise<AuthorizationCodeData | null>;
}
/**
 * D1 Database Implementation of Authorization Code Storage
 *
 * Security Features:
 * - Atomic retrieveAndDelete using D1 batch transactions
 * - Prepared statements with parameter binding (SQL injection prevention)
 * - Automatic expiry validation
 * - One-time use enforcement
 */
export declare class D1AuthorizationCodeStorage implements AuthorizationCodeStorage {
    private db;
    private tenantId;
    constructor(db: D1Database, tenantId?: string);
    /**
     * Store authorization code with PKCE challenge
     *
     * @param code - Authorization code
     * @param clientId - OAuth client ID
     * @param redirectUri - Redirect URI used in authorization
     * @param userId - User ID who authorized
     * @param scopes - Granted scopes
     * @param expiresAt - Unix timestamp when code expires
     * @param codeChallenge - PKCE code challenge (CRITICAL: must be stored)
     * @param challengeMethod - PKCE challenge method (S256)
     */
    storeCode(code: string, clientId: string, redirectUri: string, userId: string, scopes: string[], expiresAt: number, codeChallenge?: string, challengeMethod?: string): Promise<void>;
    /**
     * Retrieve and delete authorization code atomically
     *
     * Security Features:
     * - Atomic operation prevents race conditions
     * - One-time use enforcement
     * - Automatic expiry validation
     * - Returns PKCE challenge for validation
     *
     * @param code - Authorization code to retrieve
     * @returns Authorization code data or null if not found/expired
     */
    retrieveAndDeleteCode(code: string): Promise<AuthorizationCodeData | null>;
    /**
     * Cleanup expired authorization codes (maintenance operation)
     * Should be called periodically via cron job
     */
    cleanupExpiredCodes(): Promise<number>;
}
