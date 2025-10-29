import { HTTPException } from 'hono/http-exception';
/**
 * Get the base URL for the current request
 */
function getBaseUrl(c) {
    const url = new URL(c.req.url);
    return `${url.protocol}//${url.host}`;
}
/**
 * RFC 8414 Authorization Server Metadata endpoint
 * Returns metadata about the OAuth 2.1 authorization server
 */
export const getAuthorizationServerMetadata = async (c) => {
    try {
        const baseUrl = getBaseUrl(c);
        const metadata = {
            issuer: baseUrl,
            authorization_endpoint: `${baseUrl}/oauth/authorize`,
            token_endpoint: `${baseUrl}/oauth/token`,
            token_endpoint_auth_methods_supported: ['none', 'client_secret_basic', 'client_secret_post'],
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code', 'refresh_token'],
            subject_types_supported: ['public'],
            id_token_signing_alg_values_supported: ['RS256', 'HS256'],
            code_challenge_methods_supported: ['S256'],
            scopes_supported: ['openid', 'profile', 'email', 'mcp:read', 'mcp:write'],
            request_uri_parameter_supported: true,
            userinfo_endpoint: `${baseUrl}/oauth/userinfo`,
            jwks_uri: `${baseUrl}/.well-known/jwks.json`,
        };
        // Set proper content-type header
        c.header('Content-Type', 'application/json; charset=utf-8');
        // Set proper CORS headers (avoid wildcards for security-sensitive endpoints)
        const origin = c.req.header('Origin');
        if (origin) {
            const allowedOrigins = process.env.CORS_ORIGINS
                ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
                : ['http://localhost:3000', 'https://localhost:3000'];
            if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
                c.header('Access-Control-Allow-Origin', origin);
            }
        }
        else {
            // If no Origin header, don't set Access-Control-Allow-Origin to avoid wildcard
            c.header('Access-Control-Allow-Origin', 'null');
        }
        c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type');
        c.header('Vary', 'Origin'); // Important for caching when using origin-based CORS
        return c.json(metadata);
    }
    catch (error) {
        console.error('Error generating authorization server metadata:', error);
        throw new HTTPException(500, { message: 'Internal server error' });
    }
};
/**
 * RFC 9728 Protected Resource Metadata endpoint
 * Returns metadata about the protected resources
 */
export const getProtectedResourceMetadata = async (c) => {
    try {
        const baseUrl = getBaseUrl(c);
        const metadata = {
            issuer: baseUrl,
            resource_indicators_supported: true,
            scopes_supported: ['mcp:read', 'mcp:write', 'mcp:execute'],
            grant_types_supported: ['authorization_code', 'refresh_token'],
            response_types_supported: ['code'],
            token_endpoint: `${baseUrl}/oauth/token`,
            token_endpoint_auth_methods_supported: ['none', 'client_secret_basic', 'client_secret_post'],
            code_challenge_methods_supported: ['S256'],
            authorization_server_discovery_endpoint: `${baseUrl}/.well-known/oauth-authorization-server`,
            access_token_formats_supported: ['jwt', 'opaque'],
            access_token_format_as_claim: true,
            authorization_code_validity_seconds: 300, // 5 minutes
            access_token_validity_seconds: 3600, // 1 hour
            refresh_token_validity_seconds: 2592000, // 30 days
            dpop_supported: true,
            resource_indicators_required: false,
        };
        // Set proper content-type header
        c.header('Content-Type', 'application/json; charset=utf-8');
        // Set proper CORS headers (avoid wildcards for security-sensitive endpoints)
        const origin = c.req.header('Origin');
        if (origin) {
            const allowedOrigins = process.env.CORS_ORIGINS
                ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
                : ['http://localhost:3000', 'https://localhost:3000'];
            if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
                c.header('Access-Control-Allow-Origin', origin);
            }
        }
        else {
            // If no Origin header, don't set Access-Control-Allow-Origin to avoid wildcard
            c.header('Access-Control-Allow-Origin', 'null');
        }
        c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type');
        c.header('Vary', 'Origin'); // Important for caching when using origin-based CORS
        return c.json(metadata);
    }
    catch (error) {
        console.error('Error generating protected resource metadata:', error);
        throw new HTTPException(500, { message: 'Internal server error' });
    }
};
/**
 * CORS preflight handler for discovery endpoints
 */
export const discoveryPreflight = async (c) => {
    const origin = c.req.header('Origin');
    if (origin) {
        const allowedOrigins = process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
            : ['http://localhost:3000', 'https://localhost:3000'];
        if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            c.header('Access-Control-Allow-Origin', origin);
        }
    }
    else {
        // If no Origin header, don't set Access-Control-Allow-Origin to avoid wildcard
        c.header('Access-Control-Allow-Origin', 'null');
    }
    c.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type');
    c.header('Vary', 'Origin'); // Important for caching when using origin-based CORS
    return c.text('', 204);
};
