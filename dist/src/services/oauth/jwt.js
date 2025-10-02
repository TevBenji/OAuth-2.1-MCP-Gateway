import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
/**
 * JWT Service class for creating and validating JWT tokens
 * Supports both RS256 and HS256 signing algorithms
 */
export class JWTService {
    signingKey;
    verificationKey;
    algorithm;
    issuer;
    constructor(signingKey, algorithm = 'RS256', issuer = 'oauth-mcp-gateway', verificationKey) {
        if (typeof signingKey === 'string') {
            this.signingKey = new TextEncoder().encode(signingKey);
        }
        else {
            this.signingKey = signingKey;
        }
        // If verification key is provided, use it, otherwise use signing key
        if (verificationKey) {
            if (typeof verificationKey === 'string') {
                this.verificationKey = new TextEncoder().encode(verificationKey);
            }
            else {
                this.verificationKey = verificationKey;
            }
        }
        else {
            this.verificationKey = this.signingKey;
        }
        this.algorithm = algorithm;
        this.issuer = issuer;
    }
    /**
     * Creates a JWT token with the provided claims
     * @param claims - Token claims to include in the payload
     * @returns Signed JWT token string
     */
    async createToken(claims) {
        const now = Math.floor(Date.now() / 1000);
        const jwtId = uuidv4();
        // Build the token payload
        const payload = {
            iss: this.issuer,
            sub: claims.subject,
            aud: claims.audience,
            exp: now + (claims.expiresIn || 3600), // Default to 1 hour
            nbf: claims.notBefore || now,
            iat: now,
            jti: jwtId,
            scope: claims.scopes,
            tenant_id: claims.tenantId,
            user_id: claims.userId,
            resource_indicators: claims.resourceIndicators,
            mcp_permissions: claims.mcpPermissions,
        };
        const token = await new SignJWT(payload)
            .setProtectedHeader({ alg: this.algorithm })
            .setIssuedAt()
            .setIssuer(this.issuer)
            .setJti(jwtId)
            .sign(this.signingKey);
        return token;
    }
    /**
     * Validates and verifies a JWT token
     * @param token - JWT token string to verify
     * @param expectedAudience - Optional audience to validate against
     * @returns JWT verification result with payload
     */
    async verifyToken(token, expectedAudience) {
        try {
            const result = await jwtVerify(token, this.verificationKey, {
                issuer: this.issuer,
                audience: expectedAudience,
            });
            // Additional validation for MCP-specific fields
            const payload = result.payload;
            if (!payload.jti) {
                throw new Error('Token is missing required jti claim');
            }
            // Validate audience according to RFC 8707 Resource Indicators
            if (expectedAudience && payload.aud) {
                if (typeof expectedAudience === 'string') {
                    if (typeof payload.aud === 'string') {
                        if (payload.aud !== expectedAudience) {
                            throw new Error('Token audience does not match expected audience');
                        }
                    }
                    else if (!payload.aud.includes(expectedAudience)) {
                        throw new Error('Token audience does not match expected audience');
                    }
                }
                else {
                    // Expected audience is an array
                    const expectedAudSet = new Set(expectedAudience);
                    if (typeof payload.aud === 'string') {
                        if (!expectedAudSet.has(payload.aud)) {
                            throw new Error('Token audience does not match expected audience');
                        }
                    }
                    else {
                        // Both are arrays, check for intersection
                        const payloadAudSet = new Set(payload.aud);
                        const hasCommonAudience = [...expectedAudSet].some(aud => payloadAudSet.has(aud));
                        if (!hasCommonAudience) {
                            throw new Error('Token audience does not match expected audience');
                        }
                    }
                }
            }
            return result;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`JWT verification failed: ${error.message}`);
            }
            throw new Error('JWT verification failed: Unknown error');
        }
    }
    /**
     * Extracts and validates the tenant_id from a JWT token
     * @param token - JWT token string to extract tenant_id from
     * @returns tenant_id if present and valid, null otherwise
     */
    async extractTenantId(token) {
        try {
            const result = await this.verifyToken(token);
            const payload = result.payload;
            return payload.tenant_id || null;
        }
        catch (error) {
            console.error('Error extracting tenant_id from token:', error);
            return null;
        }
    }
    /**
     * Checks if a token has expired
     * @param token - JWT token string to check
     * @returns true if token is expired, false otherwise
     */
    async isTokenExpired(token) {
        try {
            const result = await this.verifyToken(token);
            const payload = result.payload;
            const now = Math.floor(Date.now() / 1000);
            return now >= payload.exp;
        }
        catch (error) {
            // If verification fails, consider the token expired
            return true;
        }
    }
    /**
     * Gets token payload without verification (for debugging purposes only)
     * @param token - JWT token string to decode
     * @returns Decoded token payload or null if invalid
     */
    async decodeToken(token) {
        try {
            // Extract payload without verification (base64 decoding)
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }
            // Decode the payload part (second part)
            const payloadB64 = parts[1];
            if (!payloadB64) {
                throw new Error('Invalid JWT: missing payload');
            }
            // Add padding if needed
            const paddedPayloadB64 = payloadB64.padEnd(payloadB64.length + ((4 - (payloadB64.length % 4)) % 4), '=');
            const payloadJSON = atob(paddedPayloadB64);
            return JSON.parse(payloadJSON);
        }
        catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }
}
// Define different token types
export var TokenType;
(function (TokenType) {
    TokenType["ACCESS_TOKEN"] = "access_token";
    TokenType["REFRESH_TOKEN"] = "refresh_token";
    TokenType["ID_TOKEN"] = "id_token";
})(TokenType || (TokenType = {}));
// Default configuration constants
export const JWT_CONFIG = {
    ACCESS_TOKEN_LIFETIME: 3600, // 1 hour in seconds
    REFRESH_TOKEN_LIFETIME: 2592000, // 30 days in seconds
    ID_TOKEN_LIFETIME: 3600, // 1 hour in seconds
    ALGORITHM: 'RS256',
};
