/**
 * Session Middleware
 *
 * Middleware for session validation, device fingerprinting, and risk assessment.
 */
import { Context, Next } from 'hono';
import { SessionManager } from '../services/security/session';
/**
 * Session middleware that validates session and attaches it to context
 */
export declare function sessionMiddleware(sessionManager: SessionManager): (c: Context, next: Next) => Promise<void | (Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>)>;
/**
 * Optional session middleware that doesn't require a session
 */
export declare function optionalSessionMiddleware(sessionManager: SessionManager): (c: Context, next: Next) => Promise<void>;
/**
 * Set session cookie in response
 */
export declare function setSessionCookie(c: Context, sessionId: string, maxAge: number, options?: {
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
    domain?: string;
    path?: string;
}): void;
/**
 * Clear session cookie
 */
export declare function clearSessionCookie(c: Context, options?: {
    domain?: string;
    path?: string;
}): void;
