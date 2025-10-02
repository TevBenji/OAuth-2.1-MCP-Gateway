/**
 * OAuth 2.1 MCP Gateway - Main Entry Point
 *
 * This is the main entry point for the Cloudflare Workers runtime.
 * It sets up the Hono application with all middleware and routes.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { registerClient } from './handlers/oauth/register';
import { healthCheck } from './handlers/admin/health';
import adminApi from './handlers/admin/api';
import adminUi from './handlers/admin/ui';
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
// OAuth 2.1 Dynamic Client Registration (RFC 7591)
app.post('/register', registerClient);
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
