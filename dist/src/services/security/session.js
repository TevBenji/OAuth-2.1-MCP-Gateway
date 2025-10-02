/**
 * Session Management Service
 *
 * Handles session lifecycle, validation, concurrent limits, idle timeouts,
 * device fingerprinting, and risk-based authentication.
 */
import { v4 as uuidv4 } from 'uuid';
import { SessionStatus, RiskLevel, SessionErrorCode, DEFAULT_SESSION_CONFIG, } from '../../types/session';
/**
 * Session Manager Service
 */
export class SessionManager {
    storage;
    limits;
    constructor(storage, limits) {
        this.storage = storage;
        this.limits = { ...DEFAULT_SESSION_CONFIG, ...limits };
    }
    /**
     * Create a new session
     */
    async createSession(options) {
        const { tenant_id, user_id, client_id, device_info, max_idle_time, max_session_time, metadata, } = options;
        // Check concurrent session limit
        const userSessions = await this.storage.getUserSessions(tenant_id, user_id);
        const activeSessions = userSessions.filter(s => s.status === SessionStatus.ACTIVE);
        if (activeSessions.length >= this.limits.max_concurrent_sessions) {
            // Revoke oldest session to make room
            const oldestSession = activeSessions.sort((a, b) => a.created_at.getTime() - b.created_at.getTime())[0];
            if (oldestSession) {
                await this.revokeSession(oldestSession.session_id, 'concurrent_limit_exceeded');
            }
        }
        const now = new Date();
        const idleTimeout = max_idle_time || this.limits.max_idle_time_seconds;
        const sessionTimeout = max_session_time || this.limits.max_session_time_seconds;
        // Perform initial risk assessment
        const riskAssessment = await this.assessRisk({ tenant_id, user_id, device_info }, null // No previous session for new session
        );
        const session = {
            session_id: uuidv4(),
            tenant_id,
            user_id,
            client_id,
            device_info,
            status: SessionStatus.ACTIVE,
            risk_level: riskAssessment.risk_level,
            created_at: now,
            last_accessed_at: now,
            expires_at: new Date(now.getTime() + sessionTimeout * 1000),
            idle_timeout_at: new Date(now.getTime() + idleTimeout * 1000),
            metadata,
        };
        await this.storage.create(session);
        // Log session creation activity
        await this.logActivity({
            session_id: session.session_id,
            activity_type: 'created',
            timestamp: now,
            device_info,
            risk_level: session.risk_level,
        });
        return session;
    }
    /**
     * Validate a session
     */
    async validateSession(sessionId, deviceInfo) {
        const session = await this.storage.get(sessionId);
        if (!session) {
            return {
                valid: false,
                error: {
                    code: SessionErrorCode.SESSION_NOT_FOUND,
                    message: 'Session not found',
                },
            };
        }
        const now = new Date();
        // Check if session is revoked
        if (session.status === SessionStatus.REVOKED) {
            return {
                valid: false,
                session,
                error: {
                    code: SessionErrorCode.SESSION_REVOKED,
                    message: 'Session has been revoked',
                    details: { reason: session.revocation_reason },
                },
            };
        }
        // Check if session is suspended
        if (session.status === SessionStatus.SUSPENDED) {
            return {
                valid: false,
                session,
                error: {
                    code: SessionErrorCode.SESSION_SUSPENDED,
                    message: 'Session is suspended',
                },
            };
        }
        // Check if session has expired
        if (now > session.expires_at) {
            await this.expireSession(sessionId);
            return {
                valid: false,
                session,
                error: {
                    code: SessionErrorCode.SESSION_EXPIRED,
                    message: 'Session has expired',
                },
            };
        }
        // Check idle timeout
        if (now > session.idle_timeout_at) {
            await this.expireSession(sessionId);
            return {
                valid: false,
                session,
                error: {
                    code: SessionErrorCode.IDLE_TIMEOUT,
                    message: 'Session idle timeout exceeded',
                },
            };
        }
        // Validate device binding if enforced
        if (this.limits.enforce_device_binding && deviceInfo) {
            if (!this.isDeviceMatch(session.device_info, deviceInfo)) {
                // Perform risk assessment for device change
                const riskAssessment = await this.assessRisk({
                    tenant_id: session.tenant_id,
                    user_id: session.user_id,
                    device_info: deviceInfo,
                }, session);
                if (riskAssessment.recommended_action === 'deny') {
                    return {
                        valid: false,
                        session,
                        error: {
                            code: SessionErrorCode.DEVICE_MISMATCH,
                            message: 'Device mismatch detected',
                            details: { requires_reauth: true },
                        },
                    };
                }
                if (riskAssessment.requires_mfa) {
                    return {
                        valid: false,
                        session,
                        error: {
                            code: SessionErrorCode.RISK_TOO_HIGH,
                            message: 'Risk level elevated, MFA required',
                            details: { requires_mfa: true, risk_level: riskAssessment.risk_level },
                        },
                    };
                }
            }
        }
        // Update last accessed time and idle timeout
        const updatedIdleTimeout = new Date(now.getTime() + this.limits.max_idle_time_seconds * 1000);
        await this.storage.update(sessionId, {
            last_accessed_at: now,
            idle_timeout_at: updatedIdleTimeout,
        });
        // Update session object
        session.last_accessed_at = now;
        session.idle_timeout_at = updatedIdleTimeout;
        // Log access activity
        await this.logActivity({
            session_id: sessionId,
            activity_type: 'accessed',
            timestamp: now,
            device_info: deviceInfo,
        });
        return {
            valid: true,
            session,
        };
    }
    /**
     * Revoke a session
     */
    async revokeSession(sessionId, reason) {
        const session = await this.storage.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        const now = new Date();
        await this.storage.update(sessionId, {
            status: SessionStatus.REVOKED,
            revoked_at: now,
            revocation_reason: reason,
        });
        await this.logActivity({
            session_id: sessionId,
            activity_type: 'revoked',
            timestamp: now,
            metadata: { reason },
        });
    }
    /**
     * Revoke all user sessions
     */
    async revokeUserSessions(tenantId, userId, reason) {
        const sessions = await this.storage.getUserSessions(tenantId, userId);
        const activeSessions = sessions.filter(s => s.status === SessionStatus.ACTIVE || s.status === SessionStatus.SUSPENDED);
        for (const session of activeSessions) {
            await this.revokeSession(session.session_id, reason);
        }
        return activeSessions.length;
    }
    /**
     * Expire a session
     */
    async expireSession(sessionId) {
        const now = new Date();
        await this.storage.update(sessionId, {
            status: SessionStatus.EXPIRED,
        });
        await this.logActivity({
            session_id: sessionId,
            activity_type: 'expired',
            timestamp: now,
        });
    }
    /**
     * Suspend a session
     */
    async suspendSession(sessionId, reason) {
        const session = await this.storage.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        await this.storage.update(sessionId, {
            status: SessionStatus.SUSPENDED,
            metadata: { ...session.metadata, suspension_reason: reason },
        });
        await this.logActivity({
            session_id: sessionId,
            activity_type: 'suspended',
            timestamp: new Date(),
            metadata: { reason },
        });
    }
    /**
     * Assess session risk
     */
    async assessRisk(context, previousSession) {
        const factors = {
            device_changed: false,
            ip_changed: false,
            location_changed: false,
            unusual_activity: false,
            failed_auth_attempts: 0,
            velocity_check_failed: false,
        };
        let riskScore = 0;
        // Check device change
        if (previousSession && !this.isDeviceMatch(previousSession.device_info, context.device_info)) {
            factors.device_changed = true;
            riskScore += 30;
        }
        // Check IP change
        if (previousSession &&
            previousSession.device_info.ip_address !== context.device_info.ip_address) {
            factors.ip_changed = true;
            riskScore += 20;
        }
        // Check for suspicious user agent
        const userAgent = context.device_info.user_agent.toLowerCase();
        if (userAgent.includes('bot') ||
            userAgent.includes('crawler') ||
            userAgent.includes('spider')) {
            factors.unusual_activity = true;
            riskScore += 40;
        }
        // Determine risk level
        let riskLevel;
        if (riskScore >= 70) {
            riskLevel = RiskLevel.CRITICAL;
        }
        else if (riskScore >= 50) {
            riskLevel = RiskLevel.HIGH;
        }
        else if (riskScore >= 30) {
            riskLevel = RiskLevel.MEDIUM;
        }
        else {
            riskLevel = RiskLevel.LOW;
        }
        // Determine recommended action
        let recommendedAction;
        if (riskScore >= 70) {
            recommendedAction = 'deny';
        }
        else if (riskScore >= 40) {
            recommendedAction = 'challenge';
        }
        else {
            recommendedAction = 'allow';
        }
        // Determine if MFA is required
        const requiresMfa = this.limits.require_mfa_on_risk_elevation &&
            (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL);
        return {
            risk_level: riskLevel,
            risk_score: riskScore,
            factors,
            recommended_action: recommendedAction,
            requires_mfa: requiresMfa,
        };
    }
    /**
     * Check if device matches
     */
    isDeviceMatch(device1, device2) {
        // Compare device fingerprints if available
        if (device1.device_fingerprint && device2.device_fingerprint) {
            return device1.device_fingerprint === device2.device_fingerprint;
        }
        // Fallback to user agent and IP comparison
        return device1.user_agent === device2.user_agent && device1.ip_address === device2.ip_address;
    }
    /**
     * Generate device fingerprint
     */
    static generateDeviceFingerprint(deviceInfo) {
        const components = [
            deviceInfo.user_agent,
            deviceInfo.ip_address,
            deviceInfo.device_type || 'unknown',
            deviceInfo.os || 'unknown',
            deviceInfo.browser || 'unknown',
        ];
        // Simple hash function (in production, use a proper hashing library)
        const fingerprint = components.join('|');
        return btoa(fingerprint);
    }
    /**
     * Parse device info from request headers
     */
    static parseDeviceInfo(headers) {
        const userAgent = headers['user-agent'] || headers['User-Agent'] || 'unknown';
        const ipAddress = headers['cf-connecting-ip'] ||
            headers['CF-Connecting-IP'] ||
            headers['x-real-ip'] ||
            headers['X-Real-IP'] ||
            headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            'unknown';
        // Simple device type detection
        let deviceType = 'unknown';
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile')) {
            deviceType = 'mobile';
        }
        else if (ua.includes('tablet') || ua.includes('ipad')) {
            deviceType = 'tablet';
        }
        else if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari')) {
            deviceType = 'desktop';
        }
        // Extract browser
        let browser;
        if (ua.includes('firefox'))
            browser = 'Firefox';
        else if (ua.includes('chrome'))
            browser = 'Chrome';
        else if (ua.includes('safari'))
            browser = 'Safari';
        else if (ua.includes('edge'))
            browser = 'Edge';
        // Extract OS
        let os;
        if (ua.includes('windows'))
            os = 'Windows';
        else if (ua.includes('mac os'))
            os = 'macOS';
        else if (ua.includes('linux'))
            os = 'Linux';
        else if (ua.includes('android'))
            os = 'Android';
        else if (ua.includes('ios'))
            os = 'iOS';
        const deviceInfo = {
            user_agent: userAgent,
            ip_address: ipAddress,
            device_type: deviceType,
            os,
            browser,
        };
        // Generate fingerprint
        deviceInfo.device_fingerprint = SessionManager.generateDeviceFingerprint(deviceInfo);
        return deviceInfo;
    }
    /**
     * Log session activity (can be extended to use audit logging service)
     */
    async logActivity(activity) {
        // In production, this should integrate with the audit logging system
        // For now, just log to console
        console.log('Session activity:', JSON.stringify(activity));
    }
    /**
     * Cleanup expired sessions
     */
    async cleanupExpiredSessions() {
        return this.storage.cleanupExpiredSessions();
    }
    /**
     * Get user sessions
     */
    async getUserSessions(tenantId, userId) {
        return this.storage.getUserSessions(tenantId, userId);
    }
    /**
     * Get active session count for user
     */
    async getActiveSessionCount(tenantId, userId) {
        const sessions = await this.storage.getUserSessions(tenantId, userId);
        return sessions.filter(s => s.status === SessionStatus.ACTIVE).length;
    }
}
