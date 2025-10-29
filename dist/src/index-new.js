/**
 * OAuth 2.1 MCP Gateway - Main Entry Point
 *
 * Simplified entry point using modular routes and DI container.
 * This file orchestrates the application but delegates implementation to modules.
 */
import { Hono } from 'hono';
import { createCorsMiddleware } from './config/cors';
import { createOAuthRoutes } from './routes/oauth';
import { createMCPRoutes } from './routes/mcp';
import { healthCheck } from './handlers/admin/health';
import adminApi from './handlers/admin/api';
import adminUi from './handlers/admin/ui';
import { RateLimiter } from './services/security/rate-limiter';
import { RateLimitStorageKV } from './services/security/rate-limit-storage-kv';
import { createRateLimitStorageDO } from './services/security/rate-limit-storage-do';
// Create app instance
const app = new Hono();
// Global middleware
app.use('*', createCorsMiddleware());
// Health check
app.get('/health', healthCheck);
// Rate limiter factory (shared across routes)
const createRateLimiter = (env) => {
    if (!env) {
        const mockStorage = {
            get: async () => 0,
            increment: async () => 1,
            isBlocked: async () => false,
            block: async () => { },
            unblock: async () => { },
            getBlockInfo: async () => null,
            reset: async () => { },
        };
        return new RateLimiter(mockStorage);
    }
    const storage = env.RATE_LIMIT_DO
        ? createRateLimitStorageDO(env.RATE_LIMIT_DO, env.RATE_LIMIT_KV || env.CACHE)
        : new RateLimitStorageKV(env.RATE_LIMIT_KV || env.CACHE, 'oauth-gateway');
    return new RateLimiter(storage);
};
// Mount route modules
app.route('/', createOAuthRoutes(createRateLimiter));
app.route('/mcp', createMCPRoutes(createRateLimiter));
app.route('/admin/api', adminApi);
app.route('/admin', adminUi);
// Error handlers
app.notFound(c => c.json({ error: 'Not Found' }, 404));
app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({
        error: 'Internal Server Error',
        message: c.env?.ENVIRONMENT === 'development' ? err.message : undefined,
    }, 500);
});
export default app;
