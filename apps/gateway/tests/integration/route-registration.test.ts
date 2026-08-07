/**
 * Route Registration Smoke Tests
 *
 * Basic smoke tests to verify that OAuth 2.1 and MCP Gateway routes are properly registered.
 */

import { describe, it, expect } from 'vitest';
import app from '../../src/index';
import { makeTestEnv } from '../helpers/env';

describe('Route Registration Smoke Tests', () => {
  const mockEnv = makeTestEnv();

  describe('OAuth 2.1 Routes - Basic Registration', () => {
    it('should register OAuth discovery endpoint', async () => {
      const response = await app.request('/.well-known/oauth-authorization-server', {}, mockEnv);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('issuer');
      expect(body).toHaveProperty('authorization_endpoint');
      expect(body).toHaveProperty('token_endpoint');
    });

    it('should register OAuth authorization endpoint (POST)', async () => {
      const response = await app.request(
        '/oauth/authorize',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'response_type=code&client_id=test&redirect_uri=http://test.com',
        },
        mockEnv
      );

      // Should handle the request (may redirect or return error)
      expect([302, 400, 401]).toContain(response.status);
    });

    it('should register OAuth authorization endpoint (GET)', async () => {
      const response = await app.request(
        '/oauth/authorize?response_type=code&client_id=test',
        {},
        mockEnv
      );

      // Should handle the request
      expect([302, 400, 401]).toContain(response.status);
    });

    it('should register OAuth token endpoint', async () => {
      const response = await app.request(
        '/oauth/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=authorization_code&code=test',
        },
        mockEnv
      );

      // Should handle the request
      expect([200, 400, 401]).toContain(response.status);
    });

    it('should register OAuth client registration endpoint', async () => {
      const response = await app.request(
        '/oauth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_name: 'Test Client' }),
        },
        mockEnv
      );

      // Should handle the request
      expect([201, 400, 415]).toContain(response.status);
    });
  });

  describe('MCP Gateway Routes - Basic Registration', () => {
    it('should register MCP health check endpoint', async () => {
      const response = await app.request('/mcp/health', {}, mockEnv);

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('status', 'healthy');
      expect(body).toHaveProperty('service', 'mcp-gateway');
    });

    it('should register MCP proxy route by server ID', async () => {
      const response = await app.request(
        '/mcp/test-server/tools',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ method: 'tools/list' }),
        },
        mockEnv
      );

      // Should require authentication
      expect([401, 403, 500]).toContain(response.status);
    });

    it('should register MCP proxy route by resource identifier', async () => {
      const response = await app.request(
        '/mcp/resource/data',
        {
          method: 'GET',
          headers: { 'X-Resource-Identifier': 'test-resource' },
        },
        mockEnv
      );

      // Should require authentication
      expect([401, 403, 500]).toContain(response.status);
    });
  });

  describe('Legacy Route Compatibility', () => {
    it('should no longer expose the legacy authorize endpoint (removed as duplicate)', async () => {
      const response = await app.request(
        '/authorize?response_type=code&client_id=test',
        {},
        mockEnv
      );

      expect(response.status).toBe(404);
    });

    it('should no longer expose the legacy token endpoint (removed as duplicate)', async () => {
      const response = await app.request(
        '/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'grant_type=authorization_code&code=test',
        },
        mockEnv
      );

      expect(response.status).toBe(404);
    });

    it('should support legacy register endpoint', async () => {
      const response = await app.request(
        '/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_name: 'Test Client' }),
        },
        mockEnv
      );

      expect([201, 400, 415]).toContain(response.status);
    });
  });

  describe('Health and Status Endpoints', () => {
    it('should provide main health check', async () => {
      const response = await app.request('/health', {}, mockEnv);

      expect(response.status).toBe(200);
    });

    it('should handle CORS preflight requests', async () => {
      const response = await app.request(
        '/oauth/token',
        {
          method: 'OPTIONS',
          headers: {
            Origin: 'https://client.example.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization',
          },
        },
        mockEnv
      );

      expect(response.status).toBe(204); // CORS preflight returns 204 No Content
    });
  });

  describe('Route Structure Verification', () => {
    it('should have proper OAuth 2.1 endpoints', async () => {
      const discoveryResponse = await app.request(
        '/.well-known/oauth-authorization-server',
        {},
        mockEnv
      );
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
      const healthResponse = await app.request('/mcp/health', {}, mockEnv);

      expect(healthResponse.status).toBe(200);

      const health = await healthResponse.json();
      expect(health.service).toBe('mcp-gateway');
      expect(health.status).toBe('healthy');
    });
  });
});
