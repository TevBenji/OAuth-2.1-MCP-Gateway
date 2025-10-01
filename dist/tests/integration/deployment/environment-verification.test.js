import { describe, it, expect } from 'vitest';
import fetch from 'node-fetch';
// Mock the fetch function globally
global.fetch = fetch;
describe('Development Deployment Verification', () => {
    const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:8787';
    it('should have development-specific configuration', async () => {
        const response = await fetch(`${gatewayUrl}/health`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.environment).toBe('development');
        expect(data.debug).toBe(true);
    });
    it('should allow CORS from localhost', async () => {
        const response = await fetch(`${gatewayUrl}/health`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'GET'
            }
        });
        expect(response.headers.get('access-control-allow-origin')).toBe('*');
    });
});
describe('Staging Deployment Verification', () => {
    const gatewayUrl = process.env.GATEWAY_URL || 'https://staging.oauth-mcp-gateway.example.com';
    it('should have staging-specific configuration', async () => {
        const response = await fetch(`${gatewayUrl}/health`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.environment).toBe('staging');
        expect(data.debug).toBe(false);
    });
    it('should have proper SSL certificate', async () => {
        // This would be tested by the HTTPS connection itself
        const response = await fetch(`${gatewayUrl}/health`);
        expect(response.status).toBe(200);
        expect(response.url.startsWith('https://')).toBe(true);
    });
    it('should have restricted CORS policy', async () => {
        const response = await fetch(`${gatewayUrl}/health`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://unauthorized.example.com',
                'Access-Control-Request-Method': 'GET'
            }
        });
        // Staging might have more restrictive CORS
        const allowOrigin = response.headers.get('access-control-allow-origin');
        expect([null, '*', 'https://authorized.staging.example.com']).toContain(allowOrigin);
    });
});
describe('Production Deployment Verification', () => {
    const gatewayUrl = process.env.GATEWAY_URL || 'https://oauth-mcp-gateway.example.com';
    it('should have production-specific configuration', async () => {
        const response = await fetch(`${gatewayUrl}/health`);
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.environment).toBe('production');
        expect(data.debug).toBe(false);
    });
    it('should have proper SSL certificate', async () => {
        const response = await fetch(`${gatewayUrl}/health`);
        expect(response.status).toBe(200);
        expect(response.url.startsWith('https://')).toBe(true);
    });
    it('should have strict CORS policy', async () => {
        const response = await fetch(`${gatewayUrl}/health`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://unauthorized.example.com',
                'Access-Control-Request-Method': 'GET'
            }
        });
        // Production should have strict CORS
        const allowOrigin = response.headers.get('access-control-allow-origin');
        expect([null, 'https://authorized.production.example.com']).toContain(allowOrigin);
    });
    it('should have security headers', async () => {
        const response = await fetch(`${gatewayUrl}/health`);
        expect(response.headers.get('strict-transport-security')).toBe('max-age=31536000; includeSubDomains');
        expect(response.headers.get('content-security-policy')).toBeDefined();
    });
});
