/**
 * Session Management Service
 *
 * Handles session lifecycle, validation, concurrent limits, idle timeouts,
 * device fingerprinting, and risk-based authentication.
 */
import { Session, CreateSessionOptions, SessionValidationResult, SessionLimits, SessionStorage, DeviceInfo } from '../../types/session';
/**
 * Session Manager Service
 */
export declare class SessionManager {
    private storage;
    private limits;
    constructor(storage: SessionStorage, limits?: Partial<SessionLimits>);
    /**
     * Create a new session
     */
    createSession(options: CreateSessionOptions): Promise<Session>;
    /**
     * Validate a session
     */
    validateSession(sessionId: string, deviceInfo?: DeviceInfo): Promise<SessionValidationResult>;
    /**
     * Revoke a session
     */
    revokeSession(sessionId: string, reason?: string): Promise<void>;
    /**
     * Revoke all user sessions
     */
    revokeUserSessions(tenantId: string, userId: string, reason?: string): Promise<number>;
    /**
     * Expire a session
     */
    private expireSession;
    /**
     * Suspend a session
     */
    suspendSession(sessionId: string, reason?: string): Promise<void>;
    /**
     * Assess session risk
     */
    private assessRisk;
    /**
     * Check if device matches
     */
    private isDeviceMatch;
    /**
     * Generate device fingerprint
     */
    static generateDeviceFingerprint(deviceInfo: DeviceInfo): string;
    /**
     * Parse device info from request headers
     */
    static parseDeviceInfo(headers: Record<string, string>): DeviceInfo;
    /**
     * Log session activity (can be extended to use audit logging service)
     */
    private logActivity;
    /**
     * Cleanup expired sessions
     */
    cleanupExpiredSessions(): Promise<number>;
    /**
     * Get user sessions
     */
    getUserSessions(tenantId: string, userId: string): Promise<Session[]>;
    /**
     * Get active session count for user
     */
    getActiveSessionCount(tenantId: string, userId: string): Promise<number>;
}
