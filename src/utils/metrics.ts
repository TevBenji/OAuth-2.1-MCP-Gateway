/**
 * Metrics Calculation Utilities
 *
 * Provides statistical calculations for performance metrics.
 * Includes percentiles (P50, P95, P99), averages, and aggregations.
 */

export interface MetricsSummary {
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;

  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, index)] ?? 0;
}

/**
 * Calculate summary statistics for a set of values
 */
export function calculateMetricsSummary(values: number[]): MetricsSummary {
  if (values.length === 0) {
    return {
      count: 0,
      avg: 0,
      min: 0,
      max: 0,
      p50: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);

  return {
    count: values.length,
    avg: values.reduce((sum, val) => sum + val, 0) / values.length,
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    p50: calculatePercentile(sorted, 50),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
  };
}

/**
 * Group metrics by endpoint
 */
export function groupByEndpoint(metrics: Array<{ endpoint: string; [key: string]: any }>) {
  const grouped = new Map<string, any[]>();

  for (const metric of metrics) {
    const endpoint = metric.endpoint;
    if (!grouped.has(endpoint)) {
      grouped.set(endpoint, []);
    }
    grouped.get(endpoint)!.push(metric);
  }

  return grouped;
}

/**
 * Calculate rate (requests per second) over a time window
 */
export function calculateRate(
  metrics: Array<{ timestamp: number }>,
  windowMs: number = 60000
): number {
  if (metrics.length === 0) return 0;

  const now = Date.now();
  const windowStart = now - windowMs;

  const recentMetrics = metrics.filter(m => m.timestamp >= windowStart);
  return (recentMetrics.length / windowMs) * 1000; // per second
}

/**
 * Format metrics for Prometheus exposition format
 */
export function formatPrometheusMetrics(metrics: any): string {
  const lines: string[] = [];

  // Add metric type and help text
  lines.push('# HELP http_request_duration_seconds HTTP request latency');
  lines.push('# TYPE http_request_duration_seconds histogram');

  // Add metric values (simplified histogram)
  for (const [endpoint, summary] of Object.entries(metrics)) {
    const m = summary as MetricsSummary;
    const labels = `endpoint="${endpoint}"`;

    lines.push(`http_request_duration_seconds{quantile="0.5",${labels}} ${m.p50 / 1000}`);
    lines.push(`http_request_duration_seconds{quantile="0.95",${labels}} ${m.p95 / 1000}`);
    lines.push(`http_request_duration_seconds{quantile="0.99",${labels}} ${m.p99 / 1000}`);
    lines.push(`http_request_duration_seconds_count{${labels}} ${m.count}`);
    lines.push(`http_request_duration_seconds_sum{${labels}} ${(m.avg * m.count) / 1000}`);
  }

  return lines.join('\n');
}
