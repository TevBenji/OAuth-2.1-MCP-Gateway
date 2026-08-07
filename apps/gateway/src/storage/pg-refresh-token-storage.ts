/**
 * PostgreSQL refresh token storage.
 *
 * Tokens are stored as SHA-256 hashes; rotation is enforced atomically with
 * DELETE ... RETURNING (one-time use).
 */
import { and, eq, isNotNull, lt, or } from 'drizzle-orm';
import { refreshTokens, type Db } from '@oauth-mcp-gateway/db';

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

export class PgRefreshTokenStorage implements RefreshTokenStorage {
  constructor(
    private db: Db,
    private tenantId: string = 'default'
  ) {}

  async storeRefreshToken(
    refreshToken: string,
    _accessToken: string,
    clientId: string,
    userId: string,
    scopes: string[],
    expiresAt: number
  ): Promise<void> {
    const tokenHash = await this.hashToken(refreshToken);
    await this.db.insert(refreshTokens).values({
      tokenHash,
      clientId,
      userId,
      tenantId: this.tenantId,
      scope: scopes.join(' '),
      expiresAt: new Date(expiresAt),
    });
  }

  async retrieveAndDeleteRefreshToken(refreshToken: string): Promise<RefreshTokenData | null> {
    try {
      const tokenHash = await this.hashToken(refreshToken);
      const [row] = await this.db
        .delete(refreshTokens)
        .where(
          and(eq(refreshTokens.tokenHash, tokenHash), eq(refreshTokens.tenantId, this.tenantId))
        )
        .returning();

      if (!row) return null;

      if (row.revokedAt) {
        console.warn('Revoked refresh token used');
        return null;
      }

      const expiresAt = row.expiresAt.getTime();
      if (expiresAt < Date.now()) {
        console.warn('Expired refresh token used');
        return null;
      }

      return {
        clientId: row.clientId,
        userId: row.userId,
        scopes: row.scope ? row.scope.split(' ') : [],
        expiresAt,
      };
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  }

  /** Revoke a refresh token (logout / compromise response). */
  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    const tokenHash = await this.hashToken(refreshToken);
    const rows = await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.tokenHash, tokenHash), eq(refreshTokens.tenantId, this.tenantId)))
      .returning({ tokenId: refreshTokens.tokenId });
    return rows.length > 0;
  }

  /** Delete expired or revoked tokens; called by the periodic cleanup job. */
  async cleanupExpiredTokens(): Promise<number> {
    const rows = await this.db
      .delete(refreshTokens)
      .where(or(lt(refreshTokens.expiresAt, new Date()), isNotNull(refreshTokens.revokedAt)))
      .returning({ tokenId: refreshTokens.tokenId });
    return rows.length;
  }

  private async hashToken(token: string): Promise<string> {
    const data = new TextEncoder().encode(token);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
