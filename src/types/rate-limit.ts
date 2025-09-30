/**
 * Rate Limiting Type Definitions
 *
 * Types for rate limiting, DDoS protection, and suspicious activity detection.
 */

import { z } from 'zod';

/**
 * Rate Limit Tier Configuration
 */
export interface RateLimitTier {
  name: string;
  requests_per_second: number;
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  burst_size: number; // Maximum burst allowance
}

/**
 * Rate Limit Configuration
 */
export interface RateLimitConfig {
  tenant_limits: RateLimitTier;
  user_limits: RateLimitTier;
  ip_limits: RateLimitTier;
  endpoint_limits?: Record<string, RateLimitTier>;
  enable_ip_blocking: boolean;
  enable_suspicious_activity_detection: boolean;
  block_duration_seconds: number; // How long to block violators
}

/**
 * Rate Limit Result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retry_after?: number; // Seconds until next allowed request
  blocked?: boolean;
  block_reason?: string;
}

/**
 * Rate Limit Key Types
 */
export enum RateLimitKeyType {
  TENANT = 'tenant',
  USER = 'user',
  IP = 'ip',
  ENDPOINT = 'endpoint',
  GLOBAL = 'global',
}

/**
 * Rate Limit Window
 */
export enum RateLimitWindow {
  SECOND = 'second',
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
}

/**
 * Sliding Window Entry
 */
export interface SlidingWindowEntry {
  timestamp: number;
  count: number;
}

/**
 * Rate Limit Violation
 */
export interface RateLimitViolation {
  key: string;
  key_type: RateLimitKeyType;
  limit: number;
  actual: number;
  window: RateLimitWindow;
  timestamp: Date;
  ip_address?: string;
  user_id?: string;
  tenant_id?: string;
}

/**
 * Suspicious Activity Event
 */
export interface SuspiciousActivityEvent {
  event_id: string;
  event_type: 'rate_limit_violation' | 'ip_blocked' | 'unusual_pattern' | 'brute_force';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip_address: string;
  user_id?: string;
  tenant_id?: string;
  details: Record<string, any>;
  timestamp: Date;
}

/**
 * IP Block Entry
 */
export interface IPBlockEntry {
  ip_address: string;
  blocked_at: Date;
  expires_at: Date;
  reason: string;
  violation_count: number;
}

/**
 * Rate Limit Storage Interface
 */
export interface RateLimitStorage {
  increment(key: string, window: RateLimitWindow, ttl: number): Promise<number>;
  get(key: string): Promise<number>;
  reset(key: string): Promise<void>;
  isBlocked(key: string): Promise<boolean>;
  block(key: string, duration: number, reason: string): Promise<void>;
  unblock(key: string): Promise<void>;
  getBlockInfo(key: string): Promise<IPBlockEntry | null>;
}

/**
 * Default Rate Limit Tiers
 */
export const DEFAULT_RATE_LIMIT_TIERS = {
  FREE: {
    name: 'free',
    requests_per_second: 10,
    requests_per_minute: 100,
    requests_per_hour: 1000,
    requests_per_day: 10000,
    burst_size: 20,
  } as RateLimitTier,

  PRO: {
    name: 'pro',
    requests_per_second: 50,
    requests_per_minute: 1000,
    requests_per_hour: 10000,
    requests_per_day: 100000,
    burst_size: 100,
  } as RateLimitTier,

  BUSINESS: {
    name: 'business',
    requests_per_second: 200,
    requests_per_minute: 5000,
    requests_per_hour: 50000,
    requests_per_day: 500000,
    burst_size: 400,
  } as RateLimitTier,

  ENTERPRISE: {
    name: 'enterprise',
    requests_per_second: 1000,
    requests_per_minute: 20000,
    requests_per_hour: 200000,
    requests_per_day: 2000000,
    burst_size: 2000,
  } as RateLimitTier,
};

/**
 * IP-based rate limits (stricter for DDoS protection)
 */
export const DEFAULT_IP_RATE_LIMITS: RateLimitTier = {
  name: 'ip_default',
  requests_per_second: 20,
  requests_per_minute: 300,
  requests_per_hour: 3000,
  requests_per_day: 20000,
  burst_size: 40,
};

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  tenant_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
  user_limits: DEFAULT_RATE_LIMIT_TIERS.PRO,
  ip_limits: DEFAULT_IP_RATE_LIMITS,
  enable_ip_blocking: true,
  enable_suspicious_activity_detection: true,
  block_duration_seconds: 3600, // 1 hour
};
