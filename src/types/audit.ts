/**
 * Audit Logging Type Definitions
 * 
 * Type definitions for comprehensive audit logging, compliance tracking,
 * and security event monitoring.
 */

import { z } from 'zod';

// Audit Event Types
export const AUDIT_EVENT_TYPES = {
  // Authentication Events
  'auth.login': 'User login attempt',
  'auth.logout': 'User logout',
  'auth.token_issued': 'OAuth token issued',
  'auth.token_refreshed': 'OAuth token refreshed',
  'auth.token_revoked': 'OAuth token revoked',
  'auth.failed_login': 'Failed login attempt',
  'auth.password_reset': 'Password reset requested',
  'auth.mfa_enabled': 'Multi-factor authentication enabled',
  'auth.mfa_disabled': 'Multi-factor authentication disabled',
  
  // Authorization Events
  'authz.access_granted': 'Access granted to resource',
  'authz.access_denied': 'Access denied to resource',
  'authz.scope_granted': 'OAuth scope granted',
  'authz.scope_denied': 'OAuth scope denied',
  'authz.permission_changed': 'User permission changed',
  
  // MCP Events
  'mcp.tool_invoked': 'MCP tool invoked',
  'mcp.resource_accessed': 'MCP resource accessed',
  'mcp.server_registered': 'MCP server registered',
  'mcp.server_deregistered': 'MCP server deregistered',
  'mcp.server_health_check': 'MCP server health check',
  
  // Tenant Management Events
  'tenant.created': 'Tenant created',
  'tenant.updated': 'Tenant configuration updated',
  'tenant.suspended': 'Tenant suspended',
  'tenant.deleted': 'Tenant deleted',
  'tenant.quota_exceeded': 'Tenant quota exceeded',
  
  // Client Management Events
  'client.registered': 'OAuth client registered',
  'client.updated': 'OAuth client updated',
  'client.deleted': 'OAuth client deleted',
  'client.secret_rotated': 'Client secret rotated',
  
  // API Key Events
  'apikey.created': 'API key created',
  'apikey.rotated': 'API key rotated',
  'apikey.revoked': 'API key revoked',
  'apikey.used': 'API key used',
  
  // Security Events
  'security.suspicious_activity': 'Suspicious activity detected',
  'security.rate_limit_exceeded': 'Rate limit exceeded',
  'security.ip_blocked': 'IP address blocked',
  'security.brute_force_detected': 'Brute force attack detected',
  'security.anomaly_detected': 'Security anomaly detected',
  
  // System Events
  'system.startup': 'System startup',
  'system.shutdown': 'System shutdown',
  'system.error': 'System error',
  'system.maintenance': 'System maintenance',
  'system.backup': 'System backup',
  'system.restore': 'System restore'
} as const;

export type AuditEventType = keyof typeof AUDIT_EVENT_TYPES;

// Audit Log Entry Schema
export const AuditLogEntrySchema = z.object({
  // Core Identifiers
  log_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  user_id: z.string().optional(),
  session_id: z.string().optional(),
  
  // Event Information
  event_type: z.enum(Object.keys(AUDIT_EVENT_TYPES) as [AuditEventType, ...AuditEventType[]]),
  event_category: z.enum(['authentication', 'authorization', 'mcp', 'tenant', 'client', 'apikey', 'security', 'system']),
  action: z.string().min(1).max(255),
  outcome: z.enum(['success', 'failure', 'denied', 'error']),
  
  // Resource Information
  resource_type: z.string().optional(),
  resource_id: z.string().optional(),
  resource_name: z.string().optional(),
  
  // Request Context
  ip_address: z.string().ip().optional(),
  user_agent: z.string().optional(),
  request_id: z.string().optional(),
  correlation_id: z.string().optional(),
  
  // Security Context
  risk_score: z.number().min(0).max(1).optional(),
  threat_indicators: z.array(z.string()).optional(),
  geolocation: z.object({
    country: z.string(),
    region: z.string(),
    city: z.string(),
    latitude: z.number(),
    longitude: z.number()
  }).optional(),
  
  // Compliance Tags
  compliance_tags: z.array(z.enum(['pci-dss', 'hipaa', 'gdpr', 'sox', 'iso27001'])).default([]),
  data_classification: z.enum(['public', 'internal', 'confidential', 'restricted']).optional(),
  
  // Event Details
  message: z.string().max(1000),
  details: z.record(z.string(), z.any()).optional(),
  error_code: z.string().optional(),
  error_message: z.string().optional(),
  
  // Timing
  timestamp: z.date(),
  duration_ms: z.number().int().min(0).optional(),
  
  // Metadata
  version: z.string().default('1.0'),
  source: z.string().default('oauth-mcp-gateway'),
  environment: z.enum(['development', 'staging', 'production'])
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

// Audit Query Filter
export const AuditQueryFilterSchema = z.object({
  // Time Range
  start_time: z.date().optional(),
  end_time: z.date().optional(),
  
  // Identifiers
  tenant_id: z.string().uuid().optional(),
  user_id: z.string().optional(),
  session_id: z.string().optional(),
  
  // Event Filters
  event_types: z.array(z.string()).optional(),
  event_categories: z.array(z.string()).optional(),
  outcomes: z.array(z.enum(['success', 'failure', 'denied', 'error'])).optional(),
  
  // Resource Filters
  resource_types: z.array(z.string()).optional(),
  resource_ids: z.array(z.string()).optional(),
  
  // Security Filters
  min_risk_score: z.number().min(0).max(1).optional(),
  max_risk_score: z.number().min(0).max(1).optional(),
  ip_addresses: z.array(z.string()).optional(),
  
  // Compliance Filters
  compliance_tags: z.array(z.string()).optional(),
  data_classifications: z.array(z.string()).optional(),
  
  // Pagination
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0),
  
  // Sorting
  sort_by: z.enum(['timestamp', 'risk_score', 'event_type']).default('timestamp'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type AuditQueryFilter = z.infer<typeof AuditQueryFilterSchema>;

// Audit Statistics
export interface AuditStatistics {
  tenant_id: string;
  period_start: Date;
  period_end: Date;
  
  // Event Counts
  total_events: number;
  events_by_type: Record<string, number>;
  events_by_outcome: Record<string, number>;
  events_by_category: Record<string, number>;
  
  // Security Metrics
  high_risk_events: number;
  failed_authentications: number;
  access_denials: number;
  suspicious_activities: number;
  
  // Compliance Metrics
  events_by_compliance_tag: Record<string, number>;
  data_access_events: number;
  privileged_operations: number;
  
  // Performance Metrics
  average_response_time_ms: number;
  peak_events_per_hour: number;
  unique_users: number;
  unique_ip_addresses: number;
}

// Audit Alert Configuration
export const AuditAlertConfigSchema = z.object({
  alert_id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  
  // Alert Conditions
  event_types: z.array(z.string()).optional(),
  event_categories: z.array(z.string()).optional(),
  outcomes: z.array(z.enum(['success', 'failure', 'denied', 'error'])).optional(),
  min_risk_score: z.number().min(0).max(1).optional(),
  
  // Threshold Configuration
  threshold_type: z.enum(['count', 'rate', 'anomaly']),
  threshold_value: z.number().positive(),
  threshold_window_minutes: z.number().int().positive().default(60),
  
  // Alert Actions
  notification_channels: z.array(z.enum(['email', 'webhook', 'slack', 'pagerduty'])),
  notification_recipients: z.array(z.string()),
  webhook_url: z.string().url().optional(),
  
  // Alert Management
  enabled: z.boolean().default(true),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  cooldown_minutes: z.number().int().min(1).default(60),
  
  // Metadata
  created_by: z.string().uuid(),
  created_at: z.date().optional(),
  updated_at: z.date().optional()
});

export type AuditAlertConfig = z.infer<typeof AuditAlertConfigSchema>;

// Audit Retention Policy
export interface AuditRetentionPolicy {
  tenant_id: string;
  compliance_tier: 'standard' | 'hipaa' | 'pci-dss' | 'sox';
  
  // Retention Periods (in days)
  authentication_events: number;
  authorization_events: number;
  mcp_events: number;
  security_events: number;
  system_events: number;
  
  // Archive Configuration
  archive_enabled: boolean;
  archive_storage_class: 'standard' | 'cold' | 'glacier';
  archive_encryption_enabled: boolean;
  
  // Deletion Configuration
  auto_delete_enabled: boolean;
  deletion_batch_size: number;
  deletion_schedule: string; // Cron expression
}

// Audit Export Configuration
export interface AuditExportConfig {
  export_id: string;
  tenant_id: string;
  
  // Export Parameters
  filter: AuditQueryFilter;
  format: 'json' | 'csv' | 'parquet';
  compression: 'none' | 'gzip' | 'brotli';
  
  // Destination
  destination_type: 'download' | 's3' | 'gcs' | 'azure_blob';
  destination_config: Record<string, any>;
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  completed_at?: Date;
  download_url?: string;
  file_size_bytes?: number;
  record_count?: number;
  error_message?: string;
}