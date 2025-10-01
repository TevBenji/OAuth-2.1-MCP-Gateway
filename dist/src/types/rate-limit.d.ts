/**
 * Rate Limiting Type Definitions
 *
 * Types for rate limiting, DDoS protection, and suspicious activity detection.
 */
/**
 * Rate Limit Tier Configuration
 */
export interface RateLimitTier {
    name: string;
    requests_per_second: number;
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
    burst_size: number;
}
/**
 * Rate Limit Configuration
 */
export interface RateLimitConfig {
    tenant_limits: RateLimitTier;
    user_limits: RateLimitTier;
    ip_limits: RateLimitTier;
    endpoint_limits?: Record<string, RateLimitTier>;
    enable_ip_blocking: boolean;
    enable_suspicious_activity_detection: boolean;
    block_duration_seconds: number;
}
/**
 * Rate Limit Result
 */
export interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    reset: number;
    retry_after?: number;
    blocked?: boolean;
    block_reason?: string;
}
/**
 * Rate Limit Key Types
 */
export declare enum RateLimitKeyType {
    TENANT = "tenant",
    USER = "user",
    IP = "ip",
    ENDPOINT = "endpoint",
    GLOBAL = "global"
}
/**
 * Rate Limit Window
 */
export declare enum RateLimitWindow {
    SECOND = "second",
    MINUTE = "minute",
    HOUR = "hour",
    DAY = "day"
}
/**
 * Sliding Window Entry
 */
export interface SlidingWindowEntry {
    timestamp: number;
    count: number;
}
/**
 * Rate Limit Violation
 */
export interface RateLimitViolation {
    key: string;
    key_type: RateLimitKeyType;
    limit: number;
    actual: number;
    window: RateLimitWindow;
    timestamp: Date;
    ip_address?: string;
    user_id?: string;
    tenant_id?: string;
}
/**
 * Suspicious Activity Event
 */
export interface SuspiciousActivityEvent {
    event_id: string;
    event_type: 'rate_limit_violation' | 'ip_blocked' | 'unusual_pattern' | 'brute_force';
    severity: 'low' | 'medium' | 'high' | 'critical';
    ip_address: string;
    user_id?: string;
    tenant_id?: string;
    details: Record<string, any>;
    timestamp: Date;
}
/**
 * IP Block Entry
 */
export interface IPBlockEntry {
    ip_address: string;
    blocked_at: Date;
    expires_at: Date;
    reason: string;
    violation_count: number;
}
/**
 * Rate Limit Storage Interface
 */
export interface RateLimitStorage {
    increment(key: string, window: RateLimitWindow, ttl: number): Promise<number>;
    get(key: string): Promise<number>;
    reset(key: string): Promise<void>;
    isBlocked(key: string): Promise<boolean>;
    block(key: string, duration: number, reason: string): Promise<void>;
    unblock(key: string): Promise<void>;
    getBlockInfo(key: string): Promise<IPBlockEntry | null>;
}
/**
 * Default Rate Limit Tiers
 */
export declare const DEFAULT_RATE_LIMIT_TIERS: {
    FREE: RateLimitTier;
    PRO: RateLimitTier;
    BUSINESS: RateLimitTier;
    ENTERPRISE: RateLimitTier;
};
/**
 * IP-based rate limits (stricter for DDoS protection)
 */
export declare const DEFAULT_IP_RATE_LIMITS: RateLimitTier;
/**
 * Default rate limit configuration
 */
export declare const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig;
