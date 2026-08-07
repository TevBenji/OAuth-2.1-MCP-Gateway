/**
 * Application Integration Tests
 *
 * Test the main Hono application endpoints and middleware.
 */

import { describe, it, expect } from 'vitest';
import app from '@/index';
import { makeTestEnv } from '../helpers/env';

const testEnv = makeTestEnv();

describe('Application Integration', () => {
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await app.request('/health', {}, testEnv);

      expect(res.status).toBe(200);

      const body = await res.json() as any;
      expect(body.status).toBe('healthy');
      expect(body.timestamp).toBeDefined();
      expect(body.version).toBe('1.0.0');
    });
  });

  describe('OAuth Discovery', () => {
    it('should return authorization server metadata', async () => {
      const res = await app.request('/.well-known/oauth-authorization-server', {}, testEnv);

      expect(res.status).toBe(200);

      const body = await res.json() as any;
      expect(body.issuer).toBe(testEnv.JWT_ISSUER);
      expect(body.authorization_endpoint).toBe(`${testEnv.JWT_ISSUER}/oauth/authorize`);
      expect(body.token_endpoint).toBe(`${testEnv.JWT_ISSUER}/oauth/token`);
      expect(body.registration_endpoint).toBe(`${testEnv.JWT_ISSUER}/oauth/register`);
      expect(body.code_challenge_methods_supported).toContain('S256');
      expect(body.response_types_supported).toContain('code');
      expect(body.grant_types_supported).toContain('authorization_code');
      expect(body.grant_types_supported).toContain('refresh_token');
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests for allowed origins', async () => {
      const res = await app.request(
        '/health',
        {
          method: 'OPTIONS',
          headers: {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
          },
        },
        testEnv
      );

      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
      expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('should reject unauthorized origins', async () => {
      const res = await app.request(
        '/health',
        {
          method: 'OPTIONS',
          headers: {
            'Origin': 'https://malicious-site.com',
            'Access-Control-Request-Method': 'GET',
          },
        },
        testEnv
      );

      // CORS middleware should not set Access-Control-Allow-Origin for unauthorized origins
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const res = await app.request('/unknown-endpoint', {}, testEnv);

      expect(res.status).toBe(404);

      const body = await res.json() as any;
      expect(body.error).toBe('Not Found');
    });
  });

  describe('Content Type', () => {
    it('should return JSON content type for API endpoints', async () => {
      const res = await app.request('/health', {}, testEnv);

      expect(res.headers.get('Content-Type')).toContain('application/json');
    });

    it('should return JSON content type for discovery endpoints', async () => {
      const res = await app.request('/.well-known/oauth-authorization-server', {}, testEnv);

      expect(res.headers.get('Content-Type')).toContain('application/json');
    });
  });
});
