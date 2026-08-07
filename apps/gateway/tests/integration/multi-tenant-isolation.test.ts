/**
 * Multi-Tenant Isolation Integration Tests
 *
 * Verifies tenant isolation across system components and data access
 * patterns, against the real Postgres-backed services.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TenantService } from '../../src/services/tenant/isolation';
import { JWTService } from '../../src/services/oauth/jwt';
import { ClientService } from '../../src/services/oauth/client';
import { MCPServerRegistry } from '../../src/services/mcp/registry';
import { PgMcpServerDatabase } from '../../src/storage/pg-mcp-server-database';
import { PgSessionStorage } from '../../src/storage/pg-session-storage';
import { AuditService } from '../../src/services/security/audit';
import { APIKeyManager } from '../../src/services/security/api-key';
import { SessionStatus, RiskLevel, type Session } from '../../src/types/session';
import { getTestDb } from '../helpers/db';

describe('Multi-Tenant Isolation Verification', () => {
  let tenantService: TenantService;
  let jwtService: JWTService;
  let clientService: ClientService;
  let mcpRegistry: MCPServerRegistry;
  let auditService: AuditService;
  let apiKeyManager: APIKeyManager;
  let sessionStorage: PgSessionStorage;

  let tenant1ClientId: string;
  let tenant2ClientId: string;

  // Test tenant data
  const tenant1 = {
    tenant_id: 'tenant-isolation-1',
    name: 'Tenant One',
    domain: 'tenant1.example.com',
    max_users: 50,
    max_mcp_servers: 5,
    compliance_tier: 'standard' as const,
    audit_retention_days: 365,
  };

  const tenant2 = {
    tenant_id: 'tenant-isolation-2',
    name: 'Tenant Two',
    domain: 'tenant2.example.com',
    max_users: 100,
    max_mcp_servers: 10,
    compliance_tier: 'hipaa' as const,
    audit_retention_days: 2555, // 7 years for HIPAA
  };

  const user1 = { user_id: 'user-1-tenant-1' };
  const user3 = { user_id: 'user-1-tenant-2' };

  function makeSession(tenantId: string, userId: string, clientId: string): Session {
    const now = new Date();
    return {
      session_id: crypto.randomUUID(),
      tenant_id: tenantId,
      user_id: userId,
      client_id: clientId,
      device_info: { user_agent: 'TestClient/1.0', ip_address: '192.168.1.100' },
      status: SessionStatus.ACTIVE,
      risk_level: RiskLevel.LOW,
      created_at: now,
      last_accessed_at: now,
      expires_at: new Date(now.getTime() + 3600_000),
      idle_timeout_at: new Date(now.getTime() + 1800_000),
    };
  }

  beforeEach(async () => {
    const { db } = getTestDb();
    tenantService = new TenantService(db);
    jwtService = new JWTService('test-secret-key', 'HS256', 'oauth-mcp-gateway');
    clientService = new ClientService(db);
    mcpRegistry = new MCPServerRegistry(new PgMcpServerDatabase(db), 60000, false);
    auditService = AuditService.getInstance(db);
    apiKeyManager = new APIKeyManager();
    sessionStorage = new PgSessionStorage(db);

    // Setup test tenants
    await tenantService.createTenant(tenant1);
    await tenantService.createTenant(tenant2);

    // OAuth clients per tenant
    tenant1ClientId = (
      await clientService.registerClient(
        {
          redirect_uris: ['https://tenant1.example.com/callback'],
          client_name: 'Tenant 1 Client',
          scope: 'mcp:tools:read mcp:resources:read',
        },
        tenant1.tenant_id
      )
    ).client_id;

    tenant2ClientId = (
      await clientService.registerClient(
        {
          redirect_uris: ['https://tenant2.example.com/callback'],
          client_name: 'Tenant 2 Client',
          scope: 'mcp:tools:read mcp:resources:read mcp:tools:write',
        },
        tenant2.tenant_id
      )
    ).client_id;

    // MCP servers per tenant
    await mcpRegistry.registerServer({
      tenant_id: tenant1.tenant_id,
      name: 'Tenant 1 Weather Server',
      endpoint_url: 'https://weather.tenant1.example.com',
      resource_identifier: 'mcp://tenant1/weather',
      required_scopes: ['mcp:tools:read'],
      status: 'active',
      timeout_ms: 30000,
      retry_attempts: 3,
    });

    await mcpRegistry.registerServer({
      tenant_id: tenant2.tenant_id,
      name: 'Tenant 2 Database Server',
      endpoint_url: 'https://db.tenant2.example.com',
      resource_identifier: 'mcp://tenant2/database',
      required_scopes: ['mcp:tools:read', 'mcp:tools:write'],
      status: 'active',
      timeout_ms: 30000,
      retry_attempts: 3,
    });

    // API keys per tenant (in-memory manager, fresh per test)
    await apiKeyManager.createAPIKey({ tenantId: tenant1.tenant_id, name: 'Tenant 1 API Key' });
    await apiKeyManager.createAPIKey({ tenantId: tenant2.tenant_id, name: 'Tenant 2 API Key' });

    // Audit logs per tenant
    await auditService.logEvent({
      tenant_id: tenant1.tenant_id,
      user_id: user1.user_id,
      event_type: 'auth.login',
      resource_type: 'oauth_client',
      resource_id: tenant1ClientId,
      action: 'authenticate',
      outcome: 'success',
      ip_address: '192.168.1.100',
      user_agent: 'Tenant1Client/1.0',
    });

    await auditService.logEvent({
      tenant_id: tenant2.tenant_id,
      user_id: user3.user_id,
      event_type: 'auth.login',
      resource_type: 'oauth_client',
      resource_id: tenant2ClientId,
      action: 'authenticate',
      outcome: 'success',
      ip_address: '192.168.2.100',
      user_agent: 'Tenant2Client/1.0',
    });

    // Sessions per tenant
    await sessionStorage.create(makeSession(tenant1.tenant_id, user1.user_id, tenant1ClientId));
    await sessionStorage.create(makeSession(tenant2.tenant_id, user3.user_id, tenant2ClientId));
  });

  describe('OAuth Client Isolation', () => {
    it('should prevent cross-tenant client access', async () => {
      // Tenant 2 client is invisible from Tenant 1 context
      const client = await clientService.getClient(tenant2ClientId, tenant1.tenant_id);
      expect(client).toBeNull();
    });

    it('should return clients for the correct tenant', async () => {
      const client1 = await clientService.getClient(tenant1ClientId, tenant1.tenant_id);
      const client2 = await clientService.getClient(tenant2ClientId, tenant2.tenant_id);

      expect(client1?.tenant_id).toBe(tenant1.tenant_id);
      expect(client2?.tenant_id).toBe(tenant2.tenant_id);
    });

    it('should prevent client deletion across tenants', async () => {
      // Deleting a Tenant 2 client from Tenant 1 context does nothing
      const deleted = await clientService.deleteClient(tenant2ClientId, tenant1.tenant_id);
      expect(deleted).toBe(false);

      // The client still exists for its own tenant
      const stillThere = await clientService.getClient(tenant2ClientId, tenant2.tenant_id);
      expect(stillThere).not.toBeNull();
    });
  });

  describe('MCP Server Registry Isolation', () => {
    it('should prevent cross-tenant MCP server access', async () => {
      await expect(
        mcpRegistry.getServerByResource('mcp://tenant2/database', tenant1.tenant_id)
      ).rejects.toThrow('MCP server not found');
    });

    it('should only return servers for the correct tenant', async () => {
      const tenant1Servers = await mcpRegistry.listServers(tenant1.tenant_id);
      const tenant2Servers = await mcpRegistry.listServers(tenant2.tenant_id);

      expect(tenant1Servers).toHaveLength(1);
      expect(tenant1Servers[0]!.config.resource_identifier).toBe('mcp://tenant1/weather');
      expect(tenant1Servers[0]!.tenant_id).toBe(tenant1.tenant_id);

      expect(tenant2Servers).toHaveLength(1);
      expect(tenant2Servers[0]!.config.resource_identifier).toBe('mcp://tenant2/database');
      expect(tenant2Servers[0]!.tenant_id).toBe(tenant2.tenant_id);
    });

    it('should reject duplicate resource identifiers across tenants (globally unique)', async () => {
      // resource_identifier is globally unique in the Postgres schema:
      // registering the same identifier under another tenant must fail.
      await expect(
        mcpRegistry.registerServer({
          tenant_id: tenant2.tenant_id,
          name: 'Tenant 2 Weather Server',
          endpoint_url: 'https://weather.tenant2.example.com',
          resource_identifier: 'mcp://tenant1/weather', // Same as tenant 1
          required_scopes: ['mcp:tools:read'],
          status: 'active',
          timeout_ms: 30000,
          retry_attempts: 3,
        })
      ).rejects.toThrow();
    });
  });

  describe('JWT Token Tenant Isolation', () => {
    it('should include correct tenant_id in token claims', async () => {
      const tenant1Token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: user1.user_id,
        audience: 'mcp://tenant1/weather',
        scopes: 'mcp:tools:read',
        tenantId: tenant1.tenant_id,
        userId: user1.user_id,
        expiresIn: 3600,
      });

      const tenant2Token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: user3.user_id,
        audience: 'mcp://tenant2/database',
        scopes: 'mcp:tools:read mcp:tools:write',
        tenantId: tenant2.tenant_id,
        userId: user3.user_id,
        expiresIn: 3600,
      });

      const tenant1Payload = await jwtService.verifyToken(tenant1Token);
      const tenant2Payload = await jwtService.verifyToken(tenant2Token);

      expect(tenant1Payload.payload.tenant_id).toBe(tenant1.tenant_id);
      expect(tenant1Payload.payload.user_id).toBe(user1.user_id);

      expect(tenant2Payload.payload.tenant_id).toBe(tenant2.tenant_id);
      expect(tenant2Payload.payload.user_id).toBe(user3.user_id);
    });

    it('should reject a token presented for another tenant resource (audience mismatch)', async () => {
      const tenant1Token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: user1.user_id,
        audience: 'mcp://tenant1/weather',
        scopes: 'mcp:tools:read',
        tenantId: tenant1.tenant_id,
        userId: user1.user_id,
        expiresIn: 3600,
      });

      await expect(
        jwtService.verifyToken(tenant1Token, 'mcp://tenant2/database')
      ).rejects.toThrow('JWT verification failed');
    });
  });

  describe('Audit Log Isolation', () => {
    it('should only return audit logs for the correct tenant', async () => {
      const tenant1Logs = await auditService.queryLogs({ tenantId: tenant1.tenant_id });
      const tenant2Logs = await auditService.queryLogs({ tenantId: tenant2.tenant_id });

      expect(tenant1Logs.entries).toHaveLength(1);
      expect(tenant1Logs.entries[0]!.tenantId).toBe(tenant1.tenant_id);
      expect(tenant1Logs.entries[0]!.userId).toBe(user1.user_id);

      expect(tenant2Logs.entries).toHaveLength(1);
      expect(tenant2Logs.entries[0]!.tenantId).toBe(tenant2.tenant_id);
      expect(tenant2Logs.entries[0]!.userId).toBe(user3.user_id);
    });

    it('should prevent cross-tenant audit log access', async () => {
      // Querying Tenant 1 logs for a Tenant 2 user returns nothing (not an error)
      const logs = await auditService.queryLogs({
        tenantId: tenant1.tenant_id,
        userId: user3.user_id, // User from Tenant 2
      });

      expect(logs.entries).toHaveLength(0);
      expect(logs.totalCount).toBe(0);
    });

    it('should apply different retention configuration per tenant', async () => {
      const tenant1Config = await tenantService.getTenant(tenant1.tenant_id);
      const tenant2Config = await tenantService.getTenant(tenant2.tenant_id);

      expect(tenant1Config?.compliance_tier).toBe('standard');
      expect(tenant1Config?.audit_retention_days).toBe(365);

      expect(tenant2Config?.compliance_tier).toBe('hipaa');
      expect(tenant2Config?.audit_retention_days).toBe(2555); // 7 years
    });
  });

  describe('API Key Isolation', () => {
    it('should only return API keys for the correct tenant', async () => {
      const tenant1Keys = await apiKeyManager.getAPIKeysByTenant(tenant1.tenant_id);
      const tenant2Keys = await apiKeyManager.getAPIKeysByTenant(tenant2.tenant_id);

      expect(tenant1Keys).toHaveLength(1);
      expect(tenant1Keys[0]!.tenantId).toBe(tenant1.tenant_id);

      expect(tenant2Keys).toHaveLength(1);
      expect(tenant2Keys[0]!.tenantId).toBe(tenant2.tenant_id);
    });
  });

  describe('Session Isolation', () => {
    it('should only return sessions for the correct tenant', async () => {
      const tenant1Sessions = await sessionStorage.getUserSessions(
        tenant1.tenant_id,
        user1.user_id
      );
      const tenant2Sessions = await sessionStorage.getUserSessions(
        tenant2.tenant_id,
        user3.user_id
      );

      expect(tenant1Sessions).toHaveLength(1);
      expect(tenant1Sessions[0]!.tenant_id).toBe(tenant1.tenant_id);
      expect(tenant1Sessions[0]!.user_id).toBe(user1.user_id);

      expect(tenant2Sessions).toHaveLength(1);
      expect(tenant2Sessions[0]!.tenant_id).toBe(tenant2.tenant_id);
      expect(tenant2Sessions[0]!.user_id).toBe(user3.user_id);
    });

    it('should prevent cross-tenant session listing', async () => {
      // Tenant 2 context cannot see Tenant 1's user sessions
      const crossTenant = await sessionStorage.getUserSessions(tenant2.tenant_id, user1.user_id);
      expect(crossTenant).toHaveLength(0);
    });

    it('should delete sessions only within the owning tenant', async () => {
      const deleted = await sessionStorage.deleteUserSessions(tenant2.tenant_id, user1.user_id);
      expect(deleted).toBe(0);

      // Tenant 1 session untouched
      const stillThere = await sessionStorage.getUserSessions(tenant1.tenant_id, user1.user_id);
      expect(stillThere).toHaveLength(1);
    });
  });

  describe('Cross-Tenant Attack Prevention', () => {
    it('should prevent access to other tenants servers regardless of token claims', async () => {
      await expect(
        mcpRegistry.getServerByResource('mcp://tenant2/database', tenant1.tenant_id)
      ).rejects.toThrow('MCP server not found');
    });

    it('should scope server-by-id lookups to the requesting tenant', async () => {
      const tenant2Servers = await mcpRegistry.listServers(tenant2.tenant_id);
      const tenant2ServerId = tenant2Servers[0]!.server_id;

      await expect(mcpRegistry.getServer(tenant2ServerId, tenant1.tenant_id)).rejects.toThrow(
        'MCP server not found'
      );
    });
  });
});
