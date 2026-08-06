/**
 * OAuth Client Registration Integration Tests
 * 
 * End-to-end tests for the Dynamic Client Registration endpoint (RFC 7591).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../../src/index';
import type { ClientRegistrationRequest, ClientRegistrationResponse, OAuthError } from '../../src/types/oauth';

// Test environment setup
const testEnv = {
  DB: {
    prepare: () => ({
      bind: () => ({
        first: () => null,
        run: () => ({ success: true, changes: 1 }),
        all: () => []
      })
    })
  },
  JWT_ISSUER: 'https://test.oauth-mcp-gateway.com',
  ENVIRONMENT: 'test'
};

describe('OAuth Client Registration Integration', () => {
  describe('POST /register', () => {
    const validRegistrationRequest: ClientRegistrationRequest = {
      redirect_uris: ['https://example.com/callback', 'https://app.example.com/auth'],
      client_name: 'Test MCP Client',
      client_uri: 'https://example.com',
      logo_uri: 'https://example.com/logo.png',
      scope: 'mcp:tools:read mcp:resources:read',
      contacts: ['admin@example.com', 'support@example.com'],
      tos_uri: 'https://example.com/terms',
      policy_uri: 'https://example.com/privacy',
      token_endpoint_auth_method: 'client_secret_post',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code']
    };

    it('should register a new client successfully', async () => {
      const response = await app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'test-tenant'
        },
        body: JSON.stringify(validRegistrationRequest)
      }, testEnv);

      expect(response.status).toBe(201);
      
      const result: ClientRegistrationResponse = await response.json();
      
      expect(result).toMatchObject({
        client_id: expect.stringMatching(/^mcp_client_[a-f0-9]{32}$/),
        client_secret: expect.stringMatching(/^mcp_secret_[A-Za-z0-9_-]+$/),
        client_id_issued_at: expect.any(Number),
        client_secret_expires_at: expect.any(Number),
        redirect_uris: validRegistrationRequest.redirect_uris,
        grant_types: validRegistrationRequest.grant_types,
        response_types: validRegistrationRequest.response_types,
        client_name: validRegistrationRequest.client_name,
        client_uri: validRegistrationRequest.client_uri,
        logo_uri: validRegistrationRequest.logo_uri,
        scope: validRegistrationRequest.scope,
        contacts: validRegistrationRequest.contacts,
        tos_uri: validRegistrationRequest.tos_uri,
        policy_uri: validRegistrationRequest.policy_uri,
        token_endpoint_auth_method: validRegistrationRequest.token_endpoint_auth_method
      });

      // Verify response headers
      expect(response.headers.get('Content-Type')).toBe('application/json; charset=UTF-8');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
      expect(response.headers.get('Pragma')).toBe('no-cache');
    });

    it('should register a minimal client with defaults', async () => {
      const minimalRequest: ClientRegistrationRequest = {
        redirect_uris: ['https://minimal.example.com/callback']
      };

      const response = await app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(minimalRequest)
      }, testEnv);

      expect(response.status).toBe(201);
      
      const result: ClientRegistrationResponse = await response.json();
      
      expect(result.redirect_uris).toEqual(minimalRequest.redirect_uris);
      expect(result.grant_types).toEqual(['authorization_code', 'refresh_token']);
      expect(result.response_types).toEqual(['code']);
      expect(result.token_endpoint_auth_method).toBe('client_secret_post');
      expect(result.client_secret).toBeDefined();
    });

    it('should register a public client without client_secret', async () => {
      const publicClientRequest: ClientRegistrationRequest = {
        redirect_uris: ['https://public.example.com/callback'],
        token_endpoint_auth_method: 'none',
        client_name: 'Public MCP Client'
      };

      const response = await app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(publicClientRequest)
      }, testEnv);

      expect(response.status).toBe(201);
      
      const result: ClientRegistrationResponse = await response.json();
      
      expect(result.client_secret).toBeUndefined();
      expect(result.client_secret_expires_at).toBeUndefined();
      expect(result.token_endpoint_auth_method).toBe('none');
    });

    it('should reject invalid redirect URIs', async () => {
      const invalidRequests = [
        // HTTP URI (not localhost)
        {
          ...validRegistrationRequest,
          redirect_uris: ['http://example.com/callback']
        },
        // URI with fragment
        {
          ...validRegistrationRequest,
          redirect_uris: ['https://example.com/callback#fragment']
        },
        // Invalid URL format
        {
          ...validRegistrationRequest,
          redirect_uris: ['not-a-valid-url']
        }
      ];

      for (const invalidRequest of invalidRequests) {
        const response = await app.request('/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(invalidRequest)
        }, testEnv);

        expect(response.status).toBe(400);
        
        const error: OAuthError = await response.json();
        expect(error.error).toBe('invalid_request');
        expect(error.error_description).toContain('Invalid');
      }
    });

    it('should accept localhost HTTP URIs for development', async () => {
      const localhostRequest: ClientRegistrationRequest = {
        redirect_uris: [
          'http://localhost:3000/callback',
          'http://127.0.0.1:8080/auth',
          'http://[::1]:3000/callback'
        ]
      };

      const response = await app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(localhostRequest)
      }, testEnv);

      expect(response.status).toBe(201);
      
      const result: ClientRegistrationResponse = await response.json();
      expect(result.redirect_uris).toEqual(localhostRequest.redirect_uris);
    });

    it('should accept custom scheme URIs for native apps', async () => {
      const nativeAppRequest: ClientRegistrationRequest = {
        redirect_uris: [
          'com.example.myapp://oauth/callback',
          'myapp://auth'
        ]
      };

      const response = await app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nativeAppRequest)
      }, testEnv);

      expect(response.status).toBe(201);
      
      const result: ClientRegistrationResponse = await response.json();
      expect(result.redirect_uris).toEqual(nativeAppRequest.redirect_uris);
    });

    it('should reject unsupported grant types', async () => {
      const invalidRequest = {
        ...validRegistrationRequest,
        grant_types: ['authorization_code', 'implicit'] // implicit not supported
      };

      const response = await app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidRequest)
      }, testEnv);

      expect(response.status).toBe(400);
      
      const error: OAuthError = await response.json();
      expect(error.error).toBe('invalid_request');
      expect(error.error_description).toContain('Invalid enum value');
    });

    it('should reject unsupported response types', async () => {
      const invalidRequest = {
        ...validRegistrationRequest,
        response_types: ['token'] // token not supported
      };

      const response = await app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidRequest)
      }, testEnv);

      expect(response.status).toBe(400);
      
      const error: OAuthError = await response.json();
      expect(error.error).toBe('invalid_request');
      expect(error.error_description).toContain('Invalid literal value');
    });

    it('should reject invalid email contacts', async () => {
      const invalidRequest = {
        ...validRegistrationRequest,
        contacts: ['not-an-email', 'admin@example.com']
      };

      const response = await app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidRequest)
      }, testEnv);

      expect(response.status).toBe(400);
      
      const error: OAuthError = await response.json();
      expect(error.error).toBe('invalid_request');
      expect(error.error_description).toContain('Invalid email');
    });

    it('should reject invalid scope format', async () => {
      const invalidRequest = {
        ...validRegistrationRequest,
        scope: 'invalid scope with\tcontrol\ncharacters'
      };

      const response = await app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidRequest)
      }, testEnv);

      expect(response.status).toBe(400);
      
      const error: OAuthError = await response.json();
      expect(error.error).toBe('invalid_request');
      expect(error.error_description).toContain('Invalid scope format');
    });

    it('should reject malformed JSON', async () => {
      const response = await app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{"invalid": json}'
      }, testEnv);

      expect(response.status).toBe(400);
    });

    it('should reject missing redirect_uris', async () => {
      const invalidRequest = {
        client_name: 'Test Client'
        // Missing redirect_uris
      };

      const response = await app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidRequest)
      }, testEnv);

      expect(response.status).toBe(400);
      
      const error: OAuthError = await response.json();
      expect(error.error).toBe('invalid_request');
      expect(error.error_description).toContain('Required');
    });

    it('should handle CORS preflight request', async () => {
      const response = await app.request('/register', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'POST'
        }
      }, testEnv);

      // CORS preflight should return 204 or 200
      expect([200, 204]).toContain(response.status);
    });
  });

  describe('Security Validations', () => {
    it('should generate cryptographically secure client_id', async () => {
      const requests = Array(10).fill(null).map(() => app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          redirect_uris: ['https://example.com/callback']
        })
      }, testEnv));

      const responses = await Promise.all(requests);
      const clientIds = await Promise.all(
        responses.map(async (r) => {
          const result: ClientRegistrationResponse = await r.json();
          return result.client_id;
        })
      );

      // All client_ids should be unique
      const uniqueIds = new Set(clientIds);
      expect(uniqueIds.size).toBe(clientIds.length);

      // All should match the expected format
      clientIds.forEach(id => {
        expect(id).toMatch(/^mcp_client_[a-f0-9]{32}$/);
      });
    });

    it('should generate cryptographically secure client_secret', async () => {
      const requests = Array(10).fill(null).map(() => app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          redirect_uris: ['https://example.com/callback']
        })
      }, testEnv));

      const responses = await Promise.all(requests);
      const clientSecrets = await Promise.all(
        responses.map(async (r) => {
          const result: ClientRegistrationResponse = await r.json();
          return result.client_secret!;
        })
      );

      // All client_secrets should be unique
      const uniqueSecrets = new Set(clientSecrets);
      expect(uniqueSecrets.size).toBe(clientSecrets.length);

      // All should match the expected format and have sufficient entropy
      clientSecrets.forEach(secret => {
        expect(secret).toMatch(/^mcp_secret_[A-Za-z0-9_-]+$/);
        expect(secret.length).toBeGreaterThan(20);
      });
    });

    it('should set appropriate client_secret expiration', async () => {
      const response = await app.request('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          redirect_uris: ['https://example.com/callback']
        })
      }, testEnv);

      const result: ClientRegistrationResponse = await response.json();
      
      expect(result.client_secret_expires_at).toBeDefined();
      
      const now = Math.floor(Date.now() / 1000);
      const oneYear = 365 * 24 * 60 * 60;
      
      // Should expire in approximately one year
      expect(result.client_secret_expires_at!).toBeGreaterThan(now + oneYear - 3600);
      expect(result.client_secret_expires_at!).toBeLessThan(now + oneYear + 3600);
    });
  });
});