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
export declare class RateLimitService {
    private cache;
    constructor(cache: KVNamespace);
    /**
     * Check if request is within rate limit
     */
    checkRateLimit(key: string, config: RateLimitConfig): Promise<boolean>;
    /**
     * Get remaining requests for a key
     */
    getRemainingRequests(key: string, config: RateLimitConfig): Promise<{
        minute: number;
        hour: number;
    }>;
}
