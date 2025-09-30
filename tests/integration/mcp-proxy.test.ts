/**
 * MCP Proxy Integration Tests
 *
 * End-to-end tests for MCP request validation, routing, and proxying.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JWTService } from '../../src/services/oauth/jwt';
import { MCPServerRegistry } from '../../src/services/mcp/registry';
import { MCPProxyService } from '../../src/services/mcp/proxy';
import {
  MCPServerConfig,
  MCPRequestContext,
  MCPProxyRequest,
} from '../../src/types/mcp';

describe('MCP Proxy Integration Tests', () => {
  let jwtService: JWTService;
  let mockRegistry: MCPServerRegistry;
  let proxyService: MCPProxyService;
  let testToken: string;
  let testTenantId: string;
  let testServerId: string;

  beforeEach(async () => {
    // Setup JWT service
    jwtService = new JWTService('test-secret-key', 'HS256', 'oauth-mcp-gateway');

    testTenantId = 'tenant-123';
    testServerId = 'server-456';

    // Create test token
    testToken = await jwtService.createToken({
      subject: 'client-123',
      audience: 'https://mcp-server.example.com',
      scopes: 'mcp:tools:read mcp:resources:read',
      tenantId: testTenantId,
      userId: 'user-789',
      expiresIn: 3600,
    });

    // Mock registry
    mockRegistry = {
      validateServerForRequest: vi.fn(),
      recordAccess: vi.fn(),
      getServerByResource: vi.fn(),
    } as any;

    // Setup proxy service
    proxyService = new MCPProxyService(mockRegistry);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Bearer Token Extraction and Validation', () => {
    it('should extract and validate valid Bearer token', async () => {
      const result = await jwtService.verifyToken(testToken);

      expect(result.payload).toBeDefined();
      expect(result.payload.sub).toBe('client-123');
      expect(result.payload.tenant_id).toBe(testTenantId);
      expect(result.payload.user_id).toBe('user-789');
    });

    it('should reject invalid Bearer token', async () => {
      await expect(jwtService.verifyToken('invalid-token')).rejects.toThrow(
        'JWT verification failed'
      );
    });

    it('should reject expired token', async () => {
      const expiredToken = await jwtService.createToken({
        subject: 'client-123',
        audience: 'https://mcp-server.example.com',
        tenantId: testTenantId,
        userId: 'user-789',
        expiresIn: -3600, // Already expired
      });

      await expect(jwtService.verifyToken(expiredToken)).rejects.toThrow();
    });

    it('should extract tenant_id from token', async () => {
      const tenantId = await jwtService.extractTenantId(testToken);
      expect(tenantId).toBe(testTenantId);
    });
  });

  describe('MCP Request Context Injection', () => {
    it('should inject tenant context headers', async () => {
      const mockServer: any = {
        server_id: testServerId,
        tenant_id: testTenantId,
        config: {
          endpoint_url: 'https://mcp-server.example.com',
          timeout_ms: 30000,
          retry_attempts: 3,
          required_scopes: [],
        },
        health: {
          status: 'healthy',
          consecutive_failures: 0,
        },
      };

      vi.mocked(mockRegistry.validateServerForRequest).mockResolvedValue(mockServer);

      const context: MCPRequestContext = {
        tenant_id: testTenantId,
        user_id: 'user-789',
        client_id: 'client-123',
        session_id: 'session-abc',
        scopes: ['mcp:tools:read'],
        ip_address: '192.168.1.1',
        user_agent: 'TestClient/1.0',
      };

      const proxyRequest: MCPProxyRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {
          'Content-Type': 'application/json',
        },
        context,
      };

      // Mock fetch to verify headers
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ success: true }),
      });

      global.fetch = mockFetch;

      await proxyService.forwardRequest(testServerId, proxyRequest);

      // Verify tenant context headers were added
      const fetchCall = mockFetch.mock.calls[0];
      const fetchHeaders = fetchCall[1].headers as Record<string, string>;

      expect(fetchHeaders['X-Tenant-ID']).toBe(testTenantId);
      expect(fetchHeaders['X-User-ID']).toBe('user-789');
      expect(fetchHeaders['X-Client-ID']).toBe('client-123');
      expect(fetchHeaders['X-Session-ID']).toBe('session-abc');
      expect(fetchHeaders['X-OAuth-Scopes']).toBe('mcp:tools:read');
    });
  });

  describe('Request Forwarding with Error Handling', () => {
    it('should successfully forward request to upstream server', async () => {
      const mockServer: any = {
        server_id: testServerId,
        tenant_id: testTenantId,
        config: {
          endpoint_url: 'https://mcp-server.example.com',
          timeout_ms: 30000,
          retry_attempts: 3,
          required_scopes: [],
        },
        health: {
          status: 'healthy',
          consecutive_failures: 0,
        },
      };

      vi.mocked(mockRegistry.validateServerForRequest).mockResolvedValue(mockServer);

      const context: MCPRequestContext = {
        tenant_id: testTenantId,
        user_id: 'user-789',
        client_id: 'client-123',
        session_id: 'session-abc',
        scopes: ['mcp:tools:read'],
        ip_address: '192.168.1.1',
        user_agent: 'TestClient/1.0',
      };

      const proxyRequest: MCPProxyRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context,
      };

      // Mock successful response
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ data: 'test' }),
      });

      global.fetch = mockFetch;

      const response = await proxyService.forwardRequest(testServerId, proxyRequest);

      expect(response.status).toBe(200);
      expect(response.latency_ms).toBeGreaterThan(0);
      expect(mockRegistry.recordAccess).toHaveBeenCalledWith(testServerId, testTenantId);
    });

    it('should retry on server errors', async () => {
      const mockServer: any = {
        server_id: testServerId,
        tenant_id: testTenantId,
        config: {
          endpoint_url: 'https://mcp-server.example.com',
          timeout_ms: 30000,
          retry_attempts: 2,
          required_scopes: [],
        },
        health: {
          status: 'healthy',
          consecutive_failures: 0,
        },
      };

      vi.mocked(mockRegistry.validateServerForRequest).mockResolvedValue(mockServer);

      const context: MCPRequestContext = {
        tenant_id: testTenantId,
        user_id: 'user-789',
        client_id: 'client-123',
        session_id: 'session-abc',
        scopes: ['mcp:tools:read'],
        ip_address: '192.168.1.1',
        user_agent: 'TestClient/1.0',
      };

      const proxyRequest: MCPProxyRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context,
      };

      // Mock failure then success
      const mockFetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers(),
          text: async () => 'Service temporarily unavailable',
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: async () => JSON.stringify({ data: 'test' }),
        });

      global.fetch = mockFetch;

      const response = await proxyService.forwardRequest(testServerId, proxyRequest, {
        retryDelay: 100,
      });

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not retry on client errors (4xx)', async () => {
      const mockServer: any = {
        server_id: testServerId,
        tenant_id: testTenantId,
        config: {
          endpoint_url: 'https://mcp-server.example.com',
          timeout_ms: 30000,
          retry_attempts: 3,
          required_scopes: [],
        },
        health: {
          status: 'healthy',
          consecutive_failures: 0,
        },
      };

      vi.mocked(mockRegistry.validateServerForRequest).mockResolvedValue(mockServer);

      const context: MCPRequestContext = {
        tenant_id: testTenantId,
        user_id: 'user-789',
        client_id: 'client-123',
        session_id: 'session-abc',
        scopes: ['mcp:tools:read'],
        ip_address: '192.168.1.1',
        user_agent: 'TestClient/1.0',
      };

      const proxyRequest: MCPProxyRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context,
      };

      // Mock 404 error
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        text: async () => 'Resource not found',
      });

      global.fetch = mockFetch;

      const response = await proxyService.forwardRequest(testServerId, proxyRequest);

      expect(response.status).toBe(404);
      expect(mockFetch).toHaveBeenCalledTimes(1); // No retry
    });

    it('should handle request timeout', async () => {
      const mockServer: any = {
        server_id: testServerId,
        tenant_id: testTenantId,
        config: {
          endpoint_url: 'https://mcp-server.example.com',
          timeout_ms: 100, // Very short timeout
          retry_attempts: 1,
          required_scopes: [],
        },
        health: {
          status: 'healthy',
          consecutive_failures: 0,
        },
      };

      vi.mocked(mockRegistry.validateServerForRequest).mockResolvedValue(mockServer);

      const context: MCPRequestContext = {
        tenant_id: testTenantId,
        user_id: 'user-789',
        client_id: 'client-123',
        session_id: 'session-abc',
        scopes: ['mcp:tools:read'],
        ip_address: '192.168.1.1',
        user_agent: 'TestClient/1.0',
      };

      const proxyRequest: MCPProxyRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context,
      };

      // Mock slow response
      const mockFetch = vi.fn().mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                headers: new Headers(),
                text: async () => 'response',
              });
            }, 500)
          )
      );

      global.fetch = mockFetch;

      await expect(
        proxyService.forwardRequest(testServerId, proxyRequest)
      ).rejects.toThrow('UPSTREAM_REQUEST_FAILED');
    });
  });

  describe('Resource Identifier Routing (RFC 8707)', () => {
    it('should route request by resource identifier', async () => {
      const resourceIdentifier = 'https://mcp-server.example.com';

      const mockServer: any = {
        server_id: testServerId,
        tenant_id: testTenantId,
        config: {
          endpoint_url: 'https://mcp-server.example.com',
          resource_identifier: resourceIdentifier,
          timeout_ms: 30000,
          retry_attempts: 3,
          required_scopes: [],
        },
        health: {
          status: 'healthy',
          consecutive_failures: 0,
        },
      };

      vi.mocked(mockRegistry.getServerByResource).mockResolvedValue(mockServer);
      vi.mocked(mockRegistry.validateServerForRequest).mockResolvedValue(mockServer);

      const context: MCPRequestContext = {
        tenant_id: testTenantId,
        user_id: 'user-789',
        client_id: 'client-123',
        session_id: 'session-abc',
        scopes: ['mcp:tools:read'],
        ip_address: '192.168.1.1',
        user_agent: 'TestClient/1.0',
      };

      const proxyRequest: MCPProxyRequest = {
        method: 'GET',
        url: '/api/test',
        headers: {},
        context,
      };

      // Mock successful response
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        text: async () => JSON.stringify({ data: 'test' }),
      });

      global.fetch = mockFetch;

      const response = await proxyService.forwardRequestByResource(
        resourceIdentifier,
        proxyRequest
      );

      expect(response.status).toBe(200);
      expect(mockRegistry.getServerByResource).toHaveBeenCalledWith(
        resourceIdentifier,
        testTenantId
      );
    });
  });
});
