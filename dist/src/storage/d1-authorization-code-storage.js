/**
 * D1 Database Authorization Code Storage
 *
 * Production-ready implementation using Cloudflare D1 with:
 * - Atomic operations
 * - PKCE challenge persistence
 * - Prepared statements
 * - Automatic expiry handling
 */
import { DATABASE_CONSTANTS } from '../utils/constants';
/**
 * D1 Database Implementation of Authorization Code Storage
 *
 * Security Features:
 * - Atomic retrieveAndDelete using D1 batch transactions
 * - Prepared statements with parameter binding (SQL injection prevention)
 * - Automatic expiry validation
 * - One-time use enforcement
 */
export class D1AuthorizationCodeStorage {
    db;
    tenantId;
    constructor(db, tenantId = 'default-tenant') {
        this.db = db;
        this.tenantId = tenantId;
    }
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
    async storeCode(code, clientId, redirectUri, userId, scopes, expiresAt, codeChallenge, challengeMethod) {
        // Security: Use prepared statements with .bind() to prevent SQL injection
        await this.db
            .prepare(`
        INSERT INTO ${DATABASE_CONSTANTS.TABLES.AUTHORIZATION_CODES} (
          code,
          client_id,
          user_id,
          tenant_id,
          redirect_uri,
          scope,
          code_challenge,
          code_challenge_method,
          expires_at,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
            .bind(code, clientId, userId, this.tenantId, redirectUri, scopes.join(' '), codeChallenge || null, challengeMethod || null, new Date(expiresAt).toISOString())
            .run();
    }
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
    async retrieveAndDeleteCode(code) {
        try {
            // Security: Atomic batch transaction ensures code is used only once
            const results = await this.db.batch([
                // Step 1: Retrieve the code with PKCE data
                this.db
                    .prepare(`
            SELECT
              client_id,
              redirect_uri,
              user_id,
              scope,
              expires_at,
              code_challenge,
              code_challenge_method,
              used_at
            FROM ${DATABASE_CONSTANTS.TABLES.AUTHORIZATION_CODES}
            WHERE code = ? AND tenant_id = ?
          `)
                    .bind(code, this.tenantId),
                // Step 2: Mark as used and delete (atomic operation)
                this.db
                    .prepare(`
            UPDATE ${DATABASE_CONSTANTS.TABLES.AUTHORIZATION_CODES}
            SET used_at = datetime('now')
            WHERE code = ? AND tenant_id = ?
          `)
                    .bind(code, this.tenantId),
                // Step 3: Delete the code (one-time use)
                this.db
                    .prepare(`
            DELETE FROM ${DATABASE_CONSTANTS.TABLES.AUTHORIZATION_CODES}
            WHERE code = ? AND tenant_id = ?
          `)
                    .bind(code, this.tenantId),
            ]);
            // Extract result from first query
            const result = results[0].results[0];
            if (!result) {
                return null;
            }
            // Security: Check if code was already used
            if (result.used_at) {
                console.warn(`Authorization code reuse attempt detected: ${code}`);
                return null;
            }
            // Security: Validate expiry
            const expiresAt = new Date(result.expires_at).getTime();
            if (expiresAt < Date.now()) {
                console.warn(`Expired authorization code used: ${code}`);
                return null;
            }
            // Parse scopes
            const scopes = result.scope ? result.scope.split(' ') : [];
            // Return code data with PKCE challenge
            return {
                clientId: result.client_id,
                redirectUri: result.redirect_uri,
                userId: result.user_id,
                scopes,
                expiresAt,
                codeChallenge: result.code_challenge,
                challengeMethod: result.code_challenge_method,
            };
        }
        catch (error) {
            console.error('Error retrieving authorization code:', error);
            return null;
        }
    }
    /**
     * Cleanup expired authorization codes (maintenance operation)
     * Should be called periodically via cron job
     */
    async cleanupExpiredCodes() {
        const result = await this.db
            .prepare(`
        DELETE FROM ${DATABASE_CONSTANTS.TABLES.AUTHORIZATION_CODES}
        WHERE expires_at < datetime('now')
      `)
            .run();
        return result.meta.changes;
    }
}
