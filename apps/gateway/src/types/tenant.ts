/**
 * Multi-Tenant Type Definitions
 * 
 * Type definitions for multi-tenant architecture including tenant management,
 * isolation, configuration, and billing.
 */

import { z } from 'zod';

// Tenant Configuration Schema
export const TenantConfigSchema = z.object({
  tenant_id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  domain: z.string().min(1).max(255),
  status: z.enum(['active', 'suspended', 'pending']).default('active'),
  
  // Compliance and Security
  compliance_tier: z.enum(['standard', 'hipaa', 'pci-dss', 'sox']).default('standard'),
  audit_retention_days: z.number().int().min(30).max(2555).default(365), // 7 years max
  encryption_at_rest: z.boolean().default(true),
  
  // Limits and Quotas
  max_users: z.number().int().positive().default(100),
  max_mcp_servers: z.number().int().positive().default(10),
  max_oauth_clients: z.number().int().positive().default(50),
  max_requests_per_month: z.number().int().positive().default(10000),
  max_concurrent_sessions: z.number().int().positive().default(100),
  
  // Rate Limiting
  rate_limits: z.object({
    requests_per_minute: z.number().int().positive().default(1000),
    requests_per_hour: z.number().int().positive().default(10000),
    requests_per_day: z.number().int().positive().default(100000),
    burst_limit: z.number().int().positive().default(100)
  }).default({}),
  
  // Billing Configuration
  billing_tier: z.enum(['free', 'pro', 'business', 'enterprise']).default('free'),
  billing_email: z.string().email().optional(),
  billing_address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string()
  }).optional(),
  
  // Feature Flags
  features: z.object({
    api_key_rotation: z.boolean().default(true),
    advanced_audit_logging: z.boolean().default(false),
    custom_scopes: z.boolean().default(false),
    sso_integration: z.boolean().default(false),
    dedicated_support: z.boolean().default(false)
  }).default({}),
  
  // Metadata
  metadata: z.record(z.string(), z.any()).optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export type TenantConfig = z.infer<typeof TenantConfigSchema>;

// Tenant Context (extracted from JWT or API key)
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

// Tenant Usage Metrics
export interface TenantUsageMetrics {
  tenant_id: string;
  period_start: Date;
  period_end: Date;
  
  // Request Metrics
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time_ms: number;
  
  // Resource Usage
  active_users: number;
  active_mcp_servers: number;
  active_oauth_clients: number;
  storage_used_bytes: number;
  
  // Billing Metrics
  billable_requests: number;
  overage_requests: number;
  estimated_cost: number;
  
  // Security Metrics
  authentication_failures: number;
  authorization_failures: number;
  suspicious_activities: number;
}

// API Key Configuration
export const APIKeyConfigSchema = z.object({
  key_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  key_prefix: z.string().length(8), // e.g., "mcp_live_" or "mcp_test_"
  key_hash: z.string().min(64), // SHA-256 hash of the full key
  scopes: z.array(z.string()).default([]),
  
  // Key Management
  version: z.number().int().positive().default(1),
  status: z.enum(['active', 'inactive', 'revoked']).default('active'),
  expires_at: z.date().optional(),
  last_used: z.date().optional(),
  usage_count: z.number().int().min(0).default(0),
  
  // Security
  allowed_ips: z.array(z.string()).optional(),
  allowed_origins: z.array(z.string()).optional(),
  rate_limit_override: z.number().int().positive().optional(),
  
  // Metadata
  created_by: z.string().uuid(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export type APIKeyConfig = z.infer<typeof APIKeyConfigSchema>;

// Tenant Isolation Policy
export interface TenantIsolationPolicy {
  tenant_id: string;
  
  // Database Isolation
  database_isolation: 'shared' | 'dedicated' | 'row_level_security';
  schema_prefix?: string;
  
  // Network Isolation
  vpc_id?: string;
  subnet_ids?: string[];
  security_group_ids?: string[];
  
  // Storage Isolation
  storage_bucket_prefix: string;
  encryption_key_id?: string;
  
  // Compute Isolation
  dedicated_workers?: boolean;
  resource_limits: {
    cpu_limit?: number;
    memory_limit_mb?: number;
    storage_limit_gb?: number;
  };
}

// Tenant Billing Information
export interface TenantBilling {
  tenant_id: string;
  billing_tier: 'free' | 'pro' | 'business' | 'enterprise';
  
  // Subscription Details
  subscription_id?: string;
  subscription_status: 'active' | 'past_due' | 'canceled' | 'trialing';
  current_period_start: Date;
  current_period_end: Date;
  
  // Usage and Limits
  current_usage: TenantUsageMetrics;
  usage_limits: {
    requests_per_month: number;
    storage_gb: number;
    users: number;
    mcp_servers: number;
  };
  
  // Billing History
  last_invoice_date?: Date;
  last_payment_date?: Date;
  outstanding_balance: number;
  
  // Payment Method
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

// Tenant Error Types
export class TenantError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public tenantId?: string
  ) {
    super(message);
    this.name = 'TenantError';
  }
}

export class TenantNotFoundError extends TenantError {
  constructor(tenantId: string) {
    super('TENANT_NOT_FOUND', `Tenant not found: ${tenantId}`, 404, tenantId);
  }
}

export class TenantSuspendedError extends TenantError {
  constructor(tenantId: string) {
    super('TENANT_SUSPENDED', `Tenant is suspended: ${tenantId}`, 403, tenantId);
  }
}

export class TenantQuotaExceededError extends TenantError {
  constructor(tenantId: string, resource: string, limit: number) {
    super(
      'TENANT_QUOTA_EXCEEDED',
      `Tenant quota exceeded for ${resource}: ${limit}`,
      429,
      tenantId
    );
  }
}

export class TenantIsolationViolationError extends TenantError {
  constructor(tenantId: string, attemptedResource: string) {
    super(
      'TENANT_ISOLATION_VIOLATION',
      `Tenant isolation violation: ${tenantId} attempted to access ${attemptedResource}`,
      403,
      tenantId
    );
  }
}