import { Context } from 'hono';
export interface AuthorizationCodeData {
    clientId: string;
    redirectUri: string;
    userId: string;
    scopes: string[];
    expiresAt: number;
    codeChallenge?: string;
    challengeMethod?: string;
}
export interface AuthorizationCodeStorage {
    storeCode(code: string, clientId: string, redirectUri: string, userId: string, scopes: string[], expiresAt: number, codeChallenge?: string, challengeMethod?: string): Promise<void>;
    retrieveAndDeleteCode(code: string): Promise<AuthorizationCodeData | null>;
}
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
export interface RefreshTokenStorage {
    storeRefreshToken(refreshToken: string, accessToken: string, clientId: string, userId: string, scopes: string[], expiresAt: number): Promise<void>;
    retrieveAndDeleteRefreshToken(refreshToken: string): Promise<RefreshTokenData | null>;
}
export interface RefreshTokenData {
    clientId: string;
    userId: string;
    scopes: string[];
    expiresAt: number;
    rotatedRefreshToken?: string;
}
/**
 * POST /token endpoint - OAuth 2.1 token endpoint
 * Handles token exchange requests including authorization code grants and refresh tokens
 */
export declare const handleToken: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
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
