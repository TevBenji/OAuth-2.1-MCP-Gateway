/**
 * Session Middleware
 *
 * Middleware for session validation, device fingerprinting, and risk assessment.
 */

import { Context, Next } from 'hono';
import { SessionManager } from '../services/security/session';
import { DeviceInfo, SessionErrorCode } from '../types/session';
import { MCPError } from '../types/mcp';

/**
 * Session middleware that validates session and attaches it to context
 */
export function sessionMiddleware(sessionManager: SessionManager) {
  return async (c: Context, next: Next) => {
    try {
      // Extract session ID from cookie or header
      const sessionId = extractSessionId(c);

      if (!sessionId) {
        throw new MCPError(
          'MISSING_SESSION',
          'Session ID not found in request',
          401
        );
      }

      // Parse device info from request headers
      const deviceInfo = SessionManager.parseDeviceInfo(getRequestHeaders(c));

      // Validate session
      const validationResult = await sessionManager.validateSession(sessionId, deviceInfo);

      if (!validationResult.valid) {
        const error = validationResult.error!;

        // Map session errors to HTTP responses
        let statusCode = 401;
        if (error.code === SessionErrorCode.SESSION_EXPIRED ||
            error.code === SessionErrorCode.IDLE_TIMEOUT) {
          statusCode = 401;
        } else if (error.code === SessionErrorCode.DEVICE_MISMATCH ||
                   error.code === SessionErrorCode.RISK_TOO_HIGH) {
          statusCode = 403;
        }

        throw new MCPError(
          error.code,
          error.message,
          statusCode,
          error.details
        );
      }

      // Attach session to context
      c.set('session', validationResult.session);
      c.set('deviceInfo', deviceInfo);

      await next();
    } catch (error) {
      if (error instanceof MCPError) {
        return c.json(
          {
            error: error.code,
            error_description: error.message,
            details: error.details,
          },
          error.statusCode as 401 | 403
        );
      }

      console.error('Session middleware error:', error);
      return c.json(
        {
          error: 'SESSION_ERROR',
          error_description: 'An unexpected error occurred during session validation',
        },
        500
      );
    }
  };
}

/**
 * Optional session middleware that doesn't require a session
 */
export function optionalSessionMiddleware(sessionManager: SessionManager) {
  return async (c: Context, next: Next) => {
    try {
      const sessionId = extractSessionId(c);

      if (sessionId) {
        const deviceInfo = SessionManager.parseDeviceInfo(getRequestHeaders(c));
        const validationResult = await sessionManager.validateSession(sessionId, deviceInfo);

        if (validationResult.valid) {
          c.set('session', validationResult.session);
          c.set('deviceInfo', deviceInfo);
        }
      }

      await next();
    } catch (error) {
      console.error('Optional session middleware error:', error);
      // Don't fail the request, just continue without session
      await next();
    }
  };
}

/**
 * Extract session ID from cookie or Authorization header
 */
function extractSessionId(c: Context): string | null {
  // Try to get from cookie first
  const cookieHeader = c.req.header('cookie');
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    if (cookies['session_id']) {
      return cookies['session_id'];
    }
  }

  // Try to get from X-Session-ID header
  const sessionHeader = c.req.header('X-Session-ID');
  if (sessionHeader) {
    return sessionHeader;
  }

  // Try to get from Authorization header (session token)
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Session ')) {
    return authHeader.substring(8);
  }

  return null;
}

/**
 * Parse cookies from cookie header
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    const value = rest.join('=');
    if (name && value) {
      cookies[name.trim()] = decodeURIComponent(value.trim());
    }
  });

  return cookies;
}

/**
 * Get request headers as a plain object
 */
function getRequestHeaders(c: Context): Record<string, string> {
  const headers: Record<string, string> = {};

  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return headers;
}

/**
 * Set session cookie in response
 */
export function setSessionCookie(
  c: Context,
  sessionId: string,
  maxAge: number,
  options?: {
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    domain?: string;
    path?: string;
  }
): void {
  const cookieOptions = {
    secure: options?.secure ?? true,
    httpOnly: options?.httpOnly ?? true,
    sameSite: options?.sameSite ?? 'Lax',
    domain: options?.domain,
    path: options?.path ?? '/',
  };

  let cookieValue = `session_id=${sessionId}; Max-Age=${maxAge}; Path=${cookieOptions.path}`;

  if (cookieOptions.secure) {
    cookieValue += '; Secure';
  }

  if (cookieOptions.httpOnly) {
    cookieValue += '; HttpOnly';
  }

  if (cookieOptions.sameSite) {
    cookieValue += `; SameSite=${cookieOptions.sameSite}`;
  }

  if (cookieOptions.domain) {
    cookieValue += `; Domain=${cookieOptions.domain}`;
  }

  c.header('Set-Cookie', cookieValue);
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(c: Context, options?: { domain?: string; path?: string }): void {
  let cookieValue = `session_id=; Max-Age=0; Path=${options?.path ?? '/'}`;

  if (options?.domain) {
    cookieValue += `; Domain=${options.domain}`;
  }

  c.header('Set-Cookie', cookieValue);
}
