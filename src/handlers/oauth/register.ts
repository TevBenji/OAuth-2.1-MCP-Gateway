/**
 * OAuth 2.1 Dynamic Client Registration Handler (RFC 7591)
 * 
 * Implements the POST /register endpoint for automatic client onboarding
 * with secure client_id generation and optional client_secret.
 */

import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';
import { ClientRegistrationRequestSchema, type ClientRegistrationRequest, type ClientRegistrationResponse, type OAuthError } from '../../types/oauth';
import { ClientService } from '../../services/oauth/client';
import { OAUTH_CONSTANTS, HTTP_STATUS } from '../../utils/constants';

/**
 * POST /register endpoint for Dynamic Client Registration
 * Implements RFC 7591 with security validations
 */
export const registerClient = async (c: Context) => {
  try {
    // Parse and validate request body
    let body: any;
    try {
      body = await c.req.json();
    } catch (error) {
      const oauthError: OAuthError = {
        error: 'invalid_request',
        error_description: 'Invalid JSON in request body'
      };
      return c.json(oauthError, HTTP_STATUS.BAD_REQUEST);
    }
    
    let validatedRequest: ClientRegistrationRequest;
    try {
      validatedRequest = ClientRegistrationRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const oauthError: OAuthError = {
          error: 'invalid_request',
          error_description: `Invalid client registration request: ${error.errors.map(e => e.message).join(', ')}`
        };
        return c.json(oauthError, HTTP_STATUS.BAD_REQUEST);
      }
      throw error;
    }

    // Additional security validations
    const validationError = validateClientRegistrationRequest(validatedRequest);
    if (validationError) {
      return c.json(validationError, HTTP_STATUS.BAD_REQUEST);
    }

    // Extract tenant context (if multi-tenant)
    const tenantId = c.req.header('X-Tenant-ID') || 'default';
    
    // Initialize client service
    const clientService = new ClientService(c.env.DB);
    
    // Register the client
    const clientResponse = await clientService.registerClient(validatedRequest, tenantId);
    
    // Set proper headers
    c.header('Content-Type', 'application/json; charset=UTF-8');
    c.header('Cache-Control', 'no-store');
    c.header('Pragma', 'no-cache');
    
    return c.json(clientResponse, HTTP_STATUS.CREATED);
    
  } catch (error) {
    console.error('Client registration error:', error);
    
    if (error instanceof HTTPException) {
      throw error;
    }
    
    const oauthError: OAuthError = {
      error: 'invalid_request',
      error_description: 'Client registration failed'
    };
    
    return c.json(oauthError, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Validate client registration request for security compliance
 */
function validateClientRegistrationRequest(request: ClientRegistrationRequest): OAuthError | null {
  // Validate redirect URIs
  for (const uri of request.redirect_uris) {
    if (!isValidRedirectUri(uri)) {
      return {
        error: 'invalid_request',
        error_description: `Invalid redirect URI: ${uri}`
      };
    }
  }
  
  // Validate grant types
  if (request.grant_types) {
    const allowedGrantTypes = [OAUTH_CONSTANTS.GRANT_TYPES.AUTHORIZATION_CODE, OAUTH_CONSTANTS.GRANT_TYPES.REFRESH_TOKEN];
    for (const grantType of request.grant_types) {
      if (!allowedGrantTypes.includes(grantType as any)) {
        return {
          error: 'invalid_request',
          error_description: `Unsupported grant type: ${grantType}`
        };
      }
    }
  }
  
  // Validate response types
  if (request.response_types) {
    for (const responseType of request.response_types) {
      if (responseType !== OAUTH_CONSTANTS.RESPONSE_TYPES.CODE) {
        return {
          error: 'invalid_request',
          error_description: `Unsupported response type: ${responseType}`
        };
      }
    }
  }
  
  // Validate token endpoint auth method
  if (request.token_endpoint_auth_method) {
    const allowedMethods = ['none', 'client_secret_post', 'client_secret_basic'];
    if (!allowedMethods.includes(request.token_endpoint_auth_method)) {
      return {
        error: 'invalid_request',
        error_description: `Unsupported token endpoint auth method: ${request.token_endpoint_auth_method}`
      };
    }
  }
  
  // Validate scope format
  if (request.scope) {
    if (!isValidScopeString(request.scope)) {
      return {
        error: 'invalid_request',
        error_description: 'Invalid scope format'
      };
    }
  }
  
  // Validate contact emails
  if (request.contacts) {
    for (const contact of request.contacts) {
      if (!isValidEmail(contact)) {
        return {
          error: 'invalid_request',
          error_description: `Invalid contact email: ${contact}`
        };
      }
    }
  }
  
  return null;
}

/**
 * Validate redirect URI according to OAuth 2.1 security requirements
 */
function isValidRedirectUri(uri: string): boolean {
  // Reject dangerous schemes immediately
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const scheme of dangerousSchemes) {
    if (uri.toLowerCase().startsWith(scheme)) {
      return false;
    }
  }
  
  // No fragments allowed
  if (uri.includes('#')) {
    return false;
  }
  
  // Check for custom schemes first (before URL constructor which may fail)
  if (!/^https?:/.test(uri)) {
    // Custom scheme validation - must start with letter and contain valid characters
    // Must be reverse domain notation or simple app scheme (no hyphens allowed, lowercase only)
    if (!/^[a-z][a-z0-9+.]*:/.test(uri)) {
      return false;
    }
    
    // Additional validation for custom schemes
    const scheme = uri.split(':')[0]?.toLowerCase();
    if (!scheme || scheme.length < 2) {
      return false;
    }
    
    // Reject schemes that start with numbers
    if (/^[0-9]/.test(scheme)) {
      return false;
    }
    
    // Reject schemes with spaces
    if (scheme.includes(' ') || uri.includes(' ')) {
      return false;
    }
    
    // Reject schemes that start with hyphens
    if (scheme.startsWith('-')) {
      return false;
    }
    
    return true;
  }
  
  try {
    const url = new URL(uri);
    
    // Must use HTTPS in production (allow HTTP for localhost in development)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return false;
    }
    
    // For HTTP, only allow localhost
    if (url.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      return false;
    }
    
    // No fragments allowed
    if (url.hash) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate scope string format
 */
function isValidScopeString(scope: string): boolean {
  // Scope must be space-separated tokens
  const scopes = scope.split(' ');
  
  for (const s of scopes) {
    // Each scope must be a valid token (no spaces, control characters)
    if (!/^[!#-\[\]-~]+$/.test(s)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * CORS preflight handler for client registration
 */
export const registerPreflight = async (c: Context) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, X-Tenant-ID');
  return c.text('', HTTP_STATUS.NO_CONTENT);
};