/**
 * Performance Metrics Endpoint
 *
 * Exposes aggregated performance metrics for monitoring.
 * Supports both JSON and Prometheus formats.
 */
import type { Context } from 'hono';
/**
 * GET /admin/api/metrics/performance
 *
 * Returns aggregated performance metrics
 */
export declare function getPerformanceMetrics(c: Context): Promise<Response>;
/**
 * POST /admin/api/metrics/reset
 *
 * Clears performance metrics (useful for testing)
 */
export declare function resetPerformanceMetrics(c: Context): Promise<Response & import("hono").TypedResponse<{
    message: string;
    timestamp: string;
}>>;
