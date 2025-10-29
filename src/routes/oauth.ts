/**
 * OAuth 2.1 Routes
 *
 * All OAuth 2.1 and OIDC endpoints.
 * Includes authorization, token, registration, and discovery.
 */

import { Hono } from 'hono';
import type { Bindings } from '../types/bindings';
import { registerClient } from '../handlers/oauth/register';
import { handleAuthorization } from '../handlers/oauth/authorize';
import { handleToken } from '../handlers/oauth/token';
import { ipRateLimitMiddleware } from '../middleware/rate-limit';

type Variables = {
  tenantId?: string;
  userId?: string;
  clientId?: string;
  mcpContext?: any;
  tokenPayload?: any;
  session?: any;
};

export function createOAuthRoutes(createRateLimiter: (env: any) => any) {
  const oauth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  // OAuth 2.1 Discovery
  oauth.get('/.well-known/oauth-authorization-server', c => {
    const issuer = c.env?.JWT_ISSUER || 'https://test.oauth-mcp-gateway.com';
    return c.json({
      issuer,
      authorization_endpoint: \`\${issuer}/authorize\`,
      token_endpoint: \`\${issuer}/token\`,
      registration_endpoint: \`\${issuer}/register\`,
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
  oauth.post(
    '/oauth/authorize',
    (c, next) => ipRateLimitMiddleware(createRateLimiter(c.env))(c, next),
    handleAuthorization
  );
  oauth.get(
    '/oauth/authorize',
    (c, next) => ipRateLimitMiddleware(createRateLimiter(c.env))(c, next),
    handleAuthorization
  );

  // Token Endpoint
  oauth.post(
    '/oauth/token',
    (c, next) => ipRateLimitMiddleware(createRateLimiter(c.env))(c, next),
    handleToken
  );
  oauth.post('/token', handleToken);

  // Client Registration
  oauth.post('/oauth/register', registerClient);
  oauth.post('/register', registerClient);

  return oauth;
}
