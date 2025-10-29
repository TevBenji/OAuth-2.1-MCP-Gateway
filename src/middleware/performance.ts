/**
 * Performance Monitoring Middleware
 *
 * Tracks request timing, database latency, and proxy performance.
 * Provides insights for optimization and alerting.
 *
 * Metrics Tracked:
 * - Request duration (total)
 * - Database query time
 * - MCP proxy latency
 * - Auth middleware overhead
 * - Rate limit check time
 *
 * Storage: In-memory with periodic aggregation
 */

import type { Context, Next } from 'hono';

export interface PerformanceMetrics {
  requestDuration: number;
  authDuration?: number;
  rateLimitDuration?: number;
  databaseDuration?: number;
  proxyDuration?: number;
  timestamp: number;
  endpoint: string;
  method: string;
  statusCode: number;
}

/**
 * Global metrics store (in-memory)
 * Aggregated periodically and exported via /admin/api/metrics
 */
const metricsStore: PerformanceMetrics[] = [];
const maxMetricsStored = 1000; // Rolling window

/**
 * Performance monitoring middleware
 *
 * Wraps request handlers and tracks timing information.
 */
export function performanceMiddleware() {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();

    // Track timing for different phases
    const timings = {
      start: startTime,
      authStart: 0,
      authEnd: 0,
      rateLimitStart: 0,
      rateLimitEnd: 0,
      databaseStart: 0,
      databaseEnd: 0,
      proxyStart: 0,
      proxyEnd: 0,
    };

    // Attach timing tracker to context
    c.set('timings', timings);

    // Execute request
    await next();

    // Calculate total duration
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Record metrics
    const metrics: PerformanceMetrics = {
      requestDuration: duration,
      authDuration: timings.authEnd - timings.authStart || undefined,
      rateLimitDuration: timings.rateLimitEnd - timings.rateLimitStart || undefined,
      databaseDuration: timings.databaseEnd - timings.databaseStart || undefined,
      proxyDuration: timings.proxyEnd - timings.proxyStart || undefined,
      timestamp: startTime,
      endpoint: c.req.path,
      method: c.req.method,
      statusCode: c.res.status,
    };

    // Store metrics
    storeMetrics(metrics);

    // Add performance headers
    c.header('X-Response-Time', \`\${duration}ms\`);
    c.header('Server-Timing', buildServerTimingHeader(metrics));
  };
}

/**
 * Store metrics in memory
 */
function storeMetrics(metrics: PerformanceMetrics): void {
  metricsStore.push(metrics);

  // Maintain rolling window
  if (metricsStore.length > maxMetricsStored) {
    metricsStore.shift();
  }
}

/**
 * Build Server-Timing header for browser dev tools
 */
function buildServerTimingHeader(metrics: PerformanceMetrics): string {
  const parts: string[] = [];

  parts.push(\`total;dur=\${metrics.requestDuration}\`);
  if (metrics.authDuration) parts.push(\`auth;dur=\${metrics.authDuration}\`);
  if (metrics.rateLimitDuration) parts.push(\`ratelimit;dur=\${metrics.rateLimitDuration}\`);
  if (metrics.databaseDuration) parts.push(\`database;dur=\${metrics.databaseDuration}\`);
  if (metrics.proxyDuration) parts.push(\`proxy;dur=\${metrics.proxyDuration}\`);

  return parts.join(', ');
}

/**
 * Get all stored metrics
 */
export function getMetrics(): PerformanceMetrics[] {
  return [...metricsStore];
}

/**
 * Clear metrics store
 */
export function clearMetrics(): void {
  metricsStore.length = 0;
}

/**
 * Helper to mark timing for specific operations
 */
export function markTiming(c: Context, operation: string, phase: 'start' | 'end'): void {
  const timings = c.get('timings') as any;
  if (timings) {
    const key = \`\${operation}\${phase === 'start' ? 'Start' : 'End'}\`;
    timings[key] = Date.now();
  }
}
