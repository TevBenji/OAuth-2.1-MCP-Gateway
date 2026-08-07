/**
 * PostgreSQL authorization code storage.
 *
 * One-time use is enforced atomically with DELETE ... RETURNING: whichever
 * request deletes the row wins, every other request sees null.
 */
import { and, eq, lt } from 'drizzle-orm';
import { authorizationCodes, type Db } from '@oauth-mcp-gateway/db';

// Authorization code data with PKCE support
export interface AuthorizationCodeData {
  clientId: string;
  redirectUri: string;
  userId: string;
  scopes: string[];
  expiresAt: number;
  codeChallenge?: string;
  challengeMethod?: string;
}

// Authorization code storage interface
export interface AuthorizationCodeStorage {
  storeCode(
    code: string,
    clientId: string,
    redirectUri: string,
    userId: string,
    scopes: string[],
    expiresAt: number,
    codeChallenge?: string,
    challengeMethod?: string
  ): Promise<void>;

  retrieveAndDeleteCode(code: string): Promise<AuthorizationCodeData | null>;
}

export class PgAuthorizationCodeStorage implements AuthorizationCodeStorage {
  constructor(
    private db: Db,
    private tenantId: string = 'default'
  ) {}

  async storeCode(
    code: string,
    clientId: string,
    redirectUri: string,
    userId: string,
    scopes: string[],
    expiresAt: number,
    codeChallenge?: string,
    challengeMethod?: string
  ): Promise<void> {
    await this.db.insert(authorizationCodes).values({
      code,
      clientId,
      userId,
      tenantId: this.tenantId,
      redirectUri,
      scope: scopes.join(' '),
      codeChallenge: codeChallenge ?? null,
      codeChallengeMethod: (challengeMethod as 'S256' | undefined) ?? 'S256',
      expiresAt: new Date(expiresAt),
    });
  }

  async retrieveAndDeleteCode(code: string): Promise<AuthorizationCodeData | null> {
    try {
      const [row] = await this.db
        .delete(authorizationCodes)
        .where(
          and(eq(authorizationCodes.code, code), eq(authorizationCodes.tenantId, this.tenantId))
        )
        .returning();

      if (!row) return null;

      const expiresAt = row.expiresAt.getTime();
      if (expiresAt < Date.now()) {
        console.warn('Expired authorization code used');
        return null;
      }

      return {
        clientId: row.clientId,
        redirectUri: row.redirectUri,
        userId: row.userId,
        scopes: row.scope ? row.scope.split(' ') : [],
        expiresAt,
        codeChallenge: row.codeChallenge ?? undefined,
        challengeMethod: row.codeChallengeMethod ?? undefined,
      };
    } catch (error) {
      console.error('Error retrieving authorization code:', error);
      return null;
    }
  }

  /** Delete expired codes; called by the periodic cleanup job. */
  async cleanupExpiredCodes(): Promise<number> {
    const rows = await this.db
      .delete(authorizationCodes)
      .where(lt(authorizationCodes.expiresAt, new Date()))
      .returning({ code: authorizationCodes.code });
    return rows.length;
  }
}
