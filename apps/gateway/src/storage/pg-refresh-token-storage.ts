/**
 * PostgreSQL refresh token storage.
 *
 * Tokens are stored as SHA-256 hashes. Rotation no longer deletes: rows keep
 * a family_id and a status (active | rotated | revoked) so that presenting an
 * already-rotated token is detectable as reuse and revokes the whole family
 * (RFC 9700). Terminal-status rows are pruned once they expire.
 */
import { and, eq, inArray, lt, ne } from 'drizzle-orm';
import { refreshTokens, type Db } from '@oauth-mcp-gateway/db';

export type RefreshTokenStatus = 'active' | 'rotated' | 'revoked';

// Refresh token data
export interface RefreshTokenData {
  tokenId: string;
  familyId: string;
  status: RefreshTokenStatus;
  clientId: string;
  userId: string;
  scopes: string[];
  expiresAt: number;
  /** token_id of the child this token was rotated into, if any. */
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
    expiresAt: number,
    opts?: { familyId?: string; tokenId?: string }
  ): Promise<void>;

  /** Fetch by token (no side effects); null for unknown or expired tokens. */
  getRefreshToken(refreshToken: string): Promise<RefreshTokenData | null>;

  /**
   * Atomically mark a token rotated, recording the child it rotated into.
   * Returns false if the token was not active anymore (lost race / reuse).
   */
  markRotated(tokenId: string, childTokenId: string): Promise<boolean>;

  /** Revoke every token in a family (reuse detected / compromise response). */
  revokeFamily(familyId: string): Promise<number>;
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
    expiresAt: number,
    opts?: { familyId?: string; tokenId?: string }
  ): Promise<void> {
    const tokenHash = await this.hashToken(refreshToken);
    await this.db.insert(refreshTokens).values({
      ...(opts?.tokenId ? { tokenId: opts.tokenId } : {}),
      ...(opts?.familyId ? { familyId: opts.familyId } : {}),
      tokenHash,
      clientId,
      userId,
      tenantId: this.tenantId,
      scope: scopes.join(' '),
      expiresAt: new Date(expiresAt),
    });
  }

  async getRefreshToken(refreshToken: string): Promise<RefreshTokenData | null> {
    try {
      const tokenHash = await this.hashToken(refreshToken);
      const [row] = await this.db
        .select()
        .from(refreshTokens)
        .where(
          and(eq(refreshTokens.tokenHash, tokenHash), eq(refreshTokens.tenantId, this.tenantId))
        );

      if (!row) return null;

      const expiresAt = row.expiresAt.getTime();
      if (expiresAt < Date.now()) {
        console.warn('Expired refresh token used');
        return null;
      }

      return {
        tokenId: row.tokenId,
        familyId: row.familyId,
        status: row.status,
        clientId: row.clientId,
        userId: row.userId,
        scopes: row.scope ? row.scope.split(' ') : [],
        expiresAt,
        rotatedRefreshToken: row.rotatedTo ?? undefined,
      };
    } catch (error) {
      console.error('Error retrieving refresh token:', error);
      return null;
    }
  }

  async markRotated(tokenId: string, childTokenId: string): Promise<boolean> {
    const rows = await this.db
      .update(refreshTokens)
      .set({ status: 'rotated', rotatedTo: childTokenId, lastUsed: new Date() })
      .where(
        and(
          eq(refreshTokens.tokenId, tokenId),
          eq(refreshTokens.tenantId, this.tenantId),
          // guard: only an active token can rotate; a concurrent request that
          // already rotated it makes this a reuse, not a rotation
          eq(refreshTokens.status, 'active')
        )
      )
      .returning({ tokenId: refreshTokens.tokenId });
    return rows.length > 0;
  }

  async revokeFamily(familyId: string): Promise<number> {
    const rows = await this.db
      .update(refreshTokens)
      .set({ status: 'revoked', revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.familyId, familyId),
          eq(refreshTokens.tenantId, this.tenantId),
          ne(refreshTokens.status, 'revoked')
        )
      )
      .returning({ tokenId: refreshTokens.tokenId });
    return rows.length;
  }

  /** Revoke a refresh token (logout / compromise response). */
  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    const tokenHash = await this.hashToken(refreshToken);
    const rows = await this.db
      .update(refreshTokens)
      .set({ status: 'revoked', revokedAt: new Date() })
      .where(and(eq(refreshTokens.tokenHash, tokenHash), eq(refreshTokens.tenantId, this.tenantId)))
      .returning({ tokenId: refreshTokens.tokenId });
    return rows.length > 0;
  }

  /**
   * Delete expired terminal-status rows; called by the periodic cleanup job.
   * Active rows are kept even past expiry (they answer with invalid_grant,
   * never a family revocation) and rotated/revoked rows are kept until expiry
   * because they are the reuse-detection tripwire.
   */
  async cleanupExpiredTokens(): Promise<number> {
    const rows = await this.db
      .delete(refreshTokens)
      .where(
        and(
          inArray(refreshTokens.status, ['rotated', 'revoked']),
          lt(refreshTokens.expiresAt, new Date())
        )
      )
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
