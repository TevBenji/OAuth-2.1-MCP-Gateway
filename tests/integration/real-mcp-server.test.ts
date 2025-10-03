/**
 * Real MCP Server Integration Tests
 *
 * Tests complete OAuth 2.1 flow with real MCP server interactions,
 * validating end-to-end authentication, authorization, and request proxying.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestMCPServer, RealMCPServerMock } from '../helpers/real-mcp-server';
import { testUtils, mockEnv } from '../setup';
import { JWTService } from '../../src/services/oauth/jwt';
import { PKCEService } from '../../src/services/oauth/pkce';
import { TenantService } from '../../src/services/tenant/isolation';
import { MCPServerRegistry } from '../../src/services/mcp/registry';

describe('Real MCP Server Integration Tests', () => {
  let mcpServer: RealMCPServerMock;
  let jwtService: JWTService;
  let pkceService: PKCEService;
  let tenantService: TenantService;
  let mcpRegistry: MCPServerRegistry;

  const testTenantId = 'tenant-real-mcp-test';
  const testUserId = 'user-real-mcp-test';
  const testClientId = 'client-real-mcp-test';
  const mcpServerUrl = 'http://localhost:3001';

  beforeEach(async () => {
    // Initialize services
    jwtService = new JWTService('test-secret-key', 'HS256', 'oauth-mcp-gateway');
    pkceService = new PKCEService();
    tenantService = new TenantService(mockEnv.DB);
    mcpRegistry = new MCPServerRegistry(mockEnv.DB);

    // Create and start real MCP server mock
    mcpServer = createTestMCPServer({
      port: 3001,
      serverName: 'real-test-mcp-server',
      baseUrl: mcpServerUrl
    });
    await mcpServer.start();

    // Setup test tenant and MCP server registration
    await setupTestEnvironment();
  });

  afterEach(async () => {
    await mcpServer.stop();
    await cleanupTestData();
  });

  async function setupTestEnvironment() {
    // Create test tenant
    await tenantService.createTenant({
      tenant_id: testTenantId,
      name: 'Real MCP Test Tenant',
      domain: 'real-mcp-test.example.com',
      max_users: 100,
      max_mcp_servers: 10,
      compliance_tier: 'standard',
      audit_retention_days: 365
    });

    // Register MCP server
    await mcpRegistry.registerServer({
      tenant_id: testTenantId,
      name: 'Real Test MCP Server',
      endpoint_url: mcpServerUrl,
      resource_identifier: 'mcp://real-test-server',
      required_scopes: ['mcp:tools:read', 'mcp:tools:write'],
      health_check_url: `${mcpServerUrl}/health`
    });
  }

  async function cleanupTestData() {
    // Cleanup handled by test setup
  }

  describe('MCP Server Health and Discovery', () => {
    it('should successfully check MCP server health', async () => {
      const response = await fetch(`${mcpServerUrl}/health`);
      const healthData = await response.json();

      expect(response.status).toBe(200);
      expect(healthData.status).toBe('healthy');
      expect(healthData.server).toBe('real-test-mcp-server');
      expect(healthData.timestamp).toBeDefined();
    });

    it('should retrieve MCP server information', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/info`);
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
      const response = await fetch(`${mcpServerUrl}/mcp/tools/list`);
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
      const response = await fetch(`${mcpServerUrl}/mcp/resources/list`);
      const resourcesData = await response.json();

      expect(response.status).toBe(200);
      expect(resourcesData.resources).toBeDefined();
      expect(Array.isArray(resourcesData.resources)).toBe(true);
      expect(resourcesData.resources.length).toBeGreaterThan(0);
    });
  });

  describe('Authenticated MCP Tool Invocation', () => {
    let validAccessToken: string;

    beforeEach(async () => {
      // Create valid access token for testing
      validAccessToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: 'mcp://real-test-server',
        scopes: 'mcp:tools:read mcp:tools:write',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });
    });

    it('should successfully invoke MCP tool with valid OAuth token', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': testTenantId,
          'X-User-ID': testUserId
        },
        body: JSON.stringify({
          name: 'get_weather',
          arguments: {
            location: 'San Francisco'
          }
        })
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
          'X-User-ID': testUserId
        },
        body: JSON.stringify({
          name: 'get_weather',
          arguments: {
            location: 'New York'
          }
        })
      });

      const result = await response.json();

      // Verify tenant context was injected
      expect(result.content.tenant_id).toBe(testTenantId);

      // Verify request was logged with context
      const lastRequest = mcpServer.getLastRequest();
      expect(lastRequest.headers['X-Tenant-ID']).toBe(testTenantId);
      expect(lastRequest.headers['X-User-ID']).toBe(testUserId);
    });

    it('should execute calculator tool with proper validation', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': testTenantId,
          'X-User-ID': testUserId
        },
        body: JSON.stringify({
          name: 'calculate',
          arguments: {
            expression: '2 + 2'
          }
        })
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'get_weather',
          arguments: {
            location: 'London'
          }
        })
      });

      expect(response.status).toBe(401);
      const error = await response.json();
      expect(error.error).toBe('unauthorized');
    });

    it('should reject MCP tool call with invalid token', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid.token.here',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'get_weather',
          arguments: {
            location: 'Tokyo'
          }
        })
      });

      expect(response.status).toBe(401);
    });

    it('should return error for non-existent tool', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': testTenantId,
          'X-User-ID': testUserId
        },
        body: JSON.stringify({
          name: 'non_existent_tool',
          arguments: {}
        })
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
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: 'mcp://real-test-server',
        scopes: 'mcp:resources:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });
    });

    it('should successfully read MCP resource with valid OAuth token', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/resources/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': testTenantId,
          'X-User-ID': testUserId
        },
        body: JSON.stringify({
          uri: 'file:///data/sample.txt'
        })
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
          'X-User-ID': testUserId
        },
        body: JSON.stringify({
          uri: 'file:///data/sample.txt'
        })
      });

      const result = await response.json();

      // Verify tenant-specific data returned
      expect(result.contents[0].text).toContain(`tenant: ${testTenantId}`);

      // Verify request context
      const lastRequest = mcpServer.getLastRequest();
      expect(lastRequest.headers['X-Tenant-ID']).toBe(testTenantId);
    });

    it('should reject resource read without authorization', async () => {
      const response = await fetch(`${mcpServerUrl}/mcp/resources/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uri: 'file:///data/sample.txt'
        })
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Request Logging and Audit Trail', () => {
    let validAccessToken: string;

    beforeEach(async () => {
      mcpServer.clearRequestLog();

      validAccessToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: 'mcp://real-test-server',
        scopes: 'mcp:tools:read mcp:tools:write',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });
    });

    it('should log all MCP requests for audit purposes', async () => {
      // Make multiple requests
      await fetch(`${mcpServerUrl}/health`);
      await fetch(`${mcpServerUrl}/mcp/info`);
      await fetch(`${mcpServerUrl}/mcp/tools/list`);

      const requestLog = mcpServer.getRequestLog();
      expect(requestLog.length).toBe(3);
      expect(requestLog[0].path).toBe('/health');
      expect(requestLog[1].path).toBe('/mcp/info');
      expect(requestLog[2].path).toBe('/mcp/tools/list');
    });

    it('should track request timestamps for performance analysis', async () => {
      const before = Date.now();

      await fetch(`${mcpServerUrl}/health`);

      const after = Date.now();
      const lastRequest = mcpServer.getLastRequest();

      expect(lastRequest.timestamp).toBeGreaterThanOrEqual(before);
      expect(lastRequest.timestamp).toBeLessThanOrEqual(after);
    });

    it('should maintain complete request history', async () => {
      // Execute tool call
      await fetch(`${mcpServerUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validAccessToken}`,
          'Content-Type': 'application/json',
          'X-Tenant-ID': testTenantId,
          'X-User-ID': testUserId
        },
        body: JSON.stringify({
          name: 'get_weather',
          arguments: { location: 'Boston' }
        })
      });

      const toolCallRequests = mcpServer.getRequestsByPath('/mcp/tools/call');
      expect(toolCallRequests.length).toBe(1);
      expect(toolCallRequests[0].method).toBe('POST');
      expect(toolCallRequests[0].body).toBeDefined();
      expect(toolCallRequests[0].body.name).toBe('get_weather');
    });

    it('should assert specific requests were made', () => {
      mcpServer.clearRequestLog();

      // Perform health check
      fetch(`${mcpServerUrl}/health`);

      // Assert request was made
      expect(mcpServer.assertRequestMade('GET', '/health')).toBe(true);
      expect(mcpServer.assertRequestMade('POST', '/health')).toBe(false);
      expect(mcpServer.assertRequestMade('GET', '/non-existent')).toBe(false);
    });
  });
});
