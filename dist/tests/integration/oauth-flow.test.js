import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { handleAuthorization } from '../../src/handlers/oauth/authorize';
import { generateCodeVerifier, createS256CodeChallenge, InMemoryPKCEStorage } from '../../src/services/oauth/pkce';
describe('OAuth 2.1 Authorization Flow Integration', () => {
    let app;
    let pkceStorage;
    beforeEach(() => {
        app = new Hono();
        pkceStorage = new InMemoryPKCEStorage();
    });
    it('should complete a full authorization flow with PKCE', async () => {
        // Step 1: Client generates code verifier and challenge
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await createS256CodeChallenge(codeVerifier);
        // Mock redirect URI
        const redirectUri = 'https://client.example.com/callback';
        const clientId = 'test-client-id';
        const state = 'test-state-value';
        // Mock context for the authorization endpoint
        const mockContext = {
            req: {
                query: vi.fn((param) => {
                    const params = {
                        response_type: 'code',
                        client_id: clientId,
                        redirect_uri: redirectUri,
                        scope: 'read write',
                        state: state,
                        code_challenge: codeChallenge,
                        code_challenge_method: 'S256'
                    };
                    return params[param] || null;
                })
            },
            redirect: vi.fn((url) => {
                // Return a mock response that includes the redirect URL for verification
                return new Response(null, {
                    status: 302,
                    headers: { 'Location': url }
                });
            }),
        };
        // Call the authorization handler
        const response = await handleAuthorization(mockContext);
        // Verify the redirect was called
        expect(mockContext.redirect).toHaveBeenCalled();
        const redirectCall = mockContext.redirect.mock.calls[0][0];
        // Verify the redirect URL contains the authorization code and state
        const redirectUrl = new URL(redirectCall);
        expect(redirectUrl.origin + redirectUrl.pathname).toBe(new URL(redirectUri).origin + new URL(redirectUri).pathname);
        expect(redirectUrl.searchParams.get('code')).toBeDefined();
        expect(redirectUrl.searchParams.get('state')).toBe(state);
        // Verify that an authorization code was generated
        const authCode = redirectUrl.searchParams.get('code');
        expect(authCode).toMatch(/^auth_[a-z0-9]+$/);
    });
    it('should reject requests without required PKCE parameters', async () => {
        const mockContext = {
            req: {
                query: vi.fn((param) => {
                    const params = {
                        response_type: 'code',
                        client_id: 'test-client-id',
                        redirect_uri: 'https://client.example.com/callback',
                        scope: 'read write',
                        state: 'test-state-value'
                        // Missing code_challenge and code_challenge_method
                    };
                    return params[param] || null;
                })
            },
            redirect: vi.fn((url) => {
                return new Response(null, {
                    status: 302,
                    headers: { 'Location': url }
                });
            }),
        };
        await handleAuthorization(mockContext);
        // Verify the redirect was called with an error
        expect(mockContext.redirect).toHaveBeenCalled();
        const redirectCall = mockContext.redirect.mock.calls[0][0];
        expect(redirectCall).toContain('error=invalid_request');
        expect(redirectCall).toContain('code_challenge parameter is required for PKCE');
    });
    it('should reject requests with invalid code challenge method', async () => {
        const mockContext = {
            req: {
                query: vi.fn((param) => {
                    const params = {
                        response_type: 'code',
                        client_id: 'test-client-id',
                        redirect_uri: 'https://client.example.com/callback',
                        scope: 'read write',
                        state: 'test-state-value',
                        code_challenge: 'test-challenge',
                        code_challenge_method: 'invalid_method' // Invalid method
                    };
                    return params[param] || null;
                })
            },
            redirect: vi.fn((url) => {
                return new Response(null, {
                    status: 302,
                    headers: { 'Location': url }
                });
            }),
        };
        await handleAuthorization(mockContext);
        // Verify the redirect was called with an error
        expect(mockContext.redirect).toHaveBeenCalled();
        const redirectCall = mockContext.redirect.mock.calls[0][0];
        expect(redirectCall).toContain('error=invalid_request');
        expect(redirectCall).toContain('code_challenge_method must be S256 or plain');
    });
    it('should reject requests without state parameter', async () => {
        // Client generates code verifier and challenge
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await createS256CodeChallenge(codeVerifier);
        const mockContext = {
            req: {
                query: vi.fn((param) => {
                    const params = {
                        response_type: 'code',
                        client_id: 'test-client-id',
                        redirect_uri: 'https://client.example.com/callback',
                        scope: 'read write',
                        // Missing state parameter
                        code_challenge: codeChallenge,
                        code_challenge_method: 'S256'
                    };
                    return params[param] || null;
                })
            },
            redirect: vi.fn((url) => {
                return new Response(null, {
                    status: 302,
                    headers: { 'Location': url }
                });
            }),
        };
        await handleAuthorization(mockContext);
        // Verify the redirect was called with an error
        expect(mockContext.redirect).toHaveBeenCalled();
        const redirectCall = mockContext.redirect.mock.calls[0][0];
        expect(redirectCall).toContain('error=invalid_request');
        expect(redirectCall).toContain('state parameter is required for CSRF protection');
    });
    it('should reject requests with invalid response type', async () => {
        // Client generates code verifier and challenge
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await createS256CodeChallenge(codeVerifier);
        const mockContext = {
            req: {
                query: vi.fn((param) => {
                    const params = {
                        response_type: 'token', // Invalid for authorization code flow
                        client_id: 'test-client-id',
                        redirect_uri: 'https://client.example.com/callback',
                        scope: 'read write',
                        state: 'test-state-value',
                        code_challenge: codeChallenge,
                        code_challenge_method: 'S256'
                    };
                    return params[param] || null;
                })
            },
            redirect: vi.fn((url) => {
                return new Response(null, {
                    status: 302,
                    headers: { 'Location': url }
                });
            }),
        };
        await handleAuthorization(mockContext);
        // Verify the redirect was called with an error
        expect(mockContext.redirect).toHaveBeenCalled();
        const redirectCall = mockContext.redirect.mock.calls[0][0];
        expect(redirectCall).toContain('error=unsupported_response_type');
        expect(redirectCall).toContain('Only code response type is supported');
    });
});
