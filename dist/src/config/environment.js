/**
 * Environment Configuration
 *
 * Centralized configuration management for environment variables
 * and runtime settings across different deployment environments.
 */
/**
 * Load and validate environment configuration from Cloudflare Workers bindings
 */
export function loadEnvironmentConfig(env) {
    const corsOrigins = env.CORS_ORIGINS
        ? env.CORS_ORIGINS.split(',').map(origin => origin.trim())
        : ['http://localhost:3000'];
    return {
        environment: env.ENVIRONMENT || 'development',
        jwtIssuer: env.JWT_ISSUER || 'https://oauth-mcp-gateway.example.com',
        jwtExpirySeconds: 3600, // 1 hour
        refreshTokenExpirySeconds: 86400 * 30, // 30 days
        corsOrigins,
        defaultRateLimit: {
            requestsPerMinute: env.ENVIRONMENT === 'production' ? 1000 : 10000,
            requestsPerHour: env.ENVIRONMENT === 'production' ? 10000 : 100000,
            requestsPerDay: env.ENVIRONMENT === 'production' ? 100000 : 1000000,
            burstLimit: 100
        },
        security: {
            requirePKCE: true, // Always required in OAuth 2.1
            maxSessionDurationSeconds: 86400 * 7, // 7 days
            maxConcurrentSessions: 10,
            passwordMinLength: 12,
            requireMFA: env.ENVIRONMENT === 'production'
        },
        database: {
            connectionTimeout: 5000,
            queryTimeout: 30000,
            maxConnections: 10,
            retryAttempts: 3
        },
        audit: {
            enabled: true,
            retentionDays: env.ENVIRONMENT === 'production' ? 2555 : 90, // 7 years for prod
            batchSize: 100,
            flushIntervalSeconds: 60
        },
        features: {
            dynamicClientRegistration: true,
            resourceIndicators: true,
            deviceCodeFlow: false, // Not needed for MCP
            introspectionEndpoint: true,
            revocationEndpoint: true
        }
    };
}
/**
 * Validate required environment variables
 */
export function validateEnvironment(env) {
    const required = ['JWT_ISSUER'];
    const missing = required.filter(key => !env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    // Validate JWT issuer format
    try {
        new URL(env.JWT_ISSUER);
    }
    catch {
        throw new Error('JWT_ISSUER must be a valid URL');
    }
}
/**
 * Get configuration for specific tenant (with overrides)
 */
export function getTenantConfig(baseConfig, tenantOverrides) {
    if (!tenantOverrides) {
        return baseConfig;
    }
    return {
        ...baseConfig,
        ...tenantOverrides,
        defaultRateLimit: {
            ...baseConfig.defaultRateLimit,
            ...tenantOverrides.defaultRateLimit
        },
        security: {
            ...baseConfig.security,
            ...tenantOverrides.security
        },
        database: {
            ...baseConfig.database,
            ...tenantOverrides.database
        },
        audit: {
            ...baseConfig.audit,
            ...tenantOverrides.audit
        },
        features: {
            ...baseConfig.features,
            ...tenantOverrides.features
        }
    };
}
