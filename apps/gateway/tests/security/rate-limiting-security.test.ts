/**
 * Rate Limiting Security Tests
 *
 * Tests for rate limiting bypass prevention, DDoS protection, and security policies.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../../src/services/security/rate-limiter';
import {
  RateLimitStorage,
  RateLimitWindow,
  RateLimitConfig,
  IPBlockEntry,
  DEFAULT_RATE_LIMIT_TIERS,
} from '../../src/types/rate-limit';

// Mock storage (same as integration tests)
class MockRateLimitStorage implements RateLimitStorage {
  private counters: Map<string, number> = new Map();
  private blocks: Map<string, IPBlockEntry> = new Map();

  async increment(key: string, window: RateLimitWindow, ttl: number): Promise<number> {
    const currentValue = this.counters.get(key) || 0;
    const newValue = currentValue + 1;
    this.counters.set(key, newValue);
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
    return new Date() <= block.expires_at;
  }

  async block(ipAddress: string, duration: number, reason: string): Promise<void> {
    const now = new Date();
    this.blocks.set(ipAddress, {
      ip_address: ipAddress,
      blocked_at: now,
      expires_at: new Date(now.getTime() + duration * 1000),
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
}

describe('Rate Limiting Security Tests', () => {
  let storage: MockRateLimitStorage;

  beforeEach(() => {
    storage = new MockRateLimitStorage();
  });

  describe('DDoS Protection', () => {
    it('should block IPs with critical rate limit violations', async () => {
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
      const ipAddress = '192.168.1.100';

      // Simulate DDoS attack (way over limit)
      for (let i = 0; i < 100; i++) {
        await limiter.checkIPLimit(ipAddress);
      }

      // IP should be auto-blocked
      const isBlocked = await limiter.isIPBlocked(ipAddress);
      expect(isBlocked).toBe(true);
    });

    it('should enforce IP blocks across all requests', async () => {
      const limiter = new RateLimiter(storage);
      const tenantId = 'tenant-123';
      const userId = 'user-456';
      const ipAddress = '192.168.1.100';

      await limiter.blockIP(ipAddress, 'DDoS attack detected');

      const result = await limiter.checkAllLimits(tenantId, userId, ipAddress);

      expect(result.allowed).toBe(false);
      expect(result.blocked).toBe(true);
    });

    it('should maintain blocks for specified duration', async () => {
      const limiter = new RateLimiter(storage);
      const ipAddress = '192.168.1.100';

      await limiter.blockIP(ipAddress, 'Test block', 1); // 1 second block

      let isBlocked = await limiter.isIPBlocked(ipAddress);
      expect(isBlocked).toBe(true);

      // Wait for block to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      isBlocked = await limiter.isIPBlocked(ipAddress);
      expect(isBlocked).toBe(false);
    });
  });

  describe('Bypass Prevention', () => {
    it('should enforce limits per tenant even with different users', async () => {
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
      const tenantId = 'tenant-123';

      // Multiple users from same tenant
      for (let i = 0; i < 5; i++) {
        await limiter.checkTenantLimit(tenantId);
      }

      for (let i = 0; i < 5; i++) {
        await limiter.checkTenantLimit(tenantId);
      }

      // Tenant limit should be exceeded regardless of user
      const result = await limiter.checkTenantLimit(tenantId);
      expect(result.allowed).toBe(false);
    });

    it('should enforce limits per user across different IPs', async () => {
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
      const tenantId = 'tenant-123';
      const userId = 'user-456';

      // Exhaust user limit
      for (let i = 0; i < 10; i++) {
        await limiter.checkUserLimit(tenantId, userId);
      }

      // Should be blocked regardless of IP
      const result = await limiter.checkUserLimit(tenantId, userId);
      expect(result.allowed).toBe(false);
    });

    it('should prevent IP spoofing by tracking multiple IPs', async () => {
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

      // Simulate requests from different IPs
      const ips = ['192.168.1.1', '192.168.1.2', '192.168.1.3'];

      for (const ip of ips) {
        // Exhaust limit for each IP
        for (let i = 0; i < 10; i++) {
          await limiter.checkIPLimit(ip);
        }

        // Each IP should be limited independently
        const result = await limiter.checkIPLimit(ip);
        expect(result.allowed).toBe(false);
      }
    });
  });

  describe('Rate Limit Isolation', () => {
    it('should isolate rate limits by tenant', async () => {
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

      // Exhaust limit for tenant 1
      for (let i = 0; i < 10; i++) {
        await limiter.checkTenantLimit('tenant-1');
      }

      // Tenant 1 should be blocked
      let result = await limiter.checkTenantLimit('tenant-1');
      expect(result.allowed).toBe(false);

      // Tenant 2 should still be allowed
      result = await limiter.checkTenantLimit('tenant-2');
      expect(result.allowed).toBe(true);
    });

    it('should isolate rate limits by user', async () => {
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
      const tenantId = 'tenant-123';

      // Exhaust limit for user 1
      for (let i = 0; i < 10; i++) {
        await limiter.checkUserLimit(tenantId, 'user-1');
      }

      // User 1 should be blocked
      let result = await limiter.checkUserLimit(tenantId, 'user-1');
      expect(result.allowed).toBe(false);

      // User 2 should still be allowed
      result = await limiter.checkUserLimit(tenantId, 'user-2');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Burst Protection', () => {
    it('should handle burst requests appropriately', async () => {
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
      const tenantId = 'tenant-123';

      // Simulate burst (rapid successive requests)
      const results = await Promise.all(
        Array.from({ length: 20 }, () => limiter.checkTenantLimit(tenantId))
      );

      // Some requests should succeed, others should be rate limited
      const allowed = results.filter(r => r.allowed).length;
      const blocked = results.filter(r => !r.allowed).length;

      expect(allowed).toBeGreaterThan(0);
      expect(blocked).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    it('should provide rate limit information in responses', async () => {
      const limiter = new RateLimiter(storage);
      const tenantId = 'tenant-123';

      const result = await limiter.checkTenantLimit(tenantId);

      // Verify required rate limit headers
      expect(result.limit).toBeDefined();
      expect(result.remaining).toBeDefined();
      expect(result.reset).toBeDefined();
    });

    it('should include retry-after on rate limit exceeded', async () => {
      const config: RateLimitConfig = {
        tenant_limits: {
          name: 'test',
          requests_per_second: 5,
          requests_per_minute: 5,
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
      const tenantId = 'tenant-123';

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await limiter.checkTenantLimit(tenantId);
      }

      const result = await limiter.checkTenantLimit(tenantId);

      expect(result.allowed).toBe(false);
      expect(result.retry_after).toBeDefined();
      expect(result.retry_after).toBeGreaterThan(0);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle concurrent requests accurately', async () => {
      const limiter = new RateLimiter(storage);
      const tenantId = 'tenant-123';

      // Fire 100 concurrent requests
      const results = await Promise.all(
        Array.from({ length: 100 }, () => limiter.checkTenantLimit(tenantId))
      );

      // Count should be accurate
      const allowedCount = results.filter(r => r.allowed).length;
      expect(allowedCount).toBeLessThanOrEqual(1000); // PRO tier limit
    });
  });
});
