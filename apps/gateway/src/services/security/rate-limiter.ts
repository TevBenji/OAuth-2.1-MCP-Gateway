/**
 * Rate Limiter Service
 *
 * Implements sliding window rate limiting over a pluggable RateLimitStorage
 * backend. Current shipped implementation is in-memory and single-instance:
 * limits multiply and IP blocks do not propagate across replicas. See
 * docs/security/hardening-notes.md for the Postgres-backed storage plan.
 * Supports per-tenant, per-user, and IP-based rate limiting with DDoS protection.
 */

import {
  RateLimitConfig,
  RateLimitResult,
  RateLimitKeyType,
  RateLimitWindow,
  RateLimitTier,
  RateLimitViolation,
  SuspiciousActivityEvent,
  RateLimitStorage,
  DEFAULT_RATE_LIMIT_CONFIG,
} from '../../types/rate-limit';
import { v4 as uuidv4 } from 'uuid';

/**
 * Rate Limiter Service
 */
export class RateLimiter {
  private storage: RateLimitStorage;
  private config: RateLimitConfig;

  constructor(storage: RateLimitStorage, config?: Partial<RateLimitConfig>) {
    this.storage = storage;
    this.config = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
  }

  /**
   * Check rate limit for a tenant
   */
  async checkTenantLimit(
    tenantId: string,
    window: RateLimitWindow = RateLimitWindow.MINUTE
  ): Promise<RateLimitResult> {
    const key = `tenant:${tenantId}`;
    const limits = this.config.tenant_limits;
    return this.checkLimit(key, RateLimitKeyType.TENANT, limits, window);
  }

  /**
   * Check rate limit for a user
   */
  async checkUserLimit(
    tenantId: string,
    userId: string,
    window: RateLimitWindow = RateLimitWindow.MINUTE
  ): Promise<RateLimitResult> {
    const key = `user:${tenantId}:${userId}`;
    const limits = this.config.user_limits;
    return this.checkLimit(key, RateLimitKeyType.USER, limits, window);
  }

  /**
   * Check rate limit for an IP address
   */
  async checkIPLimit(
    ipAddress: string,
    window: RateLimitWindow = RateLimitWindow.MINUTE
  ): Promise<RateLimitResult> {
    // First check if IP is blocked
    const isBlocked = await this.storage.isBlocked(ipAddress);
    if (isBlocked) {
      const blockInfo = await this.storage.getBlockInfo(ipAddress);
      return {
        allowed: false,
        limit: 0,
        remaining: 0,
        reset: blockInfo ? Math.floor(blockInfo.expires_at.getTime() / 1000) : 0,
        blocked: true,
        block_reason: blockInfo?.reason || 'IP blocked due to rate limit violations',
      };
    }

    const key = `ip:${ipAddress}`;
    const limits = this.config.ip_limits;
    return this.checkLimit(key, RateLimitKeyType.IP, limits, window);
  }

  /**
   * Check rate limit for an endpoint
   */
  async checkEndpointLimit(
    endpoint: string,
    tenantId: string,
    window: RateLimitWindow = RateLimitWindow.MINUTE
  ): Promise<RateLimitResult> {
    if (!this.config.endpoint_limits || !this.config.endpoint_limits[endpoint]) {
      // No specific limit for this endpoint, allow it
      return {
        allowed: true,
        limit: Infinity,
        remaining: Infinity,
        reset: 0,
      };
    }

    const key = `endpoint:${tenantId}:${endpoint}`;
    const limits = this.config.endpoint_limits[endpoint];
    return this.checkLimit(key, RateLimitKeyType.ENDPOINT, limits, window);
  }

  /**
   * Check rate limit with sliding window algorithm
   */
  private async checkLimit(
    key: string,
    keyType: RateLimitKeyType,
    limits: RateLimitTier,
    window: RateLimitWindow
  ): Promise<RateLimitResult> {
    const limit = this.getLimitForWindow(limits, window);
    const windowSeconds = this.getWindowSeconds(window);

    // Increment counter for this window
    const count = await this.storage.increment(key, window, windowSeconds);

    const now = Math.floor(Date.now() / 1000);
    const resetTime = now + windowSeconds;

    // Check if limit exceeded
    if (count > limit) {
      // Log violation
      await this.logViolation({
        key,
        key_type: keyType,
        limit,
        actual: count,
        window,
        timestamp: new Date(),
      });

      // Check for suspicious activity
      if (this.config.enable_suspicious_activity_detection) {
        await this.detectSuspiciousActivity(key, keyType, count, limit);
      }

      return {
        allowed: false,
        limit,
        remaining: 0,
        reset: resetTime,
        retry_after: windowSeconds,
      };
    }

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - count),
      reset: resetTime,
    };
  }

  /**
   * Get limit for specific window
   */
  private getLimitForWindow(limits: RateLimitTier, window: RateLimitWindow): number {
    switch (window) {
      case RateLimitWindow.SECOND:
        return limits.requests_per_second;
      case RateLimitWindow.MINUTE:
        return limits.requests_per_minute;
      case RateLimitWindow.HOUR:
        return limits.requests_per_hour;
      case RateLimitWindow.DAY:
        return limits.requests_per_day;
      default:
        return limits.requests_per_minute;
    }
  }

  /**
   * Get window duration in seconds
   */
  private getWindowSeconds(window: RateLimitWindow): number {
    switch (window) {
      case RateLimitWindow.SECOND:
        return 1;
      case RateLimitWindow.MINUTE:
        return 60;
      case RateLimitWindow.HOUR:
        return 3600;
      case RateLimitWindow.DAY:
        return 86400;
      default:
        return 60;
    }
  }

  /**
   * Check all rate limits (tenant, user, IP)
   */
  async checkAllLimits(
    tenantId: string,
    userId: string,
    ipAddress: string
  ): Promise<RateLimitResult> {
    // Check IP limit first (most restrictive for DDoS protection)
    const ipResult = await this.checkIPLimit(ipAddress);
    if (!ipResult.allowed) {
      return ipResult;
    }

    // Check tenant limit
    const tenantResult = await this.checkTenantLimit(tenantId);
    if (!tenantResult.allowed) {
      return tenantResult;
    }

    // Check user limit
    const userResult = await this.checkUserLimit(tenantId, userId);
    if (!userResult.allowed) {
      return userResult;
    }

    // Return the most restrictive remaining count
    return {
      allowed: true,
      limit: Math.min(ipResult.limit, tenantResult.limit, userResult.limit),
      remaining: Math.min(ipResult.remaining, tenantResult.remaining, userResult.remaining),
      reset: Math.max(ipResult.reset, tenantResult.reset, userResult.reset),
    };
  }

  /**
   * Block an IP address
   */
  async blockIP(ipAddress: string, reason: string, duration?: number): Promise<void> {
    const blockDuration = duration || this.config.block_duration_seconds;
    await this.storage.block(ipAddress, blockDuration, reason);

    // Log suspicious activity
    await this.logSuspiciousActivity({
      event_id: uuidv4(),
      event_type: 'ip_blocked',
      severity: 'high',
      ip_address: ipAddress,
      details: { reason, duration: blockDuration },
      timestamp: new Date(),
    });
  }

  /**
   * Unblock an IP address
   */
  async unblockIP(ipAddress: string): Promise<void> {
    await this.storage.unblock(ipAddress);
  }

  /**
   * Check if IP is blocked
   */
  async isIPBlocked(ipAddress: string): Promise<boolean> {
    return this.storage.isBlocked(ipAddress);
  }

  /**
   * Detect suspicious activity patterns
   */
  private async detectSuspiciousActivity(
    key: string,
    keyType: RateLimitKeyType,
    count: number,
    limit: number
  ): Promise<void> {
    const overagePercentage = ((count - limit) / limit) * 100;

    // If significantly over limit, consider it suspicious
    if (overagePercentage > 200) {
      // More than 3x the limit
      const severity = overagePercentage > 500 ? 'critical' : 'high';

      // Extract IP if this is an IP-based key
      let ipAddress: string | undefined;
      if (keyType === RateLimitKeyType.IP && key.startsWith('ip:')) {
        ipAddress = key.substring(3);

        // Auto-block IPs with critical violations
        if (severity === 'critical' && this.config.enable_ip_blocking) {
          await this.blockIP(ipAddress, 'Automatic block: Critical rate limit violation');
        }
      }

      await this.logSuspiciousActivity({
        event_id: uuidv4(),
        event_type: 'rate_limit_violation',
        severity,
        ip_address: ipAddress || 'unknown',
        details: {
          key,
          key_type: keyType,
          count,
          limit,
          overage_percentage: overagePercentage,
        },
        timestamp: new Date(),
      });
    }
  }

  /**
   * Log rate limit violation
   */
  private async logViolation(violation: RateLimitViolation): Promise<void> {
    // In production, this should integrate with the audit logging system
    console.log('Rate limit violation:', JSON.stringify(violation));
  }

  /**
   * Log suspicious activity
   */
  private async logSuspiciousActivity(event: SuspiciousActivityEvent): Promise<void> {
    // In production, this should integrate with the security monitoring system
    console.log('Suspicious activity detected:', JSON.stringify(event));
  }

  /**
   * Reset rate limit for a key
   */
  async resetLimit(key: string): Promise<void> {
    await this.storage.reset(key);
  }

  /**
   * Get current rate limit status
   */
  async getStatus(
    key: string,
    keyType: RateLimitKeyType,
    limits: RateLimitTier,
    window: RateLimitWindow = RateLimitWindow.MINUTE
  ): Promise<RateLimitResult> {
    const limit = this.getLimitForWindow(limits, window);
    const count = await this.storage.get(key);
    const windowSeconds = this.getWindowSeconds(window);
    const now = Math.floor(Date.now() / 1000);

    return {
      allowed: count < limit,
      limit,
      remaining: Math.max(0, limit - count),
      reset: now + windowSeconds,
    };
  }
}

// Factory function to create a rate limiter instance from environment bindings
export function createRateLimiter(env: any): RateLimiter {
  // This would need to be implemented based on how the storage is configured
  // For now, we'll create a default instance with a default storage implementation
  // In a real implementation, this would use the appropriate storage based on the environment
  throw new Error('createRateLimiter not fully implemented - storage needs to be configured based on environment');
}
