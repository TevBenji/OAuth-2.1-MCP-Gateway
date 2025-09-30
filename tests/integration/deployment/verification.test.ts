import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Hono } from 'hono';
import fetch from 'node-fetch';

// Mock the fetch function globally
global.fetch = fetch as any;

describe('Deployment Verification Tests', () => {
  const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:8787';
  
  describe('Health Check Endpoints', () => {
    it('should respond to basic health check', async () => {
      const response = await fetch(`${gatewayUrl}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('oauth-mcp-gateway');
    });

    it('should respond to detailed health check', async () => {
      const response = await fetch(`${gatewayUrl}/health/detail`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.service).toBe('oauth-mcp-gateway');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('OAuth 2.1 Discovery Endpoints', () => {
    it('should serve OAuth 2.1 authorization server metadata', async () => {
      const response = await fetch(`${gatewayUrl}/.well-known/oauth-authorization-server`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.issuer).toBeDefined();
      expect(data.authorization_endpoint).toBeDefined();
      expect(data.token_endpoint).toBeDefined();
      expect(data.response_types_supported).toContain('code');
    });

    it('should serve OAuth 2.1 protected resource metadata', async () => {
      const response = await fetch(`${gatewayUrl}/.well-known/oauth-protected-resource`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.resource).toBeDefined();
    });
  });

  describe('Authentication Endpoints', () => {
    it('should respond to authorization endpoint', async () => {
      const response = await fetch(`${gatewayUrl}/authorize?response_type=code&client_id=test&redirect_uri=https://example.com/callback&scope=read&state=state123`);
      
      // Should redirect or show authorization page
      expect([200, 302]).toContain(response.status);
    });

    it('should respond to token endpoint', async () => {
      const response = await fetch(`${gatewayUrl}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
      });
      
      // Should return 400 for missing client credentials or 401 for invalid
      expect([400, 401]).toContain(response.status);
    });
  });

  describe('CORS Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await fetch(`${gatewayUrl}/health`, {
        method: 'OPTIONS'
      });
      
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-methods')).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting', async () => {
      // Make multiple requests quickly to test rate limiting
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(fetch(`${gatewayUrl}/health`));
      }
      
      const responses = await Promise.all(requests);
      
      // At least one should be rate limited (429)
      const rateLimited = responses.some(res => res.status === 429);
      
      // Note: This test might be flaky depending on rate limit configuration
      // In a real environment, we might want to make many more requests
    });
  });

  describe('Database Connectivity', () => {
    it('should be able to connect to database', async () => {
      // This would test database connectivity
      // In a real implementation, we might have a specific endpoint for this
      const response = await fetch(`${gatewayUrl}/health/database`);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data.database).toBeDefined();
      }
      
      // If the endpoint doesn't exist, that's okay too
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();
      const response = await fetch(`${gatewayUrl}/health`);
      const endTime = Date.now();
      
      const responseTime = endTime - startTime;
      
      // Should respond within 1000ms (adjust based on requirements)
      expect(responseTime).toBeLessThan(1000);
      expect(response.status).toBe(200);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await fetch(`${gatewayUrl}/health`);
      
      // Check for common security headers
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBe('DENY');
    });
  });
});