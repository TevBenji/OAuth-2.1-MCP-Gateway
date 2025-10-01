/**
 * Billing and Usage Tracking Middleware
 *
 * Middleware to track usage for billing purposes on each request
 */
import { Context, Next } from 'hono';
import { Bindings } from '@/types/bindings';
export declare function billingMiddleware(c: Context<{
    Bindings: Bindings;
}>, next: Next): Promise<void>;
