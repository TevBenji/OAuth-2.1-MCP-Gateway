/**
 * Performance Monitoring Middleware
 *
 * Middleware for collecting performance metrics with Server-Timing headers
 * and response time tracking for observability.
 */

import { Context, Next } from 'hono';

// Performance metrics structure
export interface PerformanceMetrics {
  name: string;
  duration: number;
  description?: string;
}

// Performance monitoring options
export interface PerformanceOptions {
  serverTiming?: boolean;
  responseTimeHeader?: string;
  metricsStore?: PerformanceMetrics[];
  maxMetricsStored?: number;
}

// Default options
const defaultOptions: Required<PerformanceOptions> = {
  serverTiming: true,
  responseTimeHeader: 'X-Response-Time',
  metricsStore: [],
  maxMetricsStored: 1000,
};

// Global metrics store
let metricsStore: PerformanceMetrics[] = [];
let maxMetricsStored = 1000;

/**
 * Performance monitoring middleware
 * Tracks response time and optionally adds Server-Timing headers
 */
export function performanceMiddleware(options: PerformanceOptions = {}) {
  const config = { ...defaultOptions, ...options };
  metricsStore = config.metricsStore;
  maxMetricsStored = config.maxMetricsStored;

  return async function performance(c: Context, next: Next) {
    const start = Date.now();

    // Collect timing marks
    const marks: PerformanceMetrics[] = [];

    // Add mark function to context for downstream handlers
    c.set('perfMark', (name: string, description?: string) => {
      marks.push({
        name,
        duration: Date.now() - start,
        description,
      });
    });

    try {
      await next();
    } finally {
      const duration = Date.now() - start;

      // Add response time header
      if (config.responseTimeHeader) {
        c.header(config.responseTimeHeader, `${duration}ms`);
      }

      // Add Server-Timing header
      if (config.serverTiming && marks.length > 0) {
        c.header('Server-Timing', buildServerTimingHeader(marks));
      }

      // Store metrics
      storeMetrics({
        name: 'total',
        duration,
        description: c.req.path,
      });

      marks.forEach(mark => storeMetrics(mark));
    }
  };
}

/**
 * Build Server-Timing header from metrics
 */
function buildServerTimingHeader(metrics: PerformanceMetrics[]): string {
  return metrics
    .map(metric => {
      let header = metric.name;
      if (metric.duration !== undefined) {
        header += `;dur=${metric.duration}`;
      }
      if (metric.description) {
        header += `;desc="${metric.description}"`;
      }
      return header;
    })
    .join(', ');
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
 * Get current performance metrics
 */
export function getPerformanceMetrics(): PerformanceMetrics[] {
  return [...metricsStore];
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics(): void {
  metricsStore = [];
}