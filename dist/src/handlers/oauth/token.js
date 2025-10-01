import { HTTPException } from 'hono/http-exception';
import { v4 as uuidv4 } from 'uuid';
import { validateCodeVerifier } from '../../services/oauth/pkce';
import { InMemoryPKCEStorage } from '../../services/oauth/pkce';
import { JWTService, JWT_CONFIG } from '../../services/oauth/jwt';
// In-memory implementation for development/testing
class InMemoryAuthorizationCodeStorage {
    codes = new Map();
    async storeCode(code, clientId, redirectUri, userId, scopes, expiresAt, codeChallenge, challengeMethod) {
        this.codes.set(code, { clientId, redirectUri, userId, scopes, expiresAt, codeChallenge, challengeMethod });
    }
    async retrieveAndDeleteCode(code) {
        const data = this.codes.get(code);
        if (!data) {
            return null;
        }
        // Check if code is expired
        if (data.expiresAt < Date.now()) {
            this.codes.delete(code);
            return null;
        }
        // Remove and return the code data
        this.codes.delete(code);
        return data;
    }
}
class InMemoryRefreshTokenStorage {
    refreshTokens = new Map();
    async storeRefreshToken(refreshToken, accessToken, // Not stored but could be useful for tracking
    clientId, userId, scopes, expiresAt) {
        this.refreshTokens.set(refreshToken, { clientId, userId, scopes, expiresAt });
    }
    async retrieveAndDeleteRefreshToken(refreshToken) {
        const data = this.refreshTokens.get(refreshToken);
        if (!data) {
            return null;
        }
        // Check if refresh token is expired
        if (data.expiresAt < Date.now()) {
            this.refreshTokens.delete(refreshToken);
            return null;
        }
        // Remove and return the refresh token data
        // In a real implementation with rotation, we'd generate a new refresh token here
        this.refreshTokens.delete(refreshToken);
        return data;
    }
}
// Storage instances
const pkceStorage = new InMemoryPKCEStorage();
const codeStorage = new InMemoryAuthorizationCodeStorage();
const refreshTokenStorage = new InMemoryRefreshTokenStorage();
// JWT Service instance (in real implementation, would be configured properly)
const jwtService = new JWTService(process.env.JWT_SECRET || 'default_secret_key_for_development', 'HS256', 'oauth-mcp-gateway');
/**
 * POST /token endpoint - OAuth 2.1 token endpoint
 * Handles token exchange requests including authorization code grants and refresh tokens
 */
export const handleToken = async (c) => {
    try {
        // Check content type
        const contentType = c.req.header('Content-Type');
        if (!contentType || !contentType.includes('application/x-www-form-urlencoded')) {
            return c.json({ error: 'invalid_request', error_description: 'Content-Type must be application/x-www-form-urlencoded' }, 400);
        }
        // Parse form data
        const formData = await c.req.parseBody();
        const request = {
            grant_type: formData.grant_type || '',
            code: formData.code || undefined,
            redirect_uri: formData.redirect_uri || undefined,
            client_id: formData.client_id || undefined,
            client_secret: formData.client_secret || undefined,
            code_verifier: formData.code_verifier || undefined,
            refresh_token: formData.refresh_token || undefined,
        };
        // Validate grant_type
        if (!request.grant_type) {
            return c.json({ error: 'invalid_request', error_description: 'Missing grant_type parameter' }, 400);
        }
        if (request.grant_type === 'authorization_code') {
            // Handle authorization code grant
            return await handleAuthorizationCodeGrant(c, request);
        }
        else if (request.grant_type === 'refresh_token') {
            // Handle refresh token grant
            return await handleRefreshTokenGrant(c, request);
        }
        else {
            return c.json({ error: 'unsupported_grant_type', error_description: `Grant type '${request.grant_type}' is not supported` }, 400);
        }
    }
    catch (error) {
        console.error('Error in token endpoint:', error);
        throw new HTTPException(500, { message: 'Internal server error' });
    }
};
/**
 * Handle authorization code grant
 */
async function handleAuthorizationCodeGrant(c, request) {
    // Validate required parameters
    if (!request.code || !request.redirect_uri || !request.client_id) {
        return c.json({ error: 'invalid_request', error_description: 'Missing required parameters for authorization code grant' }, 400);
    }
    // Validate code_verifier for PKCE
    if (!request.code_verifier) {
        return c.json({ error: 'invalid_request', error_description: 'code_verifier is required for PKCE' }, 400);
    }
    // Retrieve and validate the authorization code
    const codeData = await codeStorage.retrieveAndDeleteCode(request.code);
    if (!codeData) {
        return c.json({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code' }, 400);
    }
    // Validate client_id matches the one used in authorization
    if (codeData.clientId !== request.client_id) {
        return c.json({ error: 'invalid_grant', error_description: 'Client ID does not match the one used in authorization' }, 400);
    }
    // Validate redirect_uri matches the one used in authorization
    if (codeData.redirectUri !== request.redirect_uri) {
        return c.json({ error: 'invalid_grant', error_description: 'Redirect URI does not match the one used in authorization' }, 400);
    }
    // Validate PKCE: when the authorization code was created, the code challenge should have been stored
    // Now we need to validate the provided code_verifier against that original challenge
    if (!codeData.codeChallenge || !codeData.challengeMethod) {
        return c.json({ error: 'invalid_grant', error_description: 'Missing PKCE challenge data' }, 400);
    }
    const isValid = await validateCodeVerifier(request.code_verifier, codeData.codeChallenge, codeData.challengeMethod);
    if (!isValid) {
        return c.json({ error: 'invalid_grant', error_description: 'Invalid PKCE verification' }, 400);
    }
    // Generate access token
    const accessToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: codeData.userId,
        audience: codeData.clientId, // Or resource server identifier for RFC 8707
        scopes: codeData.scopes.join(' '),
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_LIFETIME,
        tenantId: 'default-tenant', // In real implementation, resolve from context
        userId: codeData.userId,
        // Add resource indicators if needed per RFC 8707
        resourceIndicators: ['default-resource'],
        mcpPermissions: codeData.scopes // Map scopes to MCP permissions
    });
    // Generate refresh token
    const refreshToken = `refresh_${uuidv4().replace(/-/g, '')}`;
    const refreshTokenExpiry = Date.now() + (JWT_CONFIG.REFRESH_TOKEN_LIFETIME * 1000); // 30 days
    await refreshTokenStorage.storeRefreshToken(refreshToken, accessToken, codeData.clientId, codeData.userId, codeData.scopes, refreshTokenExpiry);
    // Create response
    const response = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: JWT_CONFIG.ACCESS_TOKEN_LIFETIME,
        refresh_token: refreshToken,
        scope: codeData.scopes.join(' ')
    };
    // Set proper headers
    c.header('Cache-Control', 'no-store');
    c.header('Pragma', 'no-cache');
    return c.json(response);
}
/**
 * Handle refresh token grant
 */
async function handleRefreshTokenGrant(c, request) {
    // Validate required parameters
    if (!request.refresh_token) {
        return c.json({ error: 'invalid_request', error_description: 'Missing refresh_token parameter' }, 400);
    }
    // Retrieve and validate the refresh token
    const refreshTokenData = await refreshTokenStorage.retrieveAndDeleteRefreshToken(request.refresh_token);
    if (!refreshTokenData) {
        return c.json({ error: 'invalid_grant', error_description: 'Invalid or expired refresh token' }, 400);
    }
    // Optionally validate client_id for confidential clients
    if (request.client_id && refreshTokenData.clientId !== request.client_id) {
        return c.json({ error: 'invalid_grant', error_description: 'Client ID does not match the one associated with the refresh token' }, 400);
    }
    // Generate new access token based on original refresh token data
    const newAccessToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: refreshTokenData.userId,
        audience: refreshTokenData.clientId, // Or resource server identifier for RFC 8707
        scopes: refreshTokenData.scopes.join(' '),
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_LIFETIME,
        tenantId: 'default-tenant', // In real implementation, resolve from context
        userId: refreshTokenData.userId,
        // Add resource indicators if needed per RFC 8707
        resourceIndicators: ['default-resource'],
        mcpPermissions: refreshTokenData.scopes // Map scopes to MCP permissions
    });
    // Generate new refresh token for rotation
    const newRefreshToken = `refresh_${uuidv4().replace(/-/g, '')}`;
    const newRefreshTokenExpiry = Date.now() + (JWT_CONFIG.REFRESH_TOKEN_LIFETIME * 1000); // 30 days
    await refreshTokenStorage.storeRefreshToken(newRefreshToken, newAccessToken, refreshTokenData.clientId, refreshTokenData.userId, refreshTokenData.scopes, newRefreshTokenExpiry);
    // Create response with new tokens
    const response = {
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: JWT_CONFIG.ACCESS_TOKEN_LIFETIME,
        refresh_token: newRefreshToken,
        scope: refreshTokenData.scopes.join(' ')
    };
    // Set proper headers
    c.header('Cache-Control', 'no-store');
    c.header('Pragma', 'no-cache');
    return c.json(response);
}
