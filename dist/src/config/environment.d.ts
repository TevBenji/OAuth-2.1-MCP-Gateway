/**
 * Environment Configuration
 *
 * Centralized configuration management for environment variables
 * and runtime settings across different deployment environments.
 */
import type { Bindings } from '@/types/bindings';
export interface EnvironmentConfig {
    environment: 'development' | 'staging' | 'production';
    jwtIssuer: string;
    jwtExpirySeconds: number;
    refreshTokenExpirySeconds: number;
    corsOrigins: string[];
    defaultRateLimit: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
        burstLimit: number;
    };
    security: {
        requirePKCE: boolean;
        maxSessionDurationSeconds: number;
        maxConcurrentSessions: number;
        passwordMinLength: number;
        requireMFA: boolean;
    };
    database: {
        connectionTimeout: number;
        queryTimeout: number;
        maxConnections: number;
        retryAttempts: number;
    };
    audit: {
        enabled: boolean;
        retentionDays: number;
        batchSize: number;
        flushIntervalSeconds: number;
    };
    features: {
        dynamicClientRegistration: boolean;
        resourceIndicators: boolean;
        deviceCodeFlow: boolean;
        introspectionEndpoint: boolean;
        revocationEndpoint: boolean;
    };
}
/**
 * Load and validate environment configuration from Cloudflare Workers bindings
 */
export declare function loadEnvironmentConfig(env: Bindings): EnvironmentConfig;
/**
 * Validate required environment variables
 */
export declare function validateEnvironment(env: Bindings): void;
/**
 * Get configuration for specific tenant (with overrides)
 */
export declare function getTenantConfig(baseConfig: EnvironmentConfig, tenantOverrides?: Partial<EnvironmentConfig>): EnvironmentConfig;
