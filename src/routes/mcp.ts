/**
 * MCP Gateway Routes
 *
 * All MCP proxy and resource endpoints.
 * Protected with OAuth authentication and rate limiting.
 */

import { Hono } from 'hono';
import type { Bindings } from '../types/bindings';
import { proxyToMCPServer, proxyByResourceIdentifier } from '../handlers/mcp/proxy';
import { authMiddleware, requireScopes } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rate-limit';

type Variables = {
  tenantId?: string;
  userId?: string;
  clientId?: string;
  mcpContext?: any;
  tokenPayload?: any;
  session?: any;
};

export function createMCPRoutes(createRateLimiter: (env: any) => any) {
  const mcp = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  // Health Check (public)
  mcp.get('/health', c => {
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'mcp-gateway',
      version: '1.0.0',
    });
  });

  // Proxy by server ID (protected)
  mcp.all(
    '/:serverId/*',
    authMiddleware(),
    requireScopes('mcp:tools:read', 'mcp:resources:read'),
    (c, next) => rateLimitMiddleware(createRateLimiter(c.env))(c, next),
    proxyToMCPServer
  );

  // Proxy by resource identifier (protected)
  mcp.all(
    '/resource/*',
    authMiddleware(),
    requireScopes('mcp:resources:read', 'mcp:resources:write'),
    (c, next) => rateLimitMiddleware(createRateLimiter(c.env))(c, next),
    proxyByResourceIdentifier
  );

  return mcp;
}
