/**
 * Session Management Type Definitions
 *
 * Types for session lifecycle, device fingerprinting, and risk-based authentication.
 */
import { z } from 'zod';
/**
 * Device Information Schema
 */
export const DeviceInfoSchema = z.object({
    user_agent: z.string(),
    ip_address: z.string(),
    device_type: z.enum(['desktop', 'mobile', 'tablet', 'unknown']).optional(),
    os: z.string().optional(),
    browser: z.string().optional(),
    device_fingerprint: z.string().optional(), // Hash of device characteristics
});
/**
 * Session Status
 */
export var SessionStatus;
(function (SessionStatus) {
    SessionStatus["ACTIVE"] = "active";
    SessionStatus["EXPIRED"] = "expired";
    SessionStatus["REVOKED"] = "revoked";
    SessionStatus["SUSPENDED"] = "suspended";
})(SessionStatus || (SessionStatus = {}));
/**
 * Session Risk Level
 */
export var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "low";
    RiskLevel["MEDIUM"] = "medium";
    RiskLevel["HIGH"] = "high";
    RiskLevel["CRITICAL"] = "critical";
})(RiskLevel || (RiskLevel = {}));
/**
 * Session Error Types
 */
export var SessionErrorCode;
(function (SessionErrorCode) {
    SessionErrorCode["SESSION_NOT_FOUND"] = "session_not_found";
    SessionErrorCode["SESSION_EXPIRED"] = "session_expired";
    SessionErrorCode["SESSION_REVOKED"] = "session_revoked";
    SessionErrorCode["SESSION_SUSPENDED"] = "session_suspended";
    SessionErrorCode["IDLE_TIMEOUT"] = "idle_timeout";
    SessionErrorCode["CONCURRENT_LIMIT_EXCEEDED"] = "concurrent_limit_exceeded";
    SessionErrorCode["DEVICE_MISMATCH"] = "device_mismatch";
    SessionErrorCode["RISK_TOO_HIGH"] = "risk_too_high";
})(SessionErrorCode || (SessionErrorCode = {}));
/**
 * Session Configuration
 */
export const DEFAULT_SESSION_CONFIG = {
    max_concurrent_sessions: 5,
    max_idle_time_seconds: 1800, // 30 minutes
    max_session_time_seconds: 86400, // 24 hours
    enforce_device_binding: true,
    require_mfa_on_risk_elevation: true,
};
