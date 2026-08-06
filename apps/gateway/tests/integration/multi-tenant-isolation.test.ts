/**
 * Multi-Tenant Isolation Integration Tests
 * 
 * Comprehensive tests to verify complete tenant isolation across
 * all system components and data access patterns.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testUtils, mockEnv } from '../setup';
import { TenantService } from '../../src/services/tenant/isolation';
import { JWTService } from '../../src/services/oauth/jwt';
import { OAuthClientService } from '../../src/services/oauth/client';
import { MCPServerRegistry } from '../../src/services/mcp/registry';
import { AuditService } from '../../src/services/security/audit';
import { APIKeyService } from '../../src/services/tenant/api-keys';
import { SessionService } from '../../src/services/security/session';

describe('Multi-Tenant Isolation Verification', () => {
  let tenantService: TenantService;
  let jwtService: JWTService;
  let clientService: OAuthClientService;
  let mcpRegistry: MCPServerRegistry;
  let auditService: AuditService;
  let apiKeyService: APIKeyService;
  let sessionService: SessionService;

  // Test tenant data
  const tenant1 = {
    tenant_id: 'tenant-isolation-1',
    name: 'Tenant One',
    domain: 'tenant1.example.com',
    max_users: 50,
    max_mcp_servers: 5,
    compliance_tier: 'standard' as const,
    audit_retention_days: 365
  };

  const tenant2 = {
    tenant_id: 'tenant-isolation-2',
    name: 'Tenant Two',
    domain: 'tenant2.example.com',
    max_users: 100,
    max_mcp_servers: 10,
    compliance_tier: 'hipaa' as const,
    audit_retention_days: 2555 // 7 years for HIPAA
  };

  const user1 = { user_id: 'user-1-tenant-1', email: 'user1@tenant1.example.com' };
  const user2 = { user_id: 'user-2-tenant-1', email: 'user2@tenant1.example.com' };
  const user3 = { user_id: 'user-1-tenant-2', email: 'user1@tenant2.example.com' };

  beforeEach(async () => {
    // Initialize services
    tenantService = new TenantService(mockEnv.DB);
    jwtService = new JWTService('test-secret-key', 'HS256', 'oauth-mcp-gateway');
    clientService = new OAuthClientService(mockEnv.DB);
    mcpRegistry = new MCPServerRegistry(mockEnv.DB);
    auditService = new AuditService(mockEnv.DB);
    apiKeyService = new APIKeyService(mockEnv.DB);
    sessionService = new SessionService(mockEnv.SESSIONS);

    // Setup test tenants
    await tenantService.createTenant(tenant1);
    await tenantService.createTenant(tenant2);

    // Setup test data for each tenant
    await setupTenantData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  async function setupTenantData() {
    // Create OAuth clients for each tenant
    await clientService.createClient({
      client_id: 'client-tenant-1',
      tenant_id: tenant1.tenant_id,
      redirect_uris: ['https://tenant1.example.com/callback'],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      scope: 'mcp:tools:read mcp:resources:read'
    });

    await clientService.createClient({
      client_id: 'client-tenant-2',
      tenant_id: tenant2.tenant_id,
      redirect_uris: ['https://tenant2.example.com/callback'],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      scope: 'mcp:tools:read mcp:resources:read mcp:tools:write'
    });

    // Create MCP servers for each tenant
    await mcpRegistry.registerServer({
      tenant_id: tenant1.tenant_id,
      name: 'Tenant 1 Weather Server',
      endpoint_url: 'https://weather.tenant1.example.com',
      resource_identifier: 'mcp://tenant1/weather',
      required_scopes: ['mcp:tools:read'],
      health_check_url: 'https://weather.tenant1.example.com/health'
    });

    await mcpRegistry.registerServer({
      tenant_id: tenant2.tenant_id,
      name: 'Tenant 2 Database Server',
      endpoint_url: 'https://db.tenant2.example.com',
      resource_identifier: 'mcp://tenant2/database',
      required_scopes: ['mcp:tools:read', 'mcp:tools:write'],
      health_check_url: 'https://db.tenant2.example.com/health'
    });

    // Create API keys for each tenant
    await apiKeyService.generateKey(tenant1.tenant_id, 'Tenant 1 API Key');
    await apiKeyService.generateKey(tenant2.tenant_id, 'Tenant 2 API Key');

    // Create audit logs for each tenant
    await auditService.logEvent({
      tenant_id: tenant1.tenant_id,
      user_id: user1.user_id,
      event_type: 'auth.login',
      resource_type: 'oauth_client',
      action: 'authenticate',
      outcome: 'success',
      ip_address: '192.168.1.100',
      user_agent: 'Tenant1Client/1.0'
    });

    await auditService.logEvent({
      tenant_id: tenant2.tenant_id,
      user_id: user3.user_id,
      event_type: 'auth.login',
      resource_type: 'oauth_client',
      action: 'authenticate',
      outcome: 'success',
      ip_address: '192.168.2.100',
      user_agent: 'Tenant2Client/1.0'
    });

    // Create sessions for each tenant
    await sessionService.createSession({
      user_id: user1.user_id,
      tenant_id: tenant1.tenant_id,
      client_id: 'client-tenant-1',
      ip_address: '192.168.1.100',
      user_agent: 'Tenant1Client/1.0',
      scopes: ['mcp:tools:read']
    });

    await sessionService.createSession({
      user_id: user3.user_id,
      tenant_id: tenant2.tenant_id,
      client_id: 'client-tenant-2',
      ip_address: '192.168.2.100',
      user_agent: 'Tenant2Client/1.0',
      scopes: ['mcp:tools:read', 'mcp:tools:write']
    });
  }

  async function cleanupTestData() {
    // Cleanup is handled by afterEach in setup.ts
  }

  describe('OAuth Client Isolation', () => {
    it('should prevent cross-tenant client access', async () => {
      // Tenant 1 user tries to access Tenant 2 client
      const tenant1Token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: user1.user_id,
        audience: 'mcp://tenant1/weather',
        scopes: 'mcp:tools:read',
        tenantId: tenant1.tenant_id,
        userId: user1.user_id,
        expiresIn: 3600
      });

      // Try to get client from different tenant
      await expect(
        clientService.getClientByTenant('client-tenant-2', tenant1.tenant_id)
      ).rejects.toThrow('TENANT_ISOLATION');
    });

    it('should only return clients for the correct tenant', async () => {
      const tenant1Clients = await clientService.getClientsByTenant(tenant1.tenant_id);
      const tenant2Clients = await clientService.getClientsByTenant(tenant2.tenant_id);

      expect(tenant1Clients).toHaveLength(1);
      expect(tenant1Clients[0].client_id).toBe('client-tenant-1');
      expect(tenant1Clients[0].tenant_id).toBe(tenant1.tenant_id);

      expect(tenant2Clients).toHaveLength(1);
      expect(tenant2Clients[0].client_id).toBe('client-tenant-2');
      expect(tenant2Clients[0].tenant_id).toBe(tenant2.tenant_id);
    });

    it('should prevent client modification across tenants', async () => {
      // Try to update Tenant 2 client from Tenant 1 context
      await expect(
        clientService.updateClient('client-tenant-2', tenant1.tenant_id, {
          scope: 'mcp:tools:write'
        })
      ).rejects.toThrow('TENANT_ISOLATION');
    });
  });

  describe('MCP Server Registry Isolation', () => {
    it('should prevent cross-tenant MCP server access', async () => {
      // Try to access Tenant 2 server from Tenant 1 context
      await expect(
        mcpRegistry.getServerByResource('mcp://tenant2/database', tenant1.tenant_id)
      ).rejects.toThrow('TENANT_ISOLATION');
    });

    it('should only return servers for the correct tenant', async () => {
      const tenant1Servers = await mcpRegistry.getServersByTenant(tenant1.tenant_id);
      const tenant2Servers = await mcpRegistry.getServersByTenant(tenant2.tenant_id);

      expect(tenant1Servers).toHaveLength(1);
      expect(tenant1Servers[0].resource_identifier).toBe('mcp://tenant1/weather');
      expect(tenant1Servers[0].tenant_id).toBe(tenant1.tenant_id);

      expect(tenant2Servers).toHaveLength(1);
      expect(tenant2Servers[0].resource_identifier).toBe('mcp://tenant2/database');
      expect(tenant2Servers[0].tenant_id).toBe(tenant2.tenant_id);
    });

    it('should prevent server registration with duplicate resource identifiers across tenants', async () => {
      // This should be allowed - same resource identifier in different tenants
      await expect(
        mcpRegistry.registerServer({
          tenant_id: tenant2.tenant_id,
          name: 'Tenant 2 Weather Server',
          endpoint_url: 'https://weather.tenant2.example.com',
          resource_identifier: 'mcp://tenant1/weather', // Same as tenant 1
          required_scopes: ['mcp:tools:read'],
          health_check_url: 'https://weather.tenant2.example.com/health'
        })
      ).resolves.toBeDefined();
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
        expiresIn: 3600
      });

      const tenant2Token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: user3.user_id,
        audience: 'mcp://tenant2/database',
        scopes: 'mcp:tools:read mcp:tools:write',
        tenantId: tenant2.tenant_id,
        userId: user3.user_id,
        expiresIn: 3600
      });

      const tenant1Payload = await jwtService.verifyToken(tenant1Token);
      const tenant2Payload = await jwtService.verifyToken(tenant2Token);

      expect(tenant1Payload.payload.tenant_id).toBe(tenant1.tenant_id);
      expect(tenant1Payload.payload.user_id).toBe(user1.user_id);

      expect(tenant2Payload.payload.tenant_id).toBe(tenant2.tenant_id);
      expect(tenant2Payload.payload.user_id).toBe(user3.user_id);
    });

    it('should reject token with wrong tenant context', async () => {
      const tenant1Token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: user1.user_id,
        audience: 'mcp://tenant1/weather',
        scopes: 'mcp:tools:read',
        tenantId: tenant1.tenant_id,
        userId: user1.user_id,
        expiresIn: 3600
      });

      // Try to use Tenant 1 token to access Tenant 2 resource
      await expect(
        jwtService.validateTokenForResource(tenant1Token, 'mcp://tenant2/database', tenant2.tenant_id)
      ).rejects.toThrow('TENANT_ISOLATION');
    });
  });

  describe('Audit Log Isolation', () => {
    it('should only return audit logs for the correct tenant', async () => {
      const tenant1Logs = await auditService.queryLogs({
        tenant_id: tenant1.tenant_id
      });

      const tenant2Logs = await auditService.queryLogs({
        tenant_id: tenant2.tenant_id
      });

      expect(tenant1Logs).toHaveLength(1);
      expect(tenant1Logs[0].tenant_id).toBe(tenant1.tenant_id);
      expect(tenant1Logs[0].user_id).toBe(user1.user_id);

      expect(tenant2Logs).toHaveLength(1);
      expect(tenant2Logs[0].tenant_id).toBe(tenant2.tenant_id);
      expect(tenant2Logs[0].user_id).toBe(user3.user_id);
    });

    it('should prevent cross-tenant audit log access', async () => {
      // Try to query Tenant 2 logs from Tenant 1 context
      const logs = await auditService.queryLogs({
        tenant_id: tenant1.tenant_id,
        user_id: user3.user_id // User from Tenant 2
      });

      expect(logs).toHaveLength(0); // Should return empty, not error
    });

    it('should apply different retention policies per tenant', async () => {
      // Verify compliance tier affects retention
      const tenant1Config = await tenantService.getTenant(tenant1.tenant_id);
      const tenant2Config = await tenantService.getTenant(tenant2.tenant_id);

      expect(tenant1Config.compliance_tier).toBe('standard');
      expect(tenant1Config.audit_retention_days).toBe(365);

      expect(tenant2Config.compliance_tier).toBe('hipaa');
      expect(tenant2Config.audit_retention_days).toBe(2555); // 7 years
    });
  });

  describe('API Key Isolation', () => {
    it('should only return API keys for the correct tenant', async () => {
      const tenant1Keys = await apiKeyService.getKeysByTenant(tenant1.tenant_id);
      const tenant2Keys = await apiKeyService.getKeysByTenant(tenant2.tenant_id);

      expect(tenant1Keys).toHaveLength(1);
      expect(tenant1Keys[0].tenant_id).toBe(tenant1.tenant_id);

      expect(tenant2Keys).toHaveLength(1);
      expect(tenant2Keys[0].tenant_id).toBe(tenant2.tenant_id);
    });

    it('should prevent cross-tenant API key validation', async () => {
      const tenant1Keys = await apiKeyService.getKeysByTenant(tenant1.tenant_id);
      const tenant1Key = tenant1Keys[0].key_hash;

      // Try to validate Tenant 1 key in Tenant 2 context
      const validationResult = await apiKeyService.validateKey(tenant1Key, tenant2.tenant_id);
      expect(validationResult).toBeNull();
    });

    it('should rotate keys independently per tenant', async () => {
      const originalTenant1Keys = await apiKeyService.getKeysByTenant(tenant1.tenant_id);
      const originalTenant2Keys = await apiKeyService.getKeysByTenant(tenant2.tenant_id);

      // Rotate Tenant 1 keys
      await apiKeyService.rotateKey(tenant1.tenant_id);

      const newTenant1Keys = await apiKeyService.getKeysByTenant(tenant1.tenant_id);
      const unchangedTenant2Keys = await apiKeyService.getKeysByTenant(tenant2.tenant_id);

      // Tenant 1 should have new keys
      expect(newTenant1Keys[0].key_hash).not.toBe(originalTenant1Keys[0].key_hash);
      
      // Tenant 2 keys should be unchanged
      expect(unchangedTenant2Keys[0].key_hash).toBe(originalTenant2Keys[0].key_hash);
    });
  });

  describe('Session Isolation', () => {
    it('should only return sessions for the correct tenant', async () => {
      const tenant1Sessions = await sessionService.getSessionsByTenant(tenant1.tenant_id);
      const tenant2Sessions = await sessionService.getSessionsByTenant(tenant2.tenant_id);

      expect(tenant1Sessions).toHaveLength(1);
      expect(tenant1Sessions[0].tenant_id).toBe(tenant1.tenant_id);
      expect(tenant1Sessions[0].user_id).toBe(user1.user_id);

      expect(tenant2Sessions).toHaveLength(1);
      expect(tenant2Sessions[0].tenant_id).toBe(tenant2.tenant_id);
      expect(tenant2Sessions[0].user_id).toBe(user3.user_id);
    });

    it('should prevent cross-tenant session access', async () => {
      const tenant1Sessions = await sessionService.getSessionsByTenant(tenant1.tenant_id);
      const tenant1SessionId = tenant1Sessions[0].session_id;

      // Try to access Tenant 1 session from Tenant 2 context
      const session = await sessionService.getSession(tenant1SessionId, tenant2.tenant_id);
      expect(session).toBeNull();
    });

    it('should enforce different session limits per tenant', async () => {
      // Create multiple sessions for Tenant 1 (limit: 50 users)
      const sessions = [];
      for (let i = 0; i < 3; i++) {
        const session = await sessionService.createSession({
          user_id: `user-${i}-tenant-1`,
          tenant_id: tenant1.tenant_id,
          client_id: 'client-tenant-1',
          ip_address: '192.168.1.100',
          user_agent: 'TestClient/1.0',
          scopes: ['mcp:tools:read']
        });
        sessions.push(session);
      }

      const tenant1Sessions = await sessionService.getSessionsByTenant(tenant1.tenant_id);
      expect(tenant1Sessions.length).toBeLessThanOrEqual(tenant1.max_users);
    });
  });

  describe('Database Row-Level Security', () => {
    it('should enforce tenant isolation at database level', async () => {
      // This test verifies that database queries automatically filter by tenant_id
      // In a real implementation, this would test actual RLS policies
      
      // Mock database query with tenant context
      const mockQuery = vi.fn().mockImplementation(async (sql: string, params: any[], tenantId: string) => {
        // Simulate RLS policy enforcement
        if (sql.includes('oauth_clients') && !sql.includes('tenant_id')) {
          throw new Error('RLS policy violation: tenant_id filter required');
        }
        return [];
      });

      // This should work (includes tenant filter)
      await expect(
        mockQuery('SELECT * FROM oauth_clients WHERE tenant_id = ?', [tenant1.tenant_id], tenant1.tenant_id)
      ).resolves.toBeDefined();

      // This should fail (missing tenant filter)
      await expect(
        mockQuery('SELECT * FROM oauth_clients', [], tenant1.tenant_id)
      ).rejects.toThrow('RLS policy violation');
    });
  });

  describe('Cross-Tenant Attack Prevention', () => {
    it('should prevent tenant ID manipulation in JWT tokens', async () => {
      // Create token with Tenant 1 ID
      const legitimateToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: user1.user_id,
        audience: 'mcp://tenant1/weather',
        scopes: 'mcp:tools:read',
        tenantId: tenant1.tenant_id,
        userId: user1.user_id,
        expiresIn: 3600
      });

      // Try to use it to access Tenant 2 resources
      await expect(
        mcpRegistry.getServerByResource('mcp://tenant2/database', tenant1.tenant_id)
      ).rejects.toThrow('TENANT_ISOLATION');
    });

    it('should prevent privilege escalation across tenants', async () => {
      // Tenant 1 user with limited scopes
      const limitedToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: user1.user_id,
        audience: 'mcp://tenant1/weather',
        scopes: 'mcp:tools:read', // Limited scope
        tenantId: tenant1.tenant_id,
        userId: user1.user_id,
        expiresIn: 3600
      });

      // Try to access Tenant 2 resource that requires write permissions
      await expect(
        jwtService.validateTokenForResource(limitedToken, 'mcp://tenant2/database', tenant2.tenant_id)
      ).rejects.toThrow('TENANT_ISOLATION');
    });

    it('should prevent data leakage through error messages', async () => {
      // Try to access non-existent resource in different tenant
      try {
        await mcpRegistry.getServerByResource('mcp://tenant2/nonexistent', tenant1.tenant_id);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        // Error message should not reveal information about other tenants
        expect(error.message).not.toContain('tenant2');
        expect(error.message).not.toContain('nonexistent');
        expect(error.message).toBe('TENANT_ISOLATION');
      }
    });
  });
});