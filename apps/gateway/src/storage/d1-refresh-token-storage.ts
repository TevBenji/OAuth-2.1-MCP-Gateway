/**
 * D1 Database Refresh Token Storage
 *
 * Production-ready implementation with:
 * - Token rotation support
 * - Secure token hashing
 * - Atomic operations
 * - Automatic expiry handling
 */

import { DATABASE_CONSTANTS } from '../utils/constants';

// Refresh token data
export interface RefreshTokenData {
  clientId: string;
  userId: string;
  scopes: string[];
  expiresAt: number;
  rotatedRefreshToken?: string;
}

// Refresh token storage interface
export interface RefreshTokenStorage {
  storeRefreshToken(
    refreshToken: string,
    accessToken: string,
    clientId: string,
    userId: string,
    scopes: string[],
    expiresAt: number
  ): Promise<void>;

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
export class D1RefreshTokenStorage implements RefreshTokenStorage {
  constructor(private db: D1Database, private tenantId: string = 'default-tenant') {}

  /**
   * Store refresh token with secure hashing
   *
   * Security: Tokens are hashed before storage to prevent leakage
   */
  async storeRefreshToken(
    refreshToken: string,
    accessToken: string,
    clientId: string,
    userId: string,
    scopes: string[],
    expiresAt: number
  ): Promise<void> {
    // Hash the refresh token for secure storage
    const tokenHash = await this.hashToken(refreshToken);

    await this.db
      .prepare(`
        INSERT INTO ${DATABASE_CONSTANTS.TABLES.REFRESH_TOKENS} (
          token_hash,
          client_id,
          user_id,
          tenant_id,
          scope,
          expires_at,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(
        tokenHash,
        clientId,
        userId,
        this.tenantId,
        scopes.join(' '),
        new Date(expiresAt).toISOString()
      )
      .run();
  }

  /**
   * Retrieve and delete refresh token atomically
   *
   * Security: Atomic operation prevents reuse attacks
   */
  async retrieveAndDeleteRefreshToken(refreshToken: string): Promise<RefreshTokenData | null> {
    try {
      // Hash the token for lookup
      const tokenHash = await this.hashToken(refreshToken);

      // Atomic batch transaction
      const results = await this.db.batch([
        // Step 1: Retrieve token data
        this.db
          .prepare(`
            SELECT
              client_id,
              user_id,
              scope,
              expires_at,
              revoked_at
            FROM ${DATABASE_CONSTANTS.TABLES.REFRESH_TOKENS}
            WHERE token_hash = ? AND tenant_id = ?
          `)
          .bind(tokenHash, this.tenantId),

        // Step 2: Delete the token (one-time use with rotation)
        this.db
          .prepare(`
            DELETE FROM ${DATABASE_CONSTANTS.TABLES.REFRESH_TOKENS}
            WHERE token_hash = ? AND tenant_id = ?
          `)
          .bind(tokenHash, this.tenantId),
      ]);

      const firstResult = results[0];
      if (!firstResult || !firstResult.results || !firstResult.results[0]) {
        return null;
      }
      const result = firstResult.results[0] as any;

      // Security: Check if token was revoked
      if (result.revoked_at) {
        console.warn(`Revoked refresh token used: ${tokenHash.substring(0, 16)}...`);
        return null;
      }

      // Security: Validate expiry
      const expiresAt = new Date(result.expires_at).getTime();
      if (expiresAt < Date.now()) {
        console.warn(`Expired refresh token used: ${tokenHash.substring(0, 16)}...`);
        return null;
      }

      // Parse scopes
      const scopes = result.scope ? result.scope.split(' ') : [];

      return {
        clientId: result.client_id,
        userId: result.user_id,
        scopes,
        expiresAt,
      };
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  }

  /**
   * Revoke a refresh token (for logout/security)
   */
  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    const tokenHash = await this.hashToken(refreshToken);

    const result = await this.db
      .prepare(`
        UPDATE ${DATABASE_CONSTANTS.TABLES.REFRESH_TOKENS}
        SET revoked_at = datetime('now')
        WHERE token_hash = ? AND tenant_id = ?
      `)
      .bind(tokenHash, this.tenantId)
      .run();

    return result.meta.changes > 0;
  }

  /**
   * Cleanup expired refresh tokens (maintenance)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.db
      .prepare(`
        DELETE FROM ${DATABASE_CONSTANTS.TABLES.REFRESH_TOKENS}
        WHERE expires_at < datetime('now') OR revoked_at IS NOT NULL
      `)
      .run();

    return result.meta.changes;
  }

  /**
   * Hash token using SHA-256
   * Security: Prevents token leakage from database
   */
  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hash = await crypto.subtle.digest('SHA-256', data);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
