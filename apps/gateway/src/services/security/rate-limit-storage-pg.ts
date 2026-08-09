/**
 * Postgres-backed rate limit storage: shared counters and IP blocks across
 * gateway replicas. One round trip per check — a single upsert that starts a
 * fresh window when the old one has expired, otherwise increments it.
 * Expired rows are pruned by the hourly cleanup job (see server.ts).
 */
import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { rateLimitBlocks, rateLimitWindows, type Db } from '@oauth-mcp-gateway/db';
import type { IPBlockEntry, RateLimitStorage, RateLimitWindow } from '../../types/rate-limit';

export class RateLimitStoragePg implements RateLimitStorage {
  constructor(private db: Db) {}

  async increment(key: string, window: RateLimitWindow, ttl: number): Promise<number> {
    const result = await this.db.execute(sql`
      INSERT INTO rate_limit_windows ("key", "window", "count", "window_start", "expires_at")
      VALUES (${key}, ${window}, 1, now(), now() + make_interval(secs => ${ttl}))
      ON CONFLICT ("key", "window") DO UPDATE SET
        "count" = CASE WHEN rate_limit_windows.expires_at <= now()
                       THEN 1 ELSE rate_limit_windows.count + 1 END,
        "window_start" = CASE WHEN rate_limit_windows.expires_at <= now()
                              THEN now() ELSE rate_limit_windows.window_start END,
        "expires_at" = CASE WHEN rate_limit_windows.expires_at <= now()
                            THEN now() + make_interval(secs => ${ttl})
                            ELSE rate_limit_windows.expires_at END
      RETURNING "count"
    `);
    return Number((result.rows[0] as { count: number }).count);
  }

  async get(key: string): Promise<number> {
    // The interface has no window parameter here; report the busiest live
    // window for the key (matches the memory backend's single-counter view).
    const rows = await this.db
      .select({ count: rateLimitWindows.count })
      .from(rateLimitWindows)
      .where(and(eq(rateLimitWindows.key, key), gt(rateLimitWindows.expiresAt, new Date())));
    return rows.reduce((max, r) => Math.max(max, r.count), 0);
  }

  async reset(key: string): Promise<void> {
    await this.db.delete(rateLimitWindows).where(eq(rateLimitWindows.key, key));
  }

  async isBlocked(key: string): Promise<boolean> {
    return (await this.getBlockInfo(key)) !== null;
  }

  async block(key: string, duration: number, reason: string): Promise<void> {
    await this.db.execute(sql`
      INSERT INTO rate_limit_blocks ("key", "blocked_at", "expires_at", "reason", "violation_count")
      VALUES (${key}, now(), now() + make_interval(secs => ${duration}), ${reason}, 1)
      ON CONFLICT ("key") DO UPDATE SET
        "blocked_at" = now(),
        "expires_at" = now() + make_interval(secs => ${duration}),
        "reason" = ${reason},
        "violation_count" = rate_limit_blocks.violation_count + 1
    `);
  }

  async unblock(key: string): Promise<void> {
    await this.db.delete(rateLimitBlocks).where(eq(rateLimitBlocks.key, key));
  }

  async getBlockInfo(key: string): Promise<IPBlockEntry | null> {
    const [row] = await this.db
      .select()
      .from(rateLimitBlocks)
      .where(and(eq(rateLimitBlocks.key, key), gt(rateLimitBlocks.expiresAt, new Date())));
    if (!row) return null;
    return {
      ip_address: row.key,
      blocked_at: row.blockedAt,
      expires_at: row.expiresAt,
      reason: row.reason,
      violation_count: row.violationCount,
    };
  }

  /** Delete expired windows and blocks; called by the hourly cleanup job. */
  async cleanupExpired(): Promise<number> {
    const now = new Date();
    const windows = await this.db
      .delete(rateLimitWindows)
      .where(lt(rateLimitWindows.expiresAt, now))
      .returning({ key: rateLimitWindows.key });
    const blocks = await this.db
      .delete(rateLimitBlocks)
      .where(lt(rateLimitBlocks.expiresAt, now))
      .returning({ key: rateLimitBlocks.key });
    return windows.length + blocks.length;
  }
}
