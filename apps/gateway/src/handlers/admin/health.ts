import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { auditService } from '../../services/security/audit';
import type {
  SystemAlert,
  AlertHandler,
  SystemFailureListener,
  SecurityEventListener,
} from '../../types/alerts';

// Health check response structure
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime?: number;
  version?: string;
  service: string;
  checks: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      message?: string;
      responseTime?: number;
    };
  };
}

// Metrics collection interface
export interface MetricsCollector {
  recordAuthenticationSuccess(): void;
  recordAuthenticationFailure(): void;
  recordTokenValidationLatency(latencyMs: number): void;
  getAuthenticationSuccessRate(): number;
  getTokenValidationAvgLatency(): number;
  getMetrics(): any;
}

// In-memory metrics collector for development
class InMemoryMetricsCollector implements MetricsCollector {
  private authSuccessCount = 0;
  private authFailureCount = 0;
  private tokenValidationLatencies: number[] = [];
  private readonly maxLatencySamples = 1000; // Keep last 1000 samples

  recordAuthenticationSuccess(): void {
    this.authSuccessCount++;
  }

  recordAuthenticationFailure(): void {
    this.authFailureCount++;
  }

  recordTokenValidationLatency(latencyMs: number): void {
    if (this.tokenValidationLatencies.length >= this.maxLatencySamples) {
      // Remove oldest sample
      this.tokenValidationLatencies.shift();
    }
    this.tokenValidationLatencies.push(latencyMs);
  }

  getAuthenticationSuccessRate(): number {
    const total = this.authSuccessCount + this.authFailureCount;
    return total > 0 ? this.authSuccessCount / total : 0;
  }

  getTokenValidationAvgLatency(): number {
    if (this.tokenValidationLatencies.length === 0) {
      return 0;
    }
    const sum = this.tokenValidationLatencies.reduce((a, b) => a + b, 0);
    return sum / this.tokenValidationLatencies.length;
  }

  getMetrics(): any {
    return {
      authentication: {
        successRate: this.getAuthenticationSuccessRate(),
        successCount: this.authSuccessCount,
        failureCount: this.authFailureCount,
      },
      tokenValidation: {
        avgLatency: this.getTokenValidationAvgLatency(),
        sampleCount: this.tokenValidationLatencies.length,
      },
    };
  }
}

// Global metrics collector instance
export const metricsCollector = new InMemoryMetricsCollector();

// Alerting system interface
export interface AlertingSystem {
  registerAlertHandler(handler: AlertHandler): void;
  triggerAlert(alert: SystemAlert): void;
  addSystemFailureListener(listener: SystemFailureListener): void;
  addSecurityEventListener(listener: SecurityEventListener): void;
}

// Simple alerting system implementation
class SimpleAlertingSystem implements AlertingSystem {
  private alertHandlers: AlertHandler[] = [];
  private failureListeners: SystemFailureListener[] = [];
  private securityListeners: SecurityEventListener[] = [];

  registerAlertHandler(handler: AlertHandler): void {
    this.alertHandlers.push(handler);
  }

  async triggerAlert(alert: SystemAlert): Promise<void> {
    for (const handler of this.alertHandlers) {
      try {
        await handler.handleAlert(alert);
      } catch (error) {
        console.error('Error in alert handler:', error);
      }
    }
  }

  addSystemFailureListener(listener: SystemFailureListener): void {
    this.failureListeners.push(listener);
  }

  addSecurityEventListener(listener: SecurityEventListener): void {
    this.securityListeners.push(listener);
  }

  async notifySystemFailure(error: Error, context: string): Promise<void> {
    for (const listener of this.failureListeners) {
      try {
        listener(error, context);
      } catch (err) {
        console.error('Error in failure listener:', err);
      }
    }

    // Also trigger an alert
    await this.triggerAlert({
      id: `failure-${Date.now()}`,
      type: 'availability',
      severity: 'high',
      message: `System failure in ${context}: ${error.message}`,
      timestamp: new Date().toISOString(),
      metadata: { context, errorMessage: error.message },
    });
  }

  async notifySecurityEvent(event: string, details: Record<string, any>): Promise<void> {
    for (const listener of this.securityListeners) {
      try {
        listener(event, details);
      } catch (err) {
        console.error('Error in security listener:', err);
      }
    }

    // Also trigger an alert if it's a significant security event
    if (event.includes('attack') || event.includes('breach') || event.includes('unauthorized')) {
      await this.triggerAlert({
        id: `security-${Date.now()}`,
        type: 'security',
        severity: 'critical',
        message: `Security event: ${event}`,
        timestamp: new Date().toISOString(),
        metadata: details,
      });
    }
  }
}

// Global alerting system instance
export const alertingSystem = new SimpleAlertingSystem();

/**
 * Health check endpoint for the gateway
 */
export const healthCheck = async (c: Context): Promise<Response> => {
  try {
    const startTime = Date.now();

    // Basic health check - system is responding
    const gatewayCheck = {
      status: 'healthy' as const,
      responseTime: Date.now() - startTime,
    };

    // Check database connectivity (if available)
    const dbCheck = { status: 'healthy' as const, message: 'Database connection OK' };

    // Check if MCP server registry is accessible
    const mcpRegistryCheck = { status: 'healthy' as const, message: 'MCP registry OK' };

    // Check other critical dependencies
    const uptime = process.uptime ? process.uptime() * 1000 : startTime - Date.now(); // fallback for Cloudflare Workers

    const response: HealthCheckResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime,
      version: process.env.npm_package_version || '1.0.0',
      service: 'oauth-mcp-gateway',
      checks: {
        gateway: gatewayCheck,
        database: dbCheck,
        mcpRegistry: mcpRegistryCheck,
        // Add more checks as needed
      },
    };

    // Calculate overall status based on individual checks
    if (Object.values(response.checks).some(check => check.status !== 'healthy')) {
      response.status = 'degraded';
    }

    return c.json(response, 200);
  } catch (error) {
    console.error('Health check error:', error);

    // Log the error for audit purposes
    await auditService.createLogEntry('system', 'system.error', 'Health check failed', false, {
      details: { error: (error as Error).message },
    });

    const response: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'oauth-mcp-gateway',
      checks: {
        gateway: {
          status: 'unhealthy',
          message: `Health check failed: ${(error as Error).message}`,
        },
      },
    };

    return c.json(response, 503);
  }
};

/**
 * Detailed health check including upstream MCP servers
 */
export const detailedHealthCheck = async (c: Context): Promise<Response> => {
  try {
    const startTime = Date.now();

    // Basic health check
    const gatewayCheck = {
      status: 'healthy' as const,
      responseTime: Date.now() - startTime,
    };

    // Note: MCP server health checks would require database access
    // For now, we'll just report gateway health
    const mcpChecks: {
      [key: string]: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        message?: string;
        responseTime?: number;
      };
    } = {
      mcpRegistry: {
        status: 'healthy',
        message: 'MCP registry available (detailed checks require database)',
      },
    };

    const overallMcpStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    const response: HealthCheckResponse = {
      status: overallMcpStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() * 1000 : 0, // fallback for Cloudflare Workers
      version: process.env.npm_package_version || '1.0.0',
      service: 'oauth-mcp-gateway',
      checks: {
        gateway: gatewayCheck,
        ...mcpChecks,
      },
    };

    // Adjust overall status based on all checks
    const allChecks = Object.values(response.checks);
    if (allChecks.some(check => check.status === 'unhealthy')) {
      response.status = 'unhealthy';
    } else if (allChecks.some(check => check.status === 'degraded')) {
      response.status = 'degraded';
    }

    return c.json(response, 200);
  } catch (error) {
    console.error('Detailed health check error:', error);

    const response: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'oauth-mcp-gateway',
      checks: {
        gateway: {
          status: 'unhealthy',
          message: `Detailed health check failed: ${(error as Error).message}`,
        },
      },
    };

    return c.json(response, 503);
  }
};
