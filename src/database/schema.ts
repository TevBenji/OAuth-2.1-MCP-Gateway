/**
 * Database schema definitions for OAuth 2.1 MCP Gateway
 * Implements multi-tenant architecture with tenant isolation
 */

// Base interface for all tenant-aware entities
export interface TenantEntity {
  tenant_id: string;
}

// Tenant configuration
export interface Tenant {
  id: string;
  name: string;
  description?: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
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

// OAuth client
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

// Authorization code
export interface AuthorizationCode extends TenantEntity {
  id: string;
  code: string;
  client_id: string;
  redirect_uri?: string;
  scope?: string;
  expires_at: number; // timestamp
  created_at: string;
  user_id?: string;
  tenant_id: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

// Access token
export interface AccessToken extends TenantEntity {
  id: string;
  token: string;
  client_id: string;
  expires_at: number; // timestamp
  created_at: string;
  scope?: string;
  user_id?: string;
  tenant_id: string;
  resource_indicators?: string[]; // RFC 8707
}

// Refresh token
export interface RefreshToken extends TenantEntity {
  id: string;
  token: string;
  access_token_id: string; // Links to AccessToken.id
  client_id: string;
  expires_at: number; // timestamp
  created_at: string;
  scope?: string;
  user_id?: string;
  tenant_id: string;
}

// User
export interface User extends TenantEntity {
  id: string;
  external_id?: string; // ID from external identity provider
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

// Audit log entry
export interface AuditLog extends TenantEntity {
  id: string;
  timestamp: string; // ISO date string
  user_id?: string;
  client_id?: string;
  action: string; // e.g., 'token_issued', 'client_created', 'auth_failed'
  resource_type?: string; // e.g., 'client', 'token', 'user'
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  details?: Record<string, any>; // Additional contextual information
  compliance_tags: string[]; // Tags for compliance requirements
  tenant_id: string;
}

// MCP server
export interface MCPServer extends TenantEntity {
  id: string;
  name: string;
  url: string;
  description?: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  status: 'active' | 'inactive' | 'maintenance' | 'degraded';
  access_token?: string; // If using static token authentication
  authorization_header_name: string; // Name of header to use for auth
}

// Usage record
export interface UsageRecord extends TenantEntity {
  id: string;
  tenant_id: string;
  user_id?: string;
  client_id?: string;
  resource_id?: string; // MCP server ID or resource being accessed
  action: string; // Type of action (e.g., 'mcp_request', 'token_issued', 'auth_flow')
  timestamp: string; // ISO date string
  metadata?: Record<string, any>; // Additional context about the request
}

// Tenant billing information
export interface TenantBilling extends TenantEntity {
  tenant_id: string;
  billing_tier: 'free' | 'pro' | 'business' | 'enterprise';
  current_period_start: string; // ISO date string
  current_period_end: string; // ISO date string
  subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'unpaid';
  last_invoice_date?: string; // ISO date string
  next_billing_date?: string; // ISO date string
  outstanding_balance: number;
  billing_email: string;
  auto_renew: boolean;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

// Usage alert
export interface UsageAlert extends TenantEntity {
  id: string;
  tenant_id: string;
  alert_type: 'usage_threshold' | 'billing_threshold' | 'quota_exceeded';
  threshold_type: 'percentage' | 'absolute';
  threshold_value: number;
  triggered_at: string; // ISO date string
  resolved_at?: string; // ISO date string
  notification_sent: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

// Usage report
export interface UsageReport extends TenantEntity {
  id: string;
  tenant_id: string;
  period_start: string; // ISO date string
  period_end: string; // ISO date string
  generated_at: string; // ISO date string
  report_data: string; // JSON string representation of the full report
}