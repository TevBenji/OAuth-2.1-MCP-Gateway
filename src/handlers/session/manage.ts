/**
 * Session Management Handlers
 *
 * HTTP handlers for session operations: create, validate, revoke, list.
 */

import { Context } from 'hono';
import { SessionManager } from '../../services/security/session';
import { Session, DeviceInfo } from '../../types/session';
import { setSessionCookie, clearSessionCookie } from '../../middleware/session';

/**
 * Create a new session
 * POST /sessions
 */
export async function createSessionHandler(c: Context) {
  try {
    const sessionManager = c.get('sessionManager') as SessionManager;

    if (!sessionManager) {
      return c.json({ error: 'Session manager not configured' }, 500);
    }

    // Get session creation parameters from request body
    const body = await c.req.json();
    const { tenant_id, user_id, client_id, max_idle_time, max_session_time, metadata } = body;

    if (!tenant_id || !user_id || !client_id) {
      return c.json(
        {
          error: 'INVALID_REQUEST',
          error_description: 'Missing required fields: tenant_id, user_id, client_id',
        },
        400
      );
    }

    // Parse device info from request headers
    const deviceInfo = SessionManager.parseDeviceInfo(getRequestHeaders(c));

    // Create session
    const session = await sessionManager.createSession({
      tenant_id,
      user_id,
      client_id,
      device_info: deviceInfo,
      max_idle_time,
      max_session_time,
      metadata,
    });

    // Set session cookie
    const maxAge = Math.floor((session.expires_at.getTime() - Date.now()) / 1000);
    setSessionCookie(c, session.session_id, maxAge, {
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
    });

    return c.json(
      {
        session_id: session.session_id,
        created_at: session.created_at.toISOString(),
        expires_at: session.expires_at.toISOString(),
        idle_timeout_at: session.idle_timeout_at.toISOString(),
        risk_level: session.risk_level,
      },
      201
    );
  } catch (error) {
    console.error('Create session error:', error);
    return c.json(
      {
        error: 'SESSION_CREATION_ERROR',
        error_description: error instanceof Error ? error.message : 'Failed to create session',
      },
      500
    );
  }
}

/**
 * Get current session information
 * GET /sessions/current
 */
export async function getCurrentSessionHandler(c: Context) {
  try {
    const session = c.get('session') as Session | undefined;

    if (!session) {
      return c.json(
        {
          error: 'SESSION_NOT_FOUND',
          error_description: 'No active session found',
        },
        404
      );
    }

    return c.json({
      session_id: session.session_id,
      tenant_id: session.tenant_id,
      user_id: session.user_id,
      client_id: session.client_id,
      status: session.status,
      risk_level: session.risk_level,
      created_at: session.created_at.toISOString(),
      last_accessed_at: session.last_accessed_at.toISOString(),
      expires_at: session.expires_at.toISOString(),
      idle_timeout_at: session.idle_timeout_at.toISOString(),
      device_info: {
        device_type: session.device_info.device_type,
        os: session.device_info.os,
        browser: session.device_info.browser,
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    return c.json(
      {
        error: 'SESSION_ERROR',
        error_description: 'Failed to retrieve session',
      },
      500
    );
  }
}

/**
 * Revoke current session
 * DELETE /sessions/current
 */
export async function revokeCurrentSessionHandler(c: Context) {
  try {
    const sessionManager = c.get('sessionManager') as SessionManager;
    const session = c.get('session') as Session | undefined;

    if (!session) {
      return c.json(
        {
          error: 'SESSION_NOT_FOUND',
          error_description: 'No active session found',
        },
        404
      );
    }

    // Get revocation reason from request body
    let reason = 'user_logout';
    try {
      const body = await c.req.json();
      reason = body.reason || reason;
    } catch {
      // No body provided, use default reason
    }

    await sessionManager.revokeSession(session.session_id, reason);

    // Clear session cookie
    clearSessionCookie(c);

    return c.json(
      {
        message: 'Session revoked successfully',
        session_id: session.session_id,
      },
      200
    );
  } catch (error) {
    console.error('Revoke session error:', error);
    return c.json(
      {
        error: 'SESSION_REVOCATION_ERROR',
        error_description: 'Failed to revoke session',
      },
      500
    );
  }
}

/**
 * List all active sessions for current user
 * GET /sessions
 */
export async function listUserSessionsHandler(c: Context) {
  try {
    const sessionManager = c.get('sessionManager') as SessionManager;
    const session = c.get('session') as Session | undefined;

    if (!session) {
      return c.json(
        {
          error: 'SESSION_NOT_FOUND',
          error_description: 'No active session found',
        },
        401
      );
    }

    const sessions = await sessionManager.getUserSessions(session.tenant_id, session.user_id);

    return c.json({
      sessions: sessions.map(s => ({
        session_id: s.session_id,
        status: s.status,
        risk_level: s.risk_level,
        created_at: s.created_at.toISOString(),
        last_accessed_at: s.last_accessed_at.toISOString(),
        expires_at: s.expires_at.toISOString(),
        device_info: {
          device_type: s.device_info.device_type,
          os: s.device_info.os,
          browser: s.device_info.browser,
          ip_address: s.device_info.ip_address,
        },
        is_current: s.session_id === session.session_id,
      })),
      total: sessions.length,
    });
  } catch (error) {
    console.error('List sessions error:', error);
    return c.json(
      {
        error: 'SESSION_LIST_ERROR',
        error_description: 'Failed to list sessions',
      },
      500
    );
  }
}

/**
 * Revoke a specific session
 * DELETE /sessions/:sessionId
 */
export async function revokeSessionHandler(c: Context) {
  try {
    const sessionManager = c.get('sessionManager') as SessionManager;
    const currentSession = c.get('session') as Session | undefined;

    if (!currentSession) {
      return c.json(
        {
          error: 'UNAUTHORIZED',
          error_description: 'Authentication required',
        },
        401
      );
    }

    const sessionIdToRevoke = c.req.param('sessionId');

    if (!sessionIdToRevoke) {
      return c.json(
        {
          error: 'INVALID_REQUEST',
          error_description: 'Session ID is required',
        },
        400
      );
    }

    // Get revocation reason
    let reason = 'user_requested';
    try {
      const body = await c.req.json();
      reason = body.reason || reason;
    } catch {
      // No body provided, use default reason
    }

    await sessionManager.revokeSession(sessionIdToRevoke, reason);

    // If revoking current session, clear cookie
    if (sessionIdToRevoke === currentSession.session_id) {
      clearSessionCookie(c);
    }

    return c.json({
      message: 'Session revoked successfully',
      session_id: sessionIdToRevoke,
    });
  } catch (error) {
    console.error('Revoke session error:', error);
    return c.json(
      {
        error: 'SESSION_REVOCATION_ERROR',
        error_description: error instanceof Error ? error.message : 'Failed to revoke session',
      },
      500
    );
  }
}

/**
 * Revoke all user sessions (except current)
 * POST /sessions/revoke-all
 */
export async function revokeAllSessionsHandler(c: Context) {
  try {
    const sessionManager = c.get('sessionManager') as SessionManager;
    const currentSession = c.get('session') as Session | undefined;

    if (!currentSession) {
      return c.json(
        {
          error: 'UNAUTHORIZED',
          error_description: 'Authentication required',
        },
        401
      );
    }

    // Get all user sessions
    const sessions = await sessionManager.getUserSessions(
      currentSession.tenant_id,
      currentSession.user_id
    );

    // Revoke all except current
    let revokedCount = 0;
    for (const session of sessions) {
      if (session.session_id !== currentSession.session_id) {
        await sessionManager.revokeSession(session.session_id, 'user_revoked_all');
        revokedCount++;
      }
    }

    return c.json({
      message: 'All other sessions revoked successfully',
      revoked_count: revokedCount,
    });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    return c.json(
      {
        error: 'SESSION_REVOCATION_ERROR',
        error_description: 'Failed to revoke sessions',
      },
      500
    );
  }
}

/**
 * Helper function to get request headers
 */
function getRequestHeaders(c: Context): Record<string, string> {
  const headers: Record<string, string> = {};
  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return headers;
}
