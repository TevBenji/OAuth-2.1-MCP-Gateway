import { Context } from 'hono';
export interface AuthorizationRequest {
    response_type: string;
    client_id: string;
    redirect_uri: string;
    scope?: string;
    state?: string;
    code_challenge?: string;
    code_challenge_method?: string;
}
export interface AuthorizationCodeStorage {
    storeCode(code: string, clientId: string, redirectUri: string, userId: string, scopes: string[], expiresAt: number): Promise<void>;
    retrieveAndDeleteCode(code: string): Promise<AuthorizationCodeData | null>;
}
export interface AuthorizationCodeData {
    clientId: string;
    redirectUri: string;
    userId: string;
    scopes: string[];
    expiresAt: number;
}
/**
 * GET /authorize endpoint - OAuth 2.1 authorization endpoint
 * Handles authorization requests and enforces PKCE
 */
export declare const handleAuthorization: (c: Context) => Promise<Response>;
/**
 * Function to validate state parameter for CSRF protection
 * @param providedState - State parameter provided in the request
 * @param expectedState - Expected state value
 * @returns True if state matches, false otherwise
 */
export declare function validateState(providedState: string | undefined, expectedState: string | undefined): boolean;
