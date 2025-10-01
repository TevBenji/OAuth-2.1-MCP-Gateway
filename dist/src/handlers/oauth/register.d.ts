/**
 * OAuth 2.1 Dynamic Client Registration Handler (RFC 7591)
 *
 * Implements the POST /register endpoint for automatic client onboarding
 * with secure client_id generation and optional client_secret.
 */
import { Context } from 'hono';
/**
 * POST /register endpoint for Dynamic Client Registration
 * Implements RFC 7591 with security validations
 */
export declare const registerClient: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: "invalid_request" | "invalid_client" | "invalid_grant" | "unauthorized_client" | "unsupported_grant_type" | "invalid_scope" | "invalid_target" | "access_denied";
    error_description?: string | undefined;
    error_uri?: string | undefined;
    state?: string | undefined;
}>) | (Response & import("hono").TypedResponse<{
    client_id: string;
    client_secret?: string | undefined;
    client_id_issued_at: number;
    client_secret_expires_at?: number | undefined;
    redirect_uris: string[];
    grant_types: string[];
    response_types: string[];
    client_name?: string | undefined;
    client_uri?: string | undefined;
    logo_uri?: string | undefined;
    scope?: string | undefined;
    contacts?: string[] | undefined;
    tos_uri?: string | undefined;
    policy_uri?: string | undefined;
    token_endpoint_auth_method: string;
}>)>;
/**
 * CORS preflight handler for client registration
 */
export declare const registerPreflight: (c: Context) => Promise<Response>;
