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
 * Calculate summary statistics for a set of values
 */
export declare function calculateMetricsSummary(values: number[]): MetricsSummary;
/**
 * Group metrics by endpoint
 */
export declare function groupByEndpoint(metrics: Array<{
    endpoint: string;
    [key: string]: any;
}>): Map<string, any[]>;
/**
 * Calculate rate (requests per second) over a time window
 */
export declare function calculateRate(metrics: Array<{
    timestamp: number;
}>, windowMs?: number): number;
/**
 * Format metrics for Prometheus exposition format
 */
export declare function formatPrometheusMetrics(metrics: any): string;
