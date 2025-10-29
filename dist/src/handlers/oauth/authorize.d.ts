import { Context } from 'hono';
import type { Bindings } from '../../types/bindings';
export interface AuthorizationRequest {
    response_type: string;
    client_id: string;
    redirect_uri: string;
    scope?: string;
    state?: string;
    code_challenge?: string;
    code_challenge_method?: string;
}
/**
 * GET /authorize endpoint - OAuth 2.1 authorization endpoint
 * Handles authorization requests and enforces PKCE
 *
 * Security Enhancements:
 * - Uses D1 database for authorization code storage
 * - Persists PKCE challenge for validation during token exchange
 * - Atomic operations prevent race conditions
 */
export declare const handleAuthorization: (c: Context<{
    Bindings: Bindings;
}>) => Promise<Response>;
/**
 * Function to validate state parameter for CSRF protection
 * @param providedState - State parameter provided in the request
 * @param expectedState - Expected state value
 * @returns True if state matches, false otherwise
 */
export declare function validateState(providedState: string | undefined, expectedState: string | undefined): boolean;
