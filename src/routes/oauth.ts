/**
 * OAuth 2.1 Routes
 *
 * Hono routes for OAuth 2.1 endpoints with proper error handling and validation.
 */

import { Hono } from 'hono';
import { Bindings } from '../types/bindings';
import { handleAuthorization } from '../handlers/oauth/authorize';
import { handleToken } from '../handlers/oauth/token';
import { registerClient } from '../handlers/oauth/register';
import { ipRateLimitMiddleware } from '../middleware/rate-limit';
import { createRateLimiter } from '../services/security/rate-limiter';

// Define context variables for type safety
type Variables = {
  tenantId?: string;
  userId?: string;
  clientId?: string;
  mcpContext?: any;
  tokenPayload?: any;
  session?: any;
  deviceInfo?: any;
};

// Configure OAuth routes with rate limiter
function configureOAuthRoutes(app: Hono<{ Bindings: Bindings; Variables: Variables }>, createRateLimiterFn?: (env: any) => any) {
  // OAuth 2.1 Discovery Endpoint (RFC 8414)
  app.get('/.well-known/oauth-authorization-server', (c) => {
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
  if (createRateLimiterFn) {
    app.post(
      '/oauth/authorize',
      (c, next) => ipRateLimitMiddleware(createRateLimiterFn(c.env))(c, next),
      handleAuthorization
    );
    app.get(
      '/oauth/authorize',
      (c, next) => ipRateLimitMiddleware(createRateLimiterFn(c.env))(c, next),
      handleAuthorization
    ); // Support GET for compatibility
  } else {
    // For the default export (no rate limiter)
    app.post('/oauth/authorize', handleAuthorization);
    app.get('/oauth/authorize', handleAuthorization);
  }

  // Token Endpoint
  if (createRateLimiterFn) {
    app.post(
      '/oauth/token',
      (c, next) => ipRateLimitMiddleware(createRateLimiterFn(c.env))(c, next),
      handleToken
    );
  } else {
    // For the default export (no rate limiter)
    app.post('/oauth/token', handleToken);
  }
  
  app.post('/token', handleToken); // Legacy compatibility

  // Client Registration
  app.post('/oauth/register', registerClient);
  app.post('/register', registerClient); // Legacy compatibility

  return app;
}

// Default export for use without rate limiter
const oauth = new Hono<{ Bindings: Bindings; Variables: Variables }>();
configureOAuthRoutes(oauth);

// Factory function to create OAuth routes with rate limiter
export function createOAuthRoutes(createRateLimiter: (env: any) => any) {
  const oauthWithRateLimiter = new Hono<{ Bindings: Bindings; Variables: Variables }>();
  return configureOAuthRoutes(oauthWithRateLimiter, createRateLimiter);
}

export default oauth;