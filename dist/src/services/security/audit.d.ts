import { AuditLogOptions, AuditEventType, AuditLogQuery, AuditLogQueryResult, RetentionPolicy, ComplianceTag } from '../../types/audit';
import { D1Database } from '@cloudflare/workers-types';
/**
 * AuditService handles all audit logging functionality for the system
 * Implements structured audit log creation with compliance tags
 */
export declare class AuditService {
    private db?;
    private retentionPolicies;
    private static instance;
    private constructor();
    static getInstance(database?: D1Database): AuditService;
    /**
     * Initialize default retention policies for different compliance requirements
     */
    private initializeDefaultRetentionPolicies;
    /**
     * Create a structured audit log entry with compliance tags
     */
    createLogEntry(tenantId: string, event: AuditEventType, action: string, success: boolean, options?: AuditLogOptions): Promise<string>;
    /**
     * Store audit log entry in database
     */
    private storeLogEntry;
    /**
     * Store audit log entry in memory (for development/testing)
     */
    private storeLogEntryInMemory;
    /**
     * Query audit logs based on various criteria
     */
    queryLogs(query: AuditLogQuery): Promise<AuditLogQueryResult>;
    /**
     * Export audit logs for compliance requirements
     */
    exportLogs(query: AuditLogQuery, format?: 'json' | 'csv' | 'xml'): Promise<string>;
    /**
     * Convert audit log entries to CSV format
     */
    private convertToCSV;
    /**
     * Convert audit log entries to XML format
     */
    private convertToXML;
    /**
     * Escape field for CSV format
     */
    private escapeCSVField;
    /**
     * Escape field for XML format
     */
    private escapeXMLField;
    /**
     * Apply retention policies to remove old logs
     */
    applyRetentionPolicies(): Promise<void>;
    /**
     * Get retention policy for a specific compliance tag
     */
    getRetentionPolicy(complianceTag: ComplianceTag): RetentionPolicy | undefined;
    /**
     * Add or update a retention policy
     */
    setRetentionPolicy(policy: RetentionPolicy): void;
    /**
     * Generate a unique log ID
     */
    private generateLogId;
}
export declare const auditService: AuditService;
