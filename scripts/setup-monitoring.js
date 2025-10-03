#!/usr/bin/env node

/**
 * Prometheus/Grafana Monitoring Setup Script
 *
 * Configures production monitoring with Prometheus metrics
 * and Grafana dashboards for the OAuth 2.1 MCP Gateway.
 * Requirements: 5.4, 5.5
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Prometheus metrics configuration
 */
const prometheusConfig = {
  job_name: 'oauth-mcp-gateway',
  scrape_interval: '15s',
  scrape_timeout: '10s',
  metrics_path: '/metrics',
  scheme: 'https',
  static_configs: [
    {
      targets: ['oauth-mcp-gateway.example.com']
    }
  ]
};

/**
 * Grafana dashboard configuration
 */
const grafanaDashboard = {
  title: 'OAuth 2.1 MCP Gateway - Production Dashboard',
  panels: [
    {
      id: 1,
      title: 'Request Rate',
      type: 'graph',
      targets: [
        {
          expr: 'rate(http_requests_total[5m])',
          legendFormat: '{{method}} {{status}}'
        }
      ]
    },
    {
      id: 2,
      title: 'Response Time (P50, P95, P99)',
      type: 'graph',
      targets: [
        {
          expr: 'histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))',
          legendFormat: 'P50'
        },
        {
          expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
          legendFormat: 'P95'
        },
        {
          expr: 'histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))',
          legendFormat: 'P99'
        }
      ]
    },
    {
      id: 3,
      title: 'Error Rate',
      type: 'graph',
      targets: [
        {
          expr: 'rate(http_requests_total{status=~"5.."}[5m])',
          legendFormat: 'Server Errors'
        },
        {
          expr: 'rate(http_requests_total{status=~"4.."}[5m])',
          legendFormat: 'Client Errors'
        }
      ]
    },
    {
      id: 4,
      title: 'Token Validation Performance',
      type: 'graph',
      targets: [
        {
          expr: 'histogram_quantile(0.95, rate(token_validation_duration_seconds_bucket[5m]))',
          legendFormat: 'P95 Token Validation Time'
        }
      ]
    },
    {
      id: 5,
      title: 'Active Sessions',
      type: 'stat',
      targets: [
        {
          expr: 'active_sessions_total',
          legendFormat: 'Active Sessions'
        }
      ]
    },
    {
      id: 6,
      title: 'Rate Limiting Events',
      type: 'graph',
      targets: [
        {
          expr: 'rate(rate_limit_exceeded_total[5m])',
          legendFormat: 'Rate Limits Exceeded'
        }
      ]
    },
    {
      id: 7,
      title: 'Tenant Activity',
      type: 'table',
      targets: [
        {
          expr: 'sum by (tenant_id) (rate(http_requests_total[5m]))',
          legendFormat: '{{tenant_id}}'
        }
      ]
    },
    {
      id: 8,
      title: 'Security Events',
      type: 'graph',
      targets: [
        {
          expr: 'rate(auth_failures_total[5m])',
          legendFormat: 'Authentication Failures'
        },
        {
          expr: 'rate(authorization_failures_total[5m])',
          legendFormat: 'Authorization Failures'
        }
      ]
    }
  ]
};

/**
 * Alert rules for production monitoring
 */
const alertRules = [
  {
    alert: 'HighErrorRate',
    expr: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.01',
    for: '5m',
    labels: {
      severity: 'critical'
    },
    annotations: {
      summary: 'High error rate detected',
      description: 'Error rate is above 1% for the last 5 minutes'
    }
  },
  {
    alert: 'SlowResponseTime',
    expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.1',
    for: '5m',
    labels: {
      severity: 'warning'
    },
    annotations: {
      summary: 'Slow response times detected',
      description: 'P95 response time is above 100ms for the last 5 minutes'
    }
  },
  {
    alert: 'TokenValidationSlow',
    expr: 'histogram_quantile(0.95, rate(token_validation_duration_seconds_bucket[5m])) > 0.01',
    for: '5m',
    labels: {
      severity: 'warning'
    },
    annotations: {
      summary: 'Slow token validation detected',
      description: 'P95 token validation time is above 10ms (sub-10ms requirement)'
    }
  },
  {
    alert: 'HighAuthenticationFailureRate',
    expr: 'rate(auth_failures_total[5m]) > 10',
    for: '5m',
    labels: {
      severity: 'warning'
    },
    annotations: {
      summary: 'High authentication failure rate',
      description: 'Authentication failures exceed 10 per second - possible attack'
    }
  },
  {
    alert: 'RateLimitExceeded',
    expr: 'rate(rate_limit_exceeded_total[5m]) > 100',
    for: '5m',
    labels: {
      severity: 'info'
    },
    annotations: {
      summary: 'High rate limiting activity',
      description: 'Rate limits being exceeded frequently'
    }
  }
];

/**
 * Setup Prometheus monitoring
 */
async function setupPrometheus() {
  console.log('📊 Setting up Prometheus monitoring...');
  console.log('');

  const configDir = path.join(__dirname, '..', 'monitoring', 'prometheus');
  fs.mkdirSync(configDir, { recursive: true });

  // Generate Prometheus configuration
  const prometheusConfigFile = path.join(configDir, 'prometheus.yml');
  const prometheusYaml = `
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    environment: 'production'
    service: 'oauth-mcp-gateway'

scrape_configs:
  - job_name: '${prometheusConfig.job_name}'
    scrape_interval: ${prometheusConfig.scrape_interval}
    scrape_timeout: ${prometheusConfig.scrape_timeout}
    metrics_path: ${prometheusConfig.metrics_path}
    scheme: ${prometheusConfig.scheme}
    static_configs:
      - targets: ${JSON.stringify(prometheusConfig.static_configs[0].targets)}

rule_files:
  - 'alerts.yml'
`;

  fs.writeFileSync(prometheusConfigFile, prometheusYaml);
  console.log(`✅ Prometheus configuration saved: ${prometheusConfigFile}`);

  // Generate alert rules
  const alertsFile = path.join(configDir, 'alerts.yml');
  const alertsYaml = `
groups:
  - name: oauth_mcp_gateway_alerts
    interval: 15s
    rules:
${alertRules.map(rule => `
      - alert: ${rule.alert}
        expr: ${rule.expr}
        for: ${rule.for}
        labels:
          severity: ${rule.labels.severity}
        annotations:
          summary: "${rule.annotations.summary}"
          description: "${rule.annotations.description}"
`).join('')}
`;

  fs.writeFileSync(alertsFile, alertsYaml);
  console.log(`✅ Alert rules saved: ${alertsFile}`);

  // Generate Docker Compose for Prometheus
  const dockerComposeFile = path.join(configDir, 'docker-compose.yml');
  const dockerCompose = `
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: oauth-mcp-gateway-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./alerts.yml:/etc/prometheus/alerts.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'
    restart: unless-stopped

volumes:
  prometheus-data:
`;

  fs.writeFileSync(dockerComposeFile, dockerCompose);
  console.log(`✅ Docker Compose saved: ${dockerComposeFile}`);
  console.log('');
}

/**
 * Setup Grafana dashboards
 */
async function setupGrafana() {
  console.log('📈 Setting up Grafana dashboards...');
  console.log('');

  const configDir = path.join(__dirname, '..', 'monitoring', 'grafana');
  fs.mkdirSync(path.join(configDir, 'dashboards'), { recursive: true });
  fs.mkdirSync(path.join(configDir, 'provisioning', 'datasources'), { recursive: true });
  fs.mkdirSync(path.join(configDir, 'provisioning', 'dashboards'), { recursive: true });

  // Generate Grafana datasource configuration
  const datasourceFile = path.join(configDir, 'provisioning', 'datasources', 'prometheus.yml');
  const datasourceYaml = `
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
`;

  fs.writeFileSync(datasourceFile, datasourceYaml);
  console.log(`✅ Grafana datasource configuration saved: ${datasourceFile}`);

  // Generate dashboard provisioning
  const dashboardProvisioningFile = path.join(configDir, 'provisioning', 'dashboards', 'default.yml');
  const dashboardProvisioning = `
apiVersion: 1

providers:
  - name: 'OAuth MCP Gateway'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
`;

  fs.writeFileSync(dashboardProvisioningFile, dashboardProvisioning);
  console.log(`✅ Dashboard provisioning configuration saved: ${dashboardProvisioningFile}`);

  // Generate main dashboard
  const dashboardFile = path.join(configDir, 'dashboards', 'oauth-mcp-gateway.json');
  fs.writeFileSync(dashboardFile, JSON.stringify(grafanaDashboard, null, 2));
  console.log(`✅ Grafana dashboard saved: ${dashboardFile}`);

  // Generate Docker Compose for Grafana
  const dockerComposeFile = path.join(configDir, 'docker-compose.yml');
  const dockerCompose = `
version: '3.8'

services:
  grafana:
    image: grafana/grafana:latest
    container_name: oauth-mcp-gateway-grafana
    ports:
      - "3000:3000"
    volumes:
      - ./provisioning:/etc/grafana/provisioning
      - ./dashboards:/etc/grafana/provisioning/dashboards
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_ADMIN_PASSWORD:-admin}
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    restart: unless-stopped

volumes:
  grafana-data:
`;

  fs.writeFileSync(dockerComposeFile, dockerCompose);
  console.log(`✅ Docker Compose saved: ${dockerComposeFile}`);
  console.log('');
}

/**
 * Generate metrics export middleware
 */
async function generateMetricsMiddleware() {
  console.log('📝 Generating metrics export middleware...');
  console.log('');

  const middlewareDir = path.join(__dirname, '..', 'src', 'middleware');
  fs.mkdirSync(middlewareDir, { recursive: true});

  const metricsFile = path.join(middlewareDir, 'prometheus.ts');
  const metricsCode = `/**
 * Prometheus Metrics Middleware
 *
 * Exports application metrics in Prometheus format for monitoring.
 */

import { Context, Next } from 'hono';

// Metrics storage (in production, use proper metrics library)
const metrics = {
  http_requests_total: new Map<string, number>(),
  http_request_duration_seconds: new Map<string, number[]>(),
  token_validation_duration_seconds: new Map<string, number[]>(),
  active_sessions_total: 0,
  rate_limit_exceeded_total: 0,
  auth_failures_total: 0,
  authorization_failures_total: 0
};

/**
 * Record HTTP request metrics
 */
export function metricsMiddleware() {
  return async (c: Context, next: Next) => {
    const startTime = performance.now();
    const path = c.req.path;
    const method = c.req.method;

    await next();

    const duration = performance.now() - startTime;
    const status = c.res.status;

    // Increment request counter
    const key = \`\${method}:\${path}:\${status}\`;
    metrics.http_requests_total.set(key, (metrics.http_requests_total.get(key) || 0) + 1);

    // Record duration
    if (!metrics.http_request_duration_seconds.has(key)) {
      metrics.http_request_duration_seconds.set(key, []);
    }
    metrics.http_request_duration_seconds.get(key)!.push(duration / 1000);
  };
}

/**
 * Record token validation metrics
 */
export function recordTokenValidation(duration: number) {
  const key = 'token_validation';
  if (!metrics.token_validation_duration_seconds.has(key)) {
    metrics.token_validation_duration_seconds.set(key, []);
  }
  metrics.token_validation_duration_seconds.get(key)!.push(duration / 1000);
}

/**
 * Increment counter metrics
 */
export function incrementMetric(metric: keyof typeof metrics, labels?: Record<string, string>) {
  if (typeof metrics[metric] === 'number') {
    (metrics as any)[metric]++;
  } else {
    const key = labels ? Object.entries(labels).map(([k, v]) => \`\${k}=\${v}\`).join(',') : 'default';
    const map = metrics[metric] as Map<string, number>;
    map.set(key, (map.get(key) || 0) + 1);
  }
}

/**
 * Export metrics in Prometheus format
 */
export function exportMetrics(c: Context) {
  let output = '';

  // HTTP requests total
  output += '# HELP http_requests_total Total HTTP requests\\n';
  output += '# TYPE http_requests_total counter\\n';
  for (const [key, value] of metrics.http_requests_total.entries()) {
    const [method, path, status] = key.split(':');
    output += \`http_requests_total{method="\${method}",path="\${path}",status="\${status}"} \${value}\\n\`;
  }

  // HTTP request duration (simplified histogram)
  output += '# HELP http_request_duration_seconds HTTP request duration\\n';
  output += '# TYPE http_request_duration_seconds histogram\\n';
  for (const [key, durations] of metrics.http_request_duration_seconds.entries()) {
    const [method, path, status] = key.split(':');
    const sorted = durations.slice().sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    output += \`http_request_duration_seconds{method="\${method}",path="\${path}",status="\${status}",quantile="0.5"} \${p50}\\n\`;
    output += \`http_request_duration_seconds{method="\${method}",path="\${path}",status="\${status}",quantile="0.95"} \${p95}\\n\`;
    output += \`http_request_duration_seconds{method="\${method}",path="\${path}",status="\${status}",quantile="0.99"} \${p99}\\n\`;
  }

  // Token validation duration
  output += '# HELP token_validation_duration_seconds Token validation duration\\n';
  output += '# TYPE token_validation_duration_seconds histogram\\n';
  for (const [key, durations] of metrics.token_validation_duration_seconds.entries()) {
    const sorted = durations.slice().sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    output += \`token_validation_duration_seconds{quantile="0.95"} \${p95}\\n\`;
  }

  // Simple counters
  output += \`# HELP active_sessions_total Active sessions\\n\`;
  output += \`# TYPE active_sessions_total gauge\\n\`;
  output += \`active_sessions_total \${metrics.active_sessions_total}\\n\`;

  output += \`# HELP rate_limit_exceeded_total Rate limit exceeded events\\n\`;
  output += \`# TYPE rate_limit_exceeded_total counter\\n\`;
  output += \`rate_limit_exceeded_total \${metrics.rate_limit_exceeded_total}\\n\`;

  output += \`# HELP auth_failures_total Authentication failures\\n\`;
  output += \`# TYPE auth_failures_total counter\\n\`;
  output += \`auth_failures_total \${metrics.auth_failures_total}\\n\`;

  output += \`# HELP authorization_failures_total Authorization failures\\n\`;
  output += \`# TYPE authorization_failures_total counter\\n\`;
  output += \`authorization_failures_total \${metrics.authorization_failures_total}\\n\`;

  return c.text(output, 200, {
    'Content-Type': 'text/plain; version=0.0.4'
  });
}
`;

  fs.writeFileSync(metricsFile, metricsCode);
  console.log(`✅ Prometheus metrics middleware generated: ${metricsFile}`);
  console.log('');
}

/**
 * Main setup function
 */
async function setupMonitoring() {
  console.log('');
  console.log('═'.repeat(80));
  console.log('📊 OAuth 2.1 MCP Gateway - Monitoring Setup');
  console.log('═'.repeat(80));
  console.log('');

  try {
    await setupPrometheus();
    await setupGrafana();
    await generateMetricsMiddleware();

    console.log('═'.repeat(80));
    console.log('✅ Monitoring Setup Complete');
    console.log('═'.repeat(80));
    console.log('');
    console.log('Next steps:');
    console.log('  1. Start Prometheus: cd monitoring/prometheus && docker-compose up -d');
    console.log('  2. Start Grafana: cd monitoring/grafana && docker-compose up -d');
    console.log('  3. Access Grafana at http://localhost:3000 (admin/admin)');
    console.log('  4. Access Prometheus at http://localhost:9090');
    console.log('  5. Add metrics middleware to src/index.ts');
    console.log('');

    return { success: true };
  } catch (error) {
    console.error('');
    console.error('❌ Monitoring setup failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (require.main === module) {
  setupMonitoring()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    });
}

module.exports = {
  setupMonitoring,
  setupPrometheus,
  setupGrafana,
  generateMetricsMiddleware
};
