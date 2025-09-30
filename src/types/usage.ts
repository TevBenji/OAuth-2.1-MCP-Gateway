/**
 * Usage Tracking and Billing Type Definitions
 * 
 * Type definitions for usage tracking, billing metrics, and tenant usage limits
 */

import { z } from 'zod';

// Usage record for individual requests
export interface UsageRecord {
  id: string;
  tenant_id: string;
  user_id?: string;
  client_id?: string;
  resource_id?: string; // MCP server ID or resource being accessed
  action: string; // Type of action (e.g., 'mcp_request', 'token_issued', 'auth_flow')
  timestamp: Date;
  metadata?: Record<string, any>; // Additional context about the request
}

// Usage metrics for a tenant in a specific period
export interface UsageMetrics {
  tenant_id: string;
  period_start: Date;
  period_end: Date;
  
  // Request metrics
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  mcp_requests: number;
  token_requests: number;
  auth_requests: number;
  
  // Resource metrics
  peak_concurrent_requests: number;
  average_response_time_ms: number;
  data_processed_bytes: number;
  
  // Billing metrics
  billable_requests: number;
  overage_requests: number;
  estimated_cost: number;
  currency: string; // e.g., 'USD'
}

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

export type TenantBilling = z.infer<typeof TenantBillingSchema>;

// Billing tier configuration
export interface BillingTierConfig {
  tier: 'free' | 'pro' | 'business' | 'enterprise';
  name: string;
  monthly_fee: number; // in cents
  currency: string; // e.g., 'USD'
  
  // Feature limits
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
  
  // Per-unit cost for overages
  overage_costs: {
    request: number; // cost per 1000 requests over limit (in cents)
    gb_storage: number; // cost per GB over limit (in cents)
    user: number; // cost per user over limit (in cents)
  };
}

// Usage alert configuration
export interface UsageAlert {
  id: string;
  tenant_id: string;
  alert_type: 'usage_threshold' | 'billing_threshold' | 'quota_exceeded';
  threshold_type: 'percentage' | 'absolute';
  threshold_value: number; // percentage (0-100) or absolute value
  triggered_at: Date;
  resolved_at?: Date;
  notification_sent: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

// Usage report for billing
export interface UsageReport {
  tenant_id: string;
  report_period_start: Date;
  report_period_end: Date;
  generated_at: Date;
  metrics: UsageMetrics;
  alerts: UsageAlert[];
  cost_breakdown: {
    base_tier_cost: number; // in cents
    overage_cost: number; // in cents
    total_cost: number; // in cents
    currency: string;
    details: Array<{
      category: string;
      count: number;
      unit_cost: number; // in cents
      total_cost: number; // in cents
    }>;
  };
}