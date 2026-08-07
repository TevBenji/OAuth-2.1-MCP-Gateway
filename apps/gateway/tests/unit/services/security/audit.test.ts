import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from '../../../../src/services/security/audit';
import {
  AuthenticationAuditHandler as AuthHandler,
  AuthorizationAuditHandler as AuthzHandler,
  MCPSecurityAuditHandler as MCPHandler,
  SecurityAuditHandler as SecurityHandler,
  logSystemEvent,
} from '../../../../src/services/security/audit-handlers';
import { getTestDb, createTenant } from '../../../helpers/db';

describe('Audit Logging and Compliance System', () => {
  let auditService: AuditService;

  beforeEach(async () => {
    await createTenant('tenant-123');
    // Singleton: the same instance is reused across tests; getInstance
    // attaches the real database on first call.
    auditService = AuditService.getInstance(getTestDb().db);
  });

  describe('AuditService', () => {
    it('should create a structured audit log entry', async () => {
      const logId = await auditService.createLogEntry(
        'tenant-123',
        'auth.login',
        'User login successful',
        true,
        {
          userId: 'user-456',
          clientId: 'client-789',
          ipAddress: '192.168.1.1',
          userAgent: 'Test Browser',
          complianceTags: ['SOC2', 'GDPR'],
          severity: 'medium'
        }
      );

      expect(logId).toBeDefined();
      expect(logId).toMatch(/^audit_/);
    });

    it('should initialize with default retention policies', () => {
      const gdprPolicy = auditService.getRetentionPolicy('GDPR');
      expect(gdprPolicy).toBeDefined();
      expect(gdprPolicy?.retentionPeriodDays).toBe(365);
      expect(gdprPolicy?.complianceTag).toBe('GDPR');

      const hipaaPolicy = auditService.getRetentionPolicy('HIPAA');
      expect(hipaaPolicy).toBeDefined();
      expect(hipaaPolicy?.retentionPeriodDays).toBe(2190);
    });

    it('should allow setting custom retention policies', () => {
      const customPolicy = {
        name: 'Custom Policy',
        description: 'A custom retention policy',
        complianceTag: 'custom' as const,
        retentionPeriodDays: 180,
        autoDelete: true,
        exportRequired: false
      };

      auditService.setRetentionPolicy(customPolicy);
      const retrievedPolicy = auditService.getRetentionPolicy('custom');
      expect(retrievedPolicy).toEqual(customPolicy);
    });

    it('should query audit logs with filters', async () => {
      await auditService.createLogEntry('tenant-123', 'auth.login', 'User login', true, {
        userId: 'user-456',
      });

      const matching = await auditService.queryLogs({
        tenantId: 'tenant-123',
        userId: 'user-456',
        event: 'auth.login',
      });
      expect(matching.entries).toHaveLength(1);
      expect(matching.totalCount).toBe(1);

      // Date filters in the past exclude the entry just written
      const outOfRange = await auditService.queryLogs({
        tenantId: 'tenant-123',
        userId: 'user-456',
        event: 'auth.login',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-12-31T23:59:59.999Z',
      });
      expect(outOfRange.entries).toBeInstanceOf(Array);
      expect(outOfRange.totalCount).toBe(0);
    });

    it('should export logs in different formats', async () => {
      await auditService.createLogEntry('tenant-123', 'auth.login', 'User login successful', true, {
        userId: 'user-456',
        clientId: 'client-789',
        complianceTags: ['SOC2'],
        severity: 'medium',
        details: { test: 'value' },
      });

      // Test JSON export
      const jsonExport = await auditService.exportLogs(
        { tenantId: 'tenant-123' },
        'json'
      );
      expect(jsonExport).toContain('auth.login');

      // Test CSV export
      const csvExport = await auditService.exportLogs(
        { tenantId: 'tenant-123' },
        'csv'
      );
      expect(csvExport).toContain('timestamp');
      expect(csvExport).toContain('event');

      // Test XML export
      const xmlExport = await auditService.exportLogs(
        { tenantId: 'tenant-123' },
        'xml'
      );
      expect(xmlExport).toContain('<audit_logs>');
      expect(xmlExport).toContain('<event>');
    });

    it('should apply retention policies', async () => {
      // The method should execute without errors against the real database
      await expect(auditService.applyRetentionPolicies()).resolves.toBeUndefined();
    });
  });

  describe('Authentication Audit Handlers', () => {
    it('should log successful login', async () => {
      const logId = await AuthHandler.logLoginSuccess(
        'tenant-123',
        'user-456',
        'client-789',
        { ipAddress: '192.168.1.1' }
      );

      expect(logId).toBeDefined();
      expect(logId).toMatch(/^audit_/);
    });

    it('should log failed login', async () => {
      const logId = await AuthHandler.logLoginFailure(
        'tenant-123',
        'user-456',
        'client-789',
        'Invalid credentials',
        { ipAddress: '192.168.1.1' }
      );

      expect(logId).toBeDefined();
    });

    it('should log logout', async () => {
      const logId = await AuthHandler.logLogout(
        'tenant-123',
        'user-456',
        'session-abc',
        { ipAddress: '192.168.1.1' }
      );

      expect(logId).toBeDefined();
    });

    it('should log token refresh', async () => {
      const successLogId = await AuthHandler.logTokenRefresh(
        'tenant-123',
        'user-456',
        'client-789',
        true,
        { ipAddress: '192.168.1.1' }
      );
      expect(successLogId).toBeDefined();

      const failureLogId = await AuthHandler.logTokenRefresh(
        'tenant-123',
        'user-456',
        'client-789',
        false,
        { ipAddress: '192.168.1.1' }
      );
      expect(failureLogId).toBeDefined();
    });
  });

  describe('Authorization Audit Handlers', () => {
    it('should log granted permission', async () => {
      const logId = await AuthzHandler.logPermissionGranted(
        'tenant-123',
        'user-456',
        'client-789',
        'read_profile',
        { ipAddress: '192.168.1.1' }
      );

      expect(logId).toBeDefined();
    });

    it('should log denied permission', async () => {
      const logId = await AuthzHandler.logPermissionDenied(
        'tenant-123',
        'user-456',
        'client-789',
        'write_config',
        'Insufficient privileges',
        { ipAddress: '192.168.1.1' }
      );

      expect(logId).toBeDefined();
    });

    it('should log granted scope', async () => {
      const logId = await AuthzHandler.logScopeGranted(
        'tenant-123',
        'user-456',
        'client-789',
        'mcp:tools:read',
        { ipAddress: '192.168.1.1' }
      );

      expect(logId).toBeDefined();
    });

    it('should log token issuance', async () => {
      const successLogId = await AuthzHandler.logTokenIssued(
        'tenant-123',
        'user-456',
        'client-789',
        'access_token',
        true,
        { ipAddress: '192.168.1.1' }
      );
      expect(successLogId).toBeDefined();

      const failureLogId = await AuthzHandler.logTokenIssued(
        'tenant-123',
        'user-456',
        'client-789',
        'refresh_token',
        false,
        { ipAddress: '192.168.1.1' }
      );
      expect(failureLogId).toBeDefined();
    });
  });

  describe('MCP Security Audit Handlers', () => {
    it('should log MCP request', async () => {
      const successLogId = await MCPHandler.logMCPRequest(
        'tenant-123',
        'mcp-server-1',
        true,
        'user-456',
        'client-789',
        { ipAddress: '192.168.1.1' }
      );
      expect(successLogId).toBeDefined();

      const failureLogId = await MCPHandler.logMCPRequest(
        'tenant-123',
        'mcp-server-1',
        false,
        'user-456',
        'client-789',
        { ipAddress: '192.168.1.1' }
      );
      expect(failureLogId).toBeDefined();
    });

    it('should log MCP tool invocation', async () => {
      const successLogId = await MCPHandler.logMCPToolInvocation(
        'tenant-123',
        'read_data_tool',
        true,
        'user-456',
        'client-789',
        { ipAddress: '192.168.1.1' }
      );
      expect(successLogId).toBeDefined();
    });

    it('should log MCP resource access', async () => {
      const logId = await MCPHandler.logMCPResourceAccess('tenant-123', 'user_profile', true, {
        ipAddress: '192.168.1.1',
        operation: 'read',
      });

      expect(logId).toBeDefined();
    });
  });

  describe('Security Audit Handlers', () => {
    it('should log rate limit exceeded', async () => {
      const logId = await SecurityHandler.logRateLimitExceeded(
        'tenant-123',
        'api_requests',
        'user-456',
        'client-789',
        { ipAddress: '192.168.1.1' }
      );

      expect(logId).toBeDefined();
    });

    it('should log suspicious activity', async () => {
      const logId = await SecurityHandler.logSuspiciousActivity(
        'tenant-123',
        'Multiple failed logins',
        'high',
        'user-456',
        'client-789',
        { ipAddress: '192.168.1.1' }
      );

      expect(logId).toBeDefined();
    });

    it('should log brute force attempt', async () => {
      const logId = await SecurityHandler.logBruteForceAttempt(
        'tenant-123',
        'user-456',
        'client-789',
        { ipAddress: '192.168.1.1', attempts: 5 }
      );

      expect(logId).toBeDefined();
    });
  });

  describe('System Event Logging', () => {
    it('should log system events', async () => {
      const logId = await logSystemEvent(
        'tenant-123',
        'system.startup',
        'System started',
        true,
        { ipAddress: '192.168.1.1' }
      );

      expect(logId).toBeDefined();
    });
  });

  describe('Compliance Tags', () => {
    it('should properly handle compliance tags in audit entries', async () => {
      const logId = await auditService.createLogEntry(
        'tenant-123',
        'auth.login',
        'User login successful',
        true,
        {
          userId: 'user-456',
          complianceTags: ['GDPR', 'SOC2']
        }
      );

      expect(logId).toBeDefined();
    });

    it('should validate that retention policies exist for all major compliance tags', () => {
      expect(auditService.getRetentionPolicy('GDPR')).toBeDefined();
      expect(auditService.getRetentionPolicy('HIPAA')).toBeDefined();
      expect(auditService.getRetentionPolicy('PCI-DSS')).toBeDefined();
      expect(auditService.getRetentionPolicy('SOX')).toBeDefined();
      expect(auditService.getRetentionPolicy('SOC2')).toBeDefined();
      expect(auditService.getRetentionPolicy('ISO27001')).toBeDefined();
    });
  });
});