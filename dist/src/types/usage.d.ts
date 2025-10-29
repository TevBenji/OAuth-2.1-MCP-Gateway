/**
 * Usage Tracking and Billing Type Definitions
 *
 * Type definitions for usage tracking, billing metrics, and tenant usage limits
 */
import { z } from 'zod';
export interface UsageRecord {
    id: string;
    tenant_id: string;
    user_id?: string;
    client_id?: string;
    resource_id?: string;
    action: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface UsageMetrics {
    tenant_id: string;
    period_start: Date;
    period_end: Date;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    mcp_requests: number;
    token_requests: number;
    auth_requests: number;
    peak_concurrent_requests: number;
    average_response_time_ms: number;
    data_processed_bytes: number;
    billable_requests: number;
    overage_requests: number;
    estimated_cost: number;
    currency: string;
}
export declare const TenantBillingSchema: z.ZodObject<{
    tenant_id: z.ZodString;
    billing_tier: z.ZodEnum<["free", "pro", "business", "enterprise"]>;
    current_period_start: z.ZodDate;
    current_period_end: z.ZodDate;
    limits: z.ZodObject<{
        requests_per_month: z.ZodNumber;
        storage_gb: z.ZodNumber;
        users: z.ZodNumber;
        mcp_servers: z.ZodNumber;
        api_keys: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        requests_per_month: number;
        storage_gb: number;
        users: number;
        mcp_servers: number;
        api_keys: number;
    }, {
        requests_per_month: number;
        storage_gb: number;
        users: number;
        mcp_servers: number;
        api_keys: number;
    }>;
    current_usage: z.ZodObject<{
        requests_this_month: z.ZodNumber;
        storage_used_gb: z.ZodNumber;
        current_users: z.ZodNumber;
        current_mcp_servers: z.ZodNumber;
        current_api_keys: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        requests_this_month: number;
        storage_used_gb: number;
        current_users: number;
        current_mcp_servers: number;
        current_api_keys: number;
    }, {
        requests_this_month: number;
        storage_used_gb: number;
        current_users: number;
        current_mcp_servers: number;
        current_api_keys: number;
    }>;
    subscription_status: z.ZodEnum<["active", "past_due", "canceled", "trialing", "unpaid"]>;
    last_invoice_date: z.ZodOptional<z.ZodDate>;
    next_billing_date: z.ZodOptional<z.ZodDate>;
    outstanding_balance: z.ZodNumber;
    billing_email: z.ZodString;
    auto_renew: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    tenant_id: string;
    billing_tier: "free" | "pro" | "business" | "enterprise";
    current_period_start: Date;
    current_period_end: Date;
    limits: {
        requests_per_month: number;
        storage_gb: number;
        users: number;
        mcp_servers: number;
        api_keys: number;
    };
    current_usage: {
        requests_this_month: number;
        storage_used_gb: number;
        current_users: number;
        current_mcp_servers: number;
        current_api_keys: number;
    };
    subscription_status: "active" | "canceled" | "past_due" | "trialing" | "unpaid";
    outstanding_balance: number;
    billing_email: string;
    auto_renew: boolean;
    last_invoice_date?: Date | undefined;
    next_billing_date?: Date | undefined;
}, {
    tenant_id: string;
    billing_tier: "free" | "pro" | "business" | "enterprise";
    current_period_start: Date;
    current_period_end: Date;
    limits: {
        requests_per_month: number;
        storage_gb: number;
        users: number;
        mcp_servers: number;
        api_keys: number;
    };
    current_usage: {
        requests_this_month: number;
        storage_used_gb: number;
        current_users: number;
        current_mcp_servers: number;
        current_api_keys: number;
    };
    subscription_status: "active" | "canceled" | "past_due" | "trialing" | "unpaid";
    outstanding_balance: number;
    billing_email: string;
    last_invoice_date?: Date | undefined;
    next_billing_date?: Date | undefined;
    auto_renew?: boolean | undefined;
}>;
export type TenantBilling = z.infer<typeof TenantBillingSchema>;
export interface BillingTierConfig {
    tier: 'free' | 'pro' | 'business' | 'enterprise';
    name: string;
    monthly_fee: number;
    currency: string;
    limits: {
        requests_per_month: number;
        storage_gb: number;
        users: number;
        mcp_servers: number;
        api_keys: number;
        custom_domains: number;
        sso: boolean;
        dedicated_support: boolean;
        audit_retention_days: number;
    };
    overage_costs: {
        request: number;
        gb_storage: number;
        user: number;
    };
}
export interface UsageAlert {
    id: string;
    tenant_id: string;
    alert_type: 'usage_threshold' | 'billing_threshold' | 'quota_exceeded';
    threshold_type: 'percentage' | 'absolute';
    threshold_value: number;
    triggered_at: Date;
    resolved_at?: Date;
    notification_sent: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
}
export interface UsageReport {
    tenant_id: string;
    report_period_start: Date;
    report_period_end: Date;
    generated_at: Date;
    metrics: UsageMetrics;
    alerts: UsageAlert[];
    cost_breakdown: {
        base_tier_cost: number;
        overage_cost: number;
        total_cost: number;
        currency: string;
        details: Array<{
            category: string;
            count: number;
            unit_cost: number;
            total_cost: number;
        }>;
    };
}
