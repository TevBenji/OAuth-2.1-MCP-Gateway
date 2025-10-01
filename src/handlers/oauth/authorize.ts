import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { v4 as uuidv4 } from 'uuid';

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

// Authorization code storage interface
export interface AuthorizationCodeStorage {
  storeCode(
    code: string,
    clientId: string,
    redirectUri: string,
    userId: string,
    scopes: string[],
    expiresAt: number
  ): Promise<void>;
  
  retrieveAndDeleteCode(code: string): Promise<AuthorizationCodeData | null>;
}

// Authorization code data
export interface AuthorizationCodeData {
  clientId: string;
  redirectUri: string;
  userId: string;
  scopes: string[];
  expiresAt: number;
}

// In-memory implementation for development/testing
class InMemoryAuthorizationCodeStorage implements AuthorizationCodeStorage {
  private codes: Map<string, AuthorizationCodeData> = new Map();

  async storeCode(
    code: string,
    clientId: string,
    redirectUri: string,
    userId: string,
    scopes: string[],
    expiresAt: number
  ): Promise<void> {
    this.codes.set(code, { clientId, redirectUri, userId, scopes, expiresAt });
  }

  async retrieveAndDeleteCode(code: string): Promise<AuthorizationCodeData | null> {
    const data = this.codes.get(code);
    
    if (!data) {
      return null;
    }
    
    // Check if code is expired
    if (data.expiresAt < Date.now()) {
      this.codes.delete(code);
      return null;
    }
    
    // Remove and return the code data
    this.codes.delete(code);
    return data;
  }
}

// Storage instances
const codeStorage = new InMemoryAuthorizationCodeStorage();

/**
 * GET /authorize endpoint - OAuth 2.1 authorization endpoint
 * Handles authorization requests and enforces PKCE
 */
export const handleAuthorization = async (c: Context) => {
  try {
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
      return c.redirect(`${request.redirect_uri}?error=invalid_request&error_description=Missing response_type parameter`);
    }
    
    if (request.response_type !== 'code') {
      return c.redirect(`${request.redirect_uri}?error=unsupported_response_type&error_description=Only code response type is supported`);
    }
    
    if (!request.client_id) {
      return c.redirect(`${request.redirect_uri}?error=invalid_request&error_description=Missing client_id parameter`);
    }
    
    if (!request.redirect_uri) {
      return c.redirect(`${request.redirect_uri || 'about:blank'}?error=invalid_request&error_description=Missing redirect_uri parameter`);
    }

    // Validate PKCE parameters (required for public clients)
    if (!request.code_challenge) {
      return c.redirect(`${request.redirect_uri}?error=invalid_request&error_description=code_challenge parameter is required for PKCE`);
    }
    
    if (!request.code_challenge_method || !['S256', 'plain'].includes(request.code_challenge_method)) {
      return c.redirect(`${request.redirect_uri}?error=invalid_request&error_description=code_challenge_method must be S256 or plain`);
    }

    // Validate state parameter for CSRF protection
    if (!request.state) {
      return c.redirect(`${request.redirect_uri}?error=invalid_request&error_description=state parameter is required for CSRF protection`);
    }

    // For demo purposes, we'll simulate user authentication and consent
    // In a real implementation, this would involve user login and consent UI
    const userId = 'demo-user-id'; // This would come from actual authentication

    // Verify that the PKCE challenge was previously stored (in a real implementation)
    // For now, we just validate it's present and has the right format
    if (!request.code_challenge) {
      return c.redirect(`${request.redirect_uri}?error=invalid_request&error_description=Invalid or missing code challenge`);
    }
    
    // Validate code challenge format (base64url encoded)
    const codeChallengeRegex = /^[A-Za-z0-9_-]+$/;
    if (!codeChallengeRegex.test(request.code_challenge)) {
      return c.redirect(`${request.redirect_uri}?error=invalid_request&error_description=Invalid code challenge format`);
    }

    // Generate authorization code
    const authorizationCode = `auth_${uuidv4().replace(/-/g, '')}`;
    const codeExpiryTime = Date.now() + (5 * 60 * 1000); // 5 minutes expiry
    
    // Parse scopes
    const scopes = request.scope ? request.scope.split(' ') : [];

    // Store the authorization code
    await codeStorage.storeCode(
      authorizationCode,
      request.client_id,
      request.redirect_uri,
      userId,
      scopes,
      codeExpiryTime
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