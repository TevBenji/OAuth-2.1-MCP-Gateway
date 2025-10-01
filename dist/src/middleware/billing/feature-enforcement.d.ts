/**
 * Billing Feature Enforcement Middleware
 *
 * Middleware to enforce feature availability based on billing tier
 */
import { Context, Next } from 'hono';
import { Bindings } from '@/types/bindings';
export declare function featureEnforcementMiddleware(c: Context<{
    Bindings: Bindings;
}>, next: Next): Promise<(Response & import("hono").TypedResponse<{
    error: string;
    message: string;
}>) | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>) | undefined>;
