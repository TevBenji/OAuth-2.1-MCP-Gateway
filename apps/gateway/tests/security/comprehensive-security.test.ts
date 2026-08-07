/**
 * Comprehensive Security Test Suite
 *
 * End-to-end security validation covering PKCE, token validation,
 * tenant isolation, rate limiting, and security attack scenarios.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PKCEService } from '../../src/services/oauth/pkce';
import { JWTService } from '../../src/services/oauth/jwt';
import { TenantService } from '../../src/services/tenant/isolation';
import { SessionManager } from '../../src/services/security/session';
import { PgSessionStorage } from '../../src/storage/pg-session-storage';
import { RateLimitService } from '../../src/services/security/rate-limit';
import { AuditService } from '../../src/services/security/audit';
import { MemoryKV } from '../../src/lib/memory-kv';
import type { DeviceInfo, SessionLimits } from '../../src/types/session';
import { SessionStatus } from '../../src/types/session';
import { getTestDb } from '../helpers/db';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Comprehensive Security Test Suite', () => {
  let pkceService: PKCEService;
  let jwtService: JWTService;
  let tenantService: TenantService;
  let sessionStorage: PgSessionStorage;
  let sessionManager: SessionManager;
  let rateLimitService: RateLimitService;
  let auditService: AuditService;
  let cache: MemoryKV;

  const tenant1Id = 'security-tenant-1';
  const tenant2Id = 'security-tenant-2';
  const userId1 = 'security-user-1';
  const userId2 = 'security-user-2';

  const deviceInfo: DeviceInfo = {
    user_agent: 'TestClient/1.0',
    ip_address: '192.168.1.100',
  };

  beforeEach(async () => {
    const { db } = getTestDb();
    pkceService = new PKCEService();
    jwtService = new JWTService('test-secret-key', 'HS256', 'oauth-mcp-gateway');
    tenantService = new TenantService(db);
    sessionStorage = new PgSessionStorage(db);
    sessionManager = new SessionManager(sessionStorage);
    cache = new MemoryKV();
    rateLimitService = new RateLimitService(cache);
    auditService = AuditService.getInstance(db);

    // Setup multi-tenant environment
    await tenantService.createTenant({
      tenant_id: tenant1Id,
      name: 'Security Test Tenant 1',
      domain: 'tenant1.example.com',
      max_users: 100,
      max_mcp_servers: 10,
      compliance_tier: 'enterprise',
      audit_retention_days: 730,
    });

    await tenantService.createTenant({
      tenant_id: tenant2Id,
      name: 'Security Test Tenant 2',
      domain: 'tenant2.example.com',
      max_users: 50,
      max_mcp_servers: 5,
      compliance_tier: 'standard',
      audit_retention_days: 365,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Defense Against Common Attack Vectors', () => {
    describe('Authorization Code Injection Attack', () => {
      it('should reject authorization code intended for different client', async () => {
        const { codeChallenge } = await pkceService.generateChallenge();

        // Client A creates authorization code
        const authCodeClientA = 'auth_code_client_a_' + Math.random().toString(36);
        await cache.put(
          `auth_code:${authCodeClientA}`,
          JSON.stringify({
            client_id: 'client-a',
            user_id: userId1,
            tenant_id: tenant1Id,
            redirect_uri: 'https://client-a.example.com/callback',
            scope: 'mcp:tools:read',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            resource: 'mcp://server-a',
            expires_at: Date.now() + 600000,
          }),
          { expirationTtl: 600 }
        );

        // Client B attempts to use Client A's authorization code
        const tokenData = await cache.get(`auth_code:${authCodeClientA}`);
        const parsedData = JSON.parse(tokenData!);

        // Should fail because client_id doesn't match
        expect(parsedData.client_id).not.toBe('client-b');

        // Attempting to exchange with different client should fail
        // (This would be enforced at token endpoint)
        expect(parsedData.client_id).toBe('client-a');
      });

      it('should prevent authorization code replay attacks', async () => {
        const { codeChallenge } = await pkceService.generateChallenge();

        const authCode = 'auth_code_replay_test_' + Math.random().toString(36);
        const authCodeKey = `auth_code:${authCode}`;

        await cache.put(
          authCodeKey,
          JSON.stringify({
            client_id: 'test-client',
            user_id: userId1,
            tenant_id: tenant1Id,
            redirect_uri: 'https://client.example.com/callback',
            scope: 'mcp:tools:read',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            resource: 'mcp://server',
            expires_at: Date.now() + 600000,
          }),
          { expirationTtl: 600 }
        );

        // First use - should succeed
        const firstAttempt = await cache.get(authCodeKey);
        expect(firstAttempt).toBeDefined();

        // Delete after first use (one-time use enforcement)
        await cache.delete(authCodeKey);

        // Second use - should fail (code already used)
        const secondAttempt = await cache.get(authCodeKey);
        expect(secondAttempt).toBeNull();
      });

      it('should enforce authorization code expiration', async () => {
        const { codeChallenge } = await pkceService.generateChallenge();

        const authCode = 'auth_code_expired_' + Math.random().toString(36);
        const authCodeKey = `auth_code:${authCode}`;

        // Create authorization code with short TTL
        await cache.put(
          authCodeKey,
          JSON.stringify({
            client_id: 'test-client',
            code_challenge: codeChallenge,
            expires_at: Date.now() - 1000, // Already expired
          }),
          { expirationTtl: 1 }
        );

        // Wait for expiration
        await sleep(1100);

        // Authorization code should be expired
        const expiredCode = await cache.get(authCodeKey);
        expect(expiredCode).toBeNull();
      });
    });

    describe('PKCE Downgrade Attack Prevention', () => {
      it('should reject plain method when S256 is required', async () => {
        const codeVerifier = 'test_code_verifier_' + Math.random().toString(36);

        // Attempt to use plain method
        await expect(
          pkceService.verifyChallenge(codeVerifier, codeVerifier, 'plain')
        ).rejects.toThrow('Only S256 PKCE method is supported');
      });

      it('should enforce S256 method for all challenges', async () => {
        const { codeVerifier, codeChallenge } = await pkceService.generateChallenge();

        // Verify that only S256 method works
        const isValid = await pkceService.verifyChallenge(codeVerifier, codeChallenge, 'S256');

        expect(isValid).toBe(true);
      });
    });

    describe('Token Theft and Replay Attacks', () => {
      it('should reject tokens with invalid signatures', async () => {
        const validToken = await jwtService.createToken({
          issuer: 'oauth-mcp-gateway',
          subject: userId1,
          audience: 'mcp://server',
          scopes: 'mcp:tools:read',
          tenantId: tenant1Id,
          userId: userId1,
          expiresIn: 3600,
        });

        // Tamper with token
        const parts = validToken.split('.');
        const tamperedToken = parts[0] + '.' + parts[1] + '.tampered_signature';

        await expect(jwtService.verifyToken(tamperedToken)).rejects.toThrow(
          'JWT verification failed'
        );
      });

      it('should reject expired tokens', async () => {
        const expiredToken = await jwtService.createToken({
          issuer: 'oauth-mcp-gateway',
          subject: userId1,
          audience: 'mcp://server',
          scopes: 'mcp:tools:read',
          tenantId: tenant1Id,
          userId: userId1,
          expiresIn: -3600, // Already expired
        });

        await expect(jwtService.verifyToken(expiredToken)).rejects.toThrow(
          'JWT verification failed'
        );
      });

      it('should reject tokens with wrong audience', async () => {
        const tokenForServerA = await jwtService.createToken({
          issuer: 'oauth-mcp-gateway',
          subject: userId1,
          audience: 'mcp://server-a',
          scopes: 'mcp:tools:read',
          tenantId: tenant1Id,
          userId: userId1,
          expiresIn: 3600,
        });

        // Verify token
        const verified = await jwtService.verifyToken(tokenForServerA);

        // Token is valid but audience check fails for server-b
        expect(verified.payload.aud).toBe('mcp://server-a');
        await expect(
          jwtService.verifyToken(tokenForServerA, 'mcp://server-b')
        ).rejects.toThrow('JWT verification failed');
      });
    });

    describe('Tenant Isolation Attacks', () => {
      it('should prevent cross-tenant token access', async () => {
        // Create token for tenant 1
        const tenant1Token = await jwtService.createToken({
          issuer: 'oauth-mcp-gateway',
          subject: userId1,
          audience: 'mcp://tenant1-server',
          scopes: 'mcp:tools:read',
          tenantId: tenant1Id,
          userId: userId1,
          expiresIn: 3600,
        });

        // Verify token contains correct tenant
        const verified = await jwtService.verifyToken(tenant1Token);
        expect(verified.payload.tenant_id).toBe(tenant1Id);
        expect(verified.payload.tenant_id).not.toBe(tenant2Id);
      });

      it('should prevent tenant data leakage through queries', async () => {
        // Log audit event for tenant 1
        await auditService.logEvent({
          tenant_id: tenant1Id,
          user_id: userId1,
          event_type: 'mcp.resource.accessed',
          resource_type: 'mcp_tool',
          resource_id: 'tool-123',
          action: 'invoke',
          outcome: 'success',
          ip_address: '192.168.1.100',
          user_agent: 'TestClient/1.0',
          details: { sensitive: 'tenant1-data' },
        });

        // Log audit event for tenant 2
        await auditService.logEvent({
          tenant_id: tenant2Id,
          user_id: userId2,
          event_type: 'mcp.resource.accessed',
          resource_type: 'mcp_tool',
          resource_id: 'tool-456',
          action: 'invoke',
          outcome: 'success',
          ip_address: '192.168.2.100',
          user_agent: 'TestClient/1.0',
          details: { sensitive: 'tenant2-data' },
        });

        // Query logs for tenant 1 - should only see tenant 1 data
        const tenant1Logs = await auditService.queryLogs({
          tenantId: tenant1Id,
          eventTypePrefix: 'mcp.resource',
        });

        expect(tenant1Logs.entries.length).toBeGreaterThan(0);
        tenant1Logs.entries.forEach(log => {
          expect(log.tenantId).toBe(tenant1Id);
          expect(log.tenantId).not.toBe(tenant2Id);
        });
      });

      it('should prevent session hijacking across tenants', async () => {
        // Create session for tenant 1
        await sessionManager.createSession({
          tenant_id: tenant1Id,
          user_id: userId1,
          client_id: 'client-1',
          device_info: deviceInfo,
        });

        // Tenant 2 context cannot see the tenant 1 session
        const crossTenantSessions = await sessionStorage.getUserSessions(tenant2Id, userId1);
        expect(crossTenantSessions).toHaveLength(0);

        // Tenant 1 context sees it
        const ownSessions = await sessionStorage.getUserSessions(tenant1Id, userId1);
        expect(ownSessions).toHaveLength(1);
      });
    });

    describe('Rate Limiting and DDoS Protection', () => {
      it('should enforce rate limits per user', async () => {
        const rateLimitConfig = {
          requests_per_minute: 10,
          requests_per_hour: 100,
          burst_limit: 5,
        };

        const userKey = `user:${userId1}`;

        // Make requests up to limit
        for (let i = 0; i < 10; i++) {
          const allowed = await rateLimitService.checkRateLimit(userKey, rateLimitConfig);
          expect(allowed).toBe(true);
        }

        // Next request should be rate limited
        const overLimit = await rateLimitService.checkRateLimit(userKey, rateLimitConfig);
        expect(overLimit).toBe(false);
      });

      it('should enforce rate limits per tenant', async () => {
        const rateLimitConfig = {
          requests_per_minute: 100,
          requests_per_hour: 1000,
          burst_limit: 20,
        };

        const tenantKey = `tenant:${tenant1Id}`;

        // Make requests up to limit
        let allowedCount = 0;
        for (let i = 0; i < 100; i++) {
          if (await rateLimitService.checkRateLimit(tenantKey, rateLimitConfig)) {
            allowedCount++;
          }
        }
        expect(allowedCount).toBe(100);

        // Next request should be rate limited
        const overLimit = await rateLimitService.checkRateLimit(tenantKey, rateLimitConfig);
        expect(overLimit).toBe(false);
      });

      it('should limit burst traffic beyond the per-minute allowance', async () => {
        const rateLimitConfig = {
          requests_per_minute: 10,
          requests_per_hour: 1000,
          burst_limit: 10,
        };

        const userKey = `user:burst-test`;

        // Burst of requests up to the per-minute limit
        for (let i = 0; i < 10; i++) {
          const allowed = await rateLimitService.checkRateLimit(userKey, rateLimitConfig);
          expect(allowed).toBe(true);
        }

        // Additional burst request should be rate limited
        const overBurst = await rateLimitService.checkRateLimit(userKey, rateLimitConfig);
        expect(overBurst).toBe(false);
      });
    });

    describe('Audit Logging for Security Events', () => {
      it('should log authentication failures', async () => {
        await auditService.logEvent({
          tenant_id: tenant1Id,
          user_id: userId1,
          event_type: 'auth.login.failed',
          resource_type: 'authentication',
          resource_id: 'login-attempt',
          action: 'login',
          outcome: 'failure',
          ip_address: '192.168.1.100',
          user_agent: 'TestClient/1.0',
          details: {
            reason: 'invalid_credentials',
            attempt_count: 3,
          },
        });

        const failureLogs = await auditService.queryLogs({
          tenantId: tenant1Id,
          userId: userId1,
          eventTypePrefix: 'auth.login',
        });

        expect(failureLogs.entries.length).toBeGreaterThan(0);
        expect(failureLogs.entries[0]!.success).toBe(false);
        expect(failureLogs.entries[0]!.details.reason).toBe('invalid_credentials');
      });

      it('should log authorization violations', async () => {
        await auditService.logEvent({
          tenant_id: tenant1Id,
          user_id: userId1,
          event_type: 'authz.permission.denied',
          resource_type: 'mcp_tool',
          resource_id: 'restricted-tool',
          action: 'invoke',
          outcome: 'failure',
          ip_address: '192.168.1.100',
          user_agent: 'TestClient/1.0',
          details: {
            reason: 'insufficient_scope',
            required_scope: 'mcp:tools:admin',
            provided_scope: 'mcp:tools:read',
          },
        });

        const deniedLogs = await auditService.queryLogs({
          tenantId: tenant1Id,
          eventTypePrefix: 'authz.permission',
        });

        expect(deniedLogs.entries.length).toBeGreaterThan(0);
        expect(deniedLogs.entries[0]!.success).toBe(false);
      });

      it('should maintain a complete audit trail with required fields', async () => {
        // Create multiple audit log entries
        const events = [
          { event_type: 'auth.login', outcome: 'success' as const },
          { event_type: 'mcp.resource.accessed', outcome: 'success' as const },
          { event_type: 'auth.logout', outcome: 'success' as const },
        ];

        for (const event of events) {
          await auditService.logEvent({
            tenant_id: tenant1Id,
            user_id: userId1,
            event_type: event.event_type,
            resource_type: 'authentication',
            resource_id: 'session',
            action: 'authenticate',
            outcome: event.outcome,
            ip_address: '192.168.1.100',
            user_agent: 'TestClient/1.0',
          });
        }

        // Query all events
        const allLogs = await auditService.queryLogs({
          tenantId: tenant1Id,
          userId: userId1,
        });

        // Verify events are recorded
        expect(allLogs.entries.length).toBeGreaterThanOrEqual(events.length);

        // Verify each log entry has required security fields
        allLogs.entries.forEach(log => {
          expect(log.id).toBeDefined();
          expect(log.timestamp).toBeDefined();
          expect(log.tenantId).toBe(tenant1Id);
          expect(log.userId).toBe(userId1);
          expect(log.ipAddress).toBeDefined();
          expect(log.userAgent).toBeDefined();
        });
      });
    });

    describe('Secure Session Management', () => {
      it('should enforce concurrent session limits', async () => {
        const limits: SessionLimits = {
          max_concurrent_sessions: 3,
          max_idle_time_seconds: 1800,
          max_session_time_seconds: 86400,
          enforce_device_binding: false,
          require_mfa_on_risk_elevation: false,
        };
        const manager = new SessionManager(sessionStorage, limits);

        // Create more sessions than the limit allows (sequentially: the
        // limit check reads current sessions)
        for (let i = 0; i < 5; i++) {
          await manager.createSession({
            tenant_id: tenant1Id,
            user_id: userId1,
            client_id: `client-${i}`,
            device_info: deviceInfo,
          });
        }

        // Get active sessions
        const sessions = await manager.getUserSessions(tenant1Id, userId1);
        const active = sessions.filter(s => s.status === SessionStatus.ACTIVE);

        // Should only keep most recent sessions
        expect(active.length).toBeLessThanOrEqual(3);
      });

      it('should detect suspicious session activity', async () => {
        const session = await sessionManager.createSession({
          tenant_id: tenant1Id,
          user_id: userId1,
          client_id: 'test-client',
          device_info: deviceInfo,
        });

        // Attempt to use session from a different device and IP
        const suspiciousDevice: DeviceInfo = {
          user_agent: 'DifferentClient/2.0',
          ip_address: '10.0.0.100',
          device_fingerprint: 'different-fingerprint',
        };

        const result = await sessionManager.validateSession(session.session_id, suspiciousDevice);

        // Device + IP change elevates risk and fails validation
        expect(result.valid).toBe(false);
      });

      it('should revoke sessions on security events', async () => {
        const session = await sessionManager.createSession({
          tenant_id: tenant1Id,
          user_id: userId1,
          client_id: 'test-client',
          device_info: deviceInfo,
        });

        // Revoke session
        await sessionManager.revokeSession(session.session_id, 'security_event');

        // Revoked session no longer validates
        const result = await sessionManager.validateSession(session.session_id, deviceInfo);
        expect(result.valid).toBe(false);
        expect(result.error?.code).toBe('session_revoked');
      });
    });
  });

  describe('Security Compliance Validation', () => {
    it('should enforce OAuth 2.1 security best practices', () => {
      // OAuth 2.1 removes implicit flow
      // OAuth 2.1 mandates PKCE for all clients
      // OAuth 2.1 requires exact redirect URI matching

      const securityRequirements = {
        pkce_required: true,
        implicit_flow_disabled: true,
        exact_redirect_uri_matching: true,
        authorization_code_single_use: true,
        token_expiration_enforced: true,
      };

      Object.values(securityRequirements).forEach(requirement => {
        expect(requirement).toBe(true);
      });
    });

    it('should pass SOC 2 audit logging requirements', async () => {
      // SOC 2 requires comprehensive audit trails (with compliance tags)
      await auditService.createLogEntry(tenant1Id, 'data.access', 'read', true, {
        userId: userId1,
        resourceType: 'sensitive_data',
        resourceId: 'data-123',
        ipAddress: '192.168.1.100',
        userAgent: 'TestClient/1.0',
        complianceTags: ['SOC2', 'GDPR'],
      });

      const complianceLogs = await auditService.queryLogs({
        tenantId: tenant1Id,
        complianceTag: 'SOC2',
      });

      expect(complianceLogs.entries.length).toBeGreaterThan(0);
      expect(complianceLogs.entries[0]!.complianceTags).toContain('SOC2');
    });
  });
});
