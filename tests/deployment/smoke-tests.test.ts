/**
 * Smoke Tests for Production Deployment
 * Critical functionality tests to verify production deployment
 */

import { describe, test, expect, beforeAll } from 'vitest';

const GATEWAY_URL = process.env.GATEWAY_URL || 'https://oauth-mcp-gateway.example.com';
const API_KEY = process.env.API_KEY || '';
const TIMEOUT = 10000; // 10 seconds for production

describe('Production Smoke Tests', () => {
  let baseUrl: string;

  beforeAll(() => {
    baseUrl = GATEWAY_URL.replace(/\/$/, '');
    console.log(`Running smoke tests against: ${baseUrl}`);
    
    if (!API_KEY) {
      console.warn('No API_KEY provided, some tests may fail');
    }
  });

  describe('Critical Endpoints', () => {
    test('health endpoint is accessible', async () => {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('healthy');
    }, TIMEOUT);

    test('OAuth discovery is working', async () => {
      const response = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
      expect(response.status).toBe(200);
      
      const metadata = await response.json();
      expect(metadata.issuer).toBeTruthy();
      expect(metadata.authorization_endpoint).toBeTruthy();
      expect(metadata.token_endpoint).toBeTruthy();
    }, TIMEOUT);

    test('HTTPS is enforced', async () => {
      expect(baseUrl).toMatch(/^https:/);
    }, TIMEOUT);
  });

  describe('Security Validation', () => {
    test('security headers are present', async () => {
      const response = await fetch(`${baseUrl}/health`);
      
      expect(response.headers.get('strict-transport-security')).toBeTruthy();
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-frame-options')).toBe('DENY');
    }, TIMEOUT);

    test('unauthorized requests are rejected', async () => {
      const response = await fetch(`${baseUrl}/oauth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          redirect_uris: ['https://example.com/callback']
        })
      });

      expect(response.status).toBe(401);
    }, TIMEOUT);
  });

  describe('Performance Validation', () => {
    test('response time is acceptable', async () => {
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/health`);
      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500); // Sub-500ms for production
    }, TIMEOUT);
  });

  describe('Availability', () => {
    test('service is available and responsive', async () => {
      // Test multiple endpoints to ensure overall availability
      const endpoints = [
        '/health',
        '/.well-known/oauth-authorization-server',
        '/.well-known/oauth-protected-resource'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`${baseUrl}${endpoint}`);
        expect(response.status).toBeLessThan(500); // No server errors
      }
    }, TIMEOUT);
  });
});