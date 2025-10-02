/**
 * Rate Limiting Middleware
 *
 * Middleware for applying rate limits with proper HTTP 429 responses and headers.
 */
import { Context, Next } from 'hono';
import { RateLimiter } from '../services/security/rate-limiter';
import { RateLimitWindow } from '../types/rate-limit';
/**
 * Rate limiting middleware for authenticated requests
 */
export declare function rateLimitMiddleware(rateLimiter: RateLimiter, window?: RateLimitWindow): (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
    retry_after: number | undefined;
}>)>;
/**
 * IP-based rate limiting middleware (no authentication required)
 */
export declare function ipRateLimitMiddleware(rateLimiter: RateLimiter, window?: RateLimitWindow): (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
    retry_after: number | undefined;
}>)>;
/**
 * Tenant-specific rate limiting middleware
 */
export declare function tenantRateLimitMiddleware(rateLimiter: RateLimiter, window?: RateLimitWindow): (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
    limit: number;
    remaining: number;
    reset: number;
    retry_after: number | undefined;
}>)>;
/**
 * User-specific rate limiting middleware
 */
export declare function userRateLimitMiddleware(rateLimiter: RateLimiter, window?: RateLimitWindow): (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
    limit: number;
    remaining: number;
    reset: number;
    retry_after: number | undefined;
}>)>;
/**
 * Endpoint-specific rate limiting middleware
 */
export declare function endpointRateLimitMiddleware(rateLimiter: RateLimiter, endpoint: string, window?: RateLimitWindow): (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
    limit: number;
    remaining: number;
    reset: number;
    retry_after: number | undefined;
}>)>;
