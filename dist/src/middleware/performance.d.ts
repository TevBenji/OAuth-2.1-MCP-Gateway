/**
 * Performance Monitoring Middleware
 *
 * Middleware for collecting performance metrics with Server-Timing headers
 * and response time tracking for observability.
 */
import { Context, Next } from 'hono';
export interface PerformanceMetrics {
    name: string;
    duration: number;
    description?: string;
}
export interface PerformanceOptions {
    serverTiming?: boolean;
    responseTimeHeader?: string;
    metricsStore?: PerformanceMetrics[];
    maxMetricsStored?: number;
}
/**
 * Performance monitoring middleware
 * Tracks response time and optionally adds Server-Timing headers
 */
export declare function performanceMiddleware(options?: PerformanceOptions): (c: Context, next: Next) => Promise<void>;
/**
 * Get current performance metrics
 */
export declare function getPerformanceMetrics(): PerformanceMetrics[];
/**
 * Clear performance metrics
 */
export declare function clearPerformanceMetrics(): void;
