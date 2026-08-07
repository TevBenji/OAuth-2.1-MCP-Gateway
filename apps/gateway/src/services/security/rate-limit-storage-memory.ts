/**
 * In-memory rate limit storage.
 *
 * ponytail: per-process counters, single instance; move to a shared store
 * (Redis / Postgres) if the gateway is scaled horizontally.
 */
import type { IPBlockEntry, RateLimitStorage, RateLimitWindow } from '../../types/rate-limit';

interface Counter {
  count: number;
  expiresAt: number;
}

export class RateLimitStorageMemory implements RateLimitStorage {
  private counters = new Map<string, Counter>();
  private blocks = new Map<string, IPBlockEntry>();

  async increment(key: string, _window: RateLimitWindow, ttl: number): Promise<number> {
    const now = Date.now();
    const existing = this.counters.get(key);
    if (!existing || existing.expiresAt <= now) {
      this.counters.set(key, { count: 1, expiresAt: now + ttl * 1000 });
      return 1;
    }
    existing.count += 1;
    return existing.count;
  }

  async get(key: string): Promise<number> {
    const entry = this.counters.get(key);
    if (!entry || entry.expiresAt <= Date.now()) return 0;
    return entry.count;
  }

  async reset(key: string): Promise<void> {
    this.counters.delete(key);
  }

  async isBlocked(key: string): Promise<boolean> {
    return (await this.getBlockInfo(key)) !== null;
  }

  async block(key: string, duration: number, reason: string): Promise<void> {
    const existing = this.blocks.get(key);
    this.blocks.set(key, {
      ip_address: key,
      blocked_at: new Date(),
      expires_at: new Date(Date.now() + duration * 1000),
      reason,
      violation_count: (existing?.violation_count ?? 0) + 1,
    });
  }

  async unblock(key: string): Promise<void> {
    this.blocks.delete(key);
  }

  async getBlockInfo(key: string): Promise<IPBlockEntry | null> {
    const entry = this.blocks.get(key);
    if (!entry) return null;
    if (entry.expires_at.getTime() <= Date.now()) {
      this.blocks.delete(key);
      return null;
    }
    return entry;
  }
}
