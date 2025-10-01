/**
 * Environment Configuration Unit Tests
 *
 * Test environment configuration loading, validation, and tenant overrides.
 */
import { describe, it, expect } from 'vitest';
import { loadEnvironmentConfig, validateEnvironment, getTenantConfig } from '@/config/environment';
describe('Environment Configuration', () => {
    describe('loadEnvironmentConfig', () => {
        it('should load configuration with default values', () => {
            const mockEnv = {
                SESSIONS: {},
                CACHE: {},
                DB: {},
                ENVIRONMENT: 'development',
                JWT_ISSUER: 'https://test.oauth-mcp-gateway.com',
                CORS_ORIGINS: 'http://localhost:3000,https://example.com'
            };
            const config = loadEnvironmentConfig(mockEnv);
            expect(config.environment).toBe('development');
            expect(config.jwtIssuer).toBe('https://test.oauth-mcp-gateway.com');
            expect(config.corsOrigins).toEqual(['http://localhost:3000', 'https://example.com']);
            expect(config.security.requirePKCE).toBe(true);
            expect(config.features.dynamicClientRegistration).toBe(true);
        });
        it('should handle production environment settings', () => {
            const mockEnv = {
                SESSIONS: {},
                CACHE: {},
                DB: {},
                ENVIRONMENT: 'production',
                JWT_ISSUER: 'https://oauth-mcp-gateway.com',
                CORS_ORIGINS: 'https://claude.ai,https://chatgpt.com'
            };
            const config = loadEnvironmentConfig(mockEnv);
            expect(config.environment).toBe('production');
            expect(config.security.requireMFA).toBe(true);
            expect(config.audit.retentionDays).toBe(2555); // 7 years
            expect(config.defaultRateLimit.requestsPerMinute).toBe(1000);
        });
        it('should parse CORS origins correctly', () => {
            const mockEnv = {
                SESSIONS: {},
                CACHE: {},
                DB: {},
                ENVIRONMENT: 'development',
                JWT_ISSUER: 'https://test.oauth-mcp-gateway.com',
                CORS_ORIGINS: 'http://localhost:3000, https://example.com , https://test.com'
            };
            const config = loadEnvironmentConfig(mockEnv);
            expect(config.corsOrigins).toEqual([
                'http://localhost:3000',
                'https://example.com',
                'https://test.com'
            ]);
        });
        it('should use default CORS origins when not provided', () => {
            const mockEnv = {
                SESSIONS: {},
                CACHE: {},
                DB: {},
                ENVIRONMENT: 'development',
                JWT_ISSUER: 'https://test.oauth-mcp-gateway.com',
                CORS_ORIGINS: ''
            };
            const config = loadEnvironmentConfig(mockEnv);
            expect(config.corsOrigins).toEqual(['http://localhost:3000']);
        });
    });
    describe('validateEnvironment', () => {
        it('should pass validation with required variables', () => {
            const mockEnv = {
                SESSIONS: {},
                CACHE: {},
                DB: {},
                ENVIRONMENT: 'development',
                JWT_ISSUER: 'https://test.oauth-mcp-gateway.com',
                CORS_ORIGINS: 'http://localhost:3000'
            };
            expect(() => validateEnvironment(mockEnv)).not.toThrow();
        });
        it('should throw error for missing JWT_ISSUER', () => {
            const mockEnv = {
                SESSIONS: {},
                CACHE: {},
                DB: {},
                ENVIRONMENT: 'development',
                CORS_ORIGINS: 'http://localhost:3000'
            };
            expect(() => validateEnvironment(mockEnv)).toThrow('Missing required environment variables: JWT_ISSUER');
        });
        it('should throw error for invalid JWT_ISSUER URL', () => {
            const mockEnv = {
                SESSIONS: {},
                CACHE: {},
                DB: {},
                ENVIRONMENT: 'development',
                JWT_ISSUER: 'not-a-valid-url',
                CORS_ORIGINS: 'http://localhost:3000'
            };
            expect(() => validateEnvironment(mockEnv)).toThrow('JWT_ISSUER must be a valid URL');
        });
    });
    describe('getTenantConfig', () => {
        it('should return base config when no overrides provided', () => {
            const mockEnv = {
                SESSIONS: {},
                CACHE: {},
                DB: {},
                ENVIRONMENT: 'development',
                JWT_ISSUER: 'https://test.oauth-mcp-gateway.com',
                CORS_ORIGINS: 'http://localhost:3000'
            };
            const baseConfig = loadEnvironmentConfig(mockEnv);
            const tenantConfig = getTenantConfig(baseConfig);
            expect(tenantConfig).toEqual(baseConfig);
        });
        it('should apply tenant overrides correctly', () => {
            const mockEnv = {
                SESSIONS: {},
                CACHE: {},
                DB: {},
                ENVIRONMENT: 'development',
                JWT_ISSUER: 'https://test.oauth-mcp-gateway.com',
                CORS_ORIGINS: 'http://localhost:3000'
            };
            const baseConfig = loadEnvironmentConfig(mockEnv);
            const overrides = {
                defaultRateLimit: {
                    requestsPerMinute: 500,
                    requestsPerHour: 5000,
                    requestsPerDay: baseConfig.defaultRateLimit.requestsPerDay,
                    burstLimit: baseConfig.defaultRateLimit.burstLimit
                },
                security: {
                    ...baseConfig.security,
                    maxConcurrentSessions: 5
                }
            };
            const tenantConfig = getTenantConfig(baseConfig, overrides);
            expect(tenantConfig.defaultRateLimit.requestsPerMinute).toBe(500);
            expect(tenantConfig.defaultRateLimit.requestsPerHour).toBe(5000);
            expect(tenantConfig.defaultRateLimit.requestsPerDay).toBe(baseConfig.defaultRateLimit.requestsPerDay); // Unchanged
            expect(tenantConfig.security.maxConcurrentSessions).toBe(5);
            expect(tenantConfig.security.requirePKCE).toBe(baseConfig.security.requirePKCE); // Unchanged
        });
        it('should merge nested configuration objects', () => {
            const mockEnv = {
                SESSIONS: {},
                CACHE: {},
                DB: {},
                ENVIRONMENT: 'development',
                JWT_ISSUER: 'https://test.oauth-mcp-gateway.com',
                CORS_ORIGINS: 'http://localhost:3000'
            };
            const baseConfig = loadEnvironmentConfig(mockEnv);
            const overrides = {
                features: {
                    ...baseConfig.features,
                    dynamicClientRegistration: false,
                    resourceIndicators: false
                }
            };
            const tenantConfig = getTenantConfig(baseConfig, overrides);
            expect(tenantConfig.features.dynamicClientRegistration).toBe(false);
            expect(tenantConfig.features.resourceIndicators).toBe(false);
            expect(tenantConfig.features.introspectionEndpoint).toBe(baseConfig.features.introspectionEndpoint); // Unchanged
        });
    });
});
