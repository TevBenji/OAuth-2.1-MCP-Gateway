/**
 * Audit logging types for OAuth 2.1 MCP Gateway
 */

// Compliance tags for different regulatory requirements
export type ComplianceTag = 
  | 'GDPR'           // General Data Protection Regulation
  | 'HIPAA'          // Health Insurance Portability and Accountability Act
  | 'PCI-DSS'        // Payment Card Industry Data Security Standard
  | 'SOX'            // Sarbanes-Oxley Act
  | 'SOC2'           // Service Organization Control 2
  | 'CCPA'           // California Consumer Privacy Act
  | 'ISO27001'       // ISO/IEC 27001 Information Security Management
  | 'FEDRAMP'        // Federal Risk and Authorization Management Program
  | 'FINRA'          // Financial Industry Regulatory Authority
  | 'custom';        // Custom compliance requirements

// Types of audit events
export type AuditEventType = 
  // Authentication events
  | 'auth.login'
  | 'auth.login.failed'
  | 'auth.logout'
  | 'auth.logout.failed'
  | 'auth.refresh'
  | 'auth.refresh.failed'
  
  // Authorization events
  | 'authz.permission.granted'
  | 'authz.permission.denied'
  | 'authz.scope.granted'
  | 'authz.scope.denied'
  | 'authz.token.issued'
  | 'authz.token.issued.failed'
  | 'authz.token.revoked'
  | 'authz.token.validated'
  | 'authz.token.validated.failed'
  
  // MCP events
  | 'mcp.request'
  | 'mcp.request.failed'
  | 'mcp.tool.invoked'
  | 'mcp.tool.invoked.failed'
  | 'mcp.resource.accessed'
  | 'mcp.resource.accessed.failed'
  
  // Client management events
  | 'client.created'
  | 'client.updated'
  | 'client.deleted'
  | 'client.registration'
  | 'client.registration.failed'
  
  // User management events
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.profile.updated'
  
  // Security events
  | 'security.rate.limit.exceeded'
  | 'security.brute.force.detected'
  | 'security.suspicious.activity'
  | 'security.session.hijacking.attempt'
  | 'security.token.leak.detected'
  | 'security.csrf.attempt'
  | 'security.xss.attempt'
  
  // System events
  | 'system.startup'
  | 'system.shutdown'
  | 'system.error'
  | 'system.config.changed';

// Standard audit log entry structure
export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601 format
  event: AuditEventType;
  tenantId: string;
  userId?: string;
  clientId?: string;
  resourceId?: string;
  resourceType?: string;
  action: string;
  success: boolean;
  details: Record<string, any>; // Additional event-specific details
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  complianceTags: ComplianceTag[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: 'gateway' | 'mcp-server' | 'client' | 'system';
}

// Options for creating audit log entries
export interface AuditLogOptions {
  userId?: string;
  clientId?: string;
  resourceId?: string;
  resourceType?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  details?: Record<string, any>;
  complianceTags?: ComplianceTag[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
  source?: 'gateway' | 'mcp-server' | 'client' | 'system';
}

// Query parameters for audit log search
export interface AuditLogQuery {
  tenantId: string;
  userId?: string;
  clientId?: string;
  event?: AuditEventType;
  eventTypePrefix?: string; // For querying event categories like 'authz.*'
  severity?: 'low' | 'medium' | 'high' | 'critical';
  source?: 'gateway' | 'mcp-server' | 'client' | 'system';
  complianceTag?: ComplianceTag;
  startDate?: string; // ISO 8601 format
  endDate?: string;   // ISO 8601 format
  limit?: number;
  offset?: number;
  orderBy?: 'timestamp' | 'severity';
  orderDirection?: 'asc' | 'desc';
}

// Response for audit log queries
export interface AuditLogQueryResult {
  entries: AuditLogEntry[];
  totalCount: number;
  limit: number;
  offset: number;
}

// Retention policy for audit logs
export interface RetentionPolicy {
  name: string;
  description: string;
  complianceTag: ComplianceTag;
  retentionPeriodDays: number; // How long to keep logs
  autoDelete: boolean; // Whether to auto-delete after retention period
  exportRequired: boolean; // Whether export is required for compliance
  exportFrequency?: 'daily' | 'weekly' | 'monthly'; // How often to export
}