/**
 * OAuth 2.1 Type Definitions
 *
 * Complete type definitions for OAuth 2.1 protocol implementation
 * including PKCE, Resource Indicators (RFC 8707), and Dynamic Client Registration.
 */

import { z } from 'zod';

// OAuth 2.1 Authorization Request (RFC 6749 + RFC 8252)
export const AuthorizeRequestSchema = z.object({
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  response_type: z.literal('code'),
  scope: z.string().optional(),
  state: z.string().min(1),
  // PKCE parameters (RFC 7636) - mandatory in OAuth 2.1
  code_challenge: z.string().min(43).max(128),
  code_challenge_method: z.literal('S256'),
  // Resource Indicators (RFC 8707)
  resource: z.string().url().optional(),
});

export type AuthorizeRequest = z.infer<typeof AuthorizeRequestSchema>;

// OAuth 2.1 Authorization Response
export interface AuthorizeResponse {
  code: string;
  state: string;
}

// OAuth 2.1 Token Request
export const TokenRequestSchema = z.object({
  grant_type: z.enum(['authorization_code', 'refresh_token']),
  // Authorization Code Grant
  code: z.string().optional(),
  redirect_uri: z.string().url().optional(),
  client_id: z.string().min(1),
  // PKCE verifier (RFC 7636)
  code_verifier: z.string().min(43).max(128).optional(),
  // Resource Indicators (RFC 8707)
  resource: z.string().url().optional(),
  // Refresh Token Grant
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

export type TokenRequest = z.infer<typeof TokenRequestSchema>;

// OAuth 2.1 Token Response
export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  // Resource Indicators (RFC 8707)
  resource?: string;
}

// JWT Token Payload
export interface TokenPayload {
  // Standard JWT claims
  iss: string; // Issuer
  sub: string; // Subject (user ID)
  aud: string | string[]; // Audience (MCP server resource) - can be array for RFC 8707
  exp: number; // Expiration time
  nbf?: number; // Not before
  iat: number; // Issued at
  jti: string; // JWT ID

  // OAuth 2.1 claims
  scope?: string;
  client_id?: string;

  // Multi-tenant claims
  tenant_id?: string;
  user_id?: string;

  // Session management
  session_id?: string;
  device_id?: string;

  // Security claims
  auth_time?: number;
  risk_score?: number;

  // MCP-specific claims (RFC 8707)
  resource_indicators?: string[];
  mcp_permissions?: string[];
}

// PKCE (Proof Key for Code Exchange) Types
export interface PKCEChallenge {
  code_verifier: string;
  code_challenge: string;
  code_challenge_method: 'S256';
}

// OAuth Client Registration (RFC 7591)
export const ClientRegistrationRequestSchema = z.object({
  redirect_uris: z.array(z.string().url()).min(1),
  // no control characters (Postgres rejects NUL; nothing legitimate needs them)
  client_name: z
    .string()
    .max(255)
    // eslint-disable-next-line no-control-regex -- intentionally matching control chars
    .regex(/^[^\u0000-\u001f\u007f]*$/, 'client_name must not contain control characters')
    .optional(),
  client_uri: z.string().url().optional(),
  logo_uri: z.string().url().optional(),
  scope: z.string().optional(),
  contacts: z.array(z.string().email()).optional(),
  tos_uri: z.string().url().optional(),
  policy_uri: z.string().url().optional(),
  token_endpoint_auth_method: z
    .enum(['none', 'client_secret_post', 'client_secret_basic'])
    .optional(),
  grant_types: z.array(z.enum(['authorization_code', 'refresh_token'])).optional(),
  response_types: z.array(z.literal('code')).optional(),
});

export type ClientRegistrationRequest = z.infer<typeof ClientRegistrationRequestSchema>;

export interface ClientRegistrationResponse {
  client_id: string;
  client_secret?: string;
  client_id_issued_at: number;
  client_secret_expires_at?: number;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  scope?: string;
  contacts?: string[];
  tos_uri?: string;
  policy_uri?: string;
  token_endpoint_auth_method: string;
}

// OAuth Error Response (RFC 6749)
export interface OAuthError {
  error:
    | 'invalid_request'
    | 'invalid_client'
    | 'invalid_grant'
    | 'unauthorized_client'
    | 'unsupported_grant_type'
    | 'invalid_scope'
    | 'invalid_target'
    | 'access_denied';
  error_description?: string;
  error_uri?: string;
  state?: string;
}

// Authorization Server Metadata (RFC 8414)
export interface AuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported: string[];
  grant_types_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  code_challenge_methods_supported: string[];
  resource_parameter_supported?: boolean;
}

// Protected Resource Metadata (RFC 9728)
export interface ProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported?: string[];
  bearer_methods_supported?: string[];
  resource_documentation?: string;
}

// OAuth Client Interface for database operations
export interface OAuthClient {
  client_id: string;
  client_secret?: string;
  tenant_id: string;
  redirect_uris: string[];
  grant_types: string[];
  response_types: string[];
  scope?: string;
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  contacts?: string[];
  tos_uri?: string;
  policy_uri?: string;
  token_endpoint_auth_method: string;
  client_id_issued_at: number;
  client_secret_expires_at?: number;
  created_at: string;
  updated_at: string;
}
