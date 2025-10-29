/**
 * Session Management Handlers
 *
 * HTTP handlers for session operations: create, validate, revoke, list.
 */
import { Context } from 'hono';
/**
 * Create a new session
 * POST /sessions
 */
export declare function createSessionHandler(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
}>) | (Response & import("hono").TypedResponse<{
    session_id: string;
    created_at: string;
    expires_at: string;
    idle_timeout_at: string;
    risk_level: import("../../types/session").RiskLevel;
}>)>;
/**
 * Get current session information
 * GET /sessions/current
 */
export declare function getCurrentSessionHandler(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>) | (Response & import("hono").TypedResponse<{
    session_id: string;
    tenant_id: string;
    user_id: string;
    client_id: string;
    status: import("../../types/session").SessionStatus;
    risk_level: import("../../types/session").RiskLevel;
    created_at: string;
    last_accessed_at: string;
    expires_at: string;
    idle_timeout_at: string;
    device_info: {
        device_type: "desktop" | "mobile" | "tablet" | "unknown" | undefined;
        os: string | undefined;
        browser: string | undefined;
    };
}>)>;
/**
 * Revoke current session
 * DELETE /sessions/current
 */
export declare function revokeCurrentSessionHandler(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>) | (Response & import("hono").TypedResponse<{
    message: string;
    session_id: string;
}>)>;
/**
 * List all active sessions for current user
 * GET /sessions
 */
export declare function listUserSessionsHandler(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>) | (Response & import("hono").TypedResponse<{
    sessions: {
        session_id: string;
        status: import("../../types/session").SessionStatus;
        risk_level: import("../../types/session").RiskLevel;
        created_at: string;
        last_accessed_at: string;
        expires_at: string;
        device_info: {
            device_type: "desktop" | "mobile" | "tablet" | "unknown" | undefined;
            os: string | undefined;
            browser: string | undefined;
            ip_address: string;
        };
        is_current: boolean;
    }[];
    total: number;
}>)>;
/**
 * Revoke a specific session
 * DELETE /sessions/:sessionId
 */
export declare function revokeSessionHandler(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>) | (Response & import("hono").TypedResponse<{
    message: string;
    session_id: string;
}>)>;
/**
 * Revoke all user sessions (except current)
 * POST /sessions/revoke-all
 */
export declare function revokeAllSessionsHandler(c: Context): Promise<(Response & import("hono").TypedResponse<{
    error: string;
    error_description: string;
}>) | (Response & import("hono").TypedResponse<{
    message: string;
    revoked_count: number;
}>)>;
