import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { healthCheck, detailedHealthCheck, metricsCollector, alertingSystem } from '../../../src/handlers/admin/health';
import { 
  metricsEndpoint, 
  authMetricsEndpoint, 
  tokenLatencyEndpoint, 
  MetricsCollector 
} from '../../../src/handlers/admin/metrics';
import { 
  ConsoleAlertHandler, 
  EmailAlertHandler, 
  WebhookAlertHandler 
} from '../../../src/services/security/alerts';

describe('Monitoring and Health Check System', () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    vi.clearAllMocks();
  });

  describe('Health Check Endpoints', () => {
    it('should return healthy status for basic health check', async () => {
      const mockContext: any = {
        json: vi.fn((data, status) => new Response(JSON.stringify(data), { status }))
      };

      const response = await healthCheck(mockContext);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('oauth-mcp-gateway');
      expect(result.checks.gateway.status).toBe('healthy');
    });

    it('should return unhealthy status when health check fails', async () => {
      // Mock a scenario where health check throws an error
      const mockContext: any = {
        json: vi.fn((data, status) => new Response(JSON.stringify(data), { status }))
      };

      // Force an error by mocking a dependency that throws
      const originalProcess = process;
      Object.defineProperty(global, 'process', {
        value: {
          ...originalProcess,
          uptime: vi.fn(() => { throw new Error('Uptime not available'); })
        },
        writable: true
      });

      const response = await healthCheck(mockContext);
      const result = await response.json();

      // Restore original process
      Object.defineProperty(global, 'process', {
        value: originalProcess,
        writable: true
      });

      expect(response.status).toBe(503);
      expect(result.status).toBe('unhealthy');
    });

    it('should return detailed health check with MCP server status', async () => {
      const mockContext: any = {
        json: vi.fn((data, status) => new Response(JSON.stringify(data), { status }))
      };

      const response = await detailedHealthCheck(mockContext);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.status).toBe('healthy');
      expect(result.service).toBe('oauth-mcp-gateway');
      expect(result.checks.gateway.status).toBe('healthy');
    });
  });

  describe('Metrics Collection', () => {
    let metricsCollector: MetricsCollector;

    beforeEach(() => {
      metricsCollector = new MetricsCollector();
    });

    it('should record HTTP request metrics', () => {
      metricsCollector.recordHttpRequest(200, 45);
      metricsCollector.recordHttpRequest(500, 120);
      metricsCollector.recordHttpRequest(401, 30);

      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.httpRequest.total).toBe(3);
      expect(metrics.httpRequest.success).toBe(1);
      expect(metrics.httpRequest.errors).toBe(2);
      expect(metrics.httpRequest.latency.avg).toBeGreaterThan(0);
    });

    it('should record authentication metrics', () => {
      metricsCollector.recordAuthentication('password', true);
      metricsCollector.recordAuthentication('password', false);
      metricsCollector.recordAuthentication('api_key', true);
      metricsCollector.recordAuthentication('oauth', true);

      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.authentication.total).toBe(4);
      expect(metrics.authentication.success).toBe(3);
      expect(metrics.authentication.failure).toBe(1);
      expect(metrics.authentication.successRate).toBe(75);
      expect(metrics.authentication.byMethod.password.total).toBe(2);
      expect(metrics.authentication.byMethod.password.success).toBe(1);
    });

    it('should record authorization metrics', () => {
      metricsCollector.recordAuthorization(true);
      metricsCollector.recordAuthorization(false);
      metricsCollector.recordAuthorization(false, true); // Denied request

      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.authorization.total).toBe(3);
      expect(metrics.authorization.success).toBe(1);
      expect(metrics.authorization.failure).toBe(2);
      expect(metrics.authorization.deniedRequests).toBe(1);
    });

    it('should record token operation metrics', () => {
      metricsCollector.recordTokenOperation('issue');
      metricsCollector.recordTokenOperation('validate', 15);
      metricsCollector.recordTokenOperation('validate', 25);
      metricsCollector.recordTokenOperation('refresh');
      metricsCollector.recordTokenOperation('revoke');

      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.tokens.issued).toBe(1);
      expect(metrics.tokens.validated).toBe(2);
      expect(metrics.tokens.refreshed).toBe(1);
      expect(metrics.tokens.revoked).toBe(1);
      expect(metrics.tokens.validationLatency.avg).toBe(20); // (15+25)/2
    });

    it('should record MCP request metrics', () => {
      metricsCollector.recordMCPRequest(true, 50);
      metricsCollector.recordMCPRequest(false, 120);
      metricsCollector.recordMCPRequest(true, 30);

      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.mcp.requests).toBe(3);
      expect(metrics.mcp.success).toBe(2);
      expect(metrics.mcp.errors).toBe(1);
      expect(metrics.mcp.latency.avg).toBe(66.67); // (50+120+30)/3
    });

    it('should update tenant and system metrics', () => {
      metricsCollector.updateTenantMetrics(10, 8, 2);
      metricsCollector.updateSystemMetrics(45, 60, 75);

      const metrics = metricsCollector.getMetrics();
      
      expect(metrics.tenants.total).toBe(10);
      expect(metrics.tenants.active).toBe(8);
      expect(metrics.tenants.inactive).toBe(2);
      expect(metrics.system.cpu).toBe(45);
      expect(metrics.system.memory).toBe(60);
      expect(metrics.system.disk).toBe(75);
    });

    it('should calculate percentiles correctly', () => {
      // Add multiple latency measurements
      for (let i = 1; i <= 100; i++) {
        metricsCollector.recordHttpRequest(200, i);
      }

      const metrics = metricsCollector.getMetrics();
      
      // Percentiles should be calculated correctly
      expect(metrics.httpRequest.latency.p50).toBe(50);
      expect(metrics.httpRequest.latency.p95).toBe(95);
      expect(metrics.httpRequest.latency.p99).toBe(99);
    });

    it('should reset metrics when requested', () => {
      metricsCollector.recordHttpRequest(200, 50);
      metricsCollector.recordAuthentication('password', true);
      
      const beforeReset = metricsCollector.getMetrics();
      expect(beforeReset.httpRequest.total).toBe(1);
      expect(beforeReset.authentication.total).toBe(1);
      
      metricsCollector.reset();
      
      const afterReset = metricsCollector.getMetrics();
      expect(afterReset.httpRequest.total).toBe(0);
      expect(afterReset.authentication.total).toBe(0);
    });
  });

  describe('Metrics Endpoints', () => {
    it('should return metrics data', async () => {
      const mockContext: any = {
        json: vi.fn((data, status) => new Response(JSON.stringify(data), { status }))
      };

      const response = await metricsEndpoint(mockContext);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.service).toBe('oauth-mcp-gateway');
      expect(result.httpRequest).toBeDefined();
      expect(result.authentication).toBeDefined();
      expect(result.authorization).toBeDefined();
    });

    it('should return authentication metrics', async () => {
      const mockContext: any = {
        json: vi.fn((data, status) => new Response(JSON.stringify(data), { status }))
      };

      const response = await authMetricsEndpoint(mockContext);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.authentication).toBeDefined();
      expect(result.authorization).toBeDefined();
    });

    it('should return token validation latency metrics', async () => {
      const mockContext: any = {
        json: vi.fn((data, status) => new Response(JSON.stringify(data), { status }))
      };

      const response = await tokenLatencyEndpoint(mockContext);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.tokenValidationLatency).toBeDefined();
      expect(result.tokensValidated).toBeDefined();
    });

    it('should handle errors in metrics endpoints', async () => {
      const mockContext: any = {
        json: vi.fn((data, status) => new Response(JSON.stringify(data), { status }))
      };

      // Force an error by mocking a dependency that throws
      const originalGetMetrics = metricsCollector.getMetrics;
      metricsCollector.getMetrics = vi.fn(() => { throw new Error('Metrics collection failed'); });

      const response = await metricsEndpoint(mockContext);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result.error).toBe('Failed to collect metrics');

      // Restore original function
      metricsCollector.getMetrics = originalGetMetrics;
    });
  });

  describe('Alerting System', () => {
    it('should register and trigger alert handlers', async () => {
      const consoleHandler = new ConsoleAlertHandler();
      const consoleSpy = vi.spyOn(consoleHandler, 'handleAlert');
      
      alertingSystem.registerAlertHandler(consoleHandler);
      
      const alert = {
        id: 'test-alert-1',
        type: 'security',
        severity: 'high',
        message: 'Test security alert',
        timestamp: new Date().toISOString(),
        metadata: { test: 'data' }
      };
      
      await alertingSystem.triggerAlert(alert);
      
      expect(consoleSpy).toHaveBeenCalledWith(alert);
    });

    it('should maintain alert history', async () => {
      const consoleHandler = new ConsoleAlertHandler();
      alertingSystem.registerAlertHandler(consoleHandler);
      
      const alert1 = {
        id: 'test-alert-1',
        type: 'security',
        severity: 'high',
        message: 'Test alert 1',
        timestamp: new Date().toISOString()
      };
      
      const alert2 = {
        id: 'test-alert-2',
        type: 'performance',
        severity: 'medium',
        message: 'Test alert 2',
        timestamp: new Date().toISOString()
      };
      
      await alertingSystem.triggerAlert(alert1);
      await alertingSystem.triggerAlert(alert2);
      
      const history = alertingSystem.getAlertHistory();
      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('test-alert-1');
      expect(history[1].id).toBe('test-alert-2');
      
      const highSeverityAlerts = alertingSystem.getAlertHistory('high');
      expect(highSeverityAlerts).toHaveLength(1);
      expect(highSeverityAlerts[0].severity).toBe('high');
    });

    it('should handle errors in alert handlers gracefully', async () => {
      const faultyHandler = {
        handleAlert: vi.fn(async () => { throw new Error('Handler error'); })
      };
      
      alertingSystem.registerAlertHandler(faultyHandler as any);
      
      const alert = {
        id: 'test-alert-1',
        type: 'security',
        severity: 'high',
        message: 'Test alert',
        timestamp: new Date().toISOString()
      };
      
      // Should not throw an error even if handler fails
      await expect(alertingSystem.triggerAlert(alert)).resolves.not.toThrow();
    });

    it('should clear alert history', async () => {
      const consoleHandler = new ConsoleAlertHandler();
      alertingSystem.registerAlertHandler(consoleHandler);
      
      const alert = {
        id: 'test-alert-1',
        type: 'security',
        severity: 'high',
        message: 'Test alert',
        timestamp: new Date().toISOString()
      };
      
      await alertingSystem.triggerAlert(alert);
      
      expect(alertingSystem.getAlertHistory()).toHaveLength(1);
      
      alertingSystem.clearAlertHistory();
      
      expect(alertingSystem.getAlertHistory()).toHaveLength(0);
    });

    it('should work with different alert handler types', async () => {
      const emailHandler = new EmailAlertHandler(['admin@example.com']);
      const webhookHandler = new WebhookAlertHandler(['https://hooks.example.com/alerts']);
      
      const emailSpy = vi.spyOn(emailHandler, 'handleAlert');
      const webhookSpy = vi.spyOn(webhookHandler, 'handleAlert');
      
      alertingSystem.registerAlertHandler(emailHandler);
      alertingSystem.registerAlertHandler(webhookHandler);
      
      const alert = {
        id: 'test-alert-1',
        type: 'availability',
        severity: 'critical',
        message: 'Gateway is down',
        timestamp: new Date().toISOString(),
        metadata: { downtime: '5 minutes' }
      };
      
      await alertingSystem.triggerAlert(alert);
      
      expect(emailSpy).toHaveBeenCalledWith(alert);
      expect(webhookSpy).toHaveBeenCalledWith(alert);
    });
  });
});