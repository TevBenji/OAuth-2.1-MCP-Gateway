/**
 * OAuth 2.1 MCP Gateway - Hono application.
 *
 * Runtime-agnostic: the Node entry point (server.ts) injects the environment
 * via app.fetch(request, env); tests inject fakes the same way.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings } from './types/bindings';
import { registerClient } from './handlers/oauth/register';
import { handleAuthorization } from './handlers/oauth/authorize';
import { handleToken } from './handlers/oauth/token';
import { proxyToMCPServer, proxyByResourceIdentifier } from './handlers/mcp/proxy';
import { healthCheck } from './handlers/admin/health';
import adminApi from './handlers/admin/api';
import { authMiddleware, requireScopes } from './middleware/auth';
import { rateLimitMiddleware, ipRateLimitMiddleware } from './middleware/rate-limit';
import { RateLimiter } from './services/security/rate-limiter';
import { RateLimitStorageMemory } from './services/security/rate-limit-storage-memory';
import { RateLimitStoragePg } from './services/security/rate-limit-storage-pg';
import { MCPServerRegistry } from './services/mcp/registry';
import { MCPProxyService } from './services/mcp/proxy';
import { PgMcpServerDatabase } from './storage/pg-mcp-server-database';

// Define context variables for type safety
type Variables = {
  tenantId?: string;
  userId?: string;
  clientId?: string;
  mcpContext?: any;
  tokenPayload?: any;
  session?: any;
  deviceInfo?: any;
  proxyService?: MCPProxyService;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS middleware — allowed origins come from CORS_ORIGINS (comma-separated)
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowed = String(c.env?.CORS_ORIGINS ?? '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);
      return allowed.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    // X-Tenant-ID is gone on purpose: no endpoint reads it inbound anymore
    // (tenant is a server-side decision; identity headers are stripped).
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  })
);

// Health check endpoint
app.get('/health', healthCheck);

// OAuth 2.1 discovery endpoints
app.get('/.well-known/oauth-authorization-server', c => {
  const issuer = c.env?.JWT_ISSUER || 'https://test.oauth-mcp-gateway.com';
  return c.json({
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
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

// Rate limiter per environment. Backend is selected by RATE_LIMIT_STORAGE:
// 'postgres' shares counters and IP blocks across replicas; the default
// in-memory backend is per-process (fine for a single instance / dev).
const rateLimiters = new WeakMap<object, RateLimiter>();
const fallbackRateLimiter = new RateLimiter(new RateLimitStorageMemory());
const createRateLimiter = (env: Bindings | undefined): RateLimiter => {
  if (!env) return fallbackRateLimiter;
  let limiter = rateLimiters.get(env);
  if (!limiter) {
    const storage =
      env.RATE_LIMIT_STORAGE === 'postgres' && env.DB
        ? new RateLimitStoragePg(env.DB)
        : new RateLimitStorageMemory();
    limiter = new RateLimiter(storage);
    rateLimiters.set(env, limiter);
  }
  return limiter;
};

// Proxy service per environment (one per process; tests get one per fake env).
const proxyServices = new WeakMap<object, MCPProxyService>();

// Make the MCP proxy service available to /mcp/* handlers.
app.use('/mcp/*', async (c, next) => {
  if (c.env?.DB) {
    let service = proxyServices.get(c.env);
    if (!service) {
      const registry = new MCPServerRegistry(new PgMcpServerDatabase(c.env.DB), 60000, false);
      let upstreamSecrets: Record<string, string> | undefined;
      if (c.env.UPSTREAM_HMAC_SECRETS) {
        try {
          upstreamSecrets = JSON.parse(c.env.UPSTREAM_HMAC_SECRETS);
        } catch {
          // never echo the value: it holds secrets
          console.error('UPSTREAM_HMAC_SECRETS is not valid JSON; upstream signing disabled');
        }
      }
      service = new MCPProxyService(registry, { upstreamSecrets });
      proxyServices.set(c.env, service);
    }
    c.set('proxyService', service);
  }
  await next();
});

// OAuth 2.1 Authorization Endpoint
app.post(
  '/oauth/authorize',
  (c, next) => ipRateLimitMiddleware(createRateLimiter(c.env))(c, next),
  handleAuthorization
);
app.get(
  '/oauth/authorize',
  (c, next) => ipRateLimitMiddleware(createRateLimiter(c.env))(c, next),
  handleAuthorization
); // Support GET for compatibility

// OAuth 2.1 Token Endpoint
app.post(
  '/oauth/token',
  (c, next) => ipRateLimitMiddleware(createRateLimiter(c.env))(c, next),
  handleToken
);

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
app.all(
  '/mcp/:serverId/*',
  authMiddleware(),
  requireScopes('mcp:tools:read', 'mcp:resources:read'),
  (c, next) => rateLimitMiddleware(createRateLimiter(c.env))(c, next),
  proxyToMCPServer
); // Proxy by server ID

app.all(
  '/mcp/resource/*',
  authMiddleware(),
  requireScopes('mcp:resources:read', 'mcp:resources:write'),
  (c, next) => rateLimitMiddleware(createRateLimiter(c.env))(c, next),
  proxyByResourceIdentifier
); // Proxy by resource identifier

// SECURITY FIX: Removed duplicate routes
// The /token route is already defined above (lines 129-134)
// The /mcp/:serverId/* route is already defined above (lines 154-160)
// The /mcp/resource/* route is already defined above (lines 162-168)

// Admin API routes
app.route('/admin/api', adminApi);

// Default 404 handler
app.notFound(c => {
  return c.json({ error: 'Not Found' }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: 'Internal Server Error',
      message: c.env?.ENVIRONMENT === 'development' ? err.message : undefined,
    },
    500
  );
});

export default app;
