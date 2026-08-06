/**
 * TypeScript SDK Types
 */

/**
 * OAuth client configuration
 */
export interface OAuthClientConfig {
  /** Gateway base URL (e.g., https://gateway.example.com) */
  gatewayUrl: string;
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret (for confidential clients) */
  clientSecret?: string;
  /** Redirect URI for authorization code flow */
  redirectUri: string;
  /** OAuth scopes to request */
  scopes?: string[];
  /** Tenant ID (for multi-tenant deployments) */
  tenantId?: string;
}

/**
 * Authorization request options
 */
export interface AuthorizeOptions {
  /** OAuth state parameter for CSRF protection */
  state?: string;
  /** Additional scopes beyond default */
  additionalScopes?: string[];
  /** Optional resource indicators (RFC 8707) */
  resource?: string;
}

/**
 * Token response
 */
export interface TokenResponse {
  /** Access token */
  access_token: string;
  /** Token type (always "Bearer") */
  token_type: string;
  /** Token expiration in seconds */
  expires_in: number;
  /** Refresh token (if available) */
  refresh_token?: string;
  /** Granted scopes */
  scope?: string;
}

/**
 * Token introspection response
 */
export interface TokenIntrospection {
  /** Whether token is active */
  active: boolean;
  /** Token scope */
  scope?: string;
  /** Client ID */
  client_id?: string;
  /** Username */
  username?: string;
  /** Token type */
  token_type?: string;
  /** Expiration timestamp */
  exp?: number;
  /** Issued at timestamp */
  iat?: number;
  /** Not before timestamp */
  nbf?: number;
  /** Subject */
  sub?: string;
  /** Audience */
  aud?: string | string[];
  /** Issuer */
  iss?: string;
  /** JWT ID */
  jti?: string;
}

/**
 * Client registration request
 */
export interface ClientRegistrationRequest {
  /** Client name */
  client_name: string;
  /** Redirect URIs */
  redirect_uris: string[];
  /** Token endpoint auth method */
  token_endpoint_auth_method?: 'client_secret_post' | 'client_secret_basic' | 'none';
  /** Grant types */
  grant_types?: string[];
  /** Response types */
  response_types?: string[];
  /** Scopes */
  scope?: string;
  /** Contacts */
  contacts?: string[];
  /** Logo URI */
  logo_uri?: string;
  /** Client URI */
  client_uri?: string;
  /** Policy URI */
  policy_uri?: string;
  /** Terms of service URI */
  tos_uri?: string;
}

/**
 * Client registration response
 */
export interface ClientRegistrationResponse {
  /** Client ID */
  client_id: string;
  /** Client secret (if applicable) */
  client_secret?: string;
  /** Client secret expires at (0 means never) */
  client_secret_expires_at?: number;
  /** Registration access token */
  registration_access_token?: string;
  /** Registration client URI */
  registration_client_uri?: string;
  /** Client ID issued at */
  client_id_issued_at?: number;
}

/**
 * MCP request options
 */
export interface MCPRequestOptions {
  /** MCP method to invoke */
  method: string;
  /** Request parameters */
  params?: Record<string, any>;
  /** Target MCP server (if using multiple) */
  server?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * MCP response
 */
export interface MCPResponse<T = any> {
  /** Response data */
  result?: T;
  /** Error information */
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * Discovery metadata
 */
export interface DiscoveryMetadata {
  /** Issuer identifier */
  issuer: string;
  /** Authorization endpoint */
  authorization_endpoint: string;
  /** Token endpoint */
  token_endpoint: string;
  /** Token introspection endpoint */
  introspection_endpoint?: string;
  /** Revocation endpoint */
  revocation_endpoint?: string;
  /** Registration endpoint */
  registration_endpoint?: string;
  /** JWKS URI */
  jwks_uri: string;
  /** Scopes supported */
  scopes_supported?: string[];
  /** Response types supported */
  response_types_supported: string[];
  /** Grant types supported */
  grant_types_supported?: string[];
  /** Token endpoint auth methods supported */
  token_endpoint_auth_methods_supported?: string[];
  /** Code challenge methods supported */
  code_challenge_methods_supported?: string[];
}
