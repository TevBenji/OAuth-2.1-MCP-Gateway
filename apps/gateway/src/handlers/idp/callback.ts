/**
 * IdP Callback Handlers
 *
 * HTTP handlers for IdP authentication callbacks.
 */

import { Context } from 'hono';
import { IdPManagerService } from '../../services/idp/manager';
import { IdPError, IdPErrorCode } from '../../types/idp';

/**
 * Handle OIDC callback
 */
export async function handleOIDCCallback(c: Context) {
  try {
    const code = c.req.query('code');
    const state = c.req.query('state');
    const error = c.req.query('error');
    const errorDescription = c.req.query('error_description');

    // Handle OAuth error response
    if (error) {
      return c.json(
        {
          error,
          error_description: errorDescription || 'Authentication failed',
        },
        400
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return c.json(
        {
          error: 'invalid_request',
          error_description: 'Missing code or state parameter',
        },
        400
      );
    }

    // Decode state to get IdP ID and original redirect URI
    // In production, state would be stored in session/KV with IdP context
    const stateData = decodeState(state);

    if (!stateData.idpId || !stateData.tenantId) {
      return c.json(
        {
          error: 'invalid_state',
          error_description: 'Invalid or expired state parameter',
        },
        400
      );
    }

    // Get IdP configuration
    const idpManager = new IdPManagerService();
    const idpConfig = await idpManager.getIdPConfig(stateData.tenantId, stateData.idpId);

    // Process OIDC callback
    const authResponse = await idpManager.processCallback(idpConfig, {
      code,
      state,
      redirectUri: stateData.redirectUri,
      nonce: stateData.nonce,
      codeVerifier: stateData.codeVerifier,
    });

    // In production, this would:
    // 1. Create OAuth session for the user
    // 2. Generate OAuth authorization code
    // 3. Redirect back to original OAuth client
    // For now, return the auth response
    return c.json({
      success: true,
      user_id: authResponse.user_id,
      email: authResponse.email,
      is_new_user: authResponse.is_new_user,
      roles: authResponse.roles,
    });
  } catch (error) {
    if (error instanceof IdPError) {
      return c.json(
        {
          error: error.code,
          error_description: error.message,
          details: error.details,
        },
        400
      );
    }

    console.error('OIDC callback error:', error);
    return c.json(
      {
        error: 'server_error',
        error_description: 'Internal server error',
      },
      500
    );
  }
}

/**
 * Handle SAML callback (POST)
 */
export async function handleSAMLCallback(c: Context) {
  try {
    const body = await c.req.parseBody();
    const samlResponse = body['SAMLResponse'] as string;
    const relayState = body['RelayState'] as string;

    // Validate required parameters
    if (!samlResponse) {
      return c.json(
        {
          error: 'invalid_request',
          error_description: 'Missing SAMLResponse parameter',
        },
        400
      );
    }

    // Decode relay state to get IdP ID
    const stateData = decodeState(relayState);

    if (!stateData.idpId || !stateData.tenantId) {
      return c.json(
        {
          error: 'invalid_state',
          error_description: 'Invalid or expired RelayState parameter',
        },
        400
      );
    }

    // Get IdP configuration
    const idpManager = new IdPManagerService();
    const idpConfig = await idpManager.getIdPConfig(stateData.tenantId, stateData.idpId);

    // Process SAML callback
    const authResponse = await idpManager.processCallback(idpConfig, {
      samlResponse,
      state: relayState,
    });

    // Return success response
    return c.json({
      success: true,
      user_id: authResponse.user_id,
      email: authResponse.email,
      is_new_user: authResponse.is_new_user,
      roles: authResponse.roles,
    });
  } catch (error) {
    if (error instanceof IdPError) {
      return c.json(
        {
          error: error.code,
          error_description: error.message,
          details: error.details,
        },
        400
      );
    }

    console.error('SAML callback error:', error);
    return c.json(
      {
        error: 'server_error',
        error_description: 'Internal server error',
      },
      500
    );
  }
}

/**
 * Initiate IdP authentication
 */
export async function handleInitiateAuth(c: Context) {
  try {
    const tenantId = c.req.param('tenantId');
    const idpId = c.req.param('idpId');
    const redirectUri = c.req.query('redirect_uri');

    if (!tenantId || !idpId || !redirectUri) {
      return c.json(
        {
          error: 'invalid_request',
          error_description: 'Missing tenantId, idpId, or redirect_uri parameter',
        },
        400
      );
    }

    // Get IdP configuration
    const idpManager = new IdPManagerService();
    const idpConfig = await idpManager.getIdPConfig(tenantId, idpId);

    // Generate state
    const state = encodeState({
      tenantId,
      idpId,
      redirectUri,
      nonce: generateNonce(),
      timestamp: Date.now(),
    });

    // Build authentication URL
    const authUrl = await idpManager.initiateAuthentication(idpConfig, {
      idp_id: idpId,
      tenant_id: tenantId,
      redirect_uri: getCallbackUrl(c, idpConfig.type),
      state,
    });

    // Redirect to IdP
    return c.redirect(authUrl);
  } catch (error) {
    if (error instanceof IdPError) {
      return c.json(
        {
          error: error.code,
          error_description: error.message,
          details: error.details,
        },
        400
      );
    }

    console.error('Initiate auth error:', error);
    return c.json(
      {
        error: 'server_error',
        error_description: 'Internal server error',
      },
      500
    );
  }
}

/**
 * Encode state parameter
 */
function encodeState(data: Record<string, any>): string {
  // In production, store state in KV with TTL and return opaque token
  // For now, just base64 encode
  return btoa(JSON.stringify(data));
}

/**
 * Decode state parameter
 */
function decodeState(state: string): any {
  try {
    // In production, retrieve from KV by token
    // For now, just base64 decode
    const decoded = atob(state);
    
    // Validate the decoded string before parsing
    if (typeof decoded !== 'string' || !/^[[{].*[\]}]$/.test(decoded.trim())) {
      console.warn('Invalid JSON format detected in state parameter');
      return {};
    }
    
    const parsed = JSON.parse(decoded);
    
    // Validate parsed object to prevent prototype pollution
    if (parsed !== null && typeof parsed === 'object') {
      // Check for dangerous properties that could lead to prototype pollution
      if (Object.prototype.hasOwnProperty.call(parsed, '__proto__') || 
          Object.prototype.hasOwnProperty.call(parsed, 'constructor')) {
        console.error('Prototype pollution attempt detected in state parameter');
        return {};
      }
    }
    
    return parsed;
  } catch (error) {
    console.error('State parameter parsing error:', error);
    return {};
  }
}

/**
 * Generate nonce
 */
function generateNonce(): string {
  return crypto.randomUUID();
}

/**
 * Get callback URL for IdP type
 */
function getCallbackUrl(c: Context, idpType: string): string {
  const url = new URL(c.req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  if (idpType === 'oidc') {
    return `${baseUrl}/idp/callback/oidc`;
  } else if (idpType === 'saml') {
    return `${baseUrl}/idp/callback/saml`;
  }

  return `${baseUrl}/idp/callback`;
}
