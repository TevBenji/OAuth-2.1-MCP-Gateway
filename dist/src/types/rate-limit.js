/**
 * Rate Limiting Type Definitions
 *
 * Types for rate limiting, DDoS protection, and suspicious activity detection.
 */
/**
 * Rate Limit Key Types
 */
export var RateLimitKeyType;
(function (RateLimitKeyType) {
    RateLimitKeyType["TENANT"] = "tenant";
    RateLimitKeyType["USER"] = "user";
    RateLimitKeyType["IP"] = "ip";
    RateLimitKeyType["ENDPOINT"] = "endpoint";
    RateLimitKeyType["GLOBAL"] = "global";
})(RateLimitKeyType || (RateLimitKeyType = {}));
/**
 * Rate Limit Window
 */
export var RateLimitWindow;
(function (RateLimitWindow) {
    RateLimitWindow["SECOND"] = "second";
    RateLimitWindow["MINUTE"] = "minute";
    RateLimitWindow["HOUR"] = "hour";
    RateLimitWindow["DAY"] = "day";
})(RateLimitWindow || (RateLimitWindow = {}));
/**
 * Default Rate Limit Tiers
 */
export const DEFAULT_RATE_LIMIT_TIERS = {
    FREE: {
        name: 'free',
        requests_per_second: 10,
        requests_per_minute: 100,
        requests_per_hour: 1000,
        requests_per_day: 10000,
        burst_size: 20,
    },
    PRO: {
        name: 'pro',
        requests_per_second: 50,
        requests_per_minute: 1000,
        requests_per_hour: 10000,
        requests_per_day: 100000,
        burst_size: 100,
    },
    BUSINESS: {
        name: 'business',
        requests_per_second: 200,
        requests_per_minute: 5000,
        requests_per_hour: 50000,
        requests_per_day: 500000,
        burst_size: 400,
    },
    ENTERPRISE: {
        name: 'enterprise',
        requests_per_second: 1000,
        requests_per_minute: 20000,
        requests_per_hour: 200000,
        requests_per_day: 2000000,
        burst_size: 2000,
    },
};
/**
 * IP-based rate limits (stricter for DDoS protection)
 */
export const DEFAULT_IP_RATE_LIMITS = {
    name: 'ip_default',
    requests_per_second: 20,
    requests_per_minute: 300,
    requests_per_hour: 3000,
    requests_per_day: 20000,
    burst_size: 40,
};
/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG = {
    tenant_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
    user_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
    ip_limits: DEFAULT_IP_RATE_LIMITS,
    enable_ip_blocking: true,
    enable_suspicious_activity_detection: true,
    block_duration_seconds: 3600, // 1 hour
};
