/**
 * End-to-End OAuth 2.1 Flow Integration Tests
 *
 * Complete OAuth 2.1 authorization code flow with PKCE, driven through the
 * real Hono app against Postgres, ending in a proxied MCP request to a real
 * local HTTP MCP server.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../../src/index';
import { JWTService, JWT_CONFIG } from '../../src/services/oauth/jwt';
import { generateCodeVerifier, createS256CodeChallenge } from '../../src/services/oauth/pkce';
import { MCPServerRegistry } from '../../src/services/mcp/registry';
import { PgMcpServerDatabase } from '../../src/storage/pg-mcp-server-database';
import { PgAuthorizationCodeStorage } from '../../src/storage/pg-authorization-code-storage';
import { AuditService } from '../../src/services/security/audit';
import { makeTestEnv } from '../helpers/env';
import { getTestDb, createTenant } from '../helpers/db';
import { form, registerTestClient, getAuthorizationCode, completeOAuthFlow } from '../helpers/oauth';
import { createTestMCPServer, RealMCPServerMock } from '../helpers/real-mcp-server';

describe('End-to-End OAuth 2.1 Flow with Real MCP Servers', () => {
  const testEnv = makeTestEnv();
  // Tokens issued by the /oauth/token endpoint carry this hardcoded tenant claim
  const tokenTenantId = 'default';

  let mcpServer: RealMCPServerMock;
  let registeredServerId: string;

  beforeEach(async () => {
    mcpServer = createTestMCPServer({ port: 0, serverName: 'e2e-mcp-server' });
    await mcpServer.start();

    // The MCP server must live under the tenant the access tokens claim
    await createTenant(tokenTenantId);
    const registry = new MCPServerRegistry(new PgMcpServerDatabase(getTestDb().db), 60000, false);
    const entry = await registry.registerServer({
      tenant_id: tokenTenantId,
      name: 'E2E Test MCP Server',
      endpoint_url: mcpServer.baseUrl,
      resource_identifier: 'mcp://e2e-test-server/tools',
      required_scopes: ['mcp:tools:read'],
      status: 'active',
      timeout_ms: 5000,
      retry_attempts: 0,
    });
    registeredServerId = entry.server_id;
  });

  afterEach(async () => {
    await mcpServer.stop();
  });

  describe('Complete Authorization Code Flow', () => {
    it('should complete full OAuth 2.1 flow and access MCP resources', async () => {
      // Steps 1-4: register client, authorize with PKCE, exchange code
      const flow = await completeOAuthFlow(testEnv, {
        scope: 'mcp:tools:read mcp:resources:read',
      });

      expect(flow.access_token).toBeDefined();
      expect(flow.token_type).toBe('Bearer');
      // Access tokens are short-lived because no revocation path exists yet;
      // assert the ceiling, not a magic number, so raising it fails here.
      expect(flow.expires_in).toBe(JWT_CONFIG.ACCESS_TOKEN_LIFETIME);
      expect(flow.expires_in).toBeLessThanOrEqual(900);
      expect(flow.scope).toBe('mcp:tools:read mcp:resources:read');
      expect(flow.refresh_token).toMatch(/^refresh_/);

      // Verify the access token claims
      const jwtService = new JWTService(testEnv.JWT_SECRET, 'HS256', testEnv.JWT_ISSUER);
      const verified = await jwtService.verifyToken(flow.access_token);
      expect(verified.payload.iss).toBe(testEnv.JWT_ISSUER);
      expect((verified.payload as any).scope).toBe('mcp:tools:read mcp:resources:read');
      expect((verified.payload as any).tenant_id).toBe(tokenTenantId);

      // Step 5: use the token to access an MCP server through the gateway
      const mcpResponse = await app.request(
        `/mcp/${registeredServerId}/mcp/tools/list`,
        { headers: { Authorization: `Bearer ${flow.access_token}` } },
        testEnv
      );

      expect(mcpResponse.status).toBe(200);
      const tools = await mcpResponse.json();
      expect(tools.tools.length).toBeGreaterThan(0);

      // The upstream server received the injected tenant context
      const lastRequest = mcpServer.getLastRequest();
      expect(lastRequest).toBeDefined();
      expect(lastRequest!.headers['x-tenant-id']).toBe(tokenTenantId);

      // Step 6: the authenticated MCP request left an audit trail
      const auditService = AuditService.getInstance(getTestDb().db);
      const logs = await auditService.queryLogs({ tenantId: tokenTenantId });
      expect(logs.totalCount).toBeGreaterThan(0);
    });

    it('should support the refresh token grant with rotation', async () => {
      const flow = await completeOAuthFlow(testEnv);

      const res = await app.request(
        '/oauth/token',
        form({
          grant_type: 'refresh_token',
          refresh_token: flow.refresh_token!,
          client_id: flow.client.client_id,
        }),
        testEnv
      );

      expect(res.status).toBe(200);
      const refreshed = await res.json();
      expect(refreshed.access_token).toBeDefined();
      expect(refreshed.refresh_token).toBeDefined();
      expect(refreshed.refresh_token).not.toBe(flow.refresh_token);

      // The old refresh token was rotated out and can no longer be used
      const replay = await app.request(
        '/oauth/token',
        form({
          grant_type: 'refresh_token',
          refresh_token: flow.refresh_token!,
          client_id: flow.client.client_id,
        }),
        testEnv
      );
      expect(replay.status).toBe(400);
    });

    it('should reject invalid PKCE verifier', async () => {
      const client = await registerTestClient(testEnv);
      const verifier = generateCodeVerifier();
      const challenge = await createS256CodeChallenge(verifier);
      const code = await getAuthorizationCode(testEnv, {
        client_id: client.client_id,
        redirect_uri: client.redirect_uri,
        code_challenge: challenge,
      });

      // A different (valid-format) verifier that does not match the challenge
      const wrongVerifier = generateCodeVerifier();
      const res = await app.request(
        '/oauth/token',
        form({
          grant_type: 'authorization_code',
          code,
          redirect_uri: client.redirect_uri,
          client_id: client.client_id,
          code_verifier: wrongVerifier,
        }),
        testEnv
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({
        error: 'invalid_grant',
        error_description: 'Invalid PKCE verification',
      });
    });

    it('should reject expired authorization code', async () => {
      const client = await registerTestClient(testEnv);
      const verifier = generateCodeVerifier();
      const challenge = await createS256CodeChallenge(verifier);

      // Store a code that expired in the past, directly through the storage layer
      const codeStorage = new PgAuthorizationCodeStorage(getTestDb().db, 'default');
      const expiredCode = 'auth_expiredcode1234567890';
      await codeStorage.storeCode(
        expiredCode,
        client.client_id,
        client.redirect_uri,
        'demo-user-id',
        ['mcp:tools:read'],
        Date.now() - 1000, // already expired
        challenge,
        'S256'
      );

      const res = await app.request(
        '/oauth/token',
        form({
          grant_type: 'authorization_code',
          code: expiredCode,
          redirect_uri: client.redirect_uri,
          client_id: client.client_id,
          code_verifier: verifier,
        }),
        testEnv
      );

      expect(res.status).toBe(400);
      expect(await res.json()).toMatchObject({
        error: 'invalid_grant',
        error_description: 'Invalid or expired authorization code',
      });
    });

    it('should not allow an authorization code to be redeemed twice', async () => {
      const client = await registerTestClient(testEnv);
      const verifier = generateCodeVerifier();
      const challenge = await createS256CodeChallenge(verifier);
      const code = await getAuthorizationCode(testEnv, {
        client_id: client.client_id,
        redirect_uri: client.redirect_uri,
        code_challenge: challenge,
      });

      const exchange = () =>
        app.request(
          '/oauth/token',
          form({
            grant_type: 'authorization_code',
            code,
            redirect_uri: client.redirect_uri,
            client_id: client.client_id,
            code_verifier: verifier,
          }),
          testEnv
        );

      const first = await exchange();
      expect(first.status).toBe(200);

      const second = await exchange();
      expect(second.status).toBe(400);
      expect((await second.json()).error).toBe('invalid_grant');
    });
  });

  describe('MCP Resource Access with Token Validation', () => {
    let validToken: string;
    let jwtService: JWTService;

    beforeEach(async () => {
      jwtService = new JWTService(testEnv.JWT_SECRET, 'HS256', testEnv.JWT_ISSUER);
      validToken = await jwtService.createToken({
        issuer: testEnv.JWT_ISSUER,
        subject: 'user-e2e-test',
        audience: 'mcp://e2e-test-server/tools',
        scopes: 'mcp:tools:read mcp:resources:read',
        tenantId: tokenTenantId,
        userId: 'user-e2e-test',
        expiresIn: 3600,
      });
    });

    it('should successfully access MCP tools with valid token', async () => {
      const response = await app.request(
        `/mcp/${registeredServerId}/mcp/tools/list`,
        { headers: { Authorization: `Bearer ${validToken}` } },
        testEnv
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.tools).toBeDefined();

      const lastRequest = mcpServer.getLastRequest();
      expect(lastRequest!.headers['x-tenant-id']).toBe(tokenTenantId);
      expect(lastRequest!.headers['x-user-id']).toBe('user-e2e-test');
    });

    it('should invoke MCP tool with proper context injection', async () => {
      const response = await app.request(
        `/mcp/${registeredServerId}/mcp/tools/call`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'get_weather', arguments: { location: 'Berlin' } }),
        },
        testEnv
      );

      expect(response.status).toBe(200);
      const result = await response.json();
      expect(result.content.temperature).toBe(22);
      expect(result.content.tenant_id).toBe(tokenTenantId);
    });

    it('should reject access with invalid token', async () => {
      const response = await app.request(
        `/mcp/${registeredServerId}/mcp/tools/list`,
        { headers: { Authorization: 'Bearer invalid.token.here' } },
        testEnv
      );

      expect(response.status).toBe(401);
      expect((await response.json()).error).toBe('INVALID_TOKEN');
    });

    it('should reject access with expired token', async () => {
      const expiredToken = await jwtService.createToken({
        issuer: testEnv.JWT_ISSUER,
        subject: 'user-e2e-test',
        audience: 'mcp://e2e-test-server/tools',
        scopes: 'mcp:tools:read mcp:resources:read',
        tenantId: tokenTenantId,
        userId: 'user-e2e-test',
        expiresIn: -3600, // Already expired
      });

      const response = await app.request(
        `/mcp/${registeredServerId}/mcp/tools/list`,
        { headers: { Authorization: `Bearer ${expiredToken}` } },
        testEnv
      );

      expect(response.status).toBe(401);
    });

    it('should reject access with insufficient scope', async () => {
      const weakToken = await jwtService.createToken({
        issuer: testEnv.JWT_ISSUER,
        subject: 'user-e2e-test',
        audience: 'mcp://e2e-test-server/tools',
        scopes: 'mcp:tools:read', // missing mcp:resources:read required by the route
        tenantId: tokenTenantId,
        userId: 'user-e2e-test',
        expiresIn: 3600,
      });

      const response = await app.request(
        `/mcp/${registeredServerId}/mcp/tools/list`,
        { headers: { Authorization: `Bearer ${weakToken}` } },
        testEnv
      );

      expect(response.status).toBe(403);
      expect((await response.json()).error).toBe('INSUFFICIENT_SCOPE');
    });
  });
});
