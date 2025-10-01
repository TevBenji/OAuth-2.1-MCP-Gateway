/**
 * Database schema definitions for OAuth 2.1 MCP Gateway
 * Implements multi-tenant architecture with tenant isolation
 */
export interface TenantEntity {
    tenant_id: string;
}
export interface Tenant {
    id: string;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    compliance_tier: 'basic' | 'standard' | 'enterprise' | 'custom';
    limits: {
        max_clients: number;
        max_tokens_per_hour: number;
        max_requests_per_minute: number;
        max_mcp_servers: number;
        max_users: number;
    };
    status: 'active' | 'suspended' | 'pending' | 'onboarding';
    settings: {
        enable_audit_logging: boolean;
        enable_session_management: boolean;
        enable_rate_limiting: boolean;
        allow_custom_scopes: boolean;
        require_mfa: boolean;
    };
}
export interface OAuthClient extends TenantEntity {
    id: string;
    client_id: string;
    client_secret?: string;
    client_name: string;
    client_uri?: string;
    redirect_uris: string[];
    grant_types: string[];
    response_types: string[];
    scope: string;
    logo_uri?: string;
    client_type: 'public' | 'confidential';
    created_at: string;
    updated_at: string;
    tenant_id: string;
    status: 'active' | 'inactive' | 'suspended';
}
export interface AuthorizationCode extends TenantEntity {
    id: string;
    code: string;
    client_id: string;
    redirect_uri?: string;
    scope?: string;
    expires_at: number;
    created_at: string;
    user_id?: string;
    tenant_id: string;
    code_challenge?: string;
    code_challenge_method?: string;
}
export interface AccessToken extends TenantEntity {
    id: string;
    token: string;
    client_id: string;
    expires_at: number;
    created_at: string;
    scope?: string;
    user_id?: string;
    tenant_id: string;
    resource_indicators?: string[];
}
export interface RefreshToken extends TenantEntity {
    id: string;
    token: string;
    access_token_id: string;
    client_id: string;
    expires_at: number;
    created_at: string;
    scope?: string;
    user_id?: string;
    tenant_id: string;
}
export interface User extends TenantEntity {
    id: string;
    external_id?: string;
    username: string;
    email: string;
    email_verified: boolean;
    first_name?: string;
    last_name?: string;
    created_at: string;
    updated_at: string;
    tenant_id: string;
    status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
    last_login_at?: string;
}
export interface AuditLog extends TenantEntity {
    id: string;
    timestamp: string;
    user_id?: string;
    client_id?: string;
    action: string;
    resource_type?: string;
    resource_id?: string;
    ip_address?: string;
    user_agent?: string;
    success: boolean;
    details?: Record<string, any>;
    compliance_tags: string[];
    tenant_id: string;
}
export interface MCPServer extends TenantEntity {
    id: string;
    name: string;
    url: string;
    description?: string;
    created_at: string;
    updated_at: string;
    tenant_id: string;
    status: 'active' | 'inactive' | 'maintenance' | 'degraded';
    access_token?: string;
    authorization_header_name: string;
}
export interface UsageRecord extends TenantEntity {
    id: string;
    tenant_id: string;
    user_id?: string;
    client_id?: string;
    resource_id?: string;
    action: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
export interface TenantBilling extends TenantEntity {
    tenant_id: string;
    billing_tier: 'free' | 'pro' | 'business' | 'enterprise';
    current_period_start: string;
    current_period_end: string;
    subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'unpaid';
    last_invoice_date?: string;
    next_billing_date?: string;
    outstanding_balance: number;
    billing_email: string;
    auto_renew: boolean;
    created_at: string;
    updated_at: string;
}
export interface UsageAlert extends TenantEntity {
    id: string;
    tenant_id: string;
    alert_type: 'usage_threshold' | 'billing_threshold' | 'quota_exceeded';
    threshold_type: 'percentage' | 'absolute';
    threshold_value: number;
    triggered_at: string;
    resolved_at?: string;
    notification_sent: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
}
export interface UsageReport extends TenantEntity {
    id: string;
    tenant_id: string;
    period_start: string;
    period_end: string;
    generated_at: string;
    report_data: string;
}
