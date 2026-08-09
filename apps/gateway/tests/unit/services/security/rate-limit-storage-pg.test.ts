/**
 * Postgres rate-limit storage: shared, race-safe counters and IP blocks.
 * Two storage instances over the same database stand in for two gateway
 * replicas.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimitBlocks, rateLimitWindows } from '@oauth-mcp-gateway/db';
import { RateLimitStoragePg } from '../../../../src/services/security/rate-limit-storage-pg';
import { RateLimitWindow } from '../../../../src/types/rate-limit';
import { getTestDb } from '../../../helpers/db';

const { db } = getTestDb();
const storage = new RateLimitStoragePg(db);

describe('RateLimitStoragePg', () => {
  beforeEach(async () => {
    // these tables have no tenant FK, so the global truncate does not touch them
    await db.delete(rateLimitWindows);
    await db.delete(rateLimitBlocks);
  });

  it('counts within a window and rolls over after it expires', async () => {
    expect(await storage.increment('k', RateLimitWindow.SECOND, 1)).toBe(1);
    expect(await storage.increment('k', RateLimitWindow.SECOND, 1)).toBe(2);
    expect(await storage.increment('k', RateLimitWindow.SECOND, 1)).toBe(3);

    await new Promise(r => setTimeout(r, 1100));

    // expired window restarts at 1 instead of continuing the old count
    expect(await storage.increment('k', RateLimitWindow.SECOND, 1)).toBe(1);
  });

  it('tracks the same key independently per window', async () => {
    expect(await storage.increment('k', RateLimitWindow.MINUTE, 60)).toBe(1);
    expect(await storage.increment('k', RateLimitWindow.HOUR, 3600)).toBe(1);
    expect(await storage.increment('k', RateLimitWindow.MINUTE, 60)).toBe(2);
  });

  it('loses no counts under concurrent increments', async () => {
    const N = 25;
    const counts = await Promise.all(
      Array.from({ length: N }, () => storage.increment('burst', RateLimitWindow.MINUTE, 60))
    );

    // every increment landed: the returned counts are exactly 1..N
    expect(new Set(counts).size).toBe(N);
    expect(Math.max(...counts)).toBe(N);
    expect(await storage.get('burst')).toBe(N);
  });

  it('propagates blocks to a second instance sharing the database', async () => {
    const replicaA = storage;
    const replicaB = new RateLimitStoragePg(db);

    await replicaA.block('203.0.113.9', 60, 'too many failures');

    expect(await replicaB.isBlocked('203.0.113.9')).toBe(true);
    const info = await replicaB.getBlockInfo('203.0.113.9');
    expect(info?.reason).toBe('too many failures');
    expect(info?.violation_count).toBe(1);

    // re-blocking counts the violation
    await replicaB.block('203.0.113.9', 60, 'again');
    expect((await replicaA.getBlockInfo('203.0.113.9'))?.violation_count).toBe(2);

    await replicaB.unblock('203.0.113.9');
    expect(await replicaA.isBlocked('203.0.113.9')).toBe(false);
  });

  it('expired blocks stop blocking without explicit unblock', async () => {
    await storage.block('198.51.100.7', 1, 'short block');
    expect(await storage.isBlocked('198.51.100.7')).toBe(true);

    await new Promise(r => setTimeout(r, 1100));

    expect(await storage.isBlocked('198.51.100.7')).toBe(false);
  });

  it('cleanup removes only expired windows and blocks', async () => {
    await storage.increment('short', RateLimitWindow.SECOND, 1);
    await storage.increment('long', RateLimitWindow.MINUTE, 60);
    await storage.block('1.1.1.1', 1, 'short');
    await storage.block('2.2.2.2', 60, 'long');

    await new Promise(r => setTimeout(r, 1100));

    expect(await storage.cleanupExpired()).toBe(2); // one window + one block

    expect(await storage.get('long')).toBe(1);
    expect(await storage.isBlocked('2.2.2.2')).toBe(true);
  });
});
