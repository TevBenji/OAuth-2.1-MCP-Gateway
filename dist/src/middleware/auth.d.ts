/**
 * Authentication Middleware
 *
 * Bearer token extraction and validation middleware for MCP requests.
 * Validates JWT tokens, extracts claims, and attaches context to requests.
 */
import type { Context, Next } from 'hono';
/**
 * Extract Bearer token from Authorization header
 */
export declare function extractBearerToken(authHeader: string | undefined): string | null;
/**
 * Authentication middleware that validates Bearer tokens
 * and attaches MCP request context to the request
 */
export declare function authMiddleware(): (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>)>;
/**
 * Optional authentication middleware that allows requests without tokens
 * but validates tokens if present
 */
export declare function optionalAuthMiddleware(): (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>)>;
/**
 * Scope validation middleware
 * Checks if the token has the required scopes
 */
export declare function requireScopes(...requiredScopes: string[]): (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>)>;
