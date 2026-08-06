/**
 * Load Testing and Performance Integration Tests
 * 
 * Tests to verify sub-10ms performance requirements and system
 * behavior under high concurrent load.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testUtils, mockEnv } from '../setup';
import { JWTService } from '../../src/services/oauth/jwt';
import { MCPProxyService } from '../../src/services/mcp/proxy';
import { MCPServerRegistry } from '../../src/services/mcp/registry';
import { RateLimitService } from '../../src/services/security/rate-limit';
import { SessionService } from '../../src/services/security/session';

// Performance test configuration (Requirements: 5.2, 5.4)
const PERFORMANCE_TARGETS = {
  TOKEN_VALIDATION_MAX_MS: 10, // Sub-10ms token validation requirement
  TOKEN_VALIDATION_P50_MS: 5,
  TOKEN_VALIDATION_P95_MS: 8,
  TOKEN_VALIDATION_P99_MS: 15,
  MCP_PROXY_MAX_MS: 50,
  MCP_PROXY_P50_MS: 20,
  MCP_PROXY_P95_MS: 40,
  MCP_PROXY_P99_MS: 80,
  CONCURRENT_REQUESTS: 1000,
  SUCCESS_RATE_MIN: 99.0, // 99% success rate minimum
  P95_LATENCY_MAX_MS: 25,
  P99_LATENCY_MAX_MS: 100,
  MIN_THROUGHPUT_RPS: 1000 // Minimum 1000 requests per second
};

describe('Load Testing and Performance', () => {
  let jwtService: JWTService;
  let mcpProxy: MCPProxyService;
  let mcpRegistry: MCPServerRegistry;
  let rateLimitService: RateLimitService;
  let sessionService: SessionService;
  
  const testTenantId = 'perf-test-tenant';
  const testUserId = 'perf-test-user';
  const resourceIdentifier = 'mcp://perf-test/server';

  beforeEach(async () => {
    // Initialize services
    jwtService = new JWTService('test-secret-key', 'HS256', 'oauth-mcp-gateway');
    mcpRegistry = new MCPServerRegistry(mockEnv.DB);
    mcpProxy = new MCPProxyService(mcpRegistry);
    rateLimitService = new RateLimitService(mockEnv.CACHE);
    sessionService = new SessionService(mockEnv.SESSIONS);

    // Setup test MCP server
    await mcpRegistry.registerServer({
      tenant_id: testTenantId,
      name: 'Performance Test Server',
      endpoint_url: 'https://perf-test.example.com',
      resource_identifier: resourceIdentifier,
      required_scopes: ['mcp:tools:read'],
      health_check_url: 'https://perf-test.example.com/health'
    });

    // Mock fast MCP server responses
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify({ result: 'success' })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Token Validation Performance', () => {
    it('should validate JWT tokens in under 10ms', async () => {
      const token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
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

      // Calculate comprehensive latency percentiles
      const sortedMeasurements = [...measurements].sort((a, b) => a - b);
      const avgLatency = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const p50Latency = sortedMeasurements[Math.floor(measurements.length * 0.50)];
      const p95Latency = sortedMeasurements[Math.floor(measurements.length * 0.95)];
      const p99Latency = sortedMeasurements[Math.floor(measurements.length * 0.99)];
      const maxLatency = Math.max(...measurements);
      const minLatency = Math.min(...measurements);

      console.log(`Token validation performance (${iterations} iterations):
        Min: ${minLatency.toFixed(2)}ms
        Average: ${avgLatency.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.TOKEN_VALIDATION_MAX_MS}ms)
        P50: ${p50Latency.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.TOKEN_VALIDATION_P50_MS}ms)
        P95: ${p95Latency.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.TOKEN_VALIDATION_P95_MS}ms)
        P99: ${p99Latency.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.TOKEN_VALIDATION_P99_MS}ms)
        Max: ${maxLatency.toFixed(2)}ms`);

      // Verify all performance targets
      expect(avgLatency).toBeLessThan(PERFORMANCE_TARGETS.TOKEN_VALIDATION_MAX_MS);
      expect(p50Latency).toBeLessThan(PERFORMANCE_TARGETS.TOKEN_VALIDATION_P50_MS);
      expect(p95Latency).toBeLessThan(PERFORMANCE_TARGETS.TOKEN_VALIDATION_P95_MS);
      expect(p99Latency).toBeLessThan(PERFORMANCE_TARGETS.TOKEN_VALIDATION_P99_MS);
    });

    it('should maintain performance with concurrent token validations', async () => {
      const tokens = await Promise.all(
        Array(50).fill(null).map(async (_, i) => 
          jwtService.createToken({
            issuer: 'oauth-mcp-gateway',
            subject: `${testUserId}-${i}`,
            audience: resourceIdentifier,
            scopes: 'mcp:tools:read',
            tenantId: testTenantId,
            userId: `${testUserId}-${i}`,
            expiresIn: 3600
          })
        )
      );

      const startTime = performance.now();
      
      const results = await Promise.allSettled(
        tokens.map(token => jwtService.verifyToken(token))
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerToken = totalTime / tokens.length;

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = (successCount / tokens.length) * 100;

      console.log(`Concurrent token validation:
        Total time: ${totalTime.toFixed(2)}ms
        Avg per token: ${avgTimePerToken.toFixed(2)}ms
        Success rate: ${successRate.toFixed(1)}%`);

      expect(avgTimePerToken).toBeLessThan(PERFORMANCE_TARGETS.TOKEN_VALIDATION_MAX_MS);
      expect(successRate).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.SUCCESS_RATE_MIN);
    });
  });

  describe('MCP Proxy Performance', () => {
    it('should proxy MCP requests in under 50ms', async () => {
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
        client_id: 'test-client',
        session_id: 'test-session',
        scopes: ['mcp:tools:read'],
        ip_address: '127.0.0.1',
        user_agent: 'TestClient/1.0'
      };

      const proxyRequest = {
        method: 'GET' as const,
        url: '/api/test',
        headers: { 'Authorization': `Bearer ${token}` },
        context
      };

      // Warm up
      await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest);

      // Measure performance
      const measurements: number[] = [];
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        const response = await mcpProxy.forwardRequestByResource(resourceIdentifier, proxyRequest);
        const endTime = performance.now();
        
        measurements.push(endTime - startTime);
        expect(response.status).toBe(200);
      }

      // Calculate comprehensive latency percentiles
      const sortedMeasurements = [...measurements].sort((a, b) => a - b);
      const avgLatency = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const p50Latency = sortedMeasurements[Math.floor(measurements.length * 0.50)];
      const p95Latency = sortedMeasurements[Math.floor(measurements.length * 0.95)];
      const p99Latency = sortedMeasurements[Math.floor(measurements.length * 0.99)];
      const maxLatency = Math.max(...measurements);
      const minLatency = Math.min(...measurements);

      console.log(`MCP proxy performance (${iterations} iterations):
        Min: ${minLatency.toFixed(2)}ms
        Average: ${avgLatency.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.MCP_PROXY_MAX_MS}ms)
        P50: ${p50Latency.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.MCP_PROXY_P50_MS}ms)
        P95: ${p95Latency.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.MCP_PROXY_P95_MS}ms)
        P99: ${p99Latency.toFixed(2)}ms (target: <${PERFORMANCE_TARGETS.MCP_PROXY_P99_MS}ms)
        Max: ${maxLatency.toFixed(2)}ms`);

      // Verify all performance targets
      expect(avgLatency).toBeLessThan(PERFORMANCE_TARGETS.MCP_PROXY_MAX_MS);
      expect(p50Latency).toBeLessThan(PERFORMANCE_TARGETS.MCP_PROXY_P50_MS);
      expect(p95Latency).toBeLessThan(PERFORMANCE_TARGETS.MCP_PROXY_P95_MS);
      expect(p99Latency).toBeLessThan(PERFORMANCE_TARGETS.MCP_PROXY_P99_MS);
    });

    it('should handle concurrent MCP requests efficiently', async () => {
      const tokens = await Promise.all(
        Array(100).fill(null).map(async (_, i) => 
          jwtService.createToken({
            issuer: 'oauth-mcp-gateway',
            subject: `${testUserId}-${i}`,
            audience: resourceIdentifier,
            scopes: 'mcp:tools:read',
            tenantId: testTenantId,
            userId: `${testUserId}-${i}`,
            expiresIn: 3600
          })
        )
      );

      const requests = tokens.map((token, i) => ({
        method: 'GET' as const,
        url: `/api/test/${i}`,
        headers: { 'Authorization': `Bearer ${token}` },
        context: {
          tenant_id: testTenantId,
          user_id: `${testUserId}-${i}`,
          client_id: 'test-client',
          session_id: `test-session-${i}`,
          scopes: ['mcp:tools:read'],
          ip_address: '127.0.0.1',
          user_agent: 'TestClient/1.0'
        }
      }));

      const startTime = performance.now();
      
      const results = await Promise.allSettled(
        requests.map(req => mcpProxy.forwardRequestByResource(resourceIdentifier, req))
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerRequest = totalTime / requests.length;

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = (successCount / requests.length) * 100;
      const throughput = requests.length / (totalTime / 1000); // requests per second

      console.log(`Concurrent MCP proxy:
        Total requests: ${requests.length}
        Total time: ${totalTime.toFixed(2)}ms
        Avg per request: ${avgTimePerRequest.toFixed(2)}ms
        Success rate: ${successRate.toFixed(1)}% (target: ≥${PERFORMANCE_TARGETS.SUCCESS_RATE_MIN}%)
        Throughput: ${throughput.toFixed(2)} req/s (target: ≥${PERFORMANCE_TARGETS.MIN_THROUGHPUT_RPS} req/s)`);

      expect(avgTimePerRequest).toBeLessThan(PERFORMANCE_TARGETS.MCP_PROXY_MAX_MS);
      expect(successRate).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.SUCCESS_RATE_MIN);
      expect(throughput).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.MIN_THROUGHPUT_RPS);
    });
  });

  describe('High Concurrency Load Testing', () => {
    it('should handle 1000 concurrent requests with 99% success rate', async () => {
      const concurrentRequests = PERFORMANCE_TARGETS.CONCURRENT_REQUESTS;
      
      // Create tokens for concurrent requests
      const tokens = await Promise.all(
        Array(concurrentRequests).fill(null).map(async (_, i) => 
          jwtService.createToken({
            issuer: 'oauth-mcp-gateway',
            subject: `load-test-user-${i}`,
            audience: resourceIdentifier,
            scopes: 'mcp:tools:read',
            tenantId: testTenantId,
            userId: `load-test-user-${i}`,
            expiresIn: 3600
          })
        )
      );

      const requests = tokens.map((token, i) => ({
        method: 'GET' as const,
        url: `/api/load-test/${i}`,
        headers: { 'Authorization': `Bearer ${token}` },
        context: {
          tenant_id: testTenantId,
          user_id: `load-test-user-${i}`,
          client_id: 'load-test-client',
          session_id: `load-test-session-${i}`,
          scopes: ['mcp:tools:read'],
          ip_address: '127.0.0.1',
          user_agent: 'LoadTestClient/1.0'
        }
      }));

      console.log(`Starting load test with ${concurrentRequests} concurrent requests...`);
      
      const startTime = performance.now();
      
      const results = await Promise.allSettled(
        requests.map(req => mcpProxy.forwardRequestByResource(resourceIdentifier, req))
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Analyze results
      const successfulResults = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
      const failedResults = results.filter(r => r.status === 'rejected');
      
      const successRate = (successfulResults.length / results.length) * 100;
      const avgLatency = totalTime / concurrentRequests;
      const throughput = concurrentRequests / (totalTime / 1000); // requests per second

      console.log(`Load test results:
        Total requests: ${concurrentRequests}
        Successful: ${successfulResults.length}
        Failed: ${failedResults.length}
        Success rate: ${successRate.toFixed(2)}%
        Total time: ${totalTime.toFixed(2)}ms
        Avg latency: ${avgLatency.toFixed(2)}ms
        Throughput: ${throughput.toFixed(2)} req/s`);

      // Verify performance requirements
      expect(successRate).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.SUCCESS_RATE_MIN);
      expect(avgLatency).toBeLessThan(PERFORMANCE_TARGETS.P99_LATENCY_MAX_MS);

      // Verify all successful responses are valid
      successfulResults.forEach(result => {
        expect(result.value.status).toBe(200);
      });
    });

    it('should maintain performance under sustained load', async () => {
      const requestsPerBatch = 100;
      const batches = 5;
      const batchDelay = 100; // ms between batches

      const batchResults: Array<{
        batchNumber: number;
        successRate: number;
        avgLatency: number;
        throughput: number;
      }> = [];

      for (let batch = 0; batch < batches; batch++) {
        console.log(`Running batch ${batch + 1}/${batches}...`);

        const tokens = await Promise.all(
          Array(requestsPerBatch).fill(null).map(async (_, i) => 
            jwtService.createToken({
              issuer: 'oauth-mcp-gateway',
              subject: `sustained-test-user-${batch}-${i}`,
              audience: resourceIdentifier,
              scopes: 'mcp:tools:read',
              tenantId: testTenantId,
              userId: `sustained-test-user-${batch}-${i}`,
              expiresIn: 3600
            })
          )
        );

        const requests = tokens.map((token, i) => ({
          method: 'GET' as const,
          url: `/api/sustained-test/${batch}/${i}`,
          headers: { 'Authorization': `Bearer ${token}` },
          context: {
            tenant_id: testTenantId,
            user_id: `sustained-test-user-${batch}-${i}`,
            client_id: 'sustained-test-client',
            session_id: `sustained-test-session-${batch}-${i}`,
            scopes: ['mcp:tools:read'],
            ip_address: '127.0.0.1',
            user_agent: 'SustainedTestClient/1.0'
          }
        }));

        const startTime = performance.now();
        
        const results = await Promise.allSettled(
          requests.map(req => mcpProxy.forwardRequestByResource(resourceIdentifier, req))
        );

        const endTime = performance.now();
        const batchTime = endTime - startTime;

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const successRate = (successCount / requestsPerBatch) * 100;
        const avgLatency = batchTime / requestsPerBatch;
        const throughput = requestsPerBatch / (batchTime / 1000);

        batchResults.push({
          batchNumber: batch + 1,
          successRate,
          avgLatency,
          throughput
        });

        // Wait between batches
        if (batch < batches - 1) {
          await testUtils.sleep(batchDelay);
        }
      }

      // Analyze sustained performance
      const avgSuccessRate = batchResults.reduce((sum, batch) => sum + batch.successRate, 0) / batches;
      const avgLatency = batchResults.reduce((sum, batch) => sum + batch.avgLatency, 0) / batches;
      const avgThroughput = batchResults.reduce((sum, batch) => sum + batch.throughput, 0) / batches;

      console.log(`Sustained load test results:
        Batches: ${batches}
        Requests per batch: ${requestsPerBatch}
        Avg success rate: ${avgSuccessRate.toFixed(2)}%
        Avg latency: ${avgLatency.toFixed(2)}ms
        Avg throughput: ${avgThroughput.toFixed(2)} req/s`);

      // Performance should not degrade significantly over time
      const firstBatch = batchResults[0];
      const lastBatch = batchResults[batches - 1];
      const latencyDegradation = ((lastBatch.avgLatency - firstBatch.avgLatency) / firstBatch.avgLatency) * 100;

      console.log(`Performance degradation: ${latencyDegradation.toFixed(2)}%`);

      expect(avgSuccessRate).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.SUCCESS_RATE_MIN);
      expect(avgLatency).toBeLessThan(PERFORMANCE_TARGETS.P99_LATENCY_MAX_MS);
      expect(latencyDegradation).toBeLessThan(20); // Less than 20% degradation
    });
  });

  describe('Rate Limiting Performance', () => {
    it('should enforce rate limits without significant latency impact', async () => {
      const rateLimitConfig = {
        requests_per_minute: 100,
        requests_per_hour: 1000,
        burst_limit: 10
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

      console.log(`Rate limiting performance:
        Average: ${avgLatency.toFixed(2)}ms
        Max: ${maxLatency.toFixed(2)}ms`);

      expect(avgLatency).toBeLessThan(5); // Rate limiting should be very fast
      expect(maxLatency).toBeLessThan(20);
    });
  });

  describe('Session Management Performance', () => {
    it('should create and validate sessions efficiently', async () => {
      const sessionData = {
        user_id: testUserId,
        tenant_id: testTenantId,
        client_id: 'perf-test-client',
        ip_address: '127.0.0.1',
        user_agent: 'PerfTestClient/1.0',
        scopes: ['mcp:tools:read']
      };

      // Test session creation performance
      const createMeasurements: number[] = [];
      const validateMeasurements: number[] = [];
      const sessions: string[] = [];

      for (let i = 0; i < 50; i++) {
        // Create session
        const createStartTime = performance.now();
        const session = await sessionService.createSession({
          ...sessionData,
          user_id: `${testUserId}-${i}`
        });
        const createEndTime = performance.now();
        
        createMeasurements.push(createEndTime - createStartTime);
        sessions.push(session.session_id);

        // Validate session
        const validateStartTime = performance.now();
        const validatedSession = await sessionService.getSession(session.session_id, testTenantId);
        const validateEndTime = performance.now();
        
        validateMeasurements.push(validateEndTime - validateStartTime);
        expect(validatedSession).toBeDefined();
      }

      const avgCreateLatency = createMeasurements.reduce((a, b) => a + b, 0) / createMeasurements.length;
      const avgValidateLatency = validateMeasurements.reduce((a, b) => a + b, 0) / validateMeasurements.length;

      console.log(`Session management performance:
        Avg create: ${avgCreateLatency.toFixed(2)}ms
        Avg validate: ${avgValidateLatency.toFixed(2)}ms`);

      expect(avgCreateLatency).toBeLessThan(10);
      expect(avgValidateLatency).toBeLessThan(5);
    });
  });
});