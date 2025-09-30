/**
 * OAuth MCP Client Tests
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { OAuthMCPClient } from './client';
import { TokenExpiredError, InvalidClientError } from './errors';

// Mock fetch globally
global.fetch = vi.fn();

describe('OAuthMCPClient', () => {
  let client: OAuthMCPClient;
  const mockFetch = fetch as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OAuthMCPClient({
      gatewayUrl: 'https://test-gateway.com',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'https://test-app.com/callback',
      scopes: ['mcp:read', 'mcp:write']
    });
  });

  describe('discover', () => {
    it('should fetch OAuth server metadata', async () => {
      const mockMetadata = {
        issuer: 'https://test-gateway.com',
        authorization_endpoint: 'https://test-gateway.com/authorize',
        token_endpoint: 'https://test-gateway.com/token',
        jwks_uri: 'https://test-gateway.com/.well-known/jwks.json',
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'refresh_token'],
        code_challenge_methods_supported: ['S256']
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata)
      });

      const metadata = await client.discover();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-gateway.com/.well-known/oauth-authorization-server'
      );
      expect(metadata).toEqual(mockMetadata);
    });

    it('should throw error on discovery failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(client.discover()).rejects.toThrow('Failed to discover OAuth metadata');
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate authorization URL with PKCE', async () => {
      const mockMetadata = {
        authorization_endpoint: 'https://test-gateway.com/authorize'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata)
      });

      const result = await client.getAuthorizationUrl();

      expect(result.url).toContain('https://test-gateway.com/authorize');
      expect(result.url).toContain('response_type=code');
      expect(result.url).toContain('client_id=test-client-id');
      expect(result.url).toContain('redirect_uri=https%3A%2F%2Ftest-app.com%2Fcallback');
      expect(result.url).toContain('scope=mcp%3Aread+mcp%3Awrite');
      expect(result.url).toContain('code_challenge=');
      expect(result.url).toContain('code_challenge_method=S256');
      expect(result.state).toBeDefined();
      expect(result.codeVerifier).toBeDefined();
    });

    it('should include additional scopes and resource', async () => {
      const mockMetadata = {
        authorization_endpoint: 'https://test-gateway.com/authorize'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMetadata)
      });

      const result = await client.getAuthorizationUrl({
        additionalScopes: ['mcp:admin'],
        resource: 'https://my-mcp-server.com'
      });

      expect(result.url).toContain('scope=mcp%3Aread+mcp%3Awrite+mcp%3Aadmin');
      expect(result.url).toContain('resource=https%3A%2F%2Fmy-mcp-server.com');
    });
  });

  describe('exchangeCode', () => {
    it('should exchange authorization code for tokens', async () => {
      const mockMetadata = {
        token_endpoint: 'https://test-gateway.com/token'
      };

      const mockTokens = {
        access_token: 'test-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'test-refresh-token',
        scope: 'mcp:read mcp:write'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadata)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokens)
        });

      const tokens = await client.exchangeCode('test-code', 'test-verifier');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-gateway.com/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );

      expect(tokens).toEqual(mockTokens);
      expect(client.getAccessToken()).toBe('test-access-token');
      expect(client.getRefreshToken()).toBe('test-refresh-token');
    });

    it('should throw error on invalid grant', async () => {
      const mockMetadata = {
        token_endpoint: 'https://test-gateway.com/token'
      };

      const mockError = {
        error: 'invalid_grant',
        error_description: 'Authorization code is invalid'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadata)
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve(mockError)
        });

      await expect(client.exchangeCode('invalid-code', 'test-verifier'))
        .rejects.toThrow('Invalid grant');
    });
  });

  describe('refreshAccessToken', () => {
    beforeEach(() => {
      client.setRefreshToken('test-refresh-token');
    });

    it('should refresh access token', async () => {
      const mockMetadata = {
        token_endpoint: 'https://test-gateway.com/token'
      };

      const mockTokens = {
        access_token: 'new-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new-refresh-token'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadata)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTokens)
        });

      const tokens = await client.refreshAccessToken();

      expect(tokens).toEqual(mockTokens);
      expect(client.getAccessToken()).toBe('new-access-token');
      expect(client.getRefreshToken()).toBe('new-refresh-token');
    });

    it('should throw error without refresh token', async () => {
      client.setRefreshToken('');
      
      await expect(client.refreshAccessToken())
        .rejects.toThrow('Refresh token is required');
    });
  });

  describe('mcpRequest', () => {
    beforeEach(() => {
      client.setAccessToken('test-access-token', 3600); // Set with future expiration
    });

    it('should make authenticated MCP request', async () => {
      const mockResponse = {
        result: {
          tools: [
            {
              name: 'get_weather',
              description: 'Get weather information'
            }
          ]
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const response = await client.mcpRequest({
        method: 'tools/list',
        params: {}
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-gateway.com/mcp',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-access-token'
          },
          body: JSON.stringify({
            method: 'tools/list',
            params: {}
          })
        })
      );

      expect(response).toEqual(mockResponse);
    });

    it('should target specific MCP server', async () => {
      const mockResponse = { result: {} };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await client.mcpRequest({
        method: 'tools/list',
        server: 'weather-api'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-gateway.com/mcp/weather-api',
        expect.any(Object)
      );
    });

    it('should throw TokenExpiredError on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          error: 'token_expired',
          error_description: 'Token has expired'
        })
      });

      await expect(client.mcpRequest({ method: 'tools/list' }))
        .rejects.toThrow(TokenExpiredError);
    });

    it('should throw error without access token', async () => {
      client.setAccessToken('');

      await expect(client.mcpRequest({ method: 'tools/list' }))
        .rejects.toThrow('No access token available');
    });
  });

  describe('revokeToken', () => {
    beforeEach(() => {
      client.setAccessToken('test-access-token', 3600);
    });

    it('should revoke access token', async () => {
      const mockMetadata = {
        issuer: 'https://test-gateway.com',
        revocation_endpoint: 'https://test-gateway.com/revoke'
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadata)
        })
        .mockResolvedValueOnce({
          ok: true
        });

      await client.revokeToken();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-gateway.com/revoke',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );

      expect(client.getAccessToken()).toBeUndefined();
    });
  });

  describe('introspectToken', () => {
    beforeEach(() => {
      client.setAccessToken('test-access-token', 3600);
    });

    it('should introspect token', async () => {
      const mockMetadata = {
        issuer: 'https://test-gateway.com',
        introspection_endpoint: 'https://test-gateway.com/introspect'
      };

      const mockIntrospection = {
        active: true,
        scope: 'mcp:read mcp:write',
        client_id: 'test-client-id',
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadata)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockIntrospection)
        });

      const introspection = await client.introspectToken();

      expect(introspection).toEqual(mockIntrospection);
    });
  });

  describe('register', () => {
    it('should register new OAuth client', async () => {
      const mockMetadata = {
        issuer: 'https://test-gateway.com',
        registration_endpoint: 'https://test-gateway.com/register'
      };

      const mockRegistration = {
        client_id: 'new-client-id',
        client_secret: 'new-client-secret',
        client_secret_expires_at: 0,
        client_id_issued_at: Math.floor(Date.now() / 1000)
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetadata)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRegistration)
        });

      const registration = await OAuthMCPClient.register(
        'https://test-gateway.com',
        {
          client_name: 'Test Client',
          redirect_uris: ['https://test-app.com/callback']
        }
      );

      expect(registration).toEqual(mockRegistration);
    });
  });

  describe('token management', () => {
    it('should check token expiration', () => {
      // Token not set
      expect(client.isTokenExpired()).toBe(true);

      // Set token with future expiration
      client.setAccessToken('test-token', 3600);
      expect(client.isTokenExpired()).toBe(false);

      // Set token with past expiration
      client.setAccessToken('test-token', -3600);
      expect(client.isTokenExpired()).toBe(true);
    });

    it('should manage tokens manually', () => {
      client.setAccessToken('test-access-token');
      client.setRefreshToken('test-refresh-token');

      expect(client.getAccessToken()).toBe('test-access-token');
      expect(client.getRefreshToken()).toBe('test-refresh-token');
    });
  });
});