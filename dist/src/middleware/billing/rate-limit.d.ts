/**
 * Billing-aware Rate Limiting Middleware
 *
 * Rate limiting that takes billing tier into account
 */
import { Context, Next } from 'hono';
import { Bindings } from '@/types/bindings';
export declare function billingRateLimitMiddleware(c: Context<{
    Bindings: Bindings;
}>, next: Next): Promise<(Response & import("hono").TypedResponse<{
    error: string;
    message: string;
}>) | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>) | undefined>;
