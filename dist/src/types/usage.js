/**
 * Usage Tracking and Billing Type Definitions
 *
 * Type definitions for usage tracking, billing metrics, and tenant usage limits
 */
import { z } from 'zod';
// Tenant billing information and limits
export const TenantBillingSchema = z.object({
    tenant_id: z.string().uuid(),
    billing_tier: z.enum(['free', 'pro', 'business', 'enterprise']),
    // Billing period
    current_period_start: z.date(),
    current_period_end: z.date(),
    // Usage limits based on billing tier
    limits: z.object({
        requests_per_month: z.number().int().min(0),
        storage_gb: z.number().min(0),
        users: z.number().int().min(0),
        mcp_servers: z.number().int().min(0),
        api_keys: z.number().int().min(0),
    }),
    // Current usage
    current_usage: z.object({
        requests_this_month: z.number().int().min(0),
        storage_used_gb: z.number().min(0),
        current_users: z.number().int().min(0),
        current_mcp_servers: z.number().int().min(0),
        current_api_keys: z.number().int().min(0),
    }),
    // Billing status
    subscription_status: z.enum(['active', 'past_due', 'canceled', 'trialing', 'unpaid']),
    last_invoice_date: z.date().optional(),
    next_billing_date: z.date().optional(),
    outstanding_balance: z.number().min(0),
    billing_email: z.string().email(),
    auto_renew: z.boolean().default(true),
});
