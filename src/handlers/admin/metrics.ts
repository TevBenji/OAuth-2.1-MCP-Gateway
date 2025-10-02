import { Context } from 'hono';

// Metrics data structure
export interface MetricsData {
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  httpRequest: {
    total: number;
    success: number;
    errors: number;
    latency: {
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    };
  };
  authentication: {
    total: number;
    success: number;
    failure: number;
    successRate: number;
    failureRate: number;
    byMethod: {
      [method: string]: {
        total: number;
        success: number;
        failure: number;
      };
    };
  };
  authorization: {
    total: number;
    success: number;
    failure: number;
    successRate: number;
    failureRate: number;
    deniedRequests: number;
  };
  tokens: {
    issued: number;
    validated: number;
    refreshed: number;
    revoked: number;
    validationLatency: {
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    };
  };
  mcp: {
    requests: number;
    success: number;
    errors: number;
    latency: {
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    };
  };
  tenants: {
    total: number;
    active: number;
    inactive: number;
  };
  system: {
    cpu: number;
    memory: number;
    disk: number;
  };
}

// Metrics collection class
export class MetricsCollector {
  private metrics: MetricsData;
  private httpRequestLatencies: number[] = [];
  private tokenValidationLatencies: number[] = [];
  private mcpRequestLatencies: number[] = [];
  private httpRequestCount = 0;
  private httpRequestSuccess = 0;
  private httpRequestErrors = 0;
  private authTotal = 0;
  private authSuccess = 0;
  private authFailure = 0;
  private authByMethod: { [method: string]: { total: number; success: number; failure: number } } =
    {};
  private authzTotal = 0;
  private authzSuccess = 0;
  private authzFailure = 0;
  private authzDenied = 0;
  private tokensIssued = 0;
  private tokensValidated = 0;
  private tokensRefreshed = 0;
  private tokensRevoked = 0;
  private mcpRequests = 0;
  private mcpSuccess = 0;
  private mcpErrors = 0;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.metrics = this.getDefaultMetrics();
  }

  private getDefaultMetrics(): MetricsData {
    return {
      timestamp: new Date().toISOString(),
      service: 'oauth-mcp-gateway',
      version: process.env.npm_package_version || '1.0.0',
      uptime: 0,
      httpRequest: {
        total: 0,
        success: 0,
        errors: 0,
        latency: {
          avg: 0,
          p50: 0,
          p95: 0,
          p99: 0,
        },
      },
      authentication: {
        total: 0,
        success: 0,
        failure: 0,
        successRate: 0,
        failureRate: 0,
        byMethod: {},
      },
      authorization: {
        total: 0,
        success: 0,
        failure: 0,
        successRate: 0,
        failureRate: 0,
        deniedRequests: 0,
      },
      tokens: {
        issued: 0,
        validated: 0,
        refreshed: 0,
        revoked: 0,
        validationLatency: {
          avg: 0,
          p50: 0,
          p95: 0,
          p99: 0,
        },
      },
      mcp: {
        requests: 0,
        success: 0,
        errors: 0,
        latency: {
          avg: 0,
          p50: 0,
          p95: 0,
          p99: 0,
        },
      },
      tenants: {
        total: 0,
        active: 0,
        inactive: 0,
      },
      system: {
        cpu: 0,
        memory: 0,
        disk: 0,
      },
    };
  }

  // Record HTTP request metrics
  recordHttpRequest(statusCode: number, latencyMs: number): void {
    this.httpRequestCount++;
    this.httpRequestLatencies.push(latencyMs);

    if (statusCode >= 200 && statusCode < 400) {
      this.httpRequestSuccess++;
    } else {
      this.httpRequestErrors++;
    }

    // Keep only the last 10000 latencies to prevent memory issues
    if (this.httpRequestLatencies.length > 10000) {
      this.httpRequestLatencies = this.httpRequestLatencies.slice(-10000);
    }
  }

  // Record authentication attempt
  recordAuthentication(method: string, success: boolean): void {
    this.authTotal++;

    if (success) {
      this.authSuccess++;
    } else {
      this.authFailure++;
    }

    // Update method-specific counters
    if (!this.authByMethod[method]) {
      this.authByMethod[method] = { total: 0, success: 0, failure: 0 };
    }

    this.authByMethod[method].total++;
    if (success) {
      this.authByMethod[method].success++;
    } else {
      this.authByMethod[method].failure++;
    }
  }

  // Record authorization decision
  recordAuthorization(success: boolean, denied: boolean = false): void {
    this.authzTotal++;

    if (success) {
      this.authzSuccess++;
    } else {
      this.authzFailure++;
    }

    if (denied) {
      this.authzDenied++;
    }
  }

  // Record token operations
  recordTokenOperation(
    operation: 'issue' | 'validate' | 'refresh' | 'revoke',
    latencyMs?: number
  ): void {
    switch (operation) {
      case 'issue':
        this.tokensIssued++;
        break;
      case 'validate':
        this.tokensValidated++;
        if (latencyMs !== undefined) {
          this.tokenValidationLatencies.push(latencyMs);
          // Keep only the last 10000 latencies
          if (this.tokenValidationLatencies.length > 10000) {
            this.tokenValidationLatencies = this.tokenValidationLatencies.slice(-10000);
          }
        }
        break;
      case 'refresh':
        this.tokensRefreshed++;
        break;
      case 'revoke':
        this.tokensRevoked++;
        break;
    }
  }

  // Record MCP request
  recordMCPRequest(success: boolean, latencyMs: number): void {
    this.mcpRequests++;
    this.mcpRequestLatencies.push(latencyMs);

    if (success) {
      this.mcpSuccess++;
    } else {
      this.mcpErrors++;
    }

    // Keep only the last 10000 latencies
    if (this.mcpRequestLatencies.length > 10000) {
      this.mcpRequestLatencies = this.mcpRequestLatencies.slice(-10000);
    }
  }

  // Update tenant metrics (would be called periodically)
  updateTenantMetrics(total: number, active: number, inactive: number): void {
    this.metrics.tenants.total = total;
    this.metrics.tenants.active = active;
    this.metrics.tenants.inactive = inactive;
  }

  // Update system metrics (would be called periodically)
  updateSystemMetrics(cpu: number, memory: number, disk: number): void {
    this.metrics.system.cpu = cpu;
    this.metrics.system.memory = memory;
    this.metrics.system.disk = disk;
  }

  // Calculate percentile
  private calculatePercentile(data: number[], percentile: number): number {
    if (data.length === 0) return 0;

    const sorted = [...data].sort((a, b) => a - b);
    const index = Math.floor((percentile / 100) * (sorted.length - 1));
    return sorted[index] ?? 0;
  }

  // Get current metrics snapshot
  getMetrics(): MetricsData {
    const uptime = (Date.now() - this.startTime) / 1000; // in seconds

    // Calculate averages and percentiles for HTTP requests
    const httpAvgLatency =
      this.httpRequestLatencies.length > 0
        ? this.httpRequestLatencies.reduce((sum, val) => sum + val, 0) /
          this.httpRequestLatencies.length
        : 0;

    const httpP50 = this.calculatePercentile(this.httpRequestLatencies, 50);
    const httpP95 = this.calculatePercentile(this.httpRequestLatencies, 95);
    const httpP99 = this.calculatePercentile(this.httpRequestLatencies, 99);

    // Calculate averages and percentiles for token validation
    const tokenAvgLatency =
      this.tokenValidationLatencies.length > 0
        ? this.tokenValidationLatencies.reduce((sum, val) => sum + val, 0) /
          this.tokenValidationLatencies.length
        : 0;

    const tokenP50 = this.calculatePercentile(this.tokenValidationLatencies, 50);
    const tokenP95 = this.calculatePercentile(this.tokenValidationLatencies, 95);
    const tokenP99 = this.calculatePercentile(this.tokenValidationLatencies, 99);

    // Calculate averages and percentiles for MCP requests
    const mcpAvgLatency =
      this.mcpRequestLatencies.length > 0
        ? this.mcpRequestLatencies.reduce((sum, val) => sum + val, 0) /
          this.mcpRequestLatencies.length
        : 0;

    const mcpP50 = this.calculatePercentile(this.mcpRequestLatencies, 50);
    const mcpP95 = this.calculatePercentile(this.mcpRequestLatencies, 95);
    const mcpP99 = this.calculatePercentile(this.mcpRequestLatencies, 99);

    // Calculate authentication success rate
    const authSuccessRate = this.authTotal > 0 ? (this.authSuccess / this.authTotal) * 100 : 0;
    const authFailureRate = this.authTotal > 0 ? (this.authFailure / this.authTotal) * 100 : 0;

    // Calculate authorization success rate
    const authzSuccessRate = this.authzTotal > 0 ? (this.authzSuccess / this.authzTotal) * 100 : 0;
    const authzFailureRate = this.authzTotal > 0 ? (this.authzFailure / this.authzTotal) * 100 : 0;

    return {
      timestamp: new Date().toISOString(),
      service: 'oauth-mcp-gateway',
      version: process.env.npm_package_version || '1.0.0',
      uptime,
      httpRequest: {
        total: this.httpRequestCount,
        success: this.httpRequestSuccess,
        errors: this.httpRequestErrors,
        latency: {
          avg: parseFloat(httpAvgLatency.toFixed(2)),
          p50: parseFloat(httpP50.toFixed(2)),
          p95: parseFloat(httpP95.toFixed(2)),
          p99: parseFloat(httpP99.toFixed(2)),
        },
      },
      authentication: {
        total: this.authTotal,
        success: this.authSuccess,
        failure: this.authFailure,
        successRate: parseFloat(authSuccessRate.toFixed(2)),
        failureRate: parseFloat(authFailureRate.toFixed(2)),
        byMethod: { ...this.authByMethod },
      },
      authorization: {
        total: this.authzTotal,
        success: this.authzSuccess,
        failure: this.authzFailure,
        successRate: parseFloat(authzSuccessRate.toFixed(2)),
        failureRate: parseFloat(authzFailureRate.toFixed(2)),
        deniedRequests: this.authzDenied,
      },
      tokens: {
        issued: this.tokensIssued,
        validated: this.tokensValidated,
        refreshed: this.tokensRefreshed,
        revoked: this.tokensRevoked,
        validationLatency: {
          avg: parseFloat(tokenAvgLatency.toFixed(2)),
          p50: parseFloat(tokenP50.toFixed(2)),
          p95: parseFloat(tokenP95.toFixed(2)),
          p99: parseFloat(tokenP99.toFixed(2)),
        },
      },
      mcp: {
        requests: this.mcpRequests,
        success: this.mcpSuccess,
        errors: this.mcpErrors,
        latency: {
          avg: parseFloat(mcpAvgLatency.toFixed(2)),
          p50: parseFloat(mcpP50.toFixed(2)),
          p95: parseFloat(mcpP95.toFixed(2)),
          p99: parseFloat(mcpP99.toFixed(2)),
        },
      },
      tenants: { ...this.metrics.tenants },
      system: { ...this.metrics.system },
    };
  }

  // Reset metrics (for testing or periodic resets)
  reset(): void {
    this.httpRequestLatencies = [];
    this.tokenValidationLatencies = [];
    this.mcpRequestLatencies = [];
    this.httpRequestCount = 0;
    this.httpRequestSuccess = 0;
    this.httpRequestErrors = 0;
    this.authTotal = 0;
    this.authSuccess = 0;
    this.authFailure = 0;
    this.authByMethod = {};
    this.authzTotal = 0;
    this.authzSuccess = 0;
    this.authzFailure = 0;
    this.authzDenied = 0;
    this.tokensIssued = 0;
    this.tokensValidated = 0;
    this.tokensRefreshed = 0;
    this.tokensRevoked = 0;
    this.mcpRequests = 0;
    this.mcpSuccess = 0;
    this.mcpErrors = 0;
    this.startTime = Date.now();
  }
}

// Global metrics collector instance
export const metricsCollector = new MetricsCollector();

/**
 * Metrics endpoint handler
 */
export const metricsEndpoint = async (c: Context): Promise<Response> => {
  try {
    const metrics = metricsCollector.getMetrics();
    return c.json(metrics, 200);
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return c.json({ error: 'Failed to collect metrics' }, 500);
  }
};

/**
 * Authentication success/failure rate endpoint
 */
export const authMetricsEndpoint = async (c: Context): Promise<Response> => {
  try {
    const metrics = metricsCollector.getMetrics();
    return c.json(
      {
        authentication: metrics.authentication,
        authorization: metrics.authorization,
      },
      200
    );
  } catch (error) {
    console.error('Auth metrics endpoint error:', error);
    return c.json({ error: 'Failed to collect authentication metrics' }, 500);
  }
};

/**
 * Token validation latency endpoint
 */
export const tokenLatencyEndpoint = async (c: Context): Promise<Response> => {
  try {
    const metrics = metricsCollector.getMetrics();
    return c.json(
      {
        tokenValidationLatency: metrics.tokens.validationLatency,
        tokensValidated: metrics.tokens.validated,
      },
      200
    );
  } catch (error) {
    console.error('Token latency endpoint error:', error);
    return c.json({ error: 'Failed to collect token validation metrics' }, 500);
  }
};
