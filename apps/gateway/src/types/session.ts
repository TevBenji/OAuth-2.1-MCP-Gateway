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

export type DeviceInfo = z.infer<typeof DeviceInfoSchema>;

/**
 * Session Status
 */
export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  SUSPENDED = 'suspended',
}

/**
 * Session Risk Level
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Session Data
 */
export interface Session {
  session_id: string;
  tenant_id: string;
  user_id: string;
  client_id: string;
  device_info: DeviceInfo;
  status: SessionStatus;
  risk_level: RiskLevel;
  created_at: Date;
  last_accessed_at: Date;
  expires_at: Date;
  idle_timeout_at: Date;
  revoked_at?: Date;
  revocation_reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Session Creation Options
 */
export interface CreateSessionOptions {
  tenant_id: string;
  user_id: string;
  client_id: string;
  device_info: DeviceInfo;
  max_idle_time?: number; // seconds
  max_session_time?: number; // seconds
  metadata?: Record<string, any>;
}

/**
 * Session Validation Result
 */
export interface SessionValidationResult {
  valid: boolean;
  session?: Session;
  error?: SessionError;
}

/**
 * Session Error Types
 */
export enum SessionErrorCode {
  SESSION_NOT_FOUND = 'session_not_found',
  SESSION_EXPIRED = 'session_expired',
  SESSION_REVOKED = 'session_revoked',
  SESSION_SUSPENDED = 'session_suspended',
  IDLE_TIMEOUT = 'idle_timeout',
  CONCURRENT_LIMIT_EXCEEDED = 'concurrent_limit_exceeded',
  DEVICE_MISMATCH = 'device_mismatch',
  RISK_TOO_HIGH = 'risk_too_high',
}

export interface SessionError {
  code: SessionErrorCode;
  message: string;
  details?: any;
}

/**
 * Session Limits Configuration
 */
export interface SessionLimits {
  max_concurrent_sessions: number;
  max_idle_time_seconds: number; // Default: 30 minutes
  max_session_time_seconds: number; // Default: 24 hours
  enforce_device_binding: boolean;
  require_mfa_on_risk_elevation: boolean;
}

/**
 * Risk Assessment Factors
 */
export interface RiskFactors {
  device_changed: boolean;
  ip_changed: boolean;
  location_changed: boolean;
  unusual_activity: boolean;
  failed_auth_attempts: number;
  velocity_check_failed: boolean;
}

/**
 * Risk Assessment Result
 */
export interface RiskAssessment {
  risk_level: RiskLevel;
  risk_score: number; // 0-100
  factors: RiskFactors;
  recommended_action: 'allow' | 'challenge' | 'deny';
  requires_mfa: boolean;
}

/**
 * Session Activity Event
 */
export interface SessionActivity {
  session_id: string;
  activity_type: 'created' | 'accessed' | 'expired' | 'revoked' | 'suspended' | 'risk_elevated';
  timestamp: Date;
  device_info?: DeviceInfo;
  risk_level?: RiskLevel;
  metadata?: Record<string, any>;
}

/**
 * Session Storage Interface
 */
export interface SessionStorage {
  create(session: Session): Promise<void>;
  get(sessionId: string): Promise<Session | null>;
  update(sessionId: string, updates: Partial<Session>): Promise<void>;
  delete(sessionId: string): Promise<void>;
  getUserSessions(tenantId: string, userId: string): Promise<Session[]>;
  deleteUserSessions(tenantId: string, userId: string): Promise<number>;
  cleanupExpiredSessions(): Promise<number>;
}

/**
 * Session Configuration
 */
export const DEFAULT_SESSION_CONFIG: SessionLimits = {
  max_concurrent_sessions: 5,
  max_idle_time_seconds: 1800, // 30 minutes
  max_session_time_seconds: 86400, // 24 hours
  enforce_device_binding: true,
  require_mfa_on_risk_elevation: true,
};

/**
 * Device Fingerprint Generator
 */
export interface DeviceFingerprintOptions {
  include_user_agent: boolean;
  include_ip: boolean;
  include_screen_resolution: boolean;
  include_timezone: boolean;
  include_language: boolean;
}
