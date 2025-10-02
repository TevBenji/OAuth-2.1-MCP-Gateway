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
// OAuth Client Registration (RFC 7591)
export const ClientRegistrationRequestSchema = z.object({
    redirect_uris: z.array(z.string().url()).min(1),
    client_name: z.string().optional(),
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
