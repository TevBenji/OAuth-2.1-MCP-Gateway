import { AuditLogEntry, AuditLogOptions, AuditEventType, AuditLogQuery, AuditLogQueryResult, RetentionPolicy, ComplianceTag } from '../../types/audit';
import { D1Database } from '@cloudflare/workers-types';

/**
 * AuditService handles all audit logging functionality for the system
 * Implements structured audit log creation with compliance tags
 */
export class AuditService {
  private db?: D1Database;
  private retentionPolicies: Map<ComplianceTag, RetentionPolicy>;
  private static instance: AuditService;

  private constructor(database?: D1Database) {
    this.db = database;
    this.retentionPolicies = new Map();
    this.initializeDefaultRetentionPolicies();
  }

  // Singleton pattern for global access
  public static getInstance(database?: D1Database): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService(database);
    }
    return AuditService.instance;
  }

  /**
   * Initialize default retention policies for different compliance requirements
   */
  private initializeDefaultRetentionPolicies(): void {
    const now = new Date().toISOString();
    
    // GDPR: 1 year retention for personal data processing logs
    this.retentionPolicies.set('GDPR', {
      name: 'GDPR Data Processing Logs',
      description: 'Logs required for GDPR compliance (Art. 5 - Storage Limitation)',
      complianceTag: 'GDPR',
      retentionPeriodDays: 365, // 1 year
      autoDelete: true,
      exportRequired: true,
      exportFrequency: 'monthly'
    });

    // HIPAA: 6 years retention for healthcare data access logs
    this.retentionPolicies.set('HIPAA', {
      name: 'HIPAA Access Logs',
      description: 'Logs required for HIPAA compliance (45 CFR §164.312)',
      complianceTag: 'HIPAA',
      retentionPeriodDays: 2190, // 6 years
      autoDelete: true,
      exportRequired: true,
      exportFrequency: 'monthly'
    });

    // PCI-DSS: 1 year for event logs, 5 years for audit trails
    this.retentionPolicies.set('PCI-DSS', {
      name: 'PCI-DSS Event Logs',
      description: 'Logs required for PCI-DSS compliance (Requirement 10)',
      complianceTag: 'PCI-DSS',
      retentionPeriodDays: 365, // 1 year (extendable based on requirements)
      autoDelete: true,
      exportRequired: true,
      exportFrequency: 'weekly'
    });

    // SOX: 7 years for financial record keeping
    this.retentionPolicies.set('SOX', {
      name: 'SOX Financial Audit Logs',
      description: 'Logs required for SOX compliance (Section 807)',
      complianceTag: 'SOX',
      retentionPeriodDays: 2555, // 7 years
      autoDelete: true,
      exportRequired: true,
      exportFrequency: 'monthly'
    });

    // SOC2: 7 years for system and organization controls
    this.retentionPolicies.set('SOC2', {
      name: 'SOC 2 Security Logs',
      description: 'Logs required for SOC 2 compliance (Criteria A1.2)',
      complianceTag: 'SOC2',
      retentionPeriodDays: 2555, // 7 years
      autoDelete: true,
      exportRequired: true,
      exportFrequency: 'monthly'
    });

    // ISO27001: 3-7 years depending on organization policy
    this.retentionPolicies.set('ISO27001', {
      name: 'ISO 27001 Security Logs',
      description: 'Logs required for ISO 27001 compliance (A.12.4.1)',
      complianceTag: 'ISO27001',
      retentionPeriodDays: 1095, // 3 years (default)
      autoDelete: true,
      exportRequired: true,
      exportFrequency: 'monthly'
    });
  }

  /**
   * Create a structured audit log entry with compliance tags
   */
  async createLogEntry(
    tenantId: string,
    event: AuditEventType,
    action: string,
    success: boolean,
    options?: AuditLogOptions
  ): Promise<string> { // Returns the ID of the created log entry
    const logEntry: AuditLogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      event,
      action,
      success,
      tenantId,
      userId: options?.userId,
      clientId: options?.clientId,
      resourceId: options?.resourceId,
      resourceType: options?.resourceType,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      sessionId: options?.sessionId,
      requestId: options?.requestId,
      details: options?.details || {},
      complianceTags: options?.complianceTags || [],
      severity: options?.severity || 'medium',
      source: options?.source || 'gateway'
    };

    // Store the log entry
    if (this.db) {
      await this.storeLogEntry(logEntry);
    } else {
      // In-memory storage for development/testing
      this.storeLogEntryInMemory(logEntry);
    }

    return logEntry.id;
  }

  /**
   * Store audit log entry in database
   */
  private async storeLogEntry(entry: AuditLogEntry): Promise<void> {
    try {
      // Convert compliance tags to JSON string for storage
      const complianceTagsJson = JSON.stringify(entry.complianceTags);
      const detailsJson = JSON.stringify(entry.details);

      await this.db!.prepare(
        `INSERT INTO audit_logs (
          id, timestamp, event, action, success, tenant_id, user_id, client_id, 
          resource_id, resource_type, ip_address, user_agent, session_id, 
          request_id, details, compliance_tags, severity, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        entry.id,
        entry.timestamp,
        entry.event,
        entry.action,
        entry.success ? 1 : 0,
        entry.tenantId,
        entry.userId || null,
        entry.clientId || null,
        entry.resourceId || null,
        entry.resourceType || null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.sessionId || null,
        entry.requestId || null,
        detailsJson,
        complianceTagsJson,
        entry.severity,
        entry.source
      ).run();
    } catch (error) {
      console.error('Failed to store audit log entry:', error);
      // In production, you might want to have a fallback mechanism for critical audit logs
      // For now, we'll log the error but continue
    }
  }

  /**
   * Store audit log entry in memory (for development/testing)
   */
  private storeLogEntryInMemory(entry: AuditLogEntry): void {
    // For development purposes only - in production, always use a persistent store
    console.log('Audit log entry:', entry);
  }

  /**
   * Query audit logs based on various criteria
   */
  async queryLogs(query: AuditLogQuery): Promise<AuditLogQueryResult> {
    if (!this.db) {
      // Return empty result if no database is configured
      return { entries: [], totalCount: 0, limit: query.limit || 50, offset: query.offset || 0 };
    }

    // Build the query dynamically based on provided filters
    let baseQuery = `
      SELECT * FROM audit_logs
      WHERE tenant_id = ?
    `;
    const params: any[] = [query.tenantId];
    
    // Add filters based on query options
    if (query.userId) {
      baseQuery += ` AND user_id = ?`;
      params.push(query.userId);
    }
    
    if (query.clientId) {
      baseQuery += ` AND client_id = ?`;
      params.push(query.clientId);
    }
    
    if (query.event) {
      baseQuery += ` AND event = ?`;
      params.push(query.event);
    }
    
    if (query.eventTypePrefix) {
      baseQuery += ` AND event LIKE ?`;
      params.push(`${query.eventTypePrefix}%`);
    }
    
    if (query.severity) {
      baseQuery += ` AND severity = ?`;
      params.push(query.severity);
    }
    
    if (query.source) {
      baseQuery += ` AND source = ?`;
      params.push(query.source);
    }
    
    if (query.complianceTag) {
      baseQuery += ` AND compliance_tags LIKE ?`;
      params.push(`%${query.complianceTag}%`);
    }
    
    if (query.startDate) {
      baseQuery += ` AND timestamp >= ?`;
      params.push(query.startDate);
    }
    
    if (query.endDate) {
      baseQuery += ` AND timestamp <= ?`;
      params.push(query.endDate);
    }

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as count FROM (${baseQuery})`;
    const countResult = await this.db.prepare(countQuery).bind(...params).first<{ count: number }>();
    const totalCount = countResult?.count || 0;

    // Apply ordering and pagination
    const orderBy = query.orderBy || 'timestamp';
    const orderDirection = query.orderDirection || 'desc';
    baseQuery += ` ORDER BY ${orderBy} ${orderDirection}`;

    const limit = query.limit || 50;
    const offset = query.offset || 0;
    baseQuery += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Execute the main query
    const result = await this.db.prepare(baseQuery).bind(...params).all<AuditLogEntry>();
    
    // Parse JSON fields
    const entries = result.results.map(log => ({
      ...log,
      details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
      complianceTags: typeof log.complianceTags === 'string' ? JSON.parse(log.complianceTags) : log.complianceTags,
      success: Boolean(log.success)
    }));

    return {
      entries,
      totalCount,
      limit,
      offset
    };
  }

  /**
   * Export audit logs for compliance requirements
   */
  async exportLogs(
    query: AuditLogQuery,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<string> {
    // Get logs based on query
    const { entries } = await this.queryLogs(query);
    
    switch (format) {
      case 'json':
        return JSON.stringify(entries, null, 2);
      case 'csv':
        return this.convertToCSV(entries);
      case 'xml':
        return this.convertToXML(entries);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert audit log entries to CSV format
   */
  private convertToCSV(entries: AuditLogEntry[]): string {
    if (entries.length === 0) {
      return '';
    }

    // Get all unique keys from all entries' details
    const allDetailKeys = new Set<string>();
    entries.forEach(entry => {
      Object.keys(entry.details).forEach(key => allDetailKeys.add(`details.${key}`));
    });

    // Define CSV headers
    const headers = [
      'id', 'timestamp', 'event', 'action', 'success', 'tenantId', 'userId', 'clientId',
      'resourceId', 'resourceType', 'ipAddress', 'userAgent', 'sessionId', 'requestId',
      'complianceTags', 'severity', 'source', ...Array.from(allDetailKeys)
    ];

    // Create CSV content
    const csvRows = [headers.join(',')];

    for (const entry of entries) {
      const row = [
        this.escapeCSVField(entry.id),
        this.escapeCSVField(entry.timestamp),
        this.escapeCSVField(entry.event),
        this.escapeCSVField(entry.action),
        this.escapeCSVField(entry.success),
        this.escapeCSVField(entry.tenantId),
        this.escapeCSVField(entry.userId),
        this.escapeCSVField(entry.clientId),
        this.escapeCSVField(entry.resourceId),
        this.escapeCSVField(entry.resourceType),
        this.escapeCSVField(entry.ipAddress),
        this.escapeCSVField(entry.userAgent),
        this.escapeCSVField(entry.sessionId),
        this.escapeCSVField(entry.requestId),
        this.escapeCSVField(JSON.stringify(entry.complianceTags)),
        this.escapeCSVField(entry.severity),
        this.escapeCSVField(entry.source)
      ];

      // Add detail fields
      allDetailKeys.forEach(key => {
        const detailKey = key.substring(8); // Remove 'details.' prefix
        row.push(this.escapeCSVField(entry.details[detailKey] || ''));
      });

      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Convert audit log entries to XML format
   */
  private convertToXML(entries: AuditLogEntry[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<audit_logs>\n';
    
    for (const entry of entries) {
      xml += '  <log_entry>\n';
      xml += `    <id>${this.escapeXMLField(entry.id)}</id>\n`;
      xml += `    <timestamp>${this.escapeXMLField(entry.timestamp)}</timestamp>\n`;
      xml += `    <event>${this.escapeXMLField(entry.event)}</event>\n`;
      xml += `    <action>${this.escapeXMLField(entry.action)}</action>\n`;
      xml += `    <success>${entry.success}</success>\n`;
      xml += `    <tenantId>${this.escapeXMLField(entry.tenantId)}</tenantId>\n`;
      if (entry.userId) xml += `    <userId>${this.escapeXMLField(entry.userId)}</userId>\n`;
      if (entry.clientId) xml += `    <clientId>${this.escapeXMLField(entry.clientId)}</clientId>\n`;
      if (entry.resourceId) xml += `    <resourceId>${this.escapeXMLField(entry.resourceId)}</resourceId>\n`;
      if (entry.resourceType) xml += `    <resourceType>${this.escapeXMLField(entry.resourceType)}</resourceType>\n`;
      if (entry.ipAddress) xml += `    <ipAddress>${this.escapeXMLField(entry.ipAddress)}</ipAddress>\n`;
      if (entry.userAgent) xml += `    <userAgent>${this.escapeXMLField(entry.userAgent)}</userAgent>\n`;
      if (entry.sessionId) xml += `    <sessionId>${this.escapeXMLField(entry.sessionId)}</sessionId>\n`;
      if (entry.requestId) xml += `    <requestId>${this.escapeXMLField(entry.requestId)}</requestId>\n`;
      xml += `    <complianceTags>${this.escapeXMLField(JSON.stringify(entry.complianceTags))}</complianceTags>\n`;
      xml += `    <severity>${this.escapeXMLField(entry.severity)}</severity>\n`;
      xml += `    <source>${this.escapeXMLField(entry.source)}</source>\n`;
      xml += '    <details>' + this.escapeXMLField(JSON.stringify(entry.details)) + '</details>\n';
      xml += '  </log_entry>\n';
    }

    xml += '</audit_logs>';
    return xml;
  }

  /**
   * Escape field for CSV format
   */
  private escapeCSVField(field: any): string {
    if (field === null || field === undefined) {
      return '';
    }
    
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Escape field for XML format
   */
  private escapeXMLField(field: any): string {
    if (field === null || field === undefined) {
      return '';
    }
    
    return String(field)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Apply retention policies to remove old logs
   */
  async applyRetentionPolicies(): Promise<void> {
    if (!this.db) {
      return;
    }

    // Get all compliance tags that have retention policies
    for (const [complianceTag, policy] of this.retentionPolicies.entries()) {
      if (policy.autoDelete) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriodDays);

        try {
          // Remove logs older than retention period for this compliance tag
          await this.db.prepare(
            `DELETE FROM audit_logs 
             WHERE compliance_tags LIKE ? 
             AND timestamp < ?`
          ).bind(`%${complianceTag}%`, cutoffDate.toISOString()).run();
        } catch (error) {
          console.error(`Failed to apply retention policy for ${complianceTag}:`, error);
        }
      }
    }
  }

  /**
   * Get retention policy for a specific compliance tag
   */
  getRetentionPolicy(complianceTag: ComplianceTag): RetentionPolicy | undefined {
    return this.retentionPolicies.get(complianceTag);
  }

  /**
   * Add or update a retention policy
   */
  setRetentionPolicy(policy: RetentionPolicy): void {
    this.retentionPolicies.set(policy.complianceTag, policy);
  }

  /**
   * Generate a unique log ID
   */
  private generateLogId(): string {
    // In a real implementation, you might want to use a more sophisticated ID generation
    // that ensures global uniqueness across all tenants and time
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create a global instance for easy access
export const auditService = AuditService.getInstance();