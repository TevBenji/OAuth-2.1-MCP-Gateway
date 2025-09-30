/**
 * Application Integration Tests
 * 
 * Test the main Hono application endpoints and middleware.
 */

import { describe, it, expect } from 'vitest';
import app from '@/index';
import { mockEnv } from '../setup';

// Type assertion helper for tests
const testEnv = mockEnv as any;

describe('Application Integration', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const req = new Request('https://test.oauth-mcp-gateway.com/health');
      const res = await app.request(req, testEnv);
      
      expect(res.status).toBe(200);
      
      const body = await res.json() as any;
      expect(body.status).toBe('healthy');
      expect(body.timestamp).toBeDefined();
      expect(body.version).toBe('1.0.0');
    });
  });
  
  describe('OAuth Discovery', () => {
    it('should return authorization server metadata', async () => {
      const req = new Request('https://test.oauth-mcp-gateway.com/.well-known/oauth-authorization-server');
      const res = await app.request(req, testEnv);
      
      expect(res.status).toBe(200);
      
      const body = await res.json() as any;
      expect(body.issuer).toBe(mockEnv.JWT_ISSUER);
      expect(body.authorization_endpoint).toBe(`${mockEnv.JWT_ISSUER}/authorize`);
      expect(body.token_endpoint).toBe(`${mockEnv.JWT_ISSUER}/token`);
      expect(body.registration_endpoint).toBe(`${mockEnv.JWT_ISSUER}/register`);
      expect(body.code_challenge_methods_supported).toContain('S256');
      expect(body.response_types_supported).toContain('code');
      expect(body.grant_types_supported).toContain('authorization_code');
      expect(body.grant_types_supported).toContain('refresh_token');
    });
  });
  
  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const req = new Request('https://test.oauth-mcp-gateway.com/health', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://claude.ai',
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const res = await app.request(req, testEnv);
      
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://claude.ai');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });
    
    it('should reject unauthorized origins', async () => {
      const req = new Request('https://test.oauth-mcp-gateway.com/health', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://malicious-site.com',
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      const res = await app.request(req, testEnv);
      
      // CORS middleware should not set Access-Control-Allow-Origin for unauthorized origins
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });
  
  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const req = new Request('https://test.oauth-mcp-gateway.com/unknown-endpoint');
      const res = await app.request(req, testEnv);
      
      expect(res.status).toBe(404);
      
      const body = await res.json() as any;
      expect(body.error).toBe('Not Found');
    });
  });
  
  describe('Content Type', () => {
    it('should return JSON content type for API endpoints', async () => {
      const req = new Request('https://test.oauth-mcp-gateway.com/health');
      const res = await app.request(req, testEnv);
      
      expect(res.headers.get('Content-Type')).toContain('application/json');
    });
    
    it('should return JSON content type for discovery endpoints', async () => {
      const req = new Request('https://test.oauth-mcp-gateway.com/.well-known/oauth-authorization-server');
      const res = await app.request(req, testEnv);
      
      expect(res.headers.get('Content-Type')).toContain('application/json');
    });
  });
});