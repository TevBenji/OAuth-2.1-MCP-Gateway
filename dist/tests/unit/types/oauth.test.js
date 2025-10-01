/**
 * OAuth 2.1 Types Unit Tests
 *
 * Test OAuth 2.1 type definitions, validation schemas, and interfaces.
 */
import { describe, it, expect } from 'vitest';
import { AuthorizeRequestSchema, TokenRequestSchema, ClientRegistrationRequestSchema } from '@/types/oauth';
describe('OAuth 2.1 Types', () => {
    describe('AuthorizeRequestSchema', () => {
        it('should validate a complete authorization request', () => {
            const validRequest = {
                client_id: 'test-client-123',
                redirect_uri: 'https://example.com/callback',
                response_type: 'code',
                scope: 'mcp:tools:read mcp:resources:read',
                state: 'random-state-value',
                code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
                code_challenge_method: 'S256',
                resource: 'https://mcp.example.com/weather-api'
            };
            const result = AuthorizeRequestSchema.safeParse(validRequest);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.client_id).toBe('test-client-123');
                expect(result.data.code_challenge_method).toBe('S256');
            }
        });
        it('should reject request without PKCE challenge', () => {
            const invalidRequest = {
                client_id: 'test-client-123',
                redirect_uri: 'https://example.com/callback',
                response_type: 'code',
                state: 'random-state-value'
                // Missing code_challenge and code_challenge_method
            };
            const result = AuthorizeRequestSchema.safeParse(invalidRequest);
            expect(result.success).toBe(false);
        });
        it('should reject invalid redirect URI', () => {
            const invalidRequest = {
                client_id: 'test-client-123',
                redirect_uri: 'not-a-valid-url',
                response_type: 'code',
                state: 'random-state-value',
                code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
                code_challenge_method: 'S256'
            };
            const result = AuthorizeRequestSchema.safeParse(invalidRequest);
            expect(result.success).toBe(false);
        });
        it('should reject unsupported response type', () => {
            const invalidRequest = {
                client_id: 'test-client-123',
                redirect_uri: 'https://example.com/callback',
                response_type: 'token', // Not supported in OAuth 2.1
                state: 'random-state-value',
                code_challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
                code_challenge_method: 'S256'
            };
            const result = AuthorizeRequestSchema.safeParse(invalidRequest);
            expect(result.success).toBe(false);
        });
    });
    describe('TokenRequestSchema', () => {
        it('should validate authorization code grant request', () => {
            const validRequest = {
                grant_type: 'authorization_code',
                code: 'auth-code-123',
                redirect_uri: 'https://example.com/callback',
                client_id: 'test-client-123',
                code_verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
                resource: 'https://mcp.example.com/weather-api'
            };
            const result = TokenRequestSchema.safeParse(validRequest);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.grant_type).toBe('authorization_code');
                expect(result.data.code_verifier).toBe('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
            }
        });
        it('should validate refresh token grant request', () => {
            const validRequest = {
                grant_type: 'refresh_token',
                refresh_token: 'refresh-token-123',
                client_id: 'test-client-123',
                scope: 'mcp:tools:read'
            };
            const result = TokenRequestSchema.safeParse(validRequest);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.grant_type).toBe('refresh_token');
                expect(result.data.refresh_token).toBe('refresh-token-123');
            }
        });
        it('should reject unsupported grant type', () => {
            const invalidRequest = {
                grant_type: 'client_credentials', // Not supported for MCP
                client_id: 'test-client-123'
            };
            const result = TokenRequestSchema.safeParse(invalidRequest);
            expect(result.success).toBe(false);
        });
    });
    describe('ClientRegistrationRequestSchema', () => {
        it('should validate complete client registration request', () => {
            const validRequest = {
                redirect_uris: ['https://example.com/callback', 'https://example.com/callback2'],
                client_name: 'Test MCP Client',
                client_uri: 'https://example.com',
                logo_uri: 'https://example.com/logo.png',
                scope: 'mcp:tools:read mcp:resources:read',
                contacts: ['admin@example.com'],
                tos_uri: 'https://example.com/tos',
                policy_uri: 'https://example.com/privacy',
                token_endpoint_auth_method: 'none',
                grant_types: ['authorization_code', 'refresh_token'],
                response_types: ['code']
            };
            const result = ClientRegistrationRequestSchema.safeParse(validRequest);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.redirect_uris).toHaveLength(2);
                expect(result.data.client_name).toBe('Test MCP Client');
            }
        });
        it('should require at least one redirect URI', () => {
            const invalidRequest = {
                redirect_uris: [], // Empty array not allowed
                client_name: 'Test Client'
            };
            const result = ClientRegistrationRequestSchema.safeParse(invalidRequest);
            expect(result.success).toBe(false);
        });
        it('should validate redirect URI format', () => {
            const invalidRequest = {
                redirect_uris: ['not-a-valid-url'],
                client_name: 'Test Client'
            };
            const result = ClientRegistrationRequestSchema.safeParse(invalidRequest);
            expect(result.success).toBe(false);
        });
    });
    describe('TokenPayload interface', () => {
        it('should have correct structure for JWT payload', () => {
            const payload = {
                iss: 'https://oauth-mcp-gateway.com',
                sub: 'user-123',
                aud: 'mcp://weather-api',
                exp: Math.floor(Date.now() / 1000) + 3600,
                iat: Math.floor(Date.now() / 1000),
                jti: 'jwt-123',
                scope: 'mcp:tools:read mcp:resources:read',
                client_id: 'client-123',
                tenant_id: 'tenant-123',
                session_id: 'session-123',
                device_id: 'device-123',
                auth_time: Math.floor(Date.now() / 1000),
                risk_score: 0.2
            };
            // Type checking - if this compiles, the interface is correct
            expect(payload.iss).toBe('https://oauth-mcp-gateway.com');
            expect(payload.tenant_id).toBe('tenant-123');
            expect(payload.risk_score).toBe(0.2);
        });
    });
    describe('OAuthError interface', () => {
        it('should support all standard OAuth error codes', () => {
            const errors = [
                { error: 'invalid_request', error_description: 'Missing parameter' },
                { error: 'invalid_client', error_description: 'Client not found' },
                { error: 'invalid_grant', error_description: 'Grant expired' },
                { error: 'unauthorized_client', error_description: 'Client not authorized' },
                { error: 'unsupported_grant_type', error_description: 'Grant type not supported' },
                { error: 'invalid_scope', error_description: 'Scope not valid' },
                { error: 'invalid_target', error_description: 'Resource not found' },
                { error: 'access_denied', error_description: 'User denied access' }
            ];
            errors.forEach(error => {
                expect(error.error).toBeDefined();
                expect(error.error_description).toBeDefined();
            });
        });
    });
});
