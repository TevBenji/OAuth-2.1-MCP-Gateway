/**
 * Route Registration Smoke Tests
 *
 * Basic smoke tests to verify that OAuth 2.1 and MCP Gateway routes are properly registered.
 */

import { describe, it, expect } from 'vitest';
import app from '../../src/index';

describe('Route Registration Smoke Tests', () => {
  // Basic mock environment for testing
  const mockEnv = {
    SESSIONS: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
    },
    CACHE: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
    },
    RATE_LIMIT_KV: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
    },
    RATE_LIMIT: {
      get: async () => null,
      put: async () => {},
      delete: async () => {},
    },
    DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => null,
          run: async () => ({ success: true, results: [] }),
          all: async () => ({ success: true, results: [] }),
        }),
      }),
    },
    ENVIRONMENT: 'test',
    JWT_ISSUER: 'https://test.oauth-mcp-gateway.com',
  };

  describe('OAuth 2.1 Routes - Basic Registration', () => {
    it('should register OAuth discovery endpoint', async () => {
      const request = new Request(
        'https://test.oauth-mcp-gateway.com/.well-known/oauth-authorization-server'
      );

      const response = await app.request(request, mockEnv);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('issuer');
      expect(body).toHaveProperty('authorization_endpoint');
      expect(body).toHaveProperty('token_endpoint');
    });

    it('should register OAuth authorization endpoint (POST)', async () => {
      const request = new Request('https://test.oauth-mcp-gateway.com/oauth/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'response_type=code&client_id=test&redirect_uri=http://test.com',
      });

      const response = await app.request(request, mockEnv);

      // Should handle the request (may redirect or return error)
      expect([302, 400, 401]).toContain(response.status);
    });

    it('should register OAuth authorization endpoint (GET)', async () => {
      const request = new Request(
        'https://test.oauth-mcp-gateway.com/oauth/authorize?response_type=code&client_id=test'
      );

      const response = await app.request(request, mockEnv);

      // Should handle the request
      expect([302, 400, 401]).toContain(response.status);
    });

    it('should register OAuth token endpoint', async () => {
      const request = new Request('https://test.oauth-mcp-gateway.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=authorization_code&code=test',
      });

      const response = await app.request(request, mockEnv);

      // Should handle the request
      expect([200, 400, 401]).toContain(response.status);
    });

    it('should register OAuth client registration endpoint', async () => {
      const request = new Request('https://test.oauth-mcp-gateway.com/oauth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_name: 'Test Client' }),
      });

      const response = await app.request(request, mockEnv);

      // Should handle the request
      expect([201, 400, 415]).toContain(response.status);
    });
  });

  describe('MCP Gateway Routes - Basic Registration', () => {
    it('should register MCP health check endpoint', async () => {
      const request = new Request('https://test.oauth-mcp-gateway.com/mcp/health');

      const response = await app.request(request, mockEnv);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status', 'healthy');
      expect(body).toHaveProperty('service', 'mcp-gateway');
    });

    it('should register MCP proxy route by server ID', async () => {
      const request = new Request('https://test.oauth-mcp-gateway.com/mcp/test-server/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'tools/list' }),
      });

      const response = await app.request(request, mockEnv);

      // Should require authentication
      expect([401, 403, 500]).toContain(response.status);
    });

    it('should register MCP proxy route by resource identifier', async () => {
      const request = new Request('https://test.oauth-mcp-gateway.com/mcp/resource/data', {
        method: 'GET',
        headers: { 'X-Resource-Identifier': 'test-resource' },
      });

      const response = await app.request(request, mockEnv);

      // Should require authentication
      expect([401, 403, 500]).toContain(response.status);
    });
  });

  describe('Legacy Route Compatibility', () => {
    it('should support legacy authorize endpoint', async () => {
      const request = new Request(
        'https://test.oauth-mcp-gateway.com/authorize?response_type=code&client_id=test'
      );

      const response = await app.request(request, mockEnv);

      expect([302, 400, 401]).toContain(response.status);
    });

    it('should support legacy token endpoint', async () => {
      const request = new Request('https://test.oauth-mcp-gateway.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=authorization_code&code=test',
      });

      const response = await app.request(request, mockEnv);

      expect([200, 400, 401]).toContain(response.status);
    });

    it('should support legacy register endpoint', async () => {
      const request = new Request('https://test.oauth-mcp-gateway.com/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_name: 'Test Client' }),
      });

      const response = await app.request(request, mockEnv);

      expect([201, 400, 415]).toContain(response.status);
    });
  });

  describe('Health and Status Endpoints', () => {
    it('should provide main health check', async () => {
      const request = new Request('https://test.oauth-mcp-gateway.com/health');

      const response = await app.request(request, mockEnv);

      expect(response.status).toBe(200);
    });

    it('should handle CORS preflight requests', async () => {
      const request = new Request('https://test.oauth-mcp-gateway.com/oauth/token', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://client.example.com',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        },
      });

      const response = await app.request(request, mockEnv);

      expect(response.status).toBe(204); // CORS preflight returns 204 No Content
      // CORS headers may not be set in test environment, but the request should be handled
      expect([204, 200]).toContain(response.status);
    });
  });

  describe('Route Structure Verification', () => {
    it('should have proper OAuth 2.1 endpoints', async () => {
      const discoveryRequest = new Request(
        'https://test.oauth-mcp-gateway.com/.well-known/oauth-authorization-server'
      );
      const discoveryResponse = await app.request(discoveryRequest, mockEnv);
      const discovery = await discoveryResponse.json();

      // Verify OAuth 2.1 compliance
      expect(discovery.authorization_endpoint).toContain('/authorize');
      expect(discovery.token_endpoint).toContain('/token');
      expect(discovery.registration_endpoint).toContain('/register');
      expect(discovery.scopes_supported).toContain('mcp:tools:read');
      expect(discovery.scopes_supported).toContain('mcp:resources:read');
      expect(discovery.response_types_supported).toContain('code');
      expect(discovery.grant_types_supported).toContain('authorization_code');
      expect(discovery.code_challenge_methods_supported).toContain('S256');
    });

    it('should have proper MCP gateway structure', async () => {
      // Test that MCP routes follow the expected pattern
      const healthRequest = new Request('https://test.oauth-mcp-gateway.com/mcp/health');
      const healthResponse = await app.request(healthRequest, mockEnv);

      expect(healthResponse.status).toBe(200);

      const health = await healthResponse.json();
      expect(health.service).toBe('mcp-gateway');
      expect(health.status).toBe('healthy');
    });
  });
});
