/**
 * Real MCP Server Integration Tests
 *
 * Tests complete OAuth 2.1 flow with a real local HTTP MCP server,
 * validating end-to-end authentication, authorization, and request proxying.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHmac } from 'node:crypto';
import app from '../../src/index';
import { createTestMCPServer, RealMCPServerMock } from '../helpers/real-mcp-server';
import { getTestDb } from '../helpers/db';
import { makeTestEnv } from '../helpers/env';
import { JWTService } from '../../src/services/oauth/jwt';
import { TenantService } from '../../src/services/tenant/isolation';
import { MCPServerRegistry } from '../../src/services/mcp/registry';
import { PgMcpServerDatabase } from '../../src/storage/pg-mcp-server-database';

describe('Real MCP Server Integration Tests', () => {
  let mcpServer: RealMCPServerMock;
  let jwtService: JWTService;
  let tenantService: TenantService;
  let mcpRegistry: MCPServerRegistry;
  let mcpServerUrl: string;
  let registeredServerId: string;

  const testEnv = makeTestEnv();
  const testTenantId = 'tenant-real-mcp-test';
  const testUserId = 'user-real-mcp-test';

  beforeEach(async () => {
    const { db } = getTestDb();
    jwtService = new JWTService(testEnv.JWT_SECRET, 'HS256', testEnv.JWT_ISSUER);
    tenantService = new TenantService(db);
    mcpRegistry = new MCPServerRegistry(new PgMcpServerDatabase(db));

    // Start a real local HTTP MCP server on an ephemeral port
    mcpServer = createTestMCPServer({ port: 0, serverName: 'real-test-mcp-server' });
    await mcpServer.start();
    mcpServerUrl = mcpServer.baseUrl;

    // Create test tenant
    await tenantService.createTenant({
      tenant_id: testTenantId,
      name: 'Real MCP Test Tenant',
      domain: 'real-mcp-test.example.com',
      max_users: 100,
      max_mcp_servers: 10,
      compliance_tier: 'standard',
      audit_retention_days: 365,
    });

    // Register MCP server in the real Postgres-backed registry
    const entry = await mcpRegistry.registerServer({
      tenant_id: testTenantId,
      name: 'Real Test MCP Server',
      endpoint_url: mcpServerUrl,
      resource_identifier: 'mcp://real-test-server',
      required_scopes: ['mcp:tools:read', 'mcp:tools:write'],
      health_check_url: `${mcpServerUrl}/health`,
      status: 'active',
      timeout_ms: 5000,
      retry_attempts: 0,
    });
    registeredServerId = entry.server_id;
  });

  afterEach(async () => {
    await mcpServer.stop();
  });

  describe('MCP Server Health and Discovery', () => {
    it('should successfully check MCP server health', async () => {
      const response = await fetch(`${mcpServerUrl}/health`);
      const healthData = await response.json();

      expect(response.status).toBe(200);
      expect(healthData.status).toBe('healthy');
      expect(healthData.server).toBe('real-test-mcp-server');
      expect(healthData.timestamp).toBeDefined();
    });

    it('should record a healthy status in the registry after registration', async () => {
      const health = await mcpRegistry.performHealthCheck(registeredServerId, testTenantId);
      expect(health.status).toBe('healthy');
      expect(health.consecutive_failures).toBe(0);
    });

    it('should retrieve MCP server information', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/info`, {
        headers: { Authorization: 'Bearer test' },
      });
      const serverInfo = await response.json();

      expect(response.status).toBe(200);
      expect(serverInfo.name).toBe('real-test-mcp-server');
      expect(serverInfo.version).toBeDefined();
      expect(serverInfo.protocol_version).toBe('2024-11-05');
      expect(serverInfo.capabilities).toBeDefined();
      expect(serverInfo.capabilities.tools).toBe(true);
      expect(serverInfo.capabilities.resources).toBe(true);
    });

    it('should list available MCP tools', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/tools/list`, {
        headers: { Authorization: 'Bearer test' },
      });
      const toolsData = await response.json();

      expect(response.status).toBe(200);
      expect(toolsData.tools).toBeDefined();
      expect(Array.isArray(toolsData.tools)).toBe(true);
      expect(toolsData.tools.length).toBeGreaterThan(0);

      const weatherTool = toolsData.tools.find((t: any) => t.name === 'get_weather');
      expect(weatherTool).toBeDefined();
      expect(weatherTool.description).toBe('Get current weather for a location');
    });

    it('should list available MCP resources', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/resources/list`, {
        headers: { Authorization: 'Bearer test' },
      });
      const resourcesData = await response.json();

      expect(response.status).toBe(200);
      expect(resourcesData.resources).toBeDefined();
      expect(Array.isArray(resourcesData.resources)).toBe(true);
      expect(resourcesData.resources.length).toBeGreaterThan(0);
    });
  });

  describe('Gateway-proxied MCP access', () => {
    let validAccessToken: string;

    beforeEach(async () => {
      validAccessToken = await jwtService.createToken({
        issuer: testEnv.JWT_ISSUER,
        subject: testUserId,
        audience: 'mcp://real-test-server',
        scopes: 'mcp:tools:read mcp:tools:write mcp:resources:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600,
      });
    });

    it('should proxy an authenticated request through the gateway to the real server', async () => {
      const response = await app.request(
        `/mcp/${registeredServerId}/mcp/tools/list`,
        { headers: { Authorization: `Bearer ${validAccessToken}` } },
        testEnv
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.tools.some((t: any) => t.name === 'get_weather')).toBe(true);

      // The upstream server must have received injected tenant context headers
      const lastRequest = mcpServer.getLastRequest();
      expect(lastRequest).toBeDefined();
      expect(lastRequest!.headers['x-tenant-id']).toBe(testTenantId);
      expect(lastRequest!.headers['x-user-id']).toBe(testUserId);
    });

    it('should invoke a tool through the gateway with context injection', async () => {
      const response = await app.request(
        `/mcp/${registeredServerId}/mcp/tools/call`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${validAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'get_weather', arguments: { location: 'San Francisco' } }),
        },
        testEnv
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.content.location).toBe('San Francisco');
      expect(result.content.tenant_id).toBe(testTenantId);
      expect(result.isError).toBe(false);
    });

    it('must not forward the client bearer upstream, and strips smuggled identity headers', async () => {
      const response = await app.request(
        `/mcp/${registeredServerId}/mcp/tools/list`,
        {
          headers: {
            Authorization: `Bearer ${validAccessToken}`,
            'X-Tenant-ID': 'attacker-tenant',
            'X-User-ID': 'attacker-user',
            'X-OAuth-Scopes': 'mcp:admin',
          },
        },
        testEnv
      );

      expect(response.status).toBe(200);
      const upstream = mcpServer.getLastRequest()!;
      // The gateway terminates auth: the client's bearer never reaches upstream.
      expect(upstream.headers['authorization']).toBeUndefined();
      // Identity comes from the verified token, never from client-supplied headers.
      expect(upstream.headers['x-tenant-id']).toBe(testTenantId);
      expect(upstream.headers['x-user-id']).toBe(testUserId);
      expect(upstream.headers['x-oauth-scopes']).not.toContain('mcp:admin');
    });

    it('should reject gateway access without a token', async () => {
      const response = await app.request(
        `/mcp/${registeredServerId}/mcp/tools/list`,
        {},
        testEnv
      );

      expect(response.status).toBe(401);
    });
  });

  describe('Upstream context signing (opt-in HMAC)', () => {
    const upstreamSecret = 'integration-shared-secret';
    // Separate env: the proxy service (and its secret map) is built per env
    const signedEnv = makeTestEnv({
      UPSTREAM_HMAC_SECRETS: JSON.stringify({ 'mcp://real-test-server': upstreamSecret }),
    });
    let validAccessToken: string;

    beforeEach(async () => {
      validAccessToken = await jwtService.createToken({
        issuer: testEnv.JWT_ISSUER,
        subject: testUserId,
        audience: 'mcp://real-test-server',
        scopes: 'mcp:tools:read mcp:tools:write mcp:resources:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600,
      });
    });

    it('adds a fresh timestamp and a verifiable v1 signature when a secret is configured', async () => {
      const response = await app.request(
        `/mcp/${registeredServerId}/mcp/tools/list`,
        { headers: { Authorization: `Bearer ${validAccessToken}` } },
        signedEnv
      );

      expect(response.status).toBe(200);
      const upstream = mcpServer.getLastRequest()!;

      const ts = Number(upstream.headers['x-gateway-ts']);
      expect(Number.isFinite(ts)).toBe(true);
      expect(Math.abs(Date.now() / 1000 - ts)).toBeLessThan(60);

      const signature = upstream.headers['x-gateway-signature'];
      expect(signature).toMatch(/^v1=[0-9a-f]{64}$/);

      // Independent verification, exactly as an upstream would do it
      // (docs/security/upstream-verification.md): tenant|user|client|scopes|ts
      const payload = [
        upstream.headers['x-tenant-id'],
        upstream.headers['x-user-id'],
        upstream.headers['x-client-id'] ?? '',
        upstream.headers['x-oauth-scopes'] ?? '',
        String(ts),
      ].join('|');
      const expected = createHmac('sha256', upstreamSecret).update(payload).digest('hex');
      expect(signature).toBe(`v1=${expected}`);
    });

    it('sends no signature headers when no secret is configured, even if the client smuggles them', async () => {
      const response = await app.request(
        `/mcp/${registeredServerId}/mcp/tools/list`,
        {
          headers: {
            Authorization: `Bearer ${validAccessToken}`,
            'X-Gateway-Ts': '1700000000',
            'X-Gateway-Signature': 'v1=forged',
          },
        },
        testEnv
      );

      expect(response.status).toBe(200);
      const upstream = mcpServer.getLastRequest()!;
      expect(upstream.headers['x-gateway-ts']).toBeUndefined();
      expect(upstream.headers['x-gateway-signature']).toBeUndefined();
    });
  });

  describe('Authenticated MCP Tool Invocation', () => {
    let validAccessToken: string;

    beforeEach(async () => {
      validAccessToken = await jwtService.createToken({
        issuer: testEnv.JWT_ISSUER,
        subject: testUserId,
        audience: 'mcp://real-test-server',
        scopes: 'mcp:tools:read mcp:tools:write',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600,
      });
    });

    it('should successfully invoke MCP tool with valid OAuth token', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': testTenantId,
          'X-User-ID': testUserId,
        },
        body: JSON.stringify({
          name: 'get_weather',
          arguments: { location: 'San Francisco' },
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.content).toBeDefined();
      expect(result.content.location).toBe('San Francisco');
      expect(result.content.temperature).toBeDefined();
      expect(result.content.condition).toBeDefined();
      expect(result.content.tenant_id).toBe(testTenantId);
      expect(result.isError).toBe(false);
    });

    it('should inject tenant context into MCP tool calls', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': testTenantId,
          'X-User-ID': testUserId,
        },
        body: JSON.stringify({
          name: 'get_weather',
          arguments: { location: 'New York' },
        }),
      });

      const result = await response.json();

      // Verify tenant context was injected
      expect(result.content.tenant_id).toBe(testTenantId);

      // Verify request was logged with context
      const lastRequest = mcpServer.getLastRequest();
      expect(lastRequest).toBeDefined();
      expect(lastRequest!.headers['x-tenant-id']).toBe(testTenantId);
      expect(lastRequest!.headers['x-user-id']).toBe(testUserId);
    });

    it('should execute calculator tool with proper validation', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': testTenantId,
          'X-User-ID': testUserId,
        },
        body: JSON.stringify({
          name: 'calculate',
          arguments: { expression: '2 + 2' },
        }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.content.expression).toBe('2 + 2');
      expect(result.content.result).toBe(4);
      expect(result.isError).toBe(false);
    });

    it('should reject MCP tool call without authorization', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'get_weather',
          arguments: { location: 'London' },
        }),
      });

      expect(response.status).toBe(401);
      const error = await response.json();
      expect(error.error).toBe('unauthorized');
    });

    it('should return error for non-existent tool', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': testTenantId,
          'X-User-ID': testUserId,
        },
        body: JSON.stringify({ name: 'non_existent_tool', arguments: {} }),
      });

      expect(response.status).toBe(500);
      const error = await response.json();
      expect(error.error_description).toContain('Tool not found');
    });
  });

  describe('Authenticated MCP Resource Access', () => {
    let validAccessToken: string;

    beforeEach(async () => {
      validAccessToken = await jwtService.createToken({
        issuer: testEnv.JWT_ISSUER,
        subject: testUserId,
        audience: 'mcp://real-test-server',
        scopes: 'mcp:resources:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600,
      });
    });

    it('should successfully read MCP resource with valid OAuth token', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/resources/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': testTenantId,
          'X-User-ID': testUserId,
        },
        body: JSON.stringify({ uri: 'file:///data/sample.txt' }),
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.contents).toBeDefined();
      expect(Array.isArray(result.contents)).toBe(true);
      expect(result.contents.length).toBeGreaterThan(0);
      expect(result.contents[0].uri).toBe('file:///data/sample.txt');
      expect(result.contents[0].text).toContain(testTenantId);
    });

    it('should inject tenant context into resource reads', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/resources/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': testTenantId,
          'X-User-ID': testUserId,
        },
        body: JSON.stringify({ uri: 'file:///data/sample.txt' }),
      });

      const result = await response.json();

      // Verify tenant-specific data returned
      expect(result.contents[0].text).toContain(`tenant: ${testTenantId}`);

      // Verify request context
      const lastRequest = mcpServer.getLastRequest();
      expect(lastRequest).toBeDefined();
      expect(lastRequest!.headers['x-tenant-id']).toBe(testTenantId);
    });

    it('should reject resource read without authorization', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/resources/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: 'file:///data/sample.txt' }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Request Logging and Audit Trail', () => {
    let validAccessToken: string;

    beforeEach(async () => {
      mcpServer.clearRequestLog();

      validAccessToken = await jwtService.createToken({
        issuer: testEnv.JWT_ISSUER,
        subject: testUserId,
        audience: 'mcp://real-test-server',
        scopes: 'mcp:tools:read mcp:tools:write',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600,
      });
    });

    it('should log all MCP requests for audit purposes', async () => {
      await fetch(`${mcpServerUrl}/health`);
      await fetch(`${mcpServerUrl}/mcp/info`, { headers: { Authorization: 'Bearer test' } });
      await fetch(`${mcpServerUrl}/mcp/tools/list`, { headers: { Authorization: 'Bearer test' } });

      const requestLog = mcpServer.getRequestLog();
      expect(requestLog.length).toBe(3);
      expect(requestLog[0]!.path).toBe('/health');
      expect(requestLog[1]!.path).toBe('/mcp/info');
      expect(requestLog[2]!.path).toBe('/mcp/tools/list');
    });

    it('should track request timestamps for performance analysis', async () => {
      const before = Date.now();

      await fetch(`${mcpServerUrl}/health`);

      const after = Date.now();
      const lastRequest = mcpServer.getLastRequest();

      expect(lastRequest).toBeDefined();
      expect(lastRequest!.timestamp).toBeGreaterThanOrEqual(before);
      expect(lastRequest!.timestamp).toBeLessThanOrEqual(after);
    });

    it('should maintain complete request history', async () => {
      await fetch(`${mcpServerUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': testTenantId,
          'X-User-ID': testUserId,
        },
        body: JSON.stringify({
          name: 'get_weather',
          arguments: { location: 'Boston' },
        }),
      });

      const toolCallRequests = mcpServer.getRequestsByPath('/mcp/tools/call');
      expect(toolCallRequests.length).toBe(1);
      expect(toolCallRequests[0]!.method).toBe('POST');
      expect(toolCallRequests[0]!.body).toBeDefined();
      expect(toolCallRequests[0]!.body.name).toBe('get_weather');
    });

    it('should assert specific requests were made', async () => {
      mcpServer.clearRequestLog();

      await fetch(`${mcpServerUrl}/health`);

      expect(mcpServer.assertRequestMade('GET', '/health')).toBe(true);
      expect(mcpServer.assertRequestMade('POST', '/health')).toBe(false);
      expect(mcpServer.assertRequestMade('GET', '/non-existent')).toBe(false);
    });
  });
});
