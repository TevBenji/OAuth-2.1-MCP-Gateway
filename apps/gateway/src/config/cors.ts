/**
 * CORS Configuration
 *
 * Centralized CORS settings for the application.
 * Configures allowed origins, methods, and headers.
 */

import { cors } from 'hono/cors';

export function createCorsMiddleware() {
  return cors({
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
  });
}
