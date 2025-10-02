/**
 * Billing-aware Rate Limiting Middleware
 *
 * Rate limiting that takes billing tier into account
 */
import { Context, Next } from 'hono';
import { Bindings } from '@/types/bindings';
type Variables = {
    tenantId?: string;
    userId?: string;
    clientId?: string;
};
export declare function billingRateLimitMiddleware(c: Context<{
    Bindings: Bindings;
    Variables: Variables;
}>, next: Next): Promise<void | (Response & import("hono").TypedResponse<{
    error: string;
    message: string;
}>) | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>)>;
export {};
