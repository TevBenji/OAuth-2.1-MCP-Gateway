/**
 * Rate Limiter Service
 *
 * Implements sliding window rate limiting with Cloudflare KV storage.
 * Supports per-tenant, per-user, and IP-based rate limiting with DDoS protection.
 */
import { RateLimitConfig, RateLimitResult, RateLimitKeyType, RateLimitWindow, RateLimitTier, RateLimitStorage } from '../../types/rate-limit';
/**
 * Rate Limiter Service
 */
export declare class RateLimiter {
    private storage;
    private config;
    constructor(storage: RateLimitStorage, config?: Partial<RateLimitConfig>);
    /**
     * Check rate limit for a tenant
     */
    checkTenantLimit(tenantId: string, window?: RateLimitWindow): Promise<RateLimitResult>;
    /**
     * Check rate limit for a user
     */
    checkUserLimit(tenantId: string, userId: string, window?: RateLimitWindow): Promise<RateLimitResult>;
    /**
     * Check rate limit for an IP address
     */
    checkIPLimit(ipAddress: string, window?: RateLimitWindow): Promise<RateLimitResult>;
    /**
     * Check rate limit for an endpoint
     */
    checkEndpointLimit(endpoint: string, tenantId: string, window?: RateLimitWindow): Promise<RateLimitResult>;
    /**
     * Check rate limit with sliding window algorithm
     */
    private checkLimit;
    /**
     * Get limit for specific window
     */
    private getLimitForWindow;
    /**
     * Get window duration in seconds
     */
    private getWindowSeconds;
    /**
     * Check all rate limits (tenant, user, IP)
     */
    checkAllLimits(tenantId: string, userId: string, ipAddress: string): Promise<RateLimitResult>;
    /**
     * Block an IP address
     */
    blockIP(ipAddress: string, reason: string, duration?: number): Promise<void>;
    /**
     * Unblock an IP address
     */
    unblockIP(ipAddress: string): Promise<void>;
    /**
     * Check if IP is blocked
     */
    isIPBlocked(ipAddress: string): Promise<boolean>;
    /**
     * Detect suspicious activity patterns
     */
    private detectSuspiciousActivity;
    /**
     * Log rate limit violation
     */
    private logViolation;
    /**
     * Log suspicious activity
     */
    private logSuspiciousActivity;
    /**
     * Reset rate limit for a key
     */
    resetLimit(key: string): Promise<void>;
    /**
     * Get current rate limit status
     */
    getStatus(key: string, keyType: RateLimitKeyType, limits: RateLimitTier, window?: RateLimitWindow): Promise<RateLimitResult>;
}
