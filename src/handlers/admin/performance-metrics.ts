/**
 * Performance Metrics Endpoint
 *
 * Exposes aggregated performance metrics for monitoring.
 * Supports both JSON and Prometheus formats.
 */

import type { Context } from 'hono';
import { getPerformanceMetrics as fetchMetrics } from '../../middleware/performance';
import {
  calculateMetricsSummary,
  groupByEndpoint,
  calculateRate,
  formatPrometheusMetrics,
} from '../../utils/metrics';

/**
 * GET /admin/api/metrics/performance
 *
 * Returns aggregated performance metrics
 */
export async function getPerformanceMetrics(c: Context) {
  const format = c.req.query('format') || 'json';
  const rawMetrics = fetchMetrics();

  if (rawMetrics.length === 0) {
    return c.json({
      message: 'No metrics collected yet',
      count: 0,
    });
  }

  // Calculate overall statistics
  const requestDurations = rawMetrics.map(m => m.duration);
  const overallStats = calculateMetricsSummary(requestDurations);

  // Group by endpoint
  const grouped = groupByEndpoint(rawMetrics.map(m => ({ endpoint: m.name, duration: m.duration, timestamp: Date.now() })));
  const endpointStats: Record<string, any> = {};

  for (const [endpoint, endpointMetrics] of grouped) {
    const durations = endpointMetrics.map((m: any) => m.duration);
    endpointStats[endpoint] = calculateMetricsSummary(durations);
  }

  // Calculate request rate (last minute)
  const requestRate = calculateRate(rawMetrics.map(m => ({ timestamp: Date.now() })), 60000);

  const response = {
    overall: overallStats,
    endpoints: endpointStats,
    requestRate,
    timestamp: new Date().toISOString(),
  };

  if (format === 'prometheus') {
    const prometheusText = formatPrometheusMetrics(endpointStats);
    return c.text(prometheusText, 200, {
      'Content-Type': 'text/plain; version=0.0.4',
    });
  }

  return c.json(response);
}

/**
 * POST /admin/api/metrics/reset
 *
 * Clears performance metrics (useful for testing)
 */
export async function resetPerformanceMetrics(c: Context) {
  const { clearPerformanceMetrics } = await import('../../middleware/performance');
  clearPerformanceMetrics();

  return c.json({
    message: 'Performance metrics cleared',
    timestamp: new Date().toISOString(),
  });
}
