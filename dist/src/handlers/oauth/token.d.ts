import { Context } from 'hono';
import type { Bindings } from '../../types/bindings';
export interface TokenRequest {
    grant_type: string;
    code?: string;
    redirect_uri?: string;
    client_id?: string;
    client_secret?: string;
    code_verifier?: string;
    refresh_token?: string;
}
export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    scope?: string;
    id_token?: string;
}
/**
 * POST /token endpoint - OAuth 2.1 token endpoint
 * Handles token exchange requests including authorization code grants and refresh tokens
 *
 * Security Enhancements:
 * - Uses D1 database for token storage (replaces in-memory)
 * - Validates PKCE challenge from stored authorization code
 * - Atomic operations prevent token reuse
 * - Refresh token rotation
 */
export declare const handleToken: (c: Context<{
    Bindings: Bindings;
}>) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>) | (Response & import("hono").TypedResponse<{
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string | undefined;
    scope?: string | undefined;
    id_token?: string | undefined;
}>)>;
