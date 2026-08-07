/**
 * Rate Limiting Service
 *
 * Implements sliding window rate limiting for API protection.
 * Requirements: 5.3, 4.3
 */

export interface RateLimitConfig {
  requests_per_minute: number;
  requests_per_hour: number;
  burst_limit: number;
}

import type { KVLike } from '../../lib/memory-kv';

export class RateLimitService {
  private cache: KVLike;

  constructor(cache: KVLike) {
    this.cache = cache;
  }

  /**
   * Check if request is within rate limit
   */
  async checkRateLimit(key: string, config: RateLimitConfig): Promise<boolean> {
    const now = Date.now();
    const minuteKey = `ratelimit:${key}:minute:${Math.floor(now / 60000)}`;
    const hourKey = `ratelimit:${key}:hour:${Math.floor(now / 3600000)}`;

    // Get current counts
    const minuteCount = parseInt((await this.cache.get(minuteKey)) || '0');
    const hourCount = parseInt((await this.cache.get(hourKey)) || '0');

    // Check limits
    if (minuteCount >= config.requests_per_minute) {
      return false;
    }

    if (hourCount >= config.requests_per_hour) {
      return false;
    }

    // Increment counters
    await this.cache.put(minuteKey, (minuteCount + 1).toString(), { expirationTtl: 60 });
    await this.cache.put(hourKey, (hourCount + 1).toString(), { expirationTtl: 3600 });

    return true;
  }

  /**
   * Get remaining requests for a key
   */
  async getRemainingRequests(key: string, config: RateLimitConfig): Promise<{
    minute: number;
    hour: number;
  }> {
    const now = Date.now();
    const minuteKey = `ratelimit:${key}:minute:${Math.floor(now / 60000)}`;
    const hourKey = `ratelimit:${key}:hour:${Math.floor(now / 3600000)}`;

    const minuteCount = parseInt((await this.cache.get(minuteKey)) || '0');
    const hourCount = parseInt((await this.cache.get(hourKey)) || '0');

    return {
      minute: Math.max(0, config.requests_per_minute - minuteCount),
      hour: Math.max(0, config.requests_per_hour - hourCount)
    };
  }
}
