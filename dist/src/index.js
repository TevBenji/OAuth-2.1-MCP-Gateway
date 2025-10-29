/**
 * OAuth 2.1 MCP Gateway - Main Entry Point
 *
 * This is the main entry point for the Cloudflare Workers runtime.
 * It sets up the Hono application with all middleware and routes.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerClient } from './handlers/oauth/register';
import { handleAuthorization } from './handlers/oauth/authorize';
import { handleToken } from './handlers/oauth/token';
import { proxyToMCPServer, proxyByResourceIdentifier } from './handlers/mcp/proxy';
import { healthCheck } from './handlers/admin/health';
import adminApi from './handlers/admin/api';
import adminUi from './handlers/admin/ui';
import { authMiddleware, requireScopes } from './middleware/auth';
import { rateLimitMiddleware, ipRateLimitMiddleware } from './middleware/rate-limit';
import { RateLimiter } from './services/security/rate-limiter';
import { RateLimitStorageKV } from './services/security/rate-limit-storage-kv';
import { createRateLimitStorageDO } from './services/security/rate-limit-storage-do';
const app = new Hono();
// CORS middleware
app.use('*', cors({
    origin: origin => {
        // Allow requests from MCP clients and admin interfaces
        const allowedOrigins = [
            'http://localhost:3000',
            'https://claude.ai',
            'https://chatgpt.com',
            'https://cursor.sh',
        ];
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            return origin;
        }
        return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    exposeHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));
// Health check endpoint
app.get('/health', healthCheck);
// OAuth 2.1 discovery endpoints
app.get('/.well-known/oauth-authorization-server', c => {
    const issuer = c.env?.JWT_ISSUER || 'https://test.oauth-mcp-gateway.com';
    return c.json({
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: `${issuer}/token`,
        registration_endpoint: `${issuer}/register`,
        scopes_supported: [
            'mcp:tools:read',
            'mcp:tools:write',
            'mcp:resources:read',
            'mcp:resources:write',
        ],
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256'],
        token_endpoint_auth_methods_supported: ['none', 'client_secret_post'],
    });
});
// Create rate limiter with Durable Objects storage (falls back to KV if DO not available)
const createRateLimiter = (env) => {
    // Handle undefined env for testing
    if (!env) {
        // Create a mock storage for testing
        const mockStorage = {
            get: async () => 0,
            put: async () => { },
            delete: async () => { },
            increment: async () => 1,
            isBlocked: async () => false,
            block: async () => { },
            unblock: async () => { },
            getBlockInfo: async () => null,
            reset: async () => { },
        };
        return new RateLimiter(mockStorage);
    }
    // Prefer Durable Objects for atomic consistency, fallback to KV
    if (env.RATE_LIMIT_DO) {
        const storage = createRateLimitStorageDO(env.RATE_LIMIT_DO, env.RATE_LIMIT_KV || env.CACHE);
        return new RateLimiter(storage);
    }
    // Fallback to KV storage
    const storage = new RateLimitStorageKV(env.RATE_LIMIT_KV || env.CACHE, 'oauth-gateway');
    return new RateLimiter(storage);
};
// OAuth 2.1 Authorization Endpoint
app.post('/oauth/authorize', (c, next) => ipRateLimitMiddleware(createRateLimiter(c.env))(c, next), handleAuthorization);
app.get('/oauth/authorize', (c, next) => ipRateLimitMiddleware(createRateLimiter(c.env))(c, next), handleAuthorization); // Support GET for compatibility
// OAuth 2.1 Token Endpoint
app.post('/oauth/token', (c, next) => ipRateLimitMiddleware(createRateLimiter(c.env))(c, next), handleToken);
// OAuth 2.1 Dynamic Client Registration (RFC 7591)
app.post('/oauth/register', registerClient);
app.post('/register', registerClient); // Legacy compatibility
// SECURITY FIX: Removed duplicate /authorize route
// The /oauth/authorize route is already defined above (lines 118-127)
// MCP Health Check - Public endpoint (must be before protected routes)
app.get('/mcp/health', c => {
    return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'mcp-gateway',
        version: '1.0.0',
    });
});
// MCP Gateway Routes - Protected with OAuth authentication and rate limiting
app.all('/mcp/:serverId/*', authMiddleware(), requireScopes('mcp:tools:read', 'mcp:resources:read'), (c, next) => rateLimitMiddleware(createRateLimiter(c.env))(c, next), proxyToMCPServer); // Proxy by server ID
app.all('/mcp/resource/*', authMiddleware(), requireScopes('mcp:resources:read', 'mcp:resources:write'), (c, next) => rateLimitMiddleware(createRateLimiter(c.env))(c, next), proxyByResourceIdentifier); // Proxy by resource identifier
// SECURITY FIX: Removed duplicate routes
// The /token route is already defined above (lines 129-134)
// The /mcp/:serverId/* route is already defined above (lines 154-160)
// The /mcp/resource/* route is already defined above (lines 162-168)
// Admin API and UI routes
app.route('/admin/api', adminApi);
app.route('/admin', adminUi);
// Default 404 handler
app.notFound(c => {
    return c.json({ error: 'Not Found' }, 404);
});
// Global error handler
app.onError((err, c) => {
    console.error('Unhandled error:', err);
    return c.json({
        error: 'Internal Server Error',
        message: c.env?.ENVIRONMENT === 'development' ? err.message : undefined,
    }, 500);
});
export default app;
