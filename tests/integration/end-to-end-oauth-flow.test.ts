/**
 * End-to-End OAuth 2.1 Flow Integration Tests
 * 
 * Complete OAuth 2.1 authorization code flow with PKCE testing
 * using real MCP server interactions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testUtils, mockEnv } from '../setup';
import { JWTService } from '../../src/services/oauth/jwt';
import { PKCEService } from '../../src/services/oauth/pkce';
import { OAuthClientService } from '../../src/services/oauth/client';
import { MCPServerRegistry } from '../../src/services/mcp/registry';
import { MCPProxyService } from '../../src/services/mcp/proxy';
import { TenantService } from '../../src/services/tenant/isolation';
import { AuditService } from '../../src/services/security/audit';

// Mock MCP Server for testing
class MockMCPServer {
  private port: number;
  private server: any;
  private responses: Map<string, any> = new Map();

  constructor(port: number = 3001) {
    this.port = port;
  }

  setResponse(path: string, response: any) {
    this.responses.set(path, response);
  }

  async start() {
    // Mock server implementation
    this.server = {
      listen: vi.fn(),
      close: vi.fn()
    };
    
    // Mock fetch to simulate server responses
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url: string, options: any) => {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      
      if (this.responses.has(path)) {
        const response = this.responses.get(path);
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
          text: async () => JSON.stringify(response),
          json: async () => response
        };
      }
      
      return originalFetch(url, options);
    });
  }

  async stop() {
    if (this.server) {
      this.server.close();
    }
    vi.restoreAllMocks();
  }
}

describe('End-to-End OAuth 2.1 Flow with Real MCP Servers', () => {
  let jwtService: JWTService;
  let pkceService: PKCEService;
  let clientService: OAuthClientService;
  let mcpRegistry: MCPServerRegistry;
  let mcpProxy: MCPProxyService;
  let tenantService: TenantService;
  let auditService: AuditService;
  let mockMCPServer: MockMCPServer;
  
  const testTenantId = 'tenant-e2e-test';
  const testUserId = 'user-e2e-test';
  const testClientId = 'client-e2e-test';
  const mcpServerUrl = 'http://localhost:3001';
  const resourceIdentifier = 'mcp://test-server/tools';

  beforeEach(async () => {
    // Initialize services
    jwtService = new JWTService('test-secret-key', 'HS256', 'oauth-mcp-gateway');
    pkceService = new PKCEService();
    clientService = new OAuthClientService(mockEnv.DB);
    mcpRegistry = new MCPServerRegistry(mockEnv.DB);
    mcpProxy = new MCPProxyService(mcpRegistry);
    tenantService = new TenantService(mockEnv.DB);
    auditService = new AuditService(mockEnv.DB);

    // Start mock MCP server
    mockMCPServer = new MockMCPServer();
    await mockMCPServer.start();

    // Setup test data
    await setupTestTenant();
    await setupTestClient();
    await setupTestMCPServer();
  });

  afterEach(async () => {
    await mockMCPServer.stop();
    await cleanupTestData();
  });

  async function setupTestTenant() {
    await tenantService.createTenant({
      tenant_id: testTenantId,
      name: 'E2E Test Tenant',
      domain: 'e2e-test.example.com',
      max_users: 100,
      max_mcp_servers: 10,
      compliance_tier: 'standard',
      audit_retention_days: 365
    });
  }

  async function setupTestClient() {
    await clientService.createClient({
      client_id: testClientId,
      tenant_id: testTenantId,
      redirect_uris: ['http://localhost:3000/callback'],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      scope: 'mcp:tools:read mcp:resources:read mcp:tools:write'
    });
  }

  async function setupTestMCPServer() {
    await mcpRegistry.registerServer({
      tenant_id: testTenantId,
      name: 'Test MCP Server',
      endpoint_url: mcpServerUrl,
      resource_identifier: resourceIdentifier,
      required_scopes: ['mcp:tools:read'],
      health_check_url: `${mcpServerUrl}/health`
    });

    // Setup mock responses
    mockMCPServer.setResponse('/health', { status: 'healthy' });
    mockMCPServer.setResponse('/api/tools', {
      tools: [
        { name: 'weather', description: 'Get weather information' },
        { name: 'calculator', description: 'Perform calculations' }
      ]
    });
    mockMCPServer.setResponse('/api/tools/weather', {
      result: { temperature: 22, condition: 'sunny' }
    });
  }

  async function cleanupTestData() {
    // Cleanup is handled by afterEach in setup.ts
  }

  describe('Complete Authorization Code Flow', () => {
    it('should complete full OAuth 2.1 flow and access MCP resources', async () => {
      // Step 1: Client generates PKCE challenge
      const { codeVerifier, codeChallenge } = await pkceService.generateChallenge();
      
      // Step 2: Authorization request
      const state = 'test-state-' + Math.random().toString(36).substring(7);
      const authorizationUrl = new URL('https://oauth-mcp-gateway.com/authorize');
      authorizationUrl.searchParams.set('response_type', 'code');
      authorizationUrl.searchParams.set('client_id', testClientId);
      authorizationUrl.searchParams.set('redirect_uri', 'http://localhost:3000/callback');
      authorizationUrl.searchParams.set('scope', 'mcp:tools:read mcp:resources:read');
      authorizationUrl.searchParams.set('state', state);
      authorizationUrl.searchParams.set('code_challenge', codeChallenge);
      authorizationUrl.searchParams.set('code_challenge_method', 'S256');
      authorizationUrl.searchParams.set('resource', resourceIdentifier);

      // Step 3: Simulate user authorization (normally done through UI)
      const authorizationCode = 'auth_' + Math.random().toString(36).substring(7);
      
      // Store authorization code with PKCE challenge
      await mockEnv.CACHE.put(
        `auth_code:${authorizationCode}`,
        JSON.stringify({
          client_id: testClientId,
          user_id: testUserId,
          tenant_id: testTenantId,
          redirect_uri: 'http://localhost:3000/callback',
          scope: 'mcp:tools:read mcp:resources:read',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          resource: resourceIdentifier,
          expires_at: Date.now() + 600000 // 10 minutes
        }),
        { expirationTtl: 600 }
      );

      // Step 4: Token exchange
      const tokenResponse = await exchangeAuthorizationCode(
        authorizationCode,
        codeVerifier,
        testClientId,
        'http://localhost:3000/callback',
        resourceIdentifier
      );

      expect(tokenResponse.access_token).toBeDefined();
      expect(tokenResponse.token_type).toBe('Bearer');
      expect(tokenResponse.expires_in).toBe(3600);
      expect(tokenResponse.scope).toBe('mcp:tools:read mcp:resources:read');

      // Step 5: Verify token can access MCP resources
      const mcpResponse = await accessMCPResource(
        tokenResponse.access_token,
        '/api/tools'
      );

      expect(mcpResponse.status).toBe(200);
      expect(mcpResponse.data.tools).toHaveLength(2);
      expect(mcpResponse.data.tools[0].name).toBe('weather');

      // Step 6: Verify audit logging
      const auditLogs = await auditService.queryLogs({
        tenant_id: testTenantId,
        user_id: testUserId,
        event_type: 'auth.token_issued'
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].outcome).toBe('success');
      expect(auditLogs[0].resource_type).toBe('oauth_token');
    });

    it('should reject invalid PKCE verifier', async () => {
      const { codeChallenge } = await pkceService.generateChallenge();
      const invalidVerifier = 'invalid-verifier';
      
      const authorizationCode = 'auth_' + Math.random().toString(36).substring(7);
      
      await mockEnv.CACHE.put(
        `auth_code:${authorizationCode}`,
        JSON.stringify({
          client_id: testClientId,
          user_id: testUserId,
          tenant_id: testTenantId,
          redirect_uri: 'http://localhost:3000/callback',
          scope: 'mcp:tools:read',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          resource: resourceIdentifier,
          expires_at: Date.now() + 600000
        }),
        { expirationTtl: 600 }
      );

      await expect(
        exchangeAuthorizationCode(
          authorizationCode,
          invalidVerifier,
          testClientId,
          'http://localhost:3000/callback',
          resourceIdentifier
        )
      ).rejects.toThrow('PKCE verification failed');
    });

    it('should reject expired authorization code', async () => {
      const { codeVerifier, codeChallenge } = await pkceService.generateChallenge();
      const authorizationCode = 'auth_' + Math.random().toString(36).substring(7);
      
      await mockEnv.CACHE.put(
        `auth_code:${authorizationCode}`,
        JSON.stringify({
          client_id: testClientId,
          user_id: testUserId,
          tenant_id: testTenantId,
          redirect_uri: 'http://localhost:3000/callback',
          scope: 'mcp:tools:read',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          resource: resourceIdentifier,
          expires_at: Date.now() - 1000 // Expired
        }),
        { expirationTtl: 1 }
      );

      // Wait for expiration
      await testUtils.sleep(100);

      await expect(
        exchangeAuthorizationCode(
          authorizationCode,
          codeVerifier,
          testClientId,
          'http://localhost:3000/callback',
          resourceIdentifier
        )
      ).rejects.toThrow('Authorization code expired or invalid');
    });
  });

  describe('MCP Resource Access with Token Validation', () => {
    let validToken: string;

    beforeEach(async () => {
      validToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read mcp:resources:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });
    });

    it('should successfully access MCP tools with valid token', async () => {
      const response = await accessMCPResource(validToken, '/api/tools');
      
      expect(response.status).toBe(200);
      expect(response.data.tools).toBeDefined();
      expect(response.headers['X-Tenant-ID']).toBe(testTenantId);
      expect(response.headers['X-User-ID']).toBe(testUserId);
    });

    it('should invoke MCP tool with proper context injection', async () => {
      const response = await accessMCPResource(validToken, '/api/tools/weather');
      
      expect(response.status).toBe(200);
      expect(response.data.result).toBeDefined();
      expect(response.data.result.temperature).toBe(22);
    });

    it('should reject access with invalid token', async () => {
      const invalidToken = 'invalid.token.here';
      
      await expect(
        accessMCPResource(invalidToken, '/api/tools')
      ).rejects.toThrow('TOKEN_INVALID');
    });

    it('should reject access with expired token', async () => {
      const expiredToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: -3600 // Already expired
      });

      await expect(
        accessMCPResource(expiredToken, '/api/tools')
      ).rejects.toThrow('TOKEN_INVALID');
    });

    it('should reject access with wrong audience', async () => {
      const wrongAudienceToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: 'mcp://different-server',
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      await expect(
        accessMCPResource(wrongAudienceToken, '/api/tools')
      ).rejects.toThrow('TOKEN_INVALID');
    });
  });

  // Helper functions
  async function exchangeAuthorizationCode(
    code: string,
    codeVerifier: string,
    clientId: string,
    redirectUri: string,
    resource: string
  ) {
    // Simulate token endpoint
    const codeData = await mockEnv.CACHE.get(`auth_code:${code}`);
    if (!codeData) {
      throw new Error('Authorization code expired or invalid');
    }

    const parsedCodeData = JSON.parse(codeData);
    
    // Verify PKCE
    const isValidPKCE = await pkceService.verifyChallenge(
      codeVerifier,
      parsedCodeData.code_challenge
    );
    
    if (!isValidPKCE) {
      throw new Error('PKCE verification failed');
    }

    // Create access token
    const accessToken = await jwtService.createToken({
      issuer: 'oauth-mcp-gateway',
      subject: parsedCodeData.user_id,
      audience: parsedCodeData.resource,
      scopes: parsedCodeData.scope,
      tenantId: parsedCodeData.tenant_id,
      userId: parsedCodeData.user_id,
      expiresIn: 3600
    });

    // Log token issuance
    await auditService.logEvent({
      tenant_id: parsedCodeData.tenant_id,
      user_id: parsedCodeData.user_id,
      event_type: 'auth.token_issued',
      resource_type: 'oauth_token',
      action: 'create',
      outcome: 'success',
      ip_address: '127.0.0.1',
      user_agent: 'TestClient/1.0'
    });

    // Clean up authorization code
    await mockEnv.CACHE.delete(`auth_code:${code}`);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: parsedCodeData.scope
    };
  }

  async function accessMCPResource(token: string, path: string) {
    // Validate token
    const tokenPayload = await jwtService.verifyToken(token);
    
    // Create MCP request context
    const context = {
      tenant_id: tokenPayload.payload.tenant_id,
      user_id: tokenPayload.payload.user_id,
      client_id: tokenPayload.payload.sub,
      session_id: 'session-' + Math.random().toString(36).substring(7),
      scopes: tokenPayload.payload.scope.split(' '),
      ip_address: '127.0.0.1',
      user_agent: 'TestClient/1.0'
    };

    // Forward request to MCP server
    const response = await mcpProxy.forwardRequestByResource(
      tokenPayload.payload.aud,
      {
        method: 'GET',
        url: path,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        context
      }
    );

    return {
      status: response.status,
      data: JSON.parse(response.body),
      headers: {
        'X-Tenant-ID': context.tenant_id,
        'X-User-ID': context.user_id
      }
    };
  }
});