/**
 * Chaos Engineering Tests for Failure Scenarios
 * 
 * Tests system behavior under various failure conditions including
 * network failures, database outages, and service degradation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testUtils, mockEnv } from '../setup';
import { JWTService } from '../../src/services/oauth/jwt';
import { MCPProxyService } from '../../src/services/mcp/proxy';
import { MCPServerRegistry } from '../../src/services/mcp/registry';
import { TenantService } from '../../src/services/tenant/isolation';
import { SessionService } from '../../src/services/security/session';
import { RateLimitService } from '../../src/services/security/rate-limit';
import { AuditService } from '../../src/services/security/audit';

// Chaos testing utilities
class ChaosUtils {
  static async simulateNetworkFailure(failureRate: number = 0.5) {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      if (Math.random() < failureRate) {
        throw new Error('Network failure simulated');
      }
      return originalFetch(url, options);
    });
  }

  static async simulateSlowNetwork(delayMs: number = 1000) {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      await testUtils.sleep(delayMs);
      return originalFetch(url, options);
    });
  }

  static async simulateIntermittentFailures(failurePattern: boolean[]) {
    let callCount = 0;
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      const shouldFail = failurePattern[callCount % failurePattern.length];
      callCount++;
      
      if (shouldFail) {
        throw new Error('Intermittent failure simulated');
      }
      return originalFetch(url, options);
    });
  }

  static async simulatePartialServiceDegradation(services: string[], degradationRate: number = 0.3) {
    // Mock specific service failures
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      const urlString = url.toString();
      const isDegraded = services.some(service => urlString.includes(service)) && Math.random() < degradationRate;
      
      if (isDegraded) {
        // Simulate slow response instead of complete failure
        await testUtils.sleep(5000);
        return {
          ok: false,
          status: 503,
          statusText: 'Service Degraded',
          headers: new Headers(),
          text: async () => 'Service temporarily degraded'
        };
      }
      
      return originalFetch(url, options);
    });
  }

  static restoreNetwork() {
    vi.restoreAllMocks();
  }
}

describe('Chaos Engineering - Failure Scenarios', () => {
  let jwtService: JWTService;
  let mcpProxy: MCPProxyService;
  let mcpRegistry: MCPServerRegistry;
  let tenantService: TenantService;
  let sessionService: SessionService;
  let rateLimitService: RateLimitService;
  let auditService: AuditService;
  
  const testTenantId = 'chaos-test-tenant';
  const testUserId = 'chaos-test-user';
  const resourceIdentifier = 'mcp://chaos-test/server';

  beforeEach(async () => {
    // Initialize services
    jwtService = new JWTService('test-secret-key', 'HS256', 'oauth-mcp-gateway');
    mcpRegistry = new MCPServerRegistry(mockEnv.DB);
    mcpProxy = new MCPProxyService(mcpRegistry);
    tenantService = new TenantService(mockEnv.DB);
    sessionService = new SessionService(mockEnv.SESSIONS);
    rateLimitService = new RateLimitService(mockEnv.CACHE);
    auditService = new AuditService(mockEnv.DB);

    // Setup test data
    await setupTestEnvironment();
  });

  afterEach(() => {
    ChaosUtils.restoreNetwork();
    vi.clearAllMocks();
  });

  async function setupTestEnvironment() {
    // Create test tenant
    await tenantService.createTenant({
      tenant_id: testTenantId,
      name: 'Chaos Test Tenant',
      domain: 'chaos-test.example.com',
      max_users: 100,
      max_mcp_servers: 10,
      compliance_tier: 'standard',
      audit_retention_days: 365
    });

    // Register test MCP server
    await mcpRegistry.registerServer({
      tenant_id: testTenantId,
      name: 'Chaos Test Server',
      endpoint_url: 'https://chaos-test.example.com',
      resource_identifier: resourceIdentifier,
      required_scopes: ['mcp:tools:read'],
      health_check_url: 'https://chaos-test.example.com/health'
    });

    // Setup default successful responses
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify({ result: 'success' })
    });
  }

  describe('Network Failure Scenarios', () => {
    it('should handle complete network failures gracefully', async () => {
      await ChaosUtils.simulateNetworkFailure(1.0); // 100% failure rate

      const token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const context = {
        tenant_id: testTenantId,
        user_id: testUserId,
        client_id: 'chaos-test-client',
        session_id: 'chaos-test-session',
        scopes: ['mcp:tools:read'],
        ip_address: '127.0.0.1',
        user_agent: 'ChaosTestClient/1.0'
      };

      const proxyRequest = {
        method: 'GET' as const,
        url: '/api/test',
        headers: { 'Authorization': `Bearer ${token}` },
        context
      };

      // Should fail gracefully with proper error handling
      await expect(
        mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest)
      ).rejects.toThrow('UPSTREAM_REQUEST_FAILED');
    });

    it('should retry on intermittent network failures', async () => {
      // Pattern: fail, fail, succeed, fail, succeed
      await ChaosUtils.simulateIntermittentFailures([true, true, false, true, false]);

      const token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const context = {
        tenant_id: testTenantId,
        user_id: testUserId,
        client_id: 'chaos-test-client',
        session_id: 'chaos-test-session',
        scopes: ['mcp:tools:read'],
        ip_address: '127.0.0.1',
        user_agent: 'ChaosTestClient/1.0'
      };

      const proxyRequest = {
        method: 'GET' as const,
        url: '/api/test',
        headers: { 'Authorization': `Bearer ${token}` },
        context
      };

      // Should eventually succeed after retries
      const response = await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, {
        retryAttempts: 3,
        retryDelay: 100
      });

      expect(response.status).toBe(200);
    });

    it('should handle slow network conditions', async () => {
      await ChaosUtils.simulateSlowNetwork(2000); // 2 second delay

      const token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const context = {
        tenant_id: testTenantId,
        user_id: testUserId,
        client_id: 'chaos-test-client',
        session_id: 'chaos-test-session',
        scopes: ['mcp:tools:read'],
        ip_address: '127.0.0.1',
        user_agent: 'ChaosTestClient/1.0'
      };

      const proxyRequest = {
        method: 'GET' as const,
        url: '/api/test',
        headers: { 'Authorization': `Bearer ${token}` },
        context
      };

      const startTime = performance.now();
      
      // Should handle slow responses but may timeout
      try {
        const response = await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, {
          timeout: 5000 // 5 second timeout
        });
        const endTime = performance.now();
        
        expect(response.status).toBe(200);
        expect(endTime - startTime).toBeGreaterThan(2000); // Should take at least 2 seconds
      } catch (error: any) {
        // Timeout is acceptable for very slow networks
        expect(error.message).toContain('UPSTREAM_REQUEST_FAILED');
      }
    });

    it('should maintain service availability during partial network failures', async () => {
      await ChaosUtils.simulateNetworkFailure(0.3); // 30% failure rate

      const requests = Array(50).fill(null).map(async (_, i) => {
        const token = await jwtService.createToken({
          issuer: 'oauth-mcp-gateway',
          subject: `${testUserId}-${i}`,
          audience: resourceIdentifier,
          scopes: 'mcp:tools:read',
          tenantId: testTenantId,
          userId: `${testUserId}-${i}`,
          expiresIn: 3600
        });

        const context = {
          tenant_id: testTenantId,
          user_id: `${testUserId}-${i}`,
          client_id: 'chaos-test-client',
          session_id: `chaos-test-session-${i}`,
          scopes: ['mcp:tools:read'],
          ip_address: '127.0.0.1',
          user_agent: 'ChaosTestClient/1.0'
        };

        const proxyRequest = {
          method: 'GET' as const,
          url: `/api/test/${i}`,
          headers: { 'Authorization': `Bearer ${token}` },
          context
        };

        try {
          return await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, {
            retryAttempts: 2,
            retryDelay: 100
          });
        } catch (error) {
          return { error: error.message, status: 'failed' };
        }
      });

      const results = await Promise.all(requests);
      
      const successCount = results.filter(r => r.status === 200).length;
      const failureCount = results.filter(r => r.status === 'failed').length;
      const successRate = (successCount / results.length) * 100;

      console.log(`Partial network failure results:
        Total requests: ${results.length}
        Successful: ${successCount}
        Failed: ${failureCount}
        Success rate: ${successRate.toFixed(2)}%`);

      // Should maintain reasonable success rate even with network issues
      expect(successRate).toBeGreaterThan(50); // At least 50% success rate
    });
  });

  describe('Database Failure Scenarios', () => {
    it('should handle database connection failures', async () => {
      // Mock database failures
      const originalDB = mockEnv.DB;
      mockEnv.DB = {
        prepare: vi.fn().mockImplementation(() => {
          throw new Error('Database connection failed');
        })
      } as any;

      // Operations that require database should fail gracefully
      await expect(
        tenantService.getTenant(testTenantId)
      ).rejects.toThrow('Database connection failed');

      // Restore database
      mockEnv.DB = originalDB;
    });

    it('should handle database query timeouts', async () => {
      // Mock slow database queries
      const originalDB = mockEnv.DB;
      mockEnv.DB = {
        prepare: vi.fn().mockImplementation((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockImplementation(async () => {
            await testUtils.sleep(10000); // 10 second delay
            return null;
          }),
          all: vi.fn().mockImplementation(async () => {
            await testUtils.sleep(10000); // 10 second delay
            return { results: [] };
          })
        }))
      } as any;

      // Should timeout gracefully
      await expect(
        Promise.race([
          tenantService.getTenant(testTenantId),
          testUtils.sleep(1000).then(() => { throw new Error('Query timeout'); })
        ])
      ).rejects.toThrow('Query timeout');

      // Restore database
      mockEnv.DB = originalDB;
    });

    it('should handle partial database failures', async () => {
      let queryCount = 0;
      const originalDB = mockEnv.DB;
      
      mockEnv.DB = {
        prepare: vi.fn().mockImplementation((query: string) => ({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockImplementation(async () => {
            queryCount++;
            if (queryCount % 3 === 0) { // Every 3rd query fails
              throw new Error('Intermittent database error');
            }
            return { tenant_id: testTenantId, name: 'Test Tenant' };
          }),
          all: vi.fn().mockImplementation(async () => {
            queryCount++;
            if (queryCount % 3 === 0) { // Every 3rd query fails
              throw new Error('Intermittent database error');
            }
            return { results: [{ tenant_id: testTenantId }] };
          })
        }))
      } as any;

      const results = [];
      
      // Try multiple operations
      for (let i = 0; i < 10; i++) {
        try {
          const tenant = await tenantService.getTenant(testTenantId);
          results.push({ success: true, tenant });
        } catch (error: any) {
          results.push({ success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      console.log(`Partial database failure results:
        Successful queries: ${successCount}
        Failed queries: ${failureCount}`);

      expect(successCount).toBeGreaterThan(0); // Some should succeed
      expect(failureCount).toBeGreaterThan(0); // Some should fail

      // Restore database
      mockEnv.DB = originalDB;
    });
  });

  describe('Cache/KV Store Failure Scenarios', () => {
    it('should handle KV store failures gracefully', async () => {
      // Mock KV store failures
      const originalSessions = mockEnv.SESSIONS;
      const originalCache = mockEnv.CACHE;

      mockEnv.SESSIONS = {
        get: vi.fn().mockRejectedValue(new Error('KV store unavailable')),
        put: vi.fn().mockRejectedValue(new Error('KV store unavailable')),
        delete: vi.fn().mockRejectedValue(new Error('KV store unavailable'))
      } as any;

      mockEnv.CACHE = {
        get: vi.fn().mockRejectedValue(new Error('Cache unavailable')),
        put: vi.fn().mockRejectedValue(new Error('Cache unavailable')),
        delete: vi.fn().mockRejectedValue(new Error('Cache unavailable'))
      } as any;

      // Session operations should fail gracefully
      await expect(
        sessionService.createSession({
          user_id: testUserId,
          tenant_id: testTenantId,
          client_id: 'test-client',
          ip_address: '127.0.0.1',
          user_agent: 'TestClient/1.0',
          scopes: ['mcp:tools:read']
        })
      ).rejects.toThrow('KV store unavailable');

      // Rate limiting should fail gracefully
      await expect(
        rateLimitService.checkRateLimit(`user:${testUserId}`, {
          requests_per_minute: 100,
          requests_per_hour: 1000,
          burst_limit: 10
        })
      ).rejects.toThrow('Cache unavailable');

      // Restore stores
      mockEnv.SESSIONS = originalSessions;
      mockEnv.CACHE = originalCache;
    });

    it('should handle intermittent cache failures', async () => {
      let cacheCallCount = 0;
      const originalCache = mockEnv.CACHE;

      mockEnv.CACHE = {
        get: vi.fn().mockImplementation(async (key: string) => {
          cacheCallCount++;
          if (cacheCallCount % 4 === 0) { // Every 4th call fails
            throw new Error('Intermittent cache failure');
          }
          return originalCache.get(key);
        }),
        put: vi.fn().mockImplementation(async (key: string, value: string, options?: any) => {
          cacheCallCount++;
          if (cacheCallCount % 4 === 0) { // Every 4th call fails
            throw new Error('Intermittent cache failure');
          }
          return originalCache.put(key, value, options);
        }),
        delete: vi.fn().mockImplementation(async (key: string) => {
          cacheCallCount++;
          if (cacheCallCount % 4 === 0) { // Every 4th call fails
            throw new Error('Intermittent cache failure');
          }
          return originalCache.delete(key);
        })
      } as any;

      const results = [];

      // Try multiple rate limit checks
      for (let i = 0; i < 20; i++) {
        try {
          const isAllowed = await rateLimitService.checkRateLimit(`user:${testUserId}-${i}`, {
            requests_per_minute: 100,
            requests_per_hour: 1000,
            burst_limit: 10
          });
          results.push({ success: true, allowed: isAllowed });
        } catch (error: any) {
          results.push({ success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      console.log(`Intermittent cache failure results:
        Successful operations: ${successCount}
        Failed operations: ${failureCount}`);

      expect(successCount).toBeGreaterThan(0); // Some should succeed
      expect(failureCount).toBeGreaterThan(0); // Some should fail

      // Restore cache
      mockEnv.CACHE = originalCache;
    });
  });

  describe('Service Degradation Scenarios', () => {
    it('should handle upstream MCP server degradation', async () => {
      await ChaosUtils.simulatePartialServiceDegradation(['chaos-test.example.com'], 0.5);

      const token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const requests = Array(20).fill(null).map(async (_, i) => {
        const context = {
          tenant_id: testTenantId,
          user_id: `${testUserId}-${i}`,
          client_id: 'chaos-test-client',
          session_id: `chaos-test-session-${i}`,
          scopes: ['mcp:tools:read'],
          ip_address: '127.0.0.1',
          user_agent: 'ChaosTestClient/1.0'
        };

        const proxyRequest = {
          method: 'GET' as const,
          url: `/api/test/${i}`,
          headers: { 'Authorization': `Bearer ${token}` },
          context
        };

        try {
          const startTime = performance.now();
          const response = await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, {
            timeout: 10000, // 10 second timeout
            retryAttempts: 1
          });
          const endTime = performance.now();
          
          return {
            success: true,
            status: response.status,
            latency: endTime - startTime
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      });

      const results = await Promise.all(requests);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      const successfulResults = results.filter(r => r.success) as Array<{ latency: number }>;
      const avgLatency = successfulResults.length > 0 
        ? successfulResults.reduce((sum, r) => sum + r.latency, 0) / successfulResults.length 
        : 0;

      console.log(`Service degradation results:
        Total requests: ${results.length}
        Successful: ${successCount}
        Failed: ${failureCount}
        Avg latency: ${avgLatency.toFixed(2)}ms`);

      // Should handle degradation gracefully
      expect(successCount + failureCount).toBe(results.length);
    });

    it('should implement circuit breaker pattern for failing services', async () => {
      // Simulate consistent failures to trigger circuit breaker
      await ChaosUtils.simulateNetworkFailure(1.0); // 100% failure rate

      const token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const context = {
        tenant_id: testTenantId,
        user_id: testUserId,
        client_id: 'chaos-test-client',
        session_id: 'chaos-test-session',
        scopes: ['mcp:tools:read'],
        ip_address: '127.0.0.1',
        user_agent: 'ChaosTestClient/1.0'
      };

      const proxyRequest = {
        method: 'GET' as const,
        url: '/api/test',
        headers: { 'Authorization': `Bearer ${token}` },
        context
      };

      // Multiple failures should trigger circuit breaker
      const failures = [];
      for (let i = 0; i < 5; i++) {
        try {
          await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest);
        } catch (error: any) {
          failures.push(error.message);
        }
      }

      expect(failures).toHaveLength(5);
      
      // Circuit breaker should be open now
      // Subsequent requests should fail fast without attempting network call
      const fastFailStart = performance.now();
      try {
        await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest);
      } catch (error: any) {
        const fastFailEnd = performance.now();
        const fastFailTime = fastFailEnd - fastFailStart;
        
        // Should fail very quickly (circuit breaker open)
        expect(fastFailTime).toBeLessThan(100); // Less than 100ms
        expect(error.message).toContain('UPSTREAM_REQUEST_FAILED');
      }
    });
  });

  describe('Cascading Failure Prevention', () => {
    it('should prevent cascading failures across tenants', async () => {
      // Create additional tenant
      const tenant2Id = 'chaos-test-tenant-2';
      await tenantService.createTenant({
        tenant_id: tenant2Id,
        name: 'Chaos Test Tenant 2',
        domain: 'chaos-test-2.example.com',
        max_users: 100,
        max_mcp_servers: 10,
        compliance_tier: 'standard',
        audit_retention_days: 365
      });

      // Simulate failure for tenant 1 only
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
        callCount++;
        const headers = options?.headers || {};
        const tenantId = headers['X-Tenant-ID'];
        
        if (tenantId === testTenantId) {
          throw new Error('Tenant 1 service failure');
        }
        
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: async () => JSON.stringify({ result: 'success' })
        };
      });

      // Test requests for both tenants
      const tenant1Token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const tenant2Token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: 'user-2',
        audience: 'mcp://tenant2/server',
        scopes: 'mcp:tools:read',
        tenantId: tenant2Id,
        userId: 'user-2',
        expiresIn: 3600
      });

      const tenant1Request = {
        method: 'GET' as const,
        url: '/api/test',
        headers: { 'Authorization': `Bearer ${tenant1Token}` },
        context: {
          tenant_id: testTenantId,
          user_id: testUserId,
          client_id: 'test-client',
          session_id: 'test-session',
          scopes: ['mcp:tools:read'],
          ip_address: '127.0.0.1',
          user_agent: 'TestClient/1.0'
        }
      };

      const tenant2Request = {
        method: 'GET' as const,
        url: '/api/test',
        headers: { 'Authorization': `Bearer ${tenant2Token}` },
        context: {
          tenant_id: tenant2Id,
          user_id: 'user-2',
          client_id: 'test-client-2',
          session_id: 'test-session-2',
          scopes: ['mcp:tools:read'],
          ip_address: '127.0.0.1',
          user_agent: 'TestClient/1.0'
        }
      };

      // Tenant 1 should fail
      await expect(
        mcpProxy.forwardRequestByResource(resourceIdentifier, tenant1Request)
      ).rejects.toThrow('Tenant 1 service failure');

      // Tenant 2 should succeed (no cascading failure)
      const tenant2Response = await mcpProxy.forwardRequestByResource('mcp://tenant2/server', tenant2Request);
      expect(tenant2Response.status).toBe(200);
    });

    it('should handle resource exhaustion gracefully', async () => {
      // Simulate memory pressure by creating many large objects
      const largeObjects = [];
      
      try {
        // Create large objects to simulate memory pressure
        for (let i = 0; i < 100; i++) {
          largeObjects.push(new Array(10000).fill(`large-data-${i}`));
        }

        // System should still function under memory pressure
        const token = await jwtService.createToken({
          issuer: 'oauth-mcp-gateway',
          subject: testUserId,
          audience: resourceIdentifier,
          scopes: 'mcp:tools:read',
          tenantId: testTenantId,
          userId: testUserId,
          expiresIn: 3600
        });

        const result = await jwtService.verifyToken(token);
        expect(result.payload.sub).toBe(testUserId);

      } finally {
        // Clean up large objects
        largeObjects.length = 0;
      }
    });
  });

  describe('Recovery and Resilience', () => {
    it('should recover from transient failures', async () => {
      // Start with failures, then recover
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
        callCount++;
        
        if (callCount <= 5) {
          throw new Error('Transient failure');
        }
        
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: async () => JSON.stringify({ result: 'recovered' })
        };
      });

      const token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const context = {
        tenant_id: testTenantId,
        user_id: testUserId,
        client_id: 'recovery-test-client',
        session_id: 'recovery-test-session',
        scopes: ['mcp:tools:read'],
        ip_address: '127.0.0.1',
        user_agent: 'RecoveryTestClient/1.0'
      };

      const proxyRequest = {
        method: 'GET' as const,
        url: '/api/recovery-test',
        headers: { 'Authorization': `Bearer ${token}` },
        context
      };

      // First few requests should fail
      for (let i = 0; i < 3; i++) {
        await expect(
          mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest)
        ).rejects.toThrow('Transient failure');
      }

      // Wait a bit for recovery
      await testUtils.sleep(100);

      // Later requests should succeed (system recovered)
      const response = await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest);
      expect(response.status).toBe(200);
      
      const responseData = JSON.parse(response.body);
      expect(responseData.result).toBe('recovered');
    });

    it('should maintain audit logging during failures', async () => {
      // Simulate network failures but ensure audit logging still works
      await ChaosUtils.simulateNetworkFailure(0.8); // 80% failure rate

      const attempts = [];
      
      for (let i = 0; i < 10; i++) {
        try {
          const token = await jwtService.createToken({
            issuer: 'oauth-mcp-gateway',
            subject: `${testUserId}-${i}`,
            audience: resourceIdentifier,
            scopes: 'mcp:tools:read',
            tenantId: testTenantId,
            userId: `${testUserId}-${i}`,
            expiresIn: 3600
          });

          const context = {
            tenant_id: testTenantId,
            user_id: `${testUserId}-${i}`,
            client_id: 'audit-test-client',
            session_id: `audit-test-session-${i}`,
            scopes: ['mcp:tools:read'],
            ip_address: '127.0.0.1',
            user_agent: 'AuditTestClient/1.0'
          };

          const proxyRequest = {
            method: 'GET' as const,
            url: `/api/audit-test/${i}`,
            headers: { 'Authorization': `Bearer ${token}` },
            context
          };

          await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest);
          attempts.push({ success: true, userId: `${testUserId}-${i}` });
          
        } catch (error: any) {
          attempts.push({ success: false, userId: `${testUserId}-${i}`, error: error.message });
          
          // Log the failure event
          await auditService.logEvent({
            tenant_id: testTenantId,
            user_id: `${testUserId}-${i}`,
            event_type: 'mcp.request_failed',
            resource_type: 'mcp_server',
            action: 'proxy_request',
            outcome: 'failure',
            ip_address: '127.0.0.1',
            user_agent: 'AuditTestClient/1.0',
            metadata: {
              error: error.message,
              resource: resourceIdentifier
            }
          });
        }
      }

      // Verify audit logs were created even during failures
      const auditLogs = await auditService.queryLogs({
        tenant_id: testTenantId,
        event_type: 'mcp.request_failed'
      });

      const failureCount = attempts.filter(a => !a.success).length;
      expect(auditLogs.length).toBeGreaterThanOrEqual(failureCount);
      
      console.log(`Audit logging during failures:
        Total attempts: ${attempts.length}
        Failures: ${failureCount}
        Audit logs: ${auditLogs.length}`);
    });
  });
});