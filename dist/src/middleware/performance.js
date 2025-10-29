/**
 * Performance Monitoring Middleware
 *
 * Middleware for collecting performance metrics with Server-Timing headers
 * and response time tracking for observability.
 */
// Default options
const defaultOptions = {
    serverTiming: true,
    responseTimeHeader: 'X-Response-Time',
    metricsStore: [],
    maxMetricsStored: 1000,
};
// Global metrics store
let metricsStore = [];
let maxMetricsStored = 1000;
/**
 * Performance monitoring middleware
 * Tracks response time and optionally adds Server-Timing headers
 */
export function performanceMiddleware(options = {}) {
    const config = { ...defaultOptions, ...options };
    metricsStore = config.metricsStore;
    maxMetricsStored = config.maxMetricsStored;
    return async function performance(c, next) {
        const start = Date.now();
        // Collect timing marks
        const marks = [];
        // Add mark function to context for downstream handlers
        c.set('perfMark', (name, description) => {
            marks.push({
                name,
                duration: Date.now() - start,
                description,
            });
        });
        try {
            await next();
        }
        finally {
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
function buildServerTimingHeader(metrics) {
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
function storeMetrics(metrics) {
    metricsStore.push(metrics);
    // Maintain rolling window
    if (metricsStore.length > maxMetricsStored) {
        metricsStore.shift();
    }
}
/**
 * Get current performance metrics
 */
export function getPerformanceMetrics() {
    return [...metricsStore];
}
/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics() {
    metricsStore = [];
}
