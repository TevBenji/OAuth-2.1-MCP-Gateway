/**
 * PostgreSQL session storage.
 *
 * The full session object lives in the `data` jsonb column; the queryable
 * bits (user, tenant, expiry) are real columns. This replaces the old KV
 * implementation and its hand-maintained per-user index.
 */
import { and, eq, lt } from 'drizzle-orm';
import { sessions, type Db } from '@oauth-mcp-gateway/db';
import type { Session, SessionStorage } from '../types/session';

export class PgSessionStorage implements SessionStorage {
  constructor(private db: Db) {}

  async create(session: Session): Promise<void> {
    await this.db.insert(sessions).values({
      sessionId: session.session_id,
      userId: session.user_id,
      tenantId: session.tenant_id,
      ipAddress: session.device_info?.ip_address,
      userAgent: session.device_info?.user_agent,
      data: this.serialize(session),
      expiresAt: session.expires_at,
      lastActivity: session.last_accessed_at,
      revokedAt: session.revoked_at ?? null,
    });
  }

  async get(sessionId: string): Promise<Session | null> {
    const [row] = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionId, sessionId))
      .limit(1);
    if (!row || row.expiresAt.getTime() <= Date.now()) return null;
    return this.deserialize(row.data);
  }

  async update(sessionId: string, updates: Partial<Session>): Promise<void> {
    const existing = await this.get(sessionId);
    if (!existing) throw new Error('Session not found');

    const updated: Session = { ...existing, ...updates };
    if (updated.expires_at.getTime() <= Date.now()) {
      await this.delete(sessionId);
      return;
    }

    await this.db
      .update(sessions)
      .set({
        data: this.serialize(updated),
        expiresAt: updated.expires_at,
        lastActivity: updated.last_accessed_at,
        revokedAt: updated.revoked_at ?? null,
      })
      .where(eq(sessions.sessionId, sessionId));
  }

  /**
   * Regenerate the session ID on authentication (prevents session fixation).
   * Returns the new session ID.
   */
  async regenerateSessionOnAuth(oldSessionId: string): Promise<string> {
    const oldSession = await this.get(oldSessionId);
    if (!oldSession) throw new Error('Session not found');

    const newSession: Session = {
      ...oldSession,
      session_id: crypto.randomUUID(),
      created_at: new Date(),
      last_accessed_at: new Date(),
    };

    await this.create(newSession);
    await this.delete(oldSessionId);
    return newSession.session_id;
  }

  async delete(sessionId: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.sessionId, sessionId));
  }

  async getUserSessions(tenantId: string, userId: string): Promise<Session[]> {
    const rows = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.tenantId, tenantId), eq(sessions.userId, userId)));
    const now = Date.now();
    return rows
      .filter(r => r.expiresAt.getTime() > now)
      .map(r => this.deserialize(r.data));
  }

  async deleteUserSessions(tenantId: string, userId: string): Promise<number> {
    const rows = await this.db
      .delete(sessions)
      .where(and(eq(sessions.tenantId, tenantId), eq(sessions.userId, userId)))
      .returning({ sessionId: sessions.sessionId });
    return rows.length;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const rows = await this.db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()))
      .returning({ sessionId: sessions.sessionId });
    return rows.length;
  }

  private serialize(session: Session): Record<string, unknown> {
    return {
      ...session,
      created_at: session.created_at.toISOString(),
      last_accessed_at: session.last_accessed_at.toISOString(),
      expires_at: session.expires_at.toISOString(),
      idle_timeout_at: session.idle_timeout_at.toISOString(),
      revoked_at: session.revoked_at?.toISOString(),
    };
  }

  private deserialize(data: unknown): Session {
    const raw = data as Record<string, any>;
    return {
      ...raw,
      created_at: new Date(raw.created_at),
      last_accessed_at: new Date(raw.last_accessed_at),
      expires_at: new Date(raw.expires_at),
      idle_timeout_at: new Date(raw.idle_timeout_at),
      revoked_at: raw.revoked_at ? new Date(raw.revoked_at) : undefined,
    } as Session;
  }
}
