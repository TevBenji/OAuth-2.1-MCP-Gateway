/**
 * Audit logging types for OAuth 2.1 MCP Gateway
 */
export type ComplianceTag = 'GDPR' | 'HIPAA' | 'PCI-DSS' | 'SOX' | 'SOC2' | 'CCPA' | 'ISO27001' | 'FEDRAMP' | 'FINRA' | 'custom';
export type AuditEventType = 'auth.login' | 'auth.login.failed' | 'auth.logout' | 'auth.logout.failed' | 'auth.refresh' | 'auth.refresh.failed' | 'authz.permission.granted' | 'authz.permission.denied' | 'authz.scope.granted' | 'authz.scope.denied' | 'authz.token.issued' | 'authz.token.issued.failed' | 'authz.token.revoked' | 'authz.token.validated' | 'authz.token.validated.failed' | 'mcp.request' | 'mcp.request.failed' | 'mcp.tool.invoked' | 'mcp.tool.invoked.failed' | 'mcp.resource.accessed' | 'mcp.resource.accessed.failed' | 'client.created' | 'client.updated' | 'client.deleted' | 'client.registration' | 'client.registration.failed' | 'user.created' | 'user.updated' | 'user.deleted' | 'user.profile.updated' | 'security.rate.limit.exceeded' | 'security.brute.force.detected' | 'security.suspicious.activity' | 'security.session.hijacking.attempt' | 'security.token.leak.detected' | 'security.csrf.attempt' | 'security.xss.attempt' | 'system.startup' | 'system.shutdown' | 'system.error' | 'system.config.changed' | 'authz.policy.created' | 'authz.policy.updated' | 'authz.policy.deleted' | 'data.access' | 'data.export' | 'system.config.updated' | 'system.schema.updated';
export interface AuditLogEntry {
    id: string;
    timestamp: string;
    event: AuditEventType;
    tenantId: string;
    userId?: string;
    clientId?: string;
    resourceId?: string;
    resourceType?: string;
    action: string;
    success: boolean;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
    complianceTags: ComplianceTag[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: 'gateway' | 'mcp-server' | 'client' | 'system';
}
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
export interface AuditLogQuery {
    tenantId: string;
    userId?: string;
    clientId?: string;
    event?: AuditEventType;
    eventTypePrefix?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    source?: 'gateway' | 'mcp-server' | 'client' | 'system';
    complianceTag?: ComplianceTag;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
    orderBy?: 'timestamp' | 'severity';
    orderDirection?: 'asc' | 'desc';
}
export interface AuditLogQueryResult {
    entries: AuditLogEntry[];
    totalCount: number;
    limit: number;
    offset: number;
}
export interface RetentionPolicy {
    name: string;
    description: string;
    complianceTag: ComplianceTag;
    retentionPeriodDays: number;
    autoDelete: boolean;
    exportRequired: boolean;
    exportFrequency?: 'daily' | 'weekly' | 'monthly';
}
export type AuditLog = AuditLogEntry;
