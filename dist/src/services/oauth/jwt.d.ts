import { type JWTVerifyResult } from 'jose';
import type { TokenPayload as OAuthTokenPayload } from '../../types/oauth';
export interface TokenPayload extends OAuthTokenPayload, Record<string, unknown> {
}
export interface TokenClaims {
    issuer: string;
    subject: string;
    audience: string | string[];
    scopes?: string;
    tenantId?: string;
    userId?: string;
    resourceIndicators?: string[];
    mcpPermissions?: string[];
    expiresIn?: number;
    notBefore?: number;
}
/**
 * JWT Service class for creating and validating JWT tokens
 * Supports both RS256 and HS256 signing algorithms
 */
export declare class JWTService {
    private signingKey;
    private verificationKey;
    private algorithm;
    private issuer;
    constructor(signingKey: string | Uint8Array | CryptoKey, algorithm?: 'RS256' | 'HS256', issuer?: string, verificationKey?: string | Uint8Array | CryptoKey);
    /**
     * Creates a JWT token with the provided claims
     * @param claims - Token claims to include in the payload
     * @returns Signed JWT token string
     */
    createToken(claims: TokenClaims): Promise<string>;
    /**
     * Validates and verifies a JWT token
     * @param token - JWT token string to verify
     * @param expectedAudience - Optional audience to validate against
     * @returns JWT verification result with payload
     */
    verifyToken(token: string, expectedAudience?: string | string[]): Promise<JWTVerifyResult>;
    /**
     * Extracts and validates the tenant_id from a JWT token
     * @param token - JWT token string to extract tenant_id from
     * @returns tenant_id if present and valid, null otherwise
     */
    extractTenantId(token: string): Promise<string | null>;
    /**
     * Checks if a token has expired
     * @param token - JWT token string to check
     * @returns true if token is expired, false otherwise
     */
    isTokenExpired(token: string): Promise<boolean>;
    /**
     * Gets token payload without verification (for debugging purposes only)
     * @param token - JWT token string to decode
     * @returns Decoded token payload or null if invalid
     */
    decodeToken(token: string): Promise<TokenPayload | null>;
}
export declare enum TokenType {
    ACCESS_TOKEN = "access_token",
    REFRESH_TOKEN = "refresh_token",
    ID_TOKEN = "id_token"
}
export declare const JWT_CONFIG: {
    ACCESS_TOKEN_LIFETIME: number;
    REFRESH_TOKEN_LIFETIME: number;
    ID_TOKEN_LIFETIME: number;
    ALGORITHM: "RS256";
};
