import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

// RFC 8414 Authorization Server Metadata
export interface AuthorizationServerMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  token_endpoint_auth_methods_supported?: string[];
  token_endpoint_auth_signing_alg_values_supported?: string[];
  introspection_endpoint?: string;
  introspection_endpoint_auth_methods_supported?: string[];
  introspection_endpoint_auth_signing_alg_values_supported?: string[];
  revocation_endpoint?: string;
  revocation_endpoint_auth_methods_supported?: string[];
  revocation_endpoint_auth_signing_alg_values_supported?: string[];
  userinfo_endpoint?: string;
  jwks_uri?: string;
  registration_endpoint?: string;
  scopes_supported?: string[];
  response_types_supported: string[];
  response_modes_supported?: string[];
  grant_types_supported?: string[];
  acr_values_supported?: string[];
  subject_types_supported: string[];
  id_token_signing_alg_values_supported: string[];
  id_token_encryption_alg_values_supported?: string[];
  id_token_encryption_enc_values_supported?: string[];
  userinfo_signing_alg_values_supported?: string[];
  userinfo_encryption_alg_values_supported?: string[];
  userinfo_encryption_enc_values_supported?: string[];
  req_policy_uri?: string;
  op_policy_uri?: string;
  op_tos_uri?: string;
  revocation_uri?: string;
  revocation_auth_methods_supported?: string[];
  revocation_auth_signing_alg_values_supported?: string[];
  introspection_uri?: string;
  introspection_auth_methods_supported?: string[];
  introspection_auth_signing_alg_values_supported?: string[];
  code_challenge_methods_supported?: string[];
  service_documentation?: string;
  claims_parameter_supported?: boolean;
  request_parameter_supported?: boolean;
  request_uri_parameter_supported: boolean;
  require_request_uri_registration?: boolean;
  mtls_endpoint_aliases?: Record<string, string>;
  tls_client_certificate_bound_access_tokens?: boolean;
  sbang_verification_endpoint?: string;
  sbang_verification_endpoint_auth_methods_supported?: string[];
  sbang_verification_endpoint_auth_signing_alg_values_supported?: string[];
}

// RFC 9728 Protected Resource Metadata
export interface ProtectedResourceMetadata {
  issuer: string;
  resource_indicators_supported?: boolean;
  resource_server_metadata_endpoint?: string;
  resource_server_configuration_endpoint?: string;
  resource_contexts_supported?: string[];
  scopes_supported?: string[];
  scope_to_claims_mappings_supported?: boolean;
  claims_supported?: string[];
  claim_types_supported?: string[];
  grant_types_supported?: string[];
  response_types_supported?: string[];
  response_modes_supported?: string[];
  token_endpoint: string;
  token_endpoint_auth_methods_supported?: string[];
  token_endpoint_auth_signing_alg_values_supported?: string[];
  dpop_signing_alg_values_supported?: string[];
  authorization_details_types_supported?: string[];
  authorization_details_parameter_supported?: boolean;
  authorization_data_types_supported?: string[];
  authorization_data_headers_supported?: string[];
  authorization_server_discovery_endpoint?: string;
  authorization_server_metadata_endpoint?: string;
  code_challenge_methods_supported?: string[];
  access_token_formats_supported?: string[];
  access_token_format_as_claim?: boolean;
  access_token_lifetime?: number;
  refresh_token_rotation_required?: boolean;
  par_supported?: boolean;
  par_required?: boolean;
  request_uri_parameter_supported?: boolean;
  require_pushed_authorization_requests?: boolean;
  mtls_endpoint_aliases?: Record<string, string>;
  sbang_verification_endpoint?: string;
  sbang_verification_endpoint_auth_methods_supported?: string[];
  sbang_verification_endpoint_auth_signing_alg_values_supported?: string[];
  dpop_supported?: boolean;
  resource_indicators_required?: boolean;
  authorization_code_validity_seconds?: number;
  access_token_validity_seconds?: number;
  refresh_token_validity_seconds?: number;
}

/**
 * Get the base URL for the current request
 */
function getBaseUrl(c: Context): string {
  const url = new URL(c.req.url);
  return `${url.protocol}//${url.host}`;
}

/**
 * RFC 8414 Authorization Server Metadata endpoint
 * Returns metadata about the OAuth 2.1 authorization server
 */
export const getAuthorizationServerMetadata = async (c: Context) => {
  try {
    const baseUrl = getBaseUrl(c);
    
    const metadata: AuthorizationServerMetadata = {
      issuer: baseUrl,
      authorization_endpoint: `${baseUrl}/oauth/authorize`,
      token_endpoint: `${baseUrl}/oauth/token`,
      token_endpoint_auth_methods_supported: ['none', 'client_secret_basic', 'client_secret_post'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256', 'HS256'],
      code_challenge_methods_supported: ['S256'],
      scopes_supported: ['openid', 'profile', 'email', 'mcp:read', 'mcp:write'],
      request_uri_parameter_supported: true,
      userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
      jwks_uri: `${baseUrl}/.well-known/jwks.json`,
    };

    // Set proper content-type header
    c.header('Content-Type', 'application/json; charset=utf-8');
    
    // Set CORS headers
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type');

    return c.json(metadata);
  } catch (error) {
    console.error('Error generating authorization server metadata:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
};

/**
 * RFC 9728 Protected Resource Metadata endpoint
 * Returns metadata about the protected resources
 */
export const getProtectedResourceMetadata = async (c: Context) => {
  try {
    const baseUrl = getBaseUrl(c);
    
    const metadata: ProtectedResourceMetadata = {
      issuer: baseUrl,
      resource_indicators_supported: true,
      scopes_supported: ['mcp:read', 'mcp:write', 'mcp:execute'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      response_types_supported: ['code'],
      token_endpoint: `${baseUrl}/oauth/token`,
      token_endpoint_auth_methods_supported: ['none', 'client_secret_basic', 'client_secret_post'],
      code_challenge_methods_supported: ['S256'],
      authorization_server_discovery_endpoint: `${baseUrl}/.well-known/oauth-authorization-server`,
      access_token_formats_supported: ['jwt', 'opaque'],
      access_token_format_as_claim: true,
      authorization_code_validity_seconds: 300, // 5 minutes
      access_token_validity_seconds: 3600, // 1 hour
      refresh_token_validity_seconds: 2592000, // 30 days
      dpop_supported: true,
      resource_indicators_required: false,
    };

    // Set proper content-type header
    c.header('Content-Type', 'application/json; charset=utf-8');
    
    // Set CORS headers
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type');

    return c.json(metadata);
  } catch (error) {
    console.error('Error generating protected resource metadata:', error);
    throw new HTTPException(500, { message: 'Internal server error' });
  }
};

/**
 * CORS preflight handler for discovery endpoints
 */
export const discoveryPreflight = async (c: Context) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type');
  return c.text('', 204);
};