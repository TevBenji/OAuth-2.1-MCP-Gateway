/**
 * Multi-Tenant Type Definitions
 *
 * Type definitions for multi-tenant architecture including tenant management,
 * isolation, configuration, and billing.
 */
import { z } from 'zod';
export declare const TenantConfigSchema: z.ZodObject<{
    tenant_id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    domain: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["active", "suspended", "pending"]>>;
    compliance_tier: z.ZodDefault<z.ZodEnum<["standard", "hipaa", "pci-dss", "sox"]>>;
    audit_retention_days: z.ZodDefault<z.ZodNumber>;
    encryption_at_rest: z.ZodDefault<z.ZodBoolean>;
    max_users: z.ZodDefault<z.ZodNumber>;
    max_mcp_servers: z.ZodDefault<z.ZodNumber>;
    max_oauth_clients: z.ZodDefault<z.ZodNumber>;
    max_requests_per_month: z.ZodDefault<z.ZodNumber>;
    max_concurrent_sessions: z.ZodDefault<z.ZodNumber>;
    rate_limits: z.ZodDefault<z.ZodObject<{
        requests_per_minute: z.ZodDefault<z.ZodNumber>;
        requests_per_hour: z.ZodDefault<z.ZodNumber>;
        requests_per_day: z.ZodDefault<z.ZodNumber>;
        burst_limit: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        requests_per_minute: number;
        requests_per_hour: number;
        requests_per_day: number;
        burst_limit: number;
    }, {
        requests_per_minute?: number | undefined;
        requests_per_hour?: number | undefined;
        requests_per_day?: number | undefined;
        burst_limit?: number | undefined;
    }>>;
    billing_tier: z.ZodDefault<z.ZodEnum<["free", "pro", "business", "enterprise"]>>;
    billing_email: z.ZodOptional<z.ZodString>;
    billing_address: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        postal_code: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        state: string;
        street: string;
        city: string;
        postal_code: string;
        country: string;
    }, {
        state: string;
        street: string;
        city: string;
        postal_code: string;
        country: string;
    }>>;
    features: z.ZodDefault<z.ZodObject<{
        api_key_rotation: z.ZodDefault<z.ZodBoolean>;
        advanced_audit_logging: z.ZodDefault<z.ZodBoolean>;
        custom_scopes: z.ZodDefault<z.ZodBoolean>;
        sso_integration: z.ZodDefault<z.ZodBoolean>;
        dedicated_support: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        api_key_rotation: boolean;
        advanced_audit_logging: boolean;
        custom_scopes: boolean;
        sso_integration: boolean;
        dedicated_support: boolean;
    }, {
        api_key_rotation?: boolean | undefined;
        advanced_audit_logging?: boolean | undefined;
        custom_scopes?: boolean | undefined;
        sso_integration?: boolean | undefined;
        dedicated_support?: boolean | undefined;
    }>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "suspended" | "pending";
    name: string;
    billing_tier: "free" | "pro" | "business" | "enterprise";
    compliance_tier: "pci-dss" | "hipaa" | "sox" | "standard";
    features: {
        api_key_rotation: boolean;
        advanced_audit_logging: boolean;
        custom_scopes: boolean;
        sso_integration: boolean;
        dedicated_support: boolean;
    };
    max_mcp_servers: number;
    max_users: number;
    domain: string;
    audit_retention_days: number;
    max_concurrent_sessions: number;
    encryption_at_rest: boolean;
    max_oauth_clients: number;
    max_requests_per_month: number;
    rate_limits: {
        requests_per_minute: number;
        requests_per_hour: number;
        requests_per_day: number;
        burst_limit: number;
    };
    tenant_id?: string | undefined;
    created_at?: Date | undefined;
    metadata?: Record<string, any> | undefined;
    updated_at?: Date | undefined;
    billing_email?: string | undefined;
    billing_address?: {
        state: string;
        street: string;
        city: string;
        postal_code: string;
        country: string;
    } | undefined;
}, {
    name: string;
    domain: string;
    status?: "active" | "suspended" | "pending" | undefined;
    tenant_id?: string | undefined;
    created_at?: Date | undefined;
    metadata?: Record<string, any> | undefined;
    updated_at?: Date | undefined;
    billing_tier?: "free" | "pro" | "business" | "enterprise" | undefined;
    billing_email?: string | undefined;
    compliance_tier?: "pci-dss" | "hipaa" | "sox" | "standard" | undefined;
    features?: {
        api_key_rotation?: boolean | undefined;
        advanced_audit_logging?: boolean | undefined;
        custom_scopes?: boolean | undefined;
        sso_integration?: boolean | undefined;
        dedicated_support?: boolean | undefined;
    } | undefined;
    max_mcp_servers?: number | undefined;
    max_users?: number | undefined;
    audit_retention_days?: number | undefined;
    max_concurrent_sessions?: number | undefined;
    encryption_at_rest?: boolean | undefined;
    max_oauth_clients?: number | undefined;
    max_requests_per_month?: number | undefined;
    rate_limits?: {
        requests_per_minute?: number | undefined;
        requests_per_hour?: number | undefined;
        requests_per_day?: number | undefined;
        burst_limit?: number | undefined;
    } | undefined;
    billing_address?: {
        state: string;
        street: string;
        city: string;
        postal_code: string;
        country: string;
    } | undefined;
}>;
export type TenantConfig = z.infer<typeof TenantConfigSchema>;
export interface TenantContext {
    tenant_id: string;
    user_id: string;
    email: string;
    roles: string[];
    permissions: string[];
    session_id?: string;
    device_id?: string;
    ip_address: string;
    user_agent: string;
    auth_time: number;
    risk_score?: number;
}
export interface TenantUsageMetrics {
    tenant_id: string;
    period_start: Date;
    period_end: Date;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    average_response_time_ms: number;
    active_users: number;
    active_mcp_servers: number;
    active_oauth_clients: number;
    storage_used_bytes: number;
    billable_requests: number;
    overage_requests: number;
    estimated_cost: number;
    authentication_failures: number;
    authorization_failures: number;
    suspicious_activities: number;
}
export declare const APIKeyConfigSchema: z.ZodObject<{
    key_id: z.ZodOptional<z.ZodString>;
    tenant_id: z.ZodString;
    name: z.ZodString;
    key_prefix: z.ZodString;
    key_hash: z.ZodString;
    scopes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    version: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["active", "inactive", "revoked"]>>;
    expires_at: z.ZodOptional<z.ZodDate>;
    last_used: z.ZodOptional<z.ZodDate>;
    usage_count: z.ZodDefault<z.ZodNumber>;
    allowed_ips: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    allowed_origins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    rate_limit_override: z.ZodOptional<z.ZodNumber>;
    created_by: z.ZodString;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    scopes: string[];
    status: "active" | "revoked" | "inactive";
    tenant_id: string;
    name: string;
    version: number;
    key_prefix: string;
    key_hash: string;
    usage_count: number;
    created_by: string;
    created_at?: Date | undefined;
    expires_at?: Date | undefined;
    updated_at?: Date | undefined;
    key_id?: string | undefined;
    last_used?: Date | undefined;
    allowed_ips?: string[] | undefined;
    allowed_origins?: string[] | undefined;
    rate_limit_override?: number | undefined;
}, {
    tenant_id: string;
    name: string;
    key_prefix: string;
    key_hash: string;
    created_by: string;
    scopes?: string[] | undefined;
    status?: "active" | "revoked" | "inactive" | undefined;
    created_at?: Date | undefined;
    expires_at?: Date | undefined;
    updated_at?: Date | undefined;
    version?: number | undefined;
    key_id?: string | undefined;
    last_used?: Date | undefined;
    usage_count?: number | undefined;
    allowed_ips?: string[] | undefined;
    allowed_origins?: string[] | undefined;
    rate_limit_override?: number | undefined;
}>;
export type APIKeyConfig = z.infer<typeof APIKeyConfigSchema>;
export interface TenantIsolationPolicy {
    tenant_id: string;
    database_isolation: 'shared' | 'dedicated' | 'row_level_security';
    schema_prefix?: string;
    vpc_id?: string;
    subnet_ids?: string[];
    security_group_ids?: string[];
    storage_bucket_prefix: string;
    encryption_key_id?: string;
    dedicated_workers?: boolean;
    resource_limits: {
        cpu_limit?: number;
        memory_limit_mb?: number;
        storage_limit_gb?: number;
    };
}
export interface TenantBilling {
    tenant_id: string;
    billing_tier: 'free' | 'pro' | 'business' | 'enterprise';
    subscription_id?: string;
    subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing';
    current_period_start: Date;
    current_period_end: Date;
    current_usage: TenantUsageMetrics;
    usage_limits: {
        requests_per_month: number;
        storage_gb: number;
        users: number;
        mcp_servers: number;
    };
    last_invoice_date?: Date;
    last_payment_date?: Date;
    outstanding_balance: number;
    payment_method_id?: string;
    billing_email: string;
    billing_address?: {
        street: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
}
export declare class TenantError extends Error {
    code: string;
    message: string;
    statusCode: number;
    tenantId?: string | undefined;
    constructor(code: string, message: string, statusCode?: number, tenantId?: string | undefined);
}
export declare class TenantNotFoundError extends TenantError {
    constructor(tenantId: string);
}
export declare class TenantSuspendedError extends TenantError {
    constructor(tenantId: string);
}
export declare class TenantQuotaExceededError extends TenantError {
    constructor(tenantId: string, resource: string, limit: number);
}
export declare class TenantIsolationViolationError extends TenantError {
    constructor(tenantId: string, attemptedResource: string);
}
