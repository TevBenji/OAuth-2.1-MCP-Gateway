/**
 * Load Testing and Performance Integration Tests
 *
 * Smoke-level performance checks for token validation, MCP proxying, rate
 * limiting, and session management. Latency targets are sanity bounds for a
 * real local Postgres setup, not marketing benchmarks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JWTService } from '../../src/services/oauth/jwt';
import { MCPProxyService } from '../../src/services/mcp/proxy';
import { MCPServerRegistry } from '../../src/services/mcp/registry';
import { PgMcpServerDatabase } from '../../src/storage/pg-mcp-server-database';
import { RateLimitService } from '../../src/services/security/rate-limit';
import { SessionManager } from '../../src/services/security/session';
import { PgSessionStorage } from '../../src/storage/pg-session-storage';
import { TenantService } from '../../src/services/tenant/isolation';
import { MemoryKV } from '../../src/lib/memory-kv';
import type { MCPRequestContext } from '../../src/types/mcp';
import { getTestDb } from '../helpers/db';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Performance sanity targets (real Postgres behind the registry; generous
// bounds so the suite stays reliable on developer machines and CI)
const PERFORMANCE_TARGETS = {
  TOKEN_VALIDATION_MAX_MS: 10, // Sub-10ms token validation requirement (avg)
  TOKEN_VALIDATION_P95_MS: 20,
  MCP_PROXY_AVG_MS: 200, // proxy call includes several Postgres round trips
  MCP_PROXY_P95_MS: 400,
  CONCURRENT_REQUESTS: 200,
  SUCCESS_RATE_MIN: 99.0, // 99% success rate minimum
  MIN_THROUGHPUT_RPS: 20,
};

const percentile = (values: number[], p: number): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]!;
};

describe('Load Testing and Performance', () => {
  let jwtService: JWTService;
  let mcpProxy: MCPProxyService;
  let mcpRegistry: MCPServerRegistry;
  let rateLimitService: RateLimitService;
  let sessionManager: SessionManager;
  let sessionStorage: PgSessionStorage;

  const realFetch = global.fetch;
  const testTenantId = 'perf-test-tenant';
  const testUserId = 'perf-test-user';
  const resourceIdentifier = 'mcp://perf-test/server';

  const makeContext = (suffix = ''): MCPRequestContext => ({
    tenant_id: testTenantId,
    user_id: `${testUserId}${suffix}`,
    client_id: 'perf-test-client',
    session_id: `perf-test-session${suffix}`,
    scopes: ['mcp:tools:read'],
    ip_address: '127.0.0.1',
    user_agent: 'PerfTestClient/1.0',
  });

  beforeEach(async () => {
    const { db } = getTestDb();
    jwtService = new JWTService('test-secret-key', 'HS256', 'oauth-mcp-gateway');
    mcpRegistry = new MCPServerRegistry(new PgMcpServerDatabase(db), 60000, false);
    mcpProxy = new MCPProxyService(mcpRegistry);
    rateLimitService = new RateLimitService(new MemoryKV());
    sessionStorage = new PgSessionStorage(db);
    sessionManager = new SessionManager(sessionStorage);

    // Tenant + MCP server for the proxy tests
    await new TenantService(db).createTenant({
      tenant_id: testTenantId,
      name: 'Performance Test Tenant',
      domain: 'perf-test.example.com',
      max_users: 1000,
      max_mcp_servers: 10,
      compliance_tier: 'standard',
      audit_retention_days: 365,
    });

    await mcpRegistry.registerServer({
      tenant_id: testTenantId,
      name: 'Performance Test Server',
      endpoint_url: 'https://perf-test.example.com',
      resource_identifier: resourceIdentifier,
      required_scopes: ['mcp:tools:read'],
      status: 'active',
      timeout_ms: 30000,
      retry_attempts: 0,
    });

    // Mock fast upstream MCP server responses (network is not under test)
    global.fetch = vi.fn().mockImplementation(async () =>
      ({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ result: 'success' }),
      }) as unknown as Response
    );
  });

  afterEach(() => {
    global.fetch = realFetch;
    vi.clearAllMocks();
  });

  describe('Token Validation Performance', () => {
    it('should validate JWT tokens in under 10ms on average', async () => {
      const token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600,
      });

      // Warm up
      await jwtService.verifyToken(token);

      // Measure performance
      const measurements: number[] = [];
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await jwtService.verifyToken(token);
        const endTime = performance.now();
        measurements.push(endTime - startTime);
      }

      const avgLatency = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const p95Latency = percentile(measurements, 0.95);

      expect(avgLatency).toBeLessThan(PERFORMANCE_TARGETS.TOKEN_VALIDATION_MAX_MS);
      expect(p95Latency).toBeLessThan(PERFORMANCE_TARGETS.TOKEN_VALIDATION_P95_MS);
    });

    it('should maintain performance with concurrent token validations', async () => {
      const tokens = await Promise.all(
        Array(50)
          .fill(null)
          .map(async (_, i) =>
            jwtService.createToken({
              issuer: 'oauth-mcp-gateway',
              subject: `${testUserId}-${i}`,
              audience: resourceIdentifier,
              scopes: 'mcp:tools:read',
              tenantId: testTenantId,
              userId: `${testUserId}-${i}`,
              expiresIn: 3600,
            })
          )
      );

      const startTime = performance.now();

      const results = await Promise.allSettled(tokens.map(token => jwtService.verifyToken(token)));

      const totalTime = performance.now() - startTime;
      const avgTimePerToken = totalTime / tokens.length;

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = (successCount / tokens.length) * 100;

      expect(avgTimePerToken).toBeLessThan(PERFORMANCE_TARGETS.TOKEN_VALIDATION_MAX_MS);
      expect(successRate).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.SUCCESS_RATE_MIN);
    });
  });

  describe('MCP Proxy Performance', () => {
    it('should proxy MCP requests within the latency budget', async () => {
      const proxyRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context: makeContext(),
      };

      // Warm up
      await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest);

      // Measure performance
      const measurements: number[] = [];
      const iterations = 25;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const response = await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest);
        const endTime = performance.now();

        measurements.push(endTime - startTime);
        expect(response.status).toBe(200);
      }

      const avgLatency = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const p95Latency = percentile(measurements, 0.95);

      expect(avgLatency).toBeLessThan(PERFORMANCE_TARGETS.MCP_PROXY_AVG_MS);
      expect(p95Latency).toBeLessThan(PERFORMANCE_TARGETS.MCP_PROXY_P95_MS);
    });

    it('should handle concurrent MCP requests efficiently', async () => {
      const requests = Array(50)
        .fill(null)
        .map((_, i) => ({
          method: 'GET',
          url: `/api/test/${i}`,
          headers: {},
          context: makeContext(`-${i}`),
        }));

      const startTime = performance.now();

      const results = await Promise.allSettled(
        requests.map(req => mcpProxy.forwardRequestByResource(resourceIdentifier, req))
      );

      const totalTime = performance.now() - startTime;

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = (successCount / requests.length) * 100;
      const throughput = requests.length / (totalTime / 1000); // requests per second

      expect(successRate).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.SUCCESS_RATE_MIN);
      expect(throughput).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.MIN_THROUGHPUT_RPS);
    });
  });

  describe('High Concurrency Load Testing', () => {
    it('should handle many concurrent requests with 99% success rate', async () => {
      const concurrentRequests = PERFORMANCE_TARGETS.CONCURRENT_REQUESTS;

      const requests = Array(concurrentRequests)
        .fill(null)
        .map((_, i) => ({
          method: 'GET',
          url: `/api/load-test/${i}`,
          headers: {},
          context: makeContext(`-load-${i}`),
        }));

      const startTime = performance.now();

      const results = await Promise.allSettled(
        requests.map(req => mcpProxy.forwardRequestByResource(resourceIdentifier, req))
      );

      const totalTime = performance.now() - startTime;

      const successfulResults = results.filter(
        r => r.status === 'fulfilled'
      ) as PromiseFulfilledResult<any>[];
      const successRate = (successfulResults.length / results.length) * 100;
      const throughput = concurrentRequests / (totalTime / 1000);

      expect(successRate).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.SUCCESS_RATE_MIN);
      expect(throughput).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.MIN_THROUGHPUT_RPS);

      // Verify all successful responses are valid
      successfulResults.forEach(result => {
        expect(result.value.status).toBe(200);
      });
    });

    it('should maintain performance under sustained load', async () => {
      const requestsPerBatch = 50;
      const batches = 3;
      const batchDelay = 100; // ms between batches

      const batchResults: Array<{
        successRate: number;
        avgLatency: number;
      }> = [];

      for (let batch = 0; batch < batches; batch++) {
        const requests = Array(requestsPerBatch)
          .fill(null)
          .map((_, i) => ({
            method: 'GET',
            url: `/api/sustained-test/${batch}/${i}`,
            headers: {},
            context: makeContext(`-sustained-${batch}-${i}`),
          }));

        const startTime = performance.now();

        const results = await Promise.allSettled(
          requests.map(req => mcpProxy.forwardRequestByResource(resourceIdentifier, req))
        );

        const batchTime = performance.now() - startTime;

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        batchResults.push({
          successRate: (successCount / requestsPerBatch) * 100,
          avgLatency: batchTime / requestsPerBatch,
        });

        // Wait between batches
        if (batch < batches - 1) {
          await sleep(batchDelay);
        }
      }

      // Analyze sustained performance
      const avgSuccessRate =
        batchResults.reduce((sum, batch) => sum + batch.successRate, 0) / batches;

      const firstBatch = batchResults[0]!;
      const lastBatch = batchResults[batches - 1]!;
      // Performance should not collapse over time (allow generous jitter)
      const latencyRatio = lastBatch.avgLatency / Math.max(firstBatch.avgLatency, 0.001);

      expect(avgSuccessRate).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.SUCCESS_RATE_MIN);
      expect(latencyRatio).toBeLessThan(5);
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should enforce rate limits without significant latency impact', async () => {
      const rateLimitConfig = {
        requests_per_minute: 100,
        requests_per_hour: 1000,
        burst_limit: 10,
      };

      // Test rate limiting performance
      const measurements: number[] = [];
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();

        const isAllowed = await rateLimitService.checkRateLimit(
          `user:${testUserId}`,
          rateLimitConfig
        );

        const endTime = performance.now();
        measurements.push(endTime - startTime);

        expect(isAllowed).toBe(true); // Should be allowed within limits
      }

      const avgLatency = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const maxLatency = Math.max(...measurements);

      expect(avgLatency).toBeLessThan(5); // In-memory rate limiting is fast
      expect(maxLatency).toBeLessThan(50);
    });
  });

  describe('Session Management Performance', () => {
    it('should create and validate sessions efficiently', async () => {
      // Test session creation performance against real Postgres
      const createMeasurements: number[] = [];
      const validateMeasurements: number[] = [];

      for (let i = 0; i < 25; i++) {
        // Create session
        const createStartTime = performance.now();
        const session = await sessionManager.createSession({
          tenant_id: testTenantId,
          user_id: `${testUserId}-${i}`,
          client_id: 'perf-test-client',
          device_info: { user_agent: 'PerfTestClient/1.0', ip_address: '127.0.0.1' },
        });
        createMeasurements.push(performance.now() - createStartTime);

        // Validate session (storage lookup)
        const validateStartTime = performance.now();
        const validatedSession = await sessionStorage.get(session.session_id);
        validateMeasurements.push(performance.now() - validateStartTime);

        expect(validatedSession).toBeDefined();
      }

      const avgCreateLatency =
        createMeasurements.reduce((a, b) => a + b, 0) / createMeasurements.length;
      const avgValidateLatency =
        validateMeasurements.reduce((a, b) => a + b, 0) / validateMeasurements.length;

      // Generous bounds: each operation is one or two Postgres round trips
      expect(avgCreateLatency).toBeLessThan(100);
      expect(avgValidateLatency).toBeLessThan(50);
    });
  });
});
