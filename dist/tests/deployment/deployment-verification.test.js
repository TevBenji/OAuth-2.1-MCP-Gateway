/**
 * Deployment Verification Tests
 * Tests to verify successful deployment of the OAuth 2.1 MCP Gateway
 */
import { describe, test, expect, beforeAll } from 'vitest';
// Environment configuration
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:8787';
const API_KEY = process.env.API_KEY || 'test-api-key';
const TIMEOUT = 30000; // 30 seconds
describe('Deployment Verification', () => {
    let baseUrl;
    beforeAll(() => {
        baseUrl = GATEWAY_URL.replace(/\/$/, ''); // Remove trailing slash
        console.log(`Testing deployment at: ${baseUrl}`);
    });
    describe('Health Checks', () => {
        test('should respond to health check endpoint', async () => {
            const response = await fetch(`${baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'OAuth-MCP-Gateway-Test/1.0'
                }
            });
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('status', 'healthy');
            expect(data).toHaveProperty('timestamp');
            expect(data).toHaveProperty('version');
        }, TIMEOUT);
        test('should respond to readiness check', async () => {
            const response = await fetch(`${baseUrl}/ready`, {
                method: 'GET'
            });
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data).toHaveProperty('ready', true);
            expect(data).toHaveProperty('services');
            expect(data.services).toHaveProperty('database');
            expect(data.services).toHaveProperty('cache');
        }, TIMEOUT);
    });
    describe('OAuth Discovery Endpoints', () => {
        test('should serve OAuth authorization server metadata', async () => {
            const response = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toContain('application/json');
            const metadata = await response.json();
            expect(metadata).toHaveProperty('issuer');
            expect(metadata).toHaveProperty('authorization_endpoint');
            expect(metadata).toHaveProperty('token_endpoint');
            expect(metadata).toHaveProperty('registration_endpoint');
            expect(metadata).toHaveProperty('code_challenge_methods_supported');
            expect(metadata.code_challenge_methods_supported).toContain('S256');
        }, TIMEOUT);
        test('should serve protected resource metadata', async () => {
            const response = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`);
            expect(response.status).toBe(200);
            expect(response.headers.get('content-type')).toContain('application/json');
            const metadata = await response.json();
            expect(metadata).toHaveProperty('resource');
            expect(metadata).toHaveProperty('authorization_servers');
            expect(metadata).toHaveProperty('scopes_supported');
        }, TIMEOUT);
    });
    describe('OAuth Endpoints', () => {
        test('should handle authorization endpoint with proper error for missing parameters', async () => {
            const response = await fetch(`${baseUrl}/oauth/authorize`, {
                method: 'GET'
            });
            expect(response.status).toBe(400);
            const error = await response.json();
            expect(error).toHaveProperty('error', 'invalid_request');
            expect(error).toHaveProperty('error_description');
        }, TIMEOUT);
        test('should handle token endpoint with proper error for missing parameters', async () => {
            const response = await fetch(`${baseUrl}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            expect(response.status).toBe(400);
            const error = await response.json();
            expect(error).toHaveProperty('error', 'invalid_request');
            expect(error).toHaveProperty('error_description');
        }, TIMEOUT);
        test('should handle client registration endpoint', async () => {
            const registrationData = {
                redirect_uris: ['https://example.com/callback'],
                client_name: 'Test Client',
                grant_types: ['authorization_code'],
                response_types: ['code']
            };
            const response = await fetch(`${baseUrl}/oauth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify(registrationData)
            });
            // Should either succeed (201) or fail with proper OAuth error (400)
            expect([201, 400, 401]).toContain(response.status);
            const data = await response.json();
            if (response.status === 201) {
                expect(data).toHaveProperty('client_id');
                expect(data).toHaveProperty('client_id_issued_at');
            }
            else {
                expect(data).toHaveProperty('error');
            }
        }, TIMEOUT);
    });
    describe('Security Headers', () => {
        test('should include security headers', async () => {
            const response = await fetch(`${baseUrl}/health`);
            // Check for security headers
            expect(response.headers.get('x-content-type-options')).toBe('nosniff');
            expect(response.headers.get('x-frame-options')).toBe('DENY');
            expect(response.headers.get('x-xss-protection')).toBe('1; mode=block');
            expect(response.headers.get('strict-transport-security')).toBeTruthy();
        }, TIMEOUT);
        test('should handle CORS properly', async () => {
            const response = await fetch(`${baseUrl}/health`, {
                method: 'OPTIONS',
                headers: {
                    'Origin': 'https://claude.ai',
                    'Access-Control-Request-Method': 'GET'
                }
            });
            expect(response.status).toBe(200);
            expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
            expect(response.headers.get('access-control-allow-methods')).toBeTruthy();
        }, TIMEOUT);
    });
    describe('Rate Limiting', () => {
        test('should implement rate limiting', async () => {
            // Make multiple rapid requests to test rate limiting
            const requests = Array(15).fill(null).map(() => fetch(`${baseUrl}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=authorization_code'
            }));
            const responses = await Promise.all(requests);
            const rateLimitedResponses = responses.filter(r => r.status === 429);
            // Should have at least some rate limited responses
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        }, TIMEOUT);
    });
    describe('Error Handling', () => {
        test('should handle 404 errors gracefully', async () => {
            const response = await fetch(`${baseUrl}/nonexistent-endpoint`);
            expect(response.status).toBe(404);
            const error = await response.json();
            expect(error).toHaveProperty('error');
            expect(error).toHaveProperty('message');
        }, TIMEOUT);
        test('should handle malformed JSON gracefully', async () => {
            const response = await fetch(`${baseUrl}/oauth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: 'invalid json'
            });
            expect(response.status).toBe(400);
            const error = await response.json();
            expect(error).toHaveProperty('error');
        }, TIMEOUT);
    });
    describe('Performance', () => {
        test('should respond within acceptable time limits', async () => {
            const startTime = Date.now();
            const response = await fetch(`${baseUrl}/health`);
            const responseTime = Date.now() - startTime;
            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        }, TIMEOUT);
        test('should handle concurrent requests', async () => {
            const concurrentRequests = 10;
            const requests = Array(concurrentRequests).fill(null).map(() => fetch(`${baseUrl}/health`));
            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;
            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });
            // Should handle concurrent requests efficiently
            expect(totalTime).toBeLessThan(5000); // Within 5 seconds
        }, TIMEOUT);
    });
});
