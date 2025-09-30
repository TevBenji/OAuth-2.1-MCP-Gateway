/**
 * Rate Limiting Middleware
 *
 * Middleware for applying rate limits with proper HTTP 429 responses and headers.
 */

import { Context, Next } from 'hono';
import { RateLimiter } from '../services/security/rate-limiter';
import { RateLimitResult, RateLimitWindow } from '../types/rate-limit';
import { MCPRequestContext } from '../types/mcp';

/**
 * Extract IP address from request
 */
function extractIPAddress(c: Context): string {
  // Try Cloudflare headers first
  const cfIP = c.req.header('CF-Connecting-IP');
  if (cfIP) return cfIP;

  // Try X-Real-IP
  const realIP = c.req.header('X-Real-IP');
  if (realIP) return realIP;

  // Try X-Forwarded-For (first IP in the list)
  const forwardedFor = c.req.header('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return 'unknown';
}

/**
 * Set rate limit headers in response
 */
function setRateLimitHeaders(c: Context, result: RateLimitResult): void {
  c.header('X-RateLimit-Limit', result.limit.toString());
  c.header('X-RateLimit-Remaining', result.remaining.toString());
  c.header('X-RateLimit-Reset', result.reset.toString());

  if (!result.allowed && result.retry_after) {
    c.header('Retry-After', result.retry_after.toString());
  }
}

/**
 * Rate limiting middleware for authenticated requests
 */
export function rateLimitMiddleware(rateLimiter: RateLimiter, window?: RateLimitWindow) {
  return async (c: Context, next: Next) => {
    try {
      // Get MCP context (requires auth middleware to run first)
      const mcpContext = c.get('mcpContext') as MCPRequestContext | undefined;

      if (!mcpContext) {
        // No auth context, skip rate limiting
        await next();
        return;
      }

      const ipAddress = extractIPAddress(c);

      // Check all rate limits
      const result = await rateLimiter.checkAllLimits(
        mcpContext.tenant_id,
        mcpContext.user_id,
        ipAddress
      );

      // Set rate limit headers
      setRateLimitHeaders(c, result);

      if (!result.allowed) {
        if (result.blocked) {
          return c.json(
            {
              error: 'ip_blocked',
              error_description: result.block_reason || 'Your IP has been blocked',
              retry_after: result.retry_after,
            },
            429
          );
        }

        return c.json(
          {
            error: 'rate_limit_exceeded',
            error_description: 'Too many requests. Please try again later.',
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
            retry_after: result.retry_after,
          },
          429
        );
      }

      await next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Don't fail the request on rate limit errors
      await next();
    }
  };
}

/**
 * IP-based rate limiting middleware (no authentication required)
 */
export function ipRateLimitMiddleware(rateLimiter: RateLimiter, window?: RateLimitWindow) {
  return async (c: Context, next: Next) => {
    try {
      const ipAddress = extractIPAddress(c);

      // Check IP rate limit
      const result = await rateLimiter.checkIPLimit(ipAddress, window);

      // Set rate limit headers
      setRateLimitHeaders(c, result);

      if (!result.allowed) {
        if (result.blocked) {
          return c.json(
            {
              error: 'ip_blocked',
              error_description: result.block_reason || 'Your IP has been blocked due to suspicious activity',
              retry_after: result.retry_after,
            },
            429
          );
        }

        return c.json(
          {
            error: 'rate_limit_exceeded',
            error_description: 'Too many requests from your IP. Please try again later.',
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
            retry_after: result.retry_after,
          },
          429
        );
      }

      await next();
    } catch (error) {
      console.error('IP rate limit middleware error:', error);
      // Don't fail the request on rate limit errors
      await next();
    }
  };
}

/**
 * Tenant-specific rate limiting middleware
 */
export function tenantRateLimitMiddleware(rateLimiter: RateLimiter, window?: RateLimitWindow) {
  return async (c: Context, next: Next) => {
    try {
      const mcpContext = c.get('mcpContext') as MCPRequestContext | undefined;

      if (!mcpContext) {
        await next();
        return;
      }

      // Check tenant rate limit
      const result = await rateLimiter.checkTenantLimit(mcpContext.tenant_id, window);

      // Set rate limit headers
      setRateLimitHeaders(c, result);

      if (!result.allowed) {
        return c.json(
          {
            error: 'tenant_rate_limit_exceeded',
            error_description: 'Tenant rate limit exceeded. Please upgrade your plan or try again later.',
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
            retry_after: result.retry_after,
          },
          429
        );
      }

      await next();
    } catch (error) {
      console.error('Tenant rate limit middleware error:', error);
      await next();
    }
  };
}

/**
 * User-specific rate limiting middleware
 */
export function userRateLimitMiddleware(rateLimiter: RateLimiter, window?: RateLimitWindow) {
  return async (c: Context, next: Next) => {
    try {
      const mcpContext = c.get('mcpContext') as MCPRequestContext | undefined;

      if (!mcpContext) {
        await next();
        return;
      }

      // Check user rate limit
      const result = await rateLimiter.checkUserLimit(
        mcpContext.tenant_id,
        mcpContext.user_id,
        window
      );

      // Set rate limit headers
      setRateLimitHeaders(c, result);

      if (!result.allowed) {
        return c.json(
          {
            error: 'user_rate_limit_exceeded',
            error_description: 'User rate limit exceeded. Please try again later.',
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
            retry_after: result.retry_after,
          },
          429
        );
      }

      await next();
    } catch (error) {
      console.error('User rate limit middleware error:', error);
      await next();
    }
  };
}

/**
 * Endpoint-specific rate limiting middleware
 */
export function endpointRateLimitMiddleware(
  rateLimiter: RateLimiter,
  endpoint: string,
  window?: RateLimitWindow
) {
  return async (c: Context, next: Next) => {
    try {
      const mcpContext = c.get('mcpContext') as MCPRequestContext | undefined;

      if (!mcpContext) {
        await next();
        return;
      }

      // Check endpoint rate limit
      const result = await rateLimiter.checkEndpointLimit(
        endpoint,
        mcpContext.tenant_id,
        window
      );

      // Set rate limit headers
      setRateLimitHeaders(c, result);

      if (!result.allowed) {
        return c.json(
          {
            error: 'endpoint_rate_limit_exceeded',
            error_description: `Rate limit exceeded for endpoint: ${endpoint}`,
            limit: result.limit,
            remaining: result.remaining,
            reset: result.reset,
            retry_after: result.retry_after,
          },
          429
        );
      }

      await next();
    } catch (error) {
      console.error('Endpoint rate limit middleware error:', error);
      await next();
    }
  };
}
