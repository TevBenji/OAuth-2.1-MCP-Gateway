/**
 * Rate Limiting Integration Tests
 *
 * Tests for rate limiting accuracy, sliding window algorithm, and DDoS protection.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from '../../src/services/security/rate-limiter';
import {
  RateLimitStorage,
  RateLimitWindow,
  RateLimitConfig,
  IPBlockEntry,
  DEFAULT_RATE_LIMIT_TIERS,
} from '../../src/types/rate-limit';

// Mock rate limit storage
class MockRateLimitStorage implements RateLimitStorage {
  private counters: Map<string, number> = new Map();
  private blocks: Map<string, IPBlockEntry> = new Map();

  async increment(key: string, window: RateLimitWindow, ttl: number): Promise<number> {
    const currentValue = this.counters.get(key) || 0;
    const newValue = currentValue + 1;
    this.counters.set(key, newValue);

    // Simulate TTL by removing after delay (for testing purposes).
    // unref() so pending timers never keep the vitest process alive.
    setTimeout(() => {
      this.counters.delete(key);
    }, ttl * 1000).unref();

    return newValue;
  }

  async get(key: string): Promise<number> {
    return this.counters.get(key) || 0;
  }

  async reset(key: string): Promise<void> {
    this.counters.delete(key);
  }

  async isBlocked(ipAddress: string): Promise<boolean> {
    const block = this.blocks.get(ipAddress);
    if (!block) return false;

    const now = new Date();
    if (now > block.expires_at) {
      this.blocks.delete(ipAddress);
      return false;
    }

    return true;
  }

  async block(ipAddress: string, duration: number, reason: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 1000);

    this.blocks.set(ipAddress, {
      ip_address: ipAddress,
      blocked_at: now,
      expires_at: expiresAt,
      reason,
      violation_count: 1,
    });
  }

  async unblock(ipAddress: string): Promise<void> {
    this.blocks.delete(ipAddress);
  }

  async getBlockInfo(ipAddress: string): Promise<IPBlockEntry | null> {
    return this.blocks.get(ipAddress) || null;
  }

  clear(): void {
    this.counters.clear();
    this.blocks.clear();
  }
}

describe('Rate Limiting Tests', () => {
  let storage: MockRateLimitStorage;
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    storage = new MockRateLimitStorage();
    rateLimiter = new RateLimiter(storage);
  });

  afterEach(() => {
    storage.clear();
  });

  describe('Tenant Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const tenantId = 'tenant-123';

      // Default limit is 1000 per minute for PRO tier
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiter.checkTenantLimit(tenantId);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(1000 - (i + 1));
      }
    });

    it('should block requests exceeding limit', async () => {
      const tenantId = 'tenant-123';
      const config: RateLimitConfig = {
        tenant_limits: {
          name: 'test',
          requests_per_second: 5,
          requests_per_minute: 10,
          requests_per_hour: 100,
          requests_per_day: 1000,
          burst_size: 5,
        },
        user_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
        ip_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
        enable_ip_blocking: true,
        enable_suspicious_activity_detection: true,
        block_duration_seconds: 3600,
      };

      const limiter = new RateLimiter(storage, config);

      // Make requests up to limit
      for (let i = 0; i < 10; i++) {
        const result = await limiter.checkTenantLimit(tenantId);
        expect(result.allowed).toBe(true);
      }

      // Next request should be blocked
      const result = await limiter.checkTenantLimit(tenantId);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retry_after).toBeDefined();
    });
  });

  describe('User Rate Limiting', () => {
    it('should allow requests within user limit', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-456';

      for (let i = 0; i < 10; i++) {
        const result = await rateLimiter.checkUserLimit(tenantId, userId);
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests exceeding user limit', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-456';
      const config: RateLimitConfig = {
        tenant_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
        user_limits: {
          name: 'test',
          requests_per_second: 5,
          requests_per_minute: 10,
          requests_per_hour: 100,
          requests_per_day: 1000,
          burst_size: 5,
        },
        ip_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
        enable_ip_blocking: true,
        enable_suspicious_activity_detection: true,
        block_duration_seconds: 3600,
      };

      const limiter = new RateLimiter(storage, config);

      // Make requests up to limit
      for (let i = 0; i < 10; i++) {
        await limiter.checkUserLimit(tenantId, userId);
      }

      // Next request should be blocked
      const result = await limiter.checkUserLimit(tenantId, userId);
      expect(result.allowed).toBe(false);
    });
  });

  describe('IP Rate Limiting', () => {
    it('should allow requests within IP limit', async () => {
      const ipAddress = '192.168.1.1';

      for (let i = 0; i < 10; i++) {
        const result = await rateLimiter.checkIPLimit(ipAddress);
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests exceeding IP limit', async () => {
      const ipAddress = '192.168.1.1';
      const config: RateLimitConfig = {
        tenant_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
        user_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
        ip_limits: {
          name: 'test',
          requests_per_second: 5,
          requests_per_minute: 10,
          requests_per_hour: 100,
          requests_per_day: 1000,
          burst_size: 5,
        },
        enable_ip_blocking: true,
        enable_suspicious_activity_detection: true,
        block_duration_seconds: 3600,
      };

      const limiter = new RateLimiter(storage, config);

      // Make requests up to limit
      for (let i = 0; i < 10; i++) {
        await limiter.checkIPLimit(ipAddress);
      }

      // Next request should be blocked
      const result = await limiter.checkIPLimit(ipAddress);
      expect(result.allowed).toBe(false);
    });

    it('should block IP address manually', async () => {
      const ipAddress = '192.168.1.1';

      await rateLimiter.blockIP(ipAddress, 'Manual block for testing');

      const result = await rateLimiter.checkIPLimit(ipAddress);
      expect(result.allowed).toBe(false);
      expect(result.blocked).toBe(true);
      expect(result.block_reason).toContain('Manual block');
    });

    it('should unblock IP address', async () => {
      const ipAddress = '192.168.1.1';

      await rateLimiter.blockIP(ipAddress, 'Test block');
      let result = await rateLimiter.checkIPLimit(ipAddress);
      expect(result.allowed).toBe(false);

      await rateLimiter.unblockIP(ipAddress);
      result = await rateLimiter.checkIPLimit(ipAddress);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Combined Rate Limiting', () => {
    it('should check all limits and return most restrictive', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-456';
      const ipAddress = '192.168.1.1';

      const result = await rateLimiter.checkAllLimits(tenantId, userId, ipAddress);

      expect(result.allowed).toBe(true);
      expect(result.limit).toBeDefined();
      expect(result.remaining).toBeDefined();
      expect(result.reset).toBeDefined();
    });

    it('should block when any limit is exceeded', async () => {
      const tenantId = 'tenant-123';
      const userId = 'user-456';
      const ipAddress = '192.168.1.1';

      // Block the IP
      await rateLimiter.blockIP(ipAddress, 'Test block');

      const result = await rateLimiter.checkAllLimits(tenantId, userId, ipAddress);

      expect(result.allowed).toBe(false);
      expect(result.blocked).toBe(true);
    });
  });

  describe('Sliding Window Algorithm', () => {
    it('should track requests across different windows', async () => {
      const tenantId = 'tenant-123';

      // Check different windows
      const minuteResult = await rateLimiter.checkTenantLimit(tenantId, RateLimitWindow.MINUTE);
      expect(minuteResult.allowed).toBe(true);

      const hourResult = await rateLimiter.checkTenantLimit(tenantId, RateLimitWindow.HOUR);
      expect(hourResult.allowed).toBe(true);

      const dayResult = await rateLimiter.checkTenantLimit(tenantId, RateLimitWindow.DAY);
      expect(dayResult.allowed).toBe(true);
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset rate limit counter', async () => {
      const tenantId = 'tenant-123';
      const config: RateLimitConfig = {
        tenant_limits: {
          name: 'test',
          requests_per_second: 5,
          requests_per_minute: 10,
          requests_per_hour: 100,
          requests_per_day: 1000,
          burst_size: 5,
        },
        user_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
        ip_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
        enable_ip_blocking: true,
        enable_suspicious_activity_detection: true,
        block_duration_seconds: 3600,
      };

      const limiter = new RateLimiter(storage, config);

      // Exhaust limit
      for (let i = 0; i < 10; i++) {
        await limiter.checkTenantLimit(tenantId);
      }

      let result = await limiter.checkTenantLimit(tenantId);
      expect(result.allowed).toBe(false);

      // Reset limit
      await limiter.resetLimit(`tenant:${tenantId}`);

      result = await limiter.checkTenantLimit(tenantId);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Suspicious Activity Detection', () => {
    it('should detect excessive rate limit violations', async () => {
      const ipAddress = '192.168.1.1';
      const config: RateLimitConfig = {
        tenant_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
        user_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
        ip_limits: {
          name: 'test',
          requests_per_second: 5,
          requests_per_minute: 5,
          requests_per_hour: 100,
          requests_per_day: 1000,
          burst_size: 5,
        },
        enable_ip_blocking: true,
        enable_suspicious_activity_detection: true,
        block_duration_seconds: 3600,
      };

      const limiter = new RateLimiter(storage, config);

      // Make way more requests than allowed (should trigger suspicious activity)
      for (let i = 0; i < 50; i++) {
        await limiter.checkIPLimit(ipAddress);
      }

      // IP should be auto-blocked due to critical violation
      const isBlocked = await limiter.isIPBlocked(ipAddress);
      expect(isBlocked).toBe(true);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include proper rate limit information', async () => {
      const tenantId = 'tenant-123';

      const result = await rateLimiter.checkTenantLimit(tenantId);

      expect(result.limit).toBeGreaterThan(0);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
      expect(result.reset).toBeGreaterThan(0);
    });

    it('should include retry-after on rate limit exceeded', async () => {
      const tenantId = 'tenant-123';
      const config: RateLimitConfig = {
        tenant_limits: {
          name: 'test',
          requests_per_second: 5,
          requests_per_minute: 10,
          requests_per_hour: 100,
          requests_per_day: 1000,
          burst_size: 5,
        },
        user_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
        ip_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
        enable_ip_blocking: true,
        enable_suspicious_activity_detection: true,
        block_duration_seconds: 3600,
      };

      const limiter = new RateLimiter(storage, config);

      // Exhaust limit
      for (let i = 0; i < 10; i++) {
        await limiter.checkTenantLimit(tenantId);
      }

      const result = await limiter.checkTenantLimit(tenantId);
      expect(result.allowed).toBe(false);
      expect(result.retry_after).toBeDefined();
      expect(result.retry_after).toBeGreaterThan(0);
    });
  });
});
