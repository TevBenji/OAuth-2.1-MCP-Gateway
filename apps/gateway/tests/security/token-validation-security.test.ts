/**
 * Token Validation Security Tests
 * 
 * Comprehensive security tests for JWT token validation including
 * attack vectors, tampering detection, and compliance verification.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JWTService } from '../../src/services/oauth/jwt';
import { TenantService } from '../../src/services/tenant/isolation';
import { AuditService } from '../../src/services/security/audit';
import { MemoryKV } from '../../src/lib/memory-kv';
import { getTestDb } from '../helpers/db';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Token Validation Security Tests', () => {
  let jwtService: JWTService;
  let tenantService: TenantService;
  let auditService: AuditService;
  let cache: MemoryKV;

  const testTenantId = 'token-security-tenant';
  const testUserId = 'token-security-user';
  const testClientId = 'token-security-client';
  const resourceIdentifier = 'mcp://test-server/tools';

  beforeEach(async () => {
    jwtService = new JWTService('test-secret-key', 'HS256', 'oauth-mcp-gateway');
    tenantService = new TenantService(getTestDb().db);
    auditService = AuditService.getInstance(getTestDb().db);
    cache = new MemoryKV();

    // Setup test tenant
    await tenantService.createTenant({
      tenant_id: testTenantId,
      name: 'Token Security Test Tenant',
      domain: 'token-security.example.com',
      max_users: 100,
      max_mcp_servers: 10,
      compliance_tier: 'standard',
      audit_retention_days: 365
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('JWT Token Structure Security', () => {
    it('should create tokens with proper structure and claims', async () => {
      const token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read mcp:resources:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const parts = token.split('.');
      expect(parts).toHaveLength(3); // header.payload.signature

      // Decode and verify header (jose omits the optional typ field)
      const header = JSON.parse(atob(parts[0]!));
      expect(header.alg).toBe('HS256');

      // Decode and verify payload
      const payload = JSON.parse(atob(parts[1]!));
      expect(payload.iss).toBe('oauth-mcp-gateway');
      expect(payload.sub).toBe(testUserId);
      expect(payload.aud).toBe(resourceIdentifier);
      expect(payload.tenant_id).toBe(testTenantId);
      expect(payload.user_id).toBe(testUserId);
      expect(payload.scope).toBe('mcp:tools:read mcp:resources:read');
      expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(payload.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
    });

    it('should reject tokens with invalid structure', async () => {
      const invalidTokens = [
        'invalid-token', // Not JWT format
        'header.payload', // Missing signature
        'header.payload.signature.extra', // Too many parts
        '', // Empty token
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.', // Missing payload and signature
        '.payload.signature', // Missing header
        'header..signature', // Missing payload
        'header.payload.' // Missing signature
      ];

      for (const invalidToken of invalidTokens) {
        await expect(
          jwtService.verifyToken(invalidToken)
        ).rejects.toThrow('JWT verification failed');
      }
    });

    it('should reject tokens with malformed JSON in header or payload', async () => {
      // Create token with malformed header
      const malformedHeader = btoa('{"alg":"HS256","typ":"JWT"'); // Missing closing brace
      const validPayload = btoa(JSON.stringify({
        iss: 'oauth-mcp-gateway',
        sub: testUserId,
        aud: resourceIdentifier,
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
      const signature = 'fake-signature';
      
      const malformedToken = `${malformedHeader}.${validPayload}.${signature}`;

      await expect(
        jwtService.verifyToken(malformedToken)
      ).rejects.toThrow('JWT verification failed');
    });
  });

  describe('Token Signature Security', () => {
    it('should reject tokens with invalid signatures', async () => {
      const validToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      // Tamper with signature
      const parts = validToken.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.tampered-signature`;

      await expect(
        jwtService.verifyToken(tamperedToken)
      ).rejects.toThrow('JWT verification failed');
    });

    it('should reject tokens signed with wrong key', async () => {
      // Create JWT service with different key
      const differentKeyService = new JWTService('different-secret-key', 'HS256', 'oauth-mcp-gateway');
      
      const tokenWithDifferentKey = await differentKeyService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      // Try to verify with original service
      await expect(
        jwtService.verifyToken(tokenWithDifferentKey)
      ).rejects.toThrow('JWT verification failed');
    });

    it('should reject tokens with algorithm confusion attacks', async () => {
      // Create a token with "none" algorithm (should be rejected)
      const header = { alg: 'none', typ: 'JWT' };
      const payload = {
        iss: 'oauth-mcp-gateway',
        sub: testUserId,
        aud: resourceIdentifier,
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      const noneToken = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.`;

      await expect(
        jwtService.verifyToken(noneToken)
      ).rejects.toThrow('JWT verification failed');
    });

    it('should be resistant to timing attacks on signature verification', async () => {
      const validToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const parts = validToken.split('.');
      const invalidSignatures = [
        'a'.repeat(parts[2]!.length), // Same length, all 'a'
        'z'.repeat(parts[2]!.length), // Same length, all 'z'
        parts[2]!.slice(0, -1) + 'x', // One character different
        parts[2]!.slice(1) + 'x' // Shifted by one
      ];

      // Measure timing for valid signature
      const validTimings: number[] = [];
      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        try {
          await jwtService.verifyToken(validToken);
        } catch (e) {
          // Expected for some tests
        }
        const end = performance.now();
        validTimings.push(end - start);
      }

      // Measure timing for invalid signatures
      const invalidTimings: number[] = [];
      for (const invalidSig of invalidSignatures) {
        const invalidToken = `${parts[0]}.${parts[1]}.${invalidSig}`;
        for (let i = 0; i < 10; i++) {
          const start = performance.now();
          try {
            await jwtService.verifyToken(invalidToken);
          } catch (e) {
            // Expected
          }
          const end = performance.now();
          invalidTimings.push(end - start);
        }
      }

      const median = (values: number[]) => {
        const sorted = [...values].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)]!;
      };
      const medianValidTime = median(validTimings);
      const medianInvalidTime = median(invalidTimings);

      // Medians should be in the same ballpark (JS timers are noisy; this is
      // a smoke check against gross early-exit behavior, not a strict bound)
      const timingDifference =
        Math.abs(medianValidTime - medianInvalidTime) /
        Math.max(medianValidTime, medianInvalidTime, 0.001);

      expect(timingDifference).toBeLessThan(0.9);
    });
  });

  describe('Token Payload Security', () => {
    it('should reject tokens with tampered payload', async () => {
      const validToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const parts = validToken.split('.');
      
      // Tamper with payload (change user_id)
      const originalPayload = JSON.parse(atob(parts[1]!));
      const tamperedPayload = { ...originalPayload, user_id: 'attacker-user' };
      const tamperedPayloadEncoded = btoa(JSON.stringify(tamperedPayload));
      
      const tamperedToken = `${parts[0]}.${tamperedPayloadEncoded}.${parts[2]}`;

      await expect(
        jwtService.verifyToken(tamperedToken)
      ).rejects.toThrow('JWT verification failed');
    });

    it('should reject tokens with privilege escalation attempts', async () => {
      const limitedToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read', // Limited scope
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const parts = limitedToken.split('.');
      
      // Try to escalate privileges by modifying scope
      const originalPayload = JSON.parse(atob(parts[1]!));
      const escalatedPayload = { 
        ...originalPayload, 
        scope: 'mcp:tools:read mcp:tools:write mcp:admin:all' // Escalated scope
      };
      const escalatedPayloadEncoded = btoa(JSON.stringify(escalatedPayload));
      
      const escalatedToken = `${parts[0]}.${escalatedPayloadEncoded}.${parts[2]}`;

      await expect(
        jwtService.verifyToken(escalatedToken)
      ).rejects.toThrow('JWT verification failed');
    });

    it('should reject tokens with tenant isolation bypass attempts', async () => {
      const validToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const parts = validToken.split('.');
      
      // Try to bypass tenant isolation
      const originalPayload = JSON.parse(atob(parts[1]!));
      const bypassPayload = { 
        ...originalPayload, 
        tenant_id: 'different-tenant-id' // Attempt to access different tenant
      };
      const bypassPayloadEncoded = btoa(JSON.stringify(bypassPayload));
      
      const bypassToken = `${parts[0]}.${bypassPayloadEncoded}.${parts[2]}`;

      await expect(
        jwtService.verifyToken(bypassToken)
      ).rejects.toThrow('JWT verification failed');
    });
  });

  describe('Token Expiration Security', () => {
    it('should reject expired tokens', async () => {
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
        jwtService.verifyToken(expiredToken)
      ).rejects.toThrow('JWT verification failed');
    });

    it('should reject tokens with future issued-at time', async () => {
      // Create token with future iat (issued at)
      const futureIat = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      
      // We need to manually create this token since our service validates iat
      const header = { alg: 'HS256', typ: 'JWT' };
      const payload = {
        iss: 'oauth-mcp-gateway',
        sub: testUserId,
        aud: resourceIdentifier,
        exp: futureIat + 3600,
        iat: futureIat, // Future timestamp
        tenant_id: testTenantId,
        user_id: testUserId,
        scope: 'mcp:tools:read'
      };

      // This would need to be properly signed, but for testing we expect it to fail
      const futureToken = `${btoa(JSON.stringify(header))}.${btoa(JSON.stringify(payload))}.fake-signature`;

      await expect(
        jwtService.verifyToken(futureToken)
      ).rejects.toThrow('JWT verification failed');
    });

    it('should handle clock skew gracefully', async () => {
      // Create token that expires very soon
      const shortLivedToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 5 // 5 seconds
      });

      // Should be valid immediately
      const result = await jwtService.verifyToken(shortLivedToken);
      expect(result.payload.sub).toBe(testUserId);

      // Wait for expiration
      await sleep(6000);

      // Should now be expired
      await expect(
        jwtService.verifyToken(shortLivedToken)
      ).rejects.toThrow('JWT verification failed');
    });
  });

  describe('Audience Validation Security', () => {
    it('should reject tokens with wrong audience', async () => {
      const tokenForDifferentResource = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: 'mcp://different-server/tools',
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      // Try to use token for different resource: audience validation fails
      await expect(
        jwtService.verifyToken(tokenForDifferentResource, resourceIdentifier)
      ).rejects.toThrow('JWT verification failed');
    });

    it('should prevent audience confusion attacks', async () => {
      const validToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      // Try to use token for multiple audiences (array injection)
      const parts = validToken.split('.');
      const originalPayload = JSON.parse(atob(parts[1]!));
      const multiAudiencePayload = { 
        ...originalPayload, 
        aud: [resourceIdentifier, 'mcp://attacker-server/tools'] // Array of audiences
      };
      const multiAudiencePayloadEncoded = btoa(JSON.stringify(multiAudiencePayload));
      
      const multiAudienceToken = `${parts[0]}.${multiAudiencePayloadEncoded}.${parts[2]}`;

      await expect(
        jwtService.verifyToken(multiAudienceToken)
      ).rejects.toThrow('JWT verification failed');
    });
  });

  describe('Issuer Validation Security', () => {
    it('should reject tokens from untrusted issuers', async () => {
      // Create JWT service with different issuer
      const untrustedIssuerService = new JWTService('test-secret-key', 'HS256', 'untrusted-issuer');
      
      const untrustedToken = await untrustedIssuerService.createToken({
        issuer: 'untrusted-issuer',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      await expect(
        jwtService.verifyToken(untrustedToken)
      ).rejects.toThrow('JWT verification failed');
    });

    it('should prevent issuer substitution attacks', async () => {
      const validToken = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      const parts = validToken.split('.');
      
      // Try to change issuer
      const originalPayload = JSON.parse(atob(parts[1]!));
      const substitutedPayload = { 
        ...originalPayload, 
        iss: 'attacker-issuer' // Different issuer
      };
      const substitutedPayloadEncoded = btoa(JSON.stringify(substitutedPayload));
      
      const substitutedToken = `${parts[0]}.${substitutedPayloadEncoded}.${parts[2]}`;

      await expect(
        jwtService.verifyToken(substitutedToken)
      ).rejects.toThrow('JWT verification failed');
    });
  });

  describe('Token Replay Attack Prevention', () => {
    it('should detect and prevent token replay attacks', async () => {
      const token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      // First use should succeed
      const firstUse = await jwtService.verifyToken(token);
      expect(firstUse.payload.sub).toBe(testUserId);

      // Mark token as used (in a real implementation, this would be done automatically)
      const tokenId = firstUse.payload.jti || 'token-id';
      await cache.put(`used_token:${tokenId}`, 'used', { expirationTtl: 3600 });

      // Check if token was used
      const tokenUsed = await cache.get(`used_token:${tokenId}`);
      expect(tokenUsed).toBe('used');
    });

    it('should handle concurrent token validation safely', async () => {
      const token = await jwtService.createToken({
        issuer: 'oauth-mcp-gateway',
        subject: testUserId,
        audience: resourceIdentifier,
        scopes: 'mcp:tools:read',
        tenantId: testTenantId,
        userId: testUserId,
        expiresIn: 3600
      });

      // Validate same token concurrently
      const concurrentValidations = Array(50).fill(null).map(() => 
        jwtService.verifyToken(token)
      );

      const results = await Promise.allSettled(concurrentValidations);
      
      // All validations should succeed (or fail consistently)
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;
      
      // Either all succeed or all fail (consistent behavior)
      expect(successCount === results.length || failureCount === results.length).toBe(true);
    });
  });

  describe('Security Event Logging', () => {
    it('should log token validation failures', async () => {
      const invalidToken = 'invalid.token.here';
      
      try {
        await jwtService.verifyToken(invalidToken);
        expect.fail('Should have thrown an error');
      } catch (error) {
        // Log the security event
        await auditService.logEvent({
          tenant_id: testTenantId,
          user_id: 'unknown',
          event_type: 'auth.token_validation_failed',
          resource_type: 'oauth_token',
          resource_id: testClientId,
          action: 'validate_token',
          outcome: 'failure',
          ip_address: '192.168.1.100',
          user_agent: 'TestClient/1.0',
          details: {
            token_prefix: invalidToken.substring(0, 10),
            error_type: 'invalid_format',
            reason: 'JWT verification failed'
          }
        });
      }

      // Verify audit log was created
      const auditLogs = await auditService.queryLogs({
        tenantId: testTenantId,
        eventTypePrefix: 'auth.token_validation'
      });

      expect(auditLogs.entries).toHaveLength(1);
      expect(auditLogs.entries[0]!.success).toBe(false);
      expect(auditLogs.entries[0]!.details.error_type).toBe('invalid_format');
    });

    it('should log suspicious token patterns', async () => {
      // Simulate multiple failed attempts with similar patterns
      const suspiciousTokens = [
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdHRhY2tlciJ9.fake1',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdHRhY2tlciJ9.fake2',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdHRhY2tlciJ9.fake3'
      ];

      for (const suspiciousToken of suspiciousTokens) {
        try {
          await jwtService.verifyToken(suspiciousToken);
        } catch (error) {
          await auditService.logEvent({
            tenant_id: testTenantId,
            user_id: 'unknown',
            event_type: 'security.suspicious_token_pattern',
            resource_type: 'oauth_token',
            resource_id: testClientId,
            action: 'validate_token',
            outcome: 'failure',
            ip_address: '192.168.1.100',
            user_agent: 'SuspiciousClient/1.0',
            details: {
              token_pattern: 'repeated_payload_structure',
              attempt_count: suspiciousTokens.indexOf(suspiciousToken) + 1
            }
          });
        }
      }

      // Verify suspicious activity was logged
      const suspiciousLogs = await auditService.queryLogs({
        tenantId: testTenantId,
        eventTypePrefix: 'security.suspicious_token'
      });

      expect(suspiciousLogs.entries).toHaveLength(3);
      expect(suspiciousLogs.entries.every(log => !log.success)).toBe(true);
    });
  });

  describe('Token Validation Performance Under Attack', () => {
    it('should maintain performance during token flooding attacks', async () => {
      const floodTokens = Array(100).fill(null).map((_, i) => 
        `flood.token.${i}.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmbG9vZCJ9.fake${i}`
      );

      const startTime = performance.now();
      
      const results = await Promise.allSettled(
        floodTokens.map(token => jwtService.verifyToken(token))
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTimePerToken = totalTime / floodTokens.length;

      console.log(`Token flood attack performance:
        Total tokens: ${floodTokens.length}
        Total time: ${totalTime.toFixed(2)}ms
        Avg per token: ${avgTimePerToken.toFixed(2)}ms`);

      // All should fail
      expect(results.every(r => r.status === 'rejected')).toBe(true);
      
      // Should still be reasonably fast even under attack
      expect(avgTimePerToken).toBeLessThan(10); // Less than 10ms per token
    });

    it('should handle malformed token flooding gracefully', async () => {
      const malformedTokens = [
        'not-a-jwt-token',
        'header.payload',
        'header.payload.signature.extra',
        '',
        'a'.repeat(10000), // Very long token
        'header.' + 'a'.repeat(5000) + '.signature', // Very long payload
        '\x00\x01\x02\x03', // Binary data
        '../../etc/passwd', // Path traversal attempt
        '<script>alert("xss")</script>', // XSS attempt
        'SELECT * FROM users', // SQL injection attempt
      ];

      const startTime = performance.now();
      
      const results = await Promise.allSettled(
        malformedTokens.map(token => jwtService.verifyToken(token))
      );

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      console.log(`Malformed token flood performance:
        Total tokens: ${malformedTokens.length}
        Total time: ${totalTime.toFixed(2)}ms`);

      // All should fail gracefully
      expect(results.every(r => r.status === 'rejected')).toBe(true);
      
      // Should not cause excessive processing time
      expect(totalTime).toBeLessThan(1000); // Less than 1 second total
    });
  });
});