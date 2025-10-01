/**
 * IdP Callback Handlers
 *
 * HTTP handlers for IdP authentication callbacks.
 */
import { Context } from 'hono';
/**
 * Handle OIDC callback
 */
export declare function handleOIDCCallback(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>) | (Response & import("hono").TypedResponse<{
    success: boolean;
    user_id: string;
    email: string;
    is_new_user: boolean;
    roles: string[];
}>)>;
/**
 * Handle SAML callback (POST)
 */
export declare function handleSAMLCallback(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>) | (Response & import("hono").TypedResponse<{
    success: boolean;
    user_id: string;
    email: string;
    is_new_user: boolean;
    roles: string[];
}>)>;
/**
 * Initiate IdP authentication
 */
export declare function handleInitiateAuth(c: Context): Promise<Response>;
