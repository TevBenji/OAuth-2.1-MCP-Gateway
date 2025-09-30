/**
 * OAuth 2.1 MCP Gateway - Main Entry Point
 * 
 * This is the main entry point for the Cloudflare Workers runtime.
 * It sets up the Hono application with all middleware and routes.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings } from '@/types/bindings';

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('*', cors({
  origin: (origin) => {
    // Allow requests from MCP clients and admin interfaces
    const allowedOrigins = [
      'http://localhost:3000',
      'https://claude.ai',
      'https://chatgpt.com',
      'https://cursor.sh'
    ];
    return allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  exposeHeaders: ['X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// OAuth 2.1 discovery endpoints
app.get('/.well-known/oauth-authorization-server', (c) => {
  return c.json({
    issuer: c.env.JWT_ISSUER,
    authorization_endpoint: `${c.env.JWT_ISSUER}/authorize`,
    token_endpoint: `${c.env.JWT_ISSUER}/token`,
    registration_endpoint: `${c.env.JWT_ISSUER}/register`,
    scopes_supported: ['mcp:tools:read', 'mcp:tools:write', 'mcp:resources:read', 'mcp:resources:write'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none', 'client_secret_post']
  });
});

// Default 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: c.env.ENVIRONMENT === 'development' ? err.message : undefined
  }, 500);
});

export default app;