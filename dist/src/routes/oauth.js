/**
 * OAuth 2.1 Routes
 *
 * Hono routes for OAuth 2.1 endpoints with proper error handling and validation.
 */
import { Hono } from 'hono';
import { handleAuthorization } from '../handlers/oauth/authorize';
import { handleToken } from '../handlers/oauth/token';
import { registerClient } from '../handlers/oauth/register';
import { ipRateLimitMiddleware } from '../middleware/rate-limit';
import { createRateLimiter } from '../services/security/rate-limiter';
const oauth = new Hono();
// OAuth 2.1 Discovery Endpoint (RFC 8414)
oauth.get('/.well-known/oauth-authorization-server', (c) => {
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
// Authorization Endpoint
oauth.post('/oauth/authorize', (c, next) => ipRateLimitMiddleware(createRateLimiter(c.env))(c, next), handleAuthorization);
oauth.get('/oauth/authorize', (c, next) => ipRateLimitMiddleware(createRateLimiter(c.env))(c, next), handleAuthorization); // Support GET for compatibility
// Token Endpoint
oauth.post('/oauth/token', (c, next) => ipRateLimitMiddleware(createRateLimiter(c.env))(c, next), handleToken);
oauth.post('/token', handleToken); // Legacy compatibility
// Client Registration
oauth.post('/oauth/register', registerClient);
oauth.post('/register', registerClient); // Legacy compatibility
export default oauth;
