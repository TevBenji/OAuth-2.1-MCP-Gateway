/**
 * Chaos Engineering Tests for Failure Scenarios
 *
 * Validates system behavior under failure conditions: network failures,
 * database outages, cache failures, service degradation, and recovery.
 * Requirements: 5.2, 5.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JWTService } from '../../src/services/oauth/jwt';
import { MCPProxyService } from '../../src/services/mcp/proxy';
import { MCPServerRegistry } from '../../src/services/mcp/registry';
import { PgMcpServerDatabase } from '../../src/storage/pg-mcp-server-database';
import { TenantService } from '../../src/services/tenant/isolation';
import { SessionManager } from '../../src/services/security/session';
import { RateLimitService } from '../../src/services/security/rate-limit';
import { AuditService } from '../../src/services/security/audit';
import { MemoryKV, type KVLike } from '../../src/lib/memory-kv';
import type { SessionStorage } from '../../src/types/session';
import type { MCPRequestContext } from '../../src/types/mcp';
import { getTestDb } from '../helpers/db';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// The real fetch, restored after every test
const realFetch = global.fetch;

// Chaos testing utilities: swap global.fetch for failure-injecting fakes
const successResponse = () =>
  ({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    text: async () => JSON.stringify({ result: 'success' }),
  }) as unknown as Response;

class ChaosUtils {
  static simulateNetworkFailure(failureRate: number = 0.5) {
    global.fetch = vi.fn().mockImplementation(async () => {
      if (Math.random() < failureRate) {
        throw new Error('Network failure simulated');
      }
      return successResponse();
    });
  }

  static simulateSlowNetwork(delayMs: number = 1000) {
    global.fetch = vi.fn().mockImplementation(async () => {
      await sleep(delayMs);
      return successResponse();
    });
  }

  static simulateIntermittentFailures(failurePattern: boolean[]) {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      const shouldFail = failurePattern[callCount % failurePattern.length];
      callCount++;

      if (shouldFail) {
        throw new Error('Intermittent failure simulated');
      }
      return successResponse();
    });
  }

  static restoreNetwork() {
    global.fetch = realFetch;
  }
}

describe('Chaos Engineering - Failure Scenarios', () => {
  let jwtService: JWTService;
  let mcpProxy: MCPProxyService;
  let mcpRegistry: MCPServerRegistry;
  let tenantService: TenantService;
  let rateLimitService: RateLimitService;
  let auditService: AuditService;
  let cache: MemoryKV;

  const testTenantId = 'chaos-test-tenant';
  const testUserId = 'chaos-test-user';
  const resourceIdentifier = 'mcp://chaos-test/server';

  const makeContext = (suffix = ''): MCPRequestContext => ({
    tenant_id: testTenantId,
    user_id: `${testUserId}${suffix}`,
    client_id: 'chaos-test-client',
    session_id: `chaos-test-session${suffix}`,
    scopes: ['mcp:tools:read'],
    ip_address: '127.0.0.1',
    user_agent: 'ChaosTestClient/1.0',
  });

  beforeEach(async () => {
    const { db } = getTestDb();
    jwtService = new JWTService('test-secret-key', 'HS256', 'oauth-mcp-gateway');
    mcpRegistry = new MCPServerRegistry(new PgMcpServerDatabase(db), 60000, false);
    mcpProxy = new MCPProxyService(mcpRegistry, { retryDelay: 50 });
    tenantService = new TenantService(db);
    cache = new MemoryKV();
    rateLimitService = new RateLimitService(cache);
    auditService = AuditService.getInstance(db);

    // Create test tenant
    await tenantService.createTenant({
      tenant_id: testTenantId,
      name: 'Chaos Test Tenant',
      domain: 'chaos-test.example.com',
      max_users: 100,
      max_mcp_servers: 10,
      compliance_tier: 'standard',
      audit_retention_days: 365,
    });

    // Register test MCP server
    await mcpRegistry.registerServer({
      tenant_id: testTenantId,
      name: 'Chaos Test Server',
      endpoint_url: 'https://chaos-test.example.com',
      resource_identifier: resourceIdentifier,
      required_scopes: ['mcp:tools:read'],
      status: 'active',
      timeout_ms: 5000,
      retry_attempts: 3,
    });

    // Setup default successful responses
    global.fetch = vi.fn().mockImplementation(async () => successResponse());
  });

  afterEach(() => {
    ChaosUtils.restoreNetwork();
    vi.clearAllMocks();
  });

  describe('Network Failure Scenarios', () => {
    it('should handle complete network failures gracefully', async () => {
      ChaosUtils.simulateNetworkFailure(1.0); // 100% failure rate

      const proxyRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context: makeContext(),
      };

      // Should fail gracefully with proper error handling
      await expect(
        mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, { maxRetries: 0 })
      ).rejects.toThrow('Failed to forward request to upstream server');
    });

    it('should retry on intermittent network failures', async () => {
      // Pattern: fail, fail, succeed
      ChaosUtils.simulateIntermittentFailures([true, true, false]);

      const proxyRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context: makeContext(),
      };

      // Should eventually succeed after retries
      const response = await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, {
        maxRetries: 3,
        retryDelay: 20,
      });

      expect(response.status).toBe(200);
    });

    it('should handle slow network conditions', async () => {
      ChaosUtils.simulateSlowNetwork(2000); // 2 second delay

      const proxyRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context: makeContext(),
      };

      const startTime = performance.now();

      // Should handle slow responses but may hit the 5s server timeout
      try {
        const response = await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, {
          maxRetries: 0,
        });
        const endTime = performance.now();

        expect(response.status).toBe(200);
        expect(endTime - startTime).toBeGreaterThan(1900); // Should take about 2 seconds
      } catch (error: any) {
        // Timeout is acceptable for very slow networks
        expect(error.message).toContain('Failed to forward request');
      }
    });

    it('should maintain service availability during partial network failures', async () => {
      ChaosUtils.simulateNetworkFailure(0.3); // 30% failure rate

      const requests = Array(30)
        .fill(null)
        .map(async (_, i) => {
          const proxyRequest = {
            method: 'GET',
            url: `/api/test/${i}`,
            headers: {},
            context: makeContext(`-${i}`),
          };

          try {
            return await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, {
              maxRetries: 2,
              retryDelay: 20,
            });
          } catch (error: any) {
            return { error: error.message, status: 'failed' as const };
          }
        });

      const results = await Promise.all(requests);

      const successCount = results.filter(r => r.status === 200).length;
      const successRate = (successCount / results.length) * 100;

      // With retries, should maintain a solid success rate despite 30% failures
      expect(successRate).toBeGreaterThan(50);
    });
  });

  describe('Database Failure Scenarios', () => {
    it('should surface database connection failures', async () => {
      // A db whose every access throws (simulates a dead connection pool)
      const brokenDb = new Proxy(
        {},
        {
          get() {
            throw new Error('Database connection failed');
          },
        }
      ) as any;

      const brokenTenantService = new TenantService(brokenDb);

      await expect(brokenTenantService.getTenant(testTenantId)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should allow callers to time out slow database queries', async () => {
      // Fake drizzle-ish chain that never answers in time
      const slowDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => sleep(10000).then(() => []),
            }),
          }),
        }),
      } as any;

      const slowTenantService = new TenantService(slowDb);

      await expect(
        Promise.race([
          slowTenantService.getTenant(testTenantId),
          sleep(500).then(() => {
            throw new Error('Query timeout');
          }),
        ])
      ).rejects.toThrow('Query timeout');
    });

    it('should handle partial database failures', async () => {
      let queryCount = 0;
      const fakeRow = {
        tenantId: testTenantId,
        name: 'Test Tenant',
        domain: 'chaos-test.example.com',
        maxUsers: 100,
        maxMcpServers: 10,
        complianceTier: 'standard',
        auditRetentionDays: 365,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const flakyDb = {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => {
                queryCount++;
                if (queryCount % 3 === 0) {
                  throw new Error('Intermittent database error');
                }
                return [fakeRow];
              },
            }),
          }),
        }),
      } as any;

      const flakyTenantService = new TenantService(flakyDb);
      const results = [];

      for (let i = 0; i < 10; i++) {
        try {
          const tenant = await flakyTenantService.getTenant(testTenantId);
          results.push({ success: true, tenant });
        } catch (error: any) {
          results.push({ success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      expect(successCount).toBeGreaterThan(0); // Some should succeed
      expect(failureCount).toBeGreaterThan(0); // Some should fail
    });
  });

  describe('Cache/Storage Failure Scenarios', () => {
    it('should surface storage failures from session and rate limit services', async () => {
      const brokenSessionStorage = new Proxy(
        {},
        {
          get() {
            return () => Promise.reject(new Error('KV store unavailable'));
          },
        }
      ) as unknown as SessionStorage;

      const brokenCache = new Proxy(
        {},
        {
          get() {
            return () => Promise.reject(new Error('Cache unavailable'));
          },
        }
      ) as unknown as KVLike;

      const sessionManager = new SessionManager(brokenSessionStorage);
      const brokenRateLimit = new RateLimitService(brokenCache);

      // Session operations should fail loudly, not silently corrupt state
      await expect(
        sessionManager.createSession({
          tenant_id: testTenantId,
          user_id: testUserId,
          client_id: 'test-client',
          device_info: { user_agent: 'TestClient/1.0', ip_address: '127.0.0.1' },
        })
      ).rejects.toThrow('KV store unavailable');

      // Rate limiting should fail loudly as well
      await expect(
        brokenRateLimit.checkRateLimit(`user:${testUserId}`, {
          requests_per_minute: 100,
          requests_per_hour: 1000,
          burst_limit: 10,
        })
      ).rejects.toThrow('Cache unavailable');
    });

    it('should handle intermittent cache failures', async () => {
      let cacheCallCount = 0;
      const backing = new MemoryKV();

      // Each rate limit check performs 4 cache calls; failing every 7th call
      // makes some checks fail and others complete.
      const flakyCache: KVLike = {
        get: async (key: string, type?: any) => {
          cacheCallCount++;
          if (cacheCallCount % 7 === 0) throw new Error('Intermittent cache failure');
          return backing.get(key, type);
        },
        put: async (key, value, options) => {
          cacheCallCount++;
          if (cacheCallCount % 7 === 0) throw new Error('Intermittent cache failure');
          return backing.put(key, value, options);
        },
        delete: async key => backing.delete(key),
        list: options => backing.list(options),
      };

      const flakyRateLimit = new RateLimitService(flakyCache);
      const results = [];

      for (let i = 0; i < 20; i++) {
        try {
          const isAllowed = await flakyRateLimit.checkRateLimit(`user:${testUserId}-${i}`, {
            requests_per_minute: 100,
            requests_per_hour: 1000,
            burst_limit: 10,
          });
          results.push({ success: true, allowed: isAllowed });
        } catch (error: any) {
          results.push({ success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      expect(successCount).toBeGreaterThan(0); // Some should succeed
      expect(failureCount).toBeGreaterThan(0); // Some should fail
    });
  });

  describe('Service Degradation Scenarios', () => {
    it('should report degraded upstream responses without retry storms', async () => {
      // Upstream consistently returns 503
      global.fetch = vi.fn().mockImplementation(async () =>
        ({
          ok: false,
          status: 503,
          statusText: 'Service Degraded',
          headers: new Headers(),
          text: async () => 'Service temporarily degraded',
        }) as unknown as Response
      );

      const proxyRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context: makeContext(),
      };

      const response = await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, {
        maxRetries: 1,
        retryDelay: 10,
      });

      // The 503 is reported to the caller after retries are exhausted
      expect(response.status).toBe(503);
      expect(global.fetch).toHaveBeenCalledTimes(2); // initial + 1 retry
    });

    it('should fail fast when retries are disabled for a failing service', async () => {
      ChaosUtils.simulateNetworkFailure(1.0); // 100% failure rate

      const proxyRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context: makeContext(),
      };

      // Multiple failures accumulate
      const failures = [];
      for (let i = 0; i < 5; i++) {
        try {
          await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, {
            maxRetries: 0,
          });
        } catch (error: any) {
          failures.push(error.message);
        }
      }

      expect(failures).toHaveLength(5);

      // With retries disabled, a failing upstream fails fast
      const fastFailStart = performance.now();
      await expect(
        mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, { maxRetries: 0 })
      ).rejects.toThrow('Failed to forward request');
      const fastFailTime = performance.now() - fastFailStart;

      expect(fastFailTime).toBeLessThan(500);
    });
  });

  describe('Cascading Failure Prevention', () => {
    it('should prevent cascading failures across tenants', async () => {
      // Create additional tenant with its own server
      const tenant2Id = 'chaos-test-tenant-2';
      await tenantService.createTenant({
        tenant_id: tenant2Id,
        name: 'Chaos Test Tenant 2',
        domain: 'chaos-test-2.example.com',
        max_users: 100,
        max_mcp_servers: 10,
        compliance_tier: 'standard',
        audit_retention_days: 365,
      });
      await mcpRegistry.registerServer({
        tenant_id: tenant2Id,
        name: 'Chaos Test Server 2',
        endpoint_url: 'https://chaos-test-2.example.com',
        resource_identifier: 'mcp://tenant2/server',
        required_scopes: ['mcp:tools:read'],
        status: 'active',
        timeout_ms: 5000,
        retry_attempts: 0,
      });

      // Simulate failure for tenant 1's upstream only
      global.fetch = vi.fn().mockImplementation(async (_url: any, options: any) => {
        const headers = options?.headers || {};
        const tenantId = headers['X-Tenant-ID'];

        if (tenantId === testTenantId) {
          throw new Error('Tenant 1 service failure');
        }
        return successResponse();
      });

      const tenant1Request = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context: makeContext(),
      };

      const tenant2Request = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context: {
          ...makeContext(),
          tenant_id: tenant2Id,
          user_id: 'user-2',
        },
      };

      // Tenant 1 should fail
      await expect(
        mcpProxy.forwardRequestByResource(resourceIdentifier, tenant1Request, { maxRetries: 0 })
      ).rejects.toThrow('Tenant 1 service failure');

      // Tenant 2 should succeed (no cascading failure)
      const tenant2Response = await mcpProxy.forwardRequestByResource(
        'mcp://tenant2/server',
        tenant2Request,
        { maxRetries: 0 }
      );
      expect(tenant2Response.status).toBe(200);
    });

    it('should handle resource exhaustion gracefully', async () => {
      // Simulate memory pressure by creating many large objects
      const largeObjects = [];

      try {
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
          expiresIn: 3600,
        });

        const result = await jwtService.verifyToken(token);
        expect(result.payload.sub).toBe(testUserId);
      } finally {
        largeObjects.length = 0;
      }
    });
  });

  describe('Recovery and Resilience', () => {
    it('should recover from transient failures', async () => {
      // Start with failures, then recover
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(async () => {
        callCount++;
        if (callCount <= 5) {
          throw new Error('Transient failure');
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: async () => JSON.stringify({ result: 'recovered' }),
        } as unknown as Response;
      });

      const proxyRequest = {
        method: 'GET',
        url: '/api/recovery-test',
        headers: {},
        context: makeContext(),
      };

      // First requests should fail (retries disabled: one call each)
      for (let i = 0; i < 5; i++) {
        await expect(
          mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, { maxRetries: 0 })
        ).rejects.toThrow('Transient failure');
      }

      // Later requests should succeed (system recovered)
      const response = await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, {
        maxRetries: 0,
      });
      expect(response.status).toBe(200);

      const responseData = JSON.parse(response.body as string);
      expect(responseData.result).toBe('recovered');
    });

    it('should maintain audit logging during failures', async () => {
      ChaosUtils.simulateNetworkFailure(0.8); // 80% failure rate

      const attempts = [];

      for (let i = 0; i < 10; i++) {
        const proxyRequest = {
          method: 'GET',
          url: `/api/audit-test/${i}`,
          headers: {},
          context: makeContext(`-${i}`),
        };

        try {
          await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest, {
            maxRetries: 0,
          });
          attempts.push({ success: true });
        } catch (error: any) {
          attempts.push({ success: false, error: error.message });

          // Log the failure event
          await auditService.logEvent({
            tenant_id: testTenantId,
            user_id: `${testUserId}-${i}`,
            event_type: 'mcp.request.failed',
            resource_type: 'mcp_server',
            resource_id: resourceIdentifier,
            action: 'proxy_request',
            outcome: 'failure',
            ip_address: '127.0.0.1',
            user_agent: 'AuditTestClient/1.0',
            details: {
              error: error.message,
              resource: resourceIdentifier,
            },
          });
        }
      }

      // Verify audit logs were created even during failures
      const auditLogs = await auditService.queryLogs({
        tenantId: testTenantId,
        eventTypePrefix: 'mcp.request',
      });

      const failureCount = attempts.filter(a => !a.success).length;
      expect(auditLogs.entries.length).toBeGreaterThanOrEqual(failureCount);
    });
  });
});
