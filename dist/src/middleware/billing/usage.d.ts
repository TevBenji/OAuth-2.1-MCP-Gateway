/**
 * Billing and Usage Tracking Middleware
 *
 * Middleware to track usage for billing purposes on each request
 */
import { Context, Next } from 'hono';
import { Bindings } from '@/types/bindings';
type Variables = {
    tenantId?: string;
    userId?: string;
    clientId?: string;
};
export declare function billingMiddleware(c: Context<{
    Bindings: Bindings;
    Variables: Variables;
}>, next: Next): Promise<void>;
export {};
