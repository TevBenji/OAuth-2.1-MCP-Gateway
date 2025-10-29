import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { v4 as uuidv4 } from 'uuid';
import type { Bindings } from '../../types/bindings';
import { D1AuthorizationCodeStorage } from '../../storage/d1-authorization-code-storage';
import {
  createInvalidRequestError,
  createUnsupportedResponseTypeError,
  createInvalidPKCEError,
} from '../../utils/enhanced-errors';

// Authorization request parameters
export interface AuthorizationRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

/**
 * GET /authorize endpoint - OAuth 2.1 authorization endpoint
 * Handles authorization requests and enforces PKCE
 *
 * Security Enhancements:
 * - Uses D1 database for authorization code storage
 * - Persists PKCE challenge for validation during token exchange
 * - Atomic operations prevent race conditions
 */
export const handleAuthorization = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    // Initialize D1 storage (production-ready)
    const db = c.env?.DB;
    const tenantId = c.env?.TENANT_ID || 'default-tenant';

    if (!db) {
      console.error('D1 database not configured');
      throw new HTTPException(500, { message: 'Database configuration error' });
    }

    const codeStorage = new D1AuthorizationCodeStorage(db, tenantId);

    // Extract query parameters
    const request: AuthorizationRequest = {
      response_type: c.req.query('response_type') || '',
      client_id: c.req.query('client_id') || '',
      redirect_uri: c.req.query('redirect_uri') || '',
      scope: c.req.query('scope'),
      state: c.req.query('state'),
      code_challenge: c.req.query('code_challenge'),
      code_challenge_method: c.req.query('code_challenge_method'),
    };

    // Validate required parameters
    if (!request.response_type) {
      const error = createInvalidRequestError('Missing response_type parameter', request.state);
      const errorParams = new URLSearchParams(error.toOAuthResponse());
      return c.redirect(`${request.redirect_uri}?${errorParams.toString()}`);
    }

    if (request.response_type !== 'code') {
      const error = createUnsupportedResponseTypeError(request.response_type, request.state);
      const errorParams = new URLSearchParams(error.toOAuthResponse());
      return c.redirect(`${request.redirect_uri}?${errorParams.toString()}`);
    }

    if (!request.client_id) {
      const error = createInvalidRequestError('Missing client_id parameter', request.state);
      const errorParams = new URLSearchParams(error.toOAuthResponse());
      return c.redirect(`${request.redirect_uri}?${errorParams.toString()}`);
    }

    if (!request.redirect_uri) {
      const error = createInvalidRequestError('Missing redirect_uri parameter', request.state);
      const errorParams = new URLSearchParams(error.toOAuthResponse());
      return c.redirect(`${request.redirect_uri || 'about:blank'}?${errorParams.toString()}`);
    }

    // Validate PKCE parameters (required for public clients)
    if (!request.code_challenge) {
      const error = createInvalidPKCEError('code_challenge parameter is required', request.state);
      const errorParams = new URLSearchParams(error.toOAuthResponse());
      return c.redirect(`${request.redirect_uri}?${errorParams.toString()}`);
    }

    if (!request.code_challenge_method || !['S256', 'plain'].includes(request.code_challenge_method)) {
      const error = createInvalidPKCEError(
        'code_challenge_method must be S256 (recommended) or plain',
        request.state
      );
      const errorParams = new URLSearchParams(error.toOAuthResponse());
      return c.redirect(`${request.redirect_uri}?${errorParams.toString()}`);
    }

    // Validate state parameter for CSRF protection
    if (!request.state) {
      const error = createInvalidRequestError(
        'state parameter is required for CSRF protection',
        request.state
      );
      const errorParams = new URLSearchParams(error.toOAuthResponse());
      return c.redirect(`${request.redirect_uri}?${errorParams.toString()}`);
    }

    // For demo purposes, we'll simulate user authentication and consent
    // In a real implementation, this would involve user login and consent UI
    const userId = 'demo-user-id'; // This would come from actual authentication

    // SECURITY FIX: Regenerate session ID after successful authentication
    // This prevents session fixation attacks
    const sessionId = c.req.header('X-Session-ID') || c.req.header('Cookie')?.match(/session_id=([^;]+)/)?.[1];
    if (sessionId && c.env?.SESSION_KV) {
      try {
        const { SessionStorageKV } = await import('../../services/security/session-storage-kv');
        const sessionStorage = new SessionStorageKV(c.env.SESSION_KV);
        const newSessionId = await sessionStorage.regenerateSessionOnAuth(sessionId);
        // Set new session ID in response cookie
        c.header('Set-Cookie', `session_id=${newSessionId}; HttpOnly; Secure; SameSite=Strict; Path=/`);
      } catch (error) {
        console.warn('Failed to regenerate session:', error);
        // Continue with authorization - session regeneration failure is not critical
      }
    }

    // Validate code challenge format (base64url encoded)
    const codeChallengeRegex = /^[A-Za-z0-9_-]+$/;
    if (!codeChallengeRegex.test(request.code_challenge)) {
      const error = createInvalidPKCEError(
        'code_challenge must be base64url encoded (A-Za-z0-9_-)',
        request.state
      );
      const errorParams = new URLSearchParams(error.toOAuthResponse());
      return c.redirect(`${request.redirect_uri}?${errorParams.toString()}`);
    }

    // Generate authorization code
    const authorizationCode = `auth_${uuidv4().replace(/-/g, '')}`;
    const codeExpiryTime = Date.now() + (5 * 60 * 1000); // 5 minutes expiry
    
    // Parse scopes
    const scopes = request.scope ? request.scope.split(' ') : [];

    // SECURITY FIX: Store the authorization code WITH PKCE challenge
    // This ensures the code_challenge is persisted for validation during token exchange
    await codeStorage.storeCode(
      authorizationCode,
      request.client_id,
      request.redirect_uri,
      userId,
      scopes,
      codeExpiryTime,
      request.code_challenge, // CRITICAL: Store PKCE challenge
      request.code_challenge_method // CRITICAL: Store challenge method
    );

    // Build the redirect URL with authorization code and state
    const redirectUrl = new URL(request.redirect_uri);
    redirectUrl.searchParams.set('code', authorizationCode);
    if (request.state) {
      redirectUrl.searchParams.set('state', request.state);
    }

    // Redirect back to client
    return c.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Error in authorization endpoint:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
};

/**
 * Function to validate state parameter for CSRF protection
 * @param providedState - State parameter provided in the request
 * @param expectedState - Expected state value
 * @returns True if state matches, false otherwise
 */
export function validateState(providedState: string | undefined, expectedState: string | undefined): boolean {
  if (!providedState || !expectedState) {
    return false;
  }
  
  return providedState === expectedState;
}