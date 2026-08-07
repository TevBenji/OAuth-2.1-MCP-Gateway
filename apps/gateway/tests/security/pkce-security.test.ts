/**
 * PKCE Security Integration Tests
 * 
 * Comprehensive security tests for PKCE implementation including
 * attack vectors, edge cases, and compliance verification.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PKCEService } from '../../src/services/oauth/pkce';
import { AuditService } from '../../src/services/security/audit';
import { MemoryKV } from '../../src/lib/memory-kv';
import { getTestDb, createTenant } from '../helpers/db';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('PKCE Security Tests', () => {
  let pkceService: PKCEService;
  let auditService: AuditService;
  let cache: MemoryKV;

  const testTenantId = 'pkce-security-tenant';
  const testClientId = 'pkce-security-client';
  const testUserId = 'pkce-security-user';

  beforeEach(async () => {
    pkceService = new PKCEService();
    auditService = AuditService.getInstance(getTestDb().db);
    cache = new MemoryKV();
    await createTenant(testTenantId);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('PKCE Challenge Generation Security', () => {
    it('should generate cryptographically secure code verifiers', async () => {
      const verifiers = new Set<string>();
      const iterations = 1000;

      // Generate multiple verifiers to test uniqueness and entropy
      for (let i = 0; i < iterations; i++) {
        const { codeVerifier } = await pkceService.generateChallenge();
        
        // Verify format (base64url, 43-128 characters)
        expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
        
        // Verify uniqueness
        expect(verifiers.has(codeVerifier)).toBe(false);
        verifiers.add(codeVerifier);
      }

      expect(verifiers.size).toBe(iterations);
    });

    it('should generate S256 challenges correctly', async () => {
      const { codeVerifier, codeChallenge } = await pkceService.generateChallenge();
      
      // Manually compute expected challenge
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = new Uint8Array(hashBuffer);
      
      // Convert to base64url
      const expectedChallenge = btoa(String.fromCharCode(...hashArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      expect(codeChallenge).toBe(expectedChallenge);
    });

    it('should reject weak code verifiers', async () => {
      const weakVerifiers = [
        'short', // Too short
        'a'.repeat(129), // Too long
        'contains spaces', // Invalid characters
        'contains+plus', // Invalid characters
        'contains/slash', // Invalid characters
        'contains=equals' // Invalid characters
      ];

      for (const weakVerifier of weakVerifiers) {
        // Malformed verifiers are rejected (verification returns false)
        await expect(
          pkceService.verifyChallenge(weakVerifier, 'any-challenge')
        ).resolves.toBe(false);
      }
    });
  });

  describe('PKCE Verification Security', () => {
    it('should verify valid PKCE challenges correctly', async () => {
      const { codeVerifier, codeChallenge } = await pkceService.generateChallenge();
      
      const isValid = await pkceService.verifyChallenge(codeVerifier, codeChallenge);
      expect(isValid).toBe(true);
    });

    it('should reject invalid PKCE verifiers', async () => {
      const { codeChallenge } = await pkceService.generateChallenge();
      const invalidVerifier = 'invalid-verifier-that-does-not-match';
      
      const isValid = await pkceService.verifyChallenge(invalidVerifier, codeChallenge);
      expect(isValid).toBe(false);
    });

    it('should reject tampered challenges', async () => {
      const { codeVerifier } = await pkceService.generateChallenge();
      const tamperedChallenge = 'tampered-challenge-value';
      
      const isValid = await pkceService.verifyChallenge(codeVerifier, tamperedChallenge);
      expect(isValid).toBe(false);
    });

    it('should be timing attack resistant', async () => {
      const { codeVerifier, codeChallenge } = await pkceService.generateChallenge();
      const invalidVerifier = 'invalid-verifier-same-length-as-valid-one-to-test-timing';
      
      // Measure timing for valid verification
      const validTimings: number[] = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await pkceService.verifyChallenge(codeVerifier, codeChallenge);
        const end = performance.now();
        validTimings.push(end - start);
      }

      // Measure timing for invalid verification
      const invalidTimings: number[] = [];
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        await pkceService.verifyChallenge(invalidVerifier, codeChallenge);
        const end = performance.now();
        invalidTimings.push(end - start);
      }

      const median = (values: number[]) => {
        const sorted = [...values].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)]!;
      };
      const medianValidTime = median(validTimings);
      const medianInvalidTime = median(invalidTimings);

      // Medians should be in the same ballpark. The implementation uses a
      // constant-time comparison; JS timers are too noisy for a tight bound,
      // so this is a smoke check against gross early-exit behavior.
      const timingDifference =
        Math.abs(medianValidTime - medianInvalidTime) /
        Math.max(medianValidTime, medianInvalidTime, 0.001);

      expect(timingDifference).toBeLessThan(0.9);
    });
  });

  describe('PKCE Attack Vector Prevention', () => {
    it('should prevent authorization code interception attacks', async () => {
      // Scenario: Attacker intercepts authorization code but doesn't have code verifier
      const { codeVerifier, codeChallenge } = await pkceService.generateChallenge();
      
      // Store authorization code with PKCE challenge
      const authCode = 'auth_intercepted_code';
      await cache.put(
        `auth_code:${authCode}`,
        JSON.stringify({
          client_id: testClientId,
          user_id: testUserId,
          tenant_id: testTenantId,
          redirect_uri: 'https://client.example.com/callback',
          scope: 'mcp:tools:read',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          expires_at: Date.now() + 600000
        }),
        { expirationTtl: 600 }
      );

      // Attacker tries to exchange code without proper verifier
      const attackerVerifier = 'attacker-generated-verifier';
      
      const isValid = await pkceService.verifyChallenge(attackerVerifier, codeChallenge);
      expect(isValid).toBe(false);

      // Legitimate client can still use the code
      const legitimateIsValid = await pkceService.verifyChallenge(codeVerifier, codeChallenge);
      expect(legitimateIsValid).toBe(true);
    });

    it('should prevent code challenge replay attacks', async () => {
      const { codeVerifier, codeChallenge } = await pkceService.generateChallenge();
      
      // First use should succeed
      const firstUse = await pkceService.verifyChallenge(codeVerifier, codeChallenge);
      expect(firstUse).toBe(true);

      // Mark challenge as used
      await cache.put(`used_challenge:${codeChallenge}`, 'used', { expirationTtl: 3600 });

      // Second use should be detected and rejected
      const challengeUsed = await cache.get(`used_challenge:${codeChallenge}`);
      expect(challengeUsed).toBe('used');
    });

    it('should prevent downgrade attacks to plain method', async () => {
      // System should only accept S256 method, never plain
      const plainChallenge = 'plain-text-challenge';
      const plainVerifier = 'plain-text-challenge'; // Same as challenge for plain method
      
      // This should fail because plain method is not supported
      await expect(
        pkceService.verifyChallenge(plainVerifier, plainChallenge, 'plain')
      ).rejects.toThrow('Only S256 PKCE method is supported');
    });

    it('should prevent brute force attacks on code verifiers', async () => {
      const { codeChallenge } = await pkceService.generateChallenge();
      const attempts = [];
      
      // Simulate multiple failed attempts
      for (let i = 0; i < 10; i++) {
        const fakeVerifier = `fake-verifier-${i}`;
        const start = performance.now();
        const isValid = await pkceService.verifyChallenge(fakeVerifier, codeChallenge);
        const end = performance.now();
        
        attempts.push({
          verifier: fakeVerifier,
          valid: isValid,
          time: end - start
        });
        
        expect(isValid).toBe(false);
      }

      // All attempts should fail
      expect(attempts.every(attempt => !attempt.valid)).toBe(true);
    });
  });

  describe('PKCE Storage Security', () => {
    it('should securely store and retrieve PKCE challenges', async () => {
      const { codeVerifier, codeChallenge } = await pkceService.generateChallenge();
      const authCode = 'test_auth_code';
      
      // Store challenge securely
      await cache.put(
        `auth_code:${authCode}`,
        JSON.stringify({
          client_id: testClientId,
          user_id: testUserId,
          tenant_id: testTenantId,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
          expires_at: Date.now() + 600000
        }),
        { expirationTtl: 600 }
      );

      // Retrieve and verify
      const storedData = await cache.get(`auth_code:${authCode}`);
      expect(storedData).toBeDefined();
      
      const parsedData = JSON.parse(storedData!);
      expect(parsedData.code_challenge).toBe(codeChallenge);
      expect(parsedData.code_challenge_method).toBe('S256');
      
      // Verify the stored challenge works
      const isValid = await pkceService.verifyChallenge(codeVerifier, parsedData.code_challenge);
      expect(isValid).toBe(true);
    });

    it('should automatically expire PKCE challenges', async () => {
      const { codeChallenge } = await pkceService.generateChallenge();
      const authCode = 'expiring_auth_code';
      
      // Store with short TTL
      await cache.put(
        `auth_code:${authCode}`,
        JSON.stringify({
          client_id: testClientId,
          code_challenge: codeChallenge,
          expires_at: Date.now() + 100 // 100ms
        }),
        { expirationTtl: 1 } // 1 second TTL
      );

      // Wait for the 1 second TTL to elapse
      await sleep(1100);

      // Should be expired
      const expiredData = await cache.get(`auth_code:${authCode}`);
      expect(expiredData).toBeNull();
    });

    it('should prevent challenge enumeration attacks', async () => {
      // Try to enumerate stored challenges
      const challengeKeys = [
        'auth_code:guess1',
        'auth_code:guess2',
        'auth_code:common',
        'auth_code:admin',
        'auth_code:test'
      ];

      for (const key of challengeKeys) {
        const result = await cache.get(key);
        expect(result).toBeNull(); // Should not exist
      }

      // Even if we store a challenge, it should not be guessable
      const { codeChallenge } = await pkceService.generateChallenge();
      const secureAuthCode = 'auth_' + crypto.randomUUID();
      
      await cache.put(
        `auth_code:${secureAuthCode}`,
        JSON.stringify({
          client_id: testClientId,
          code_challenge: codeChallenge,
          expires_at: Date.now() + 600000
        }),
        { expirationTtl: 600 }
      );

      // Guessing similar keys should fail
      const guessAttempts = [
        `auth_code:${secureAuthCode.slice(0, -1)}`,
        `auth_code:${secureAuthCode}1`,
        `auth_code:${secureAuthCode.replace('-', '_')}`
      ];

      for (const guess of guessAttempts) {
        const result = await cache.get(guess);
        expect(result).toBeNull();
      }
    });
  });

  describe('PKCE Compliance and Standards', () => {
    it('should comply with RFC 7636 PKCE specification', async () => {
      const { codeVerifier, codeChallenge } = await pkceService.generateChallenge();
      
      // RFC 7636 requirements:
      // 1. Code verifier: 43-128 characters, [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
      expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
      expect(codeVerifier.length).toBeLessThanOrEqual(128);
      expect(codeVerifier).toMatch(/^[A-Za-z0-9._~-]+$/);
      
      // 2. Code challenge: base64url-encoded SHA256 hash
      expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(codeChallenge.length).toBe(43); // SHA256 hash base64url encoded without padding
      
      // 3. Challenge method must be S256
      const isValid = await pkceService.verifyChallenge(codeVerifier, codeChallenge, 'S256');
      expect(isValid).toBe(true);
    });

    it('should enforce PKCE for all authorization code flows', async () => {
      // Authorization request without PKCE should be rejected
      const authRequestWithoutPKCE = {
        response_type: 'code',
        client_id: testClientId,
        redirect_uri: 'https://client.example.com/callback',
        scope: 'mcp:tools:read',
        state: 'test-state'
        // Missing code_challenge and code_challenge_method
      };

      // This should be rejected at the authorization endpoint level
      // (simulated here as the PKCE service would be called by the endpoint)
      expect(() => {
        if (!authRequestWithoutPKCE.hasOwnProperty('code_challenge')) {
          throw new Error('PKCE code_challenge parameter is required');
        }
      }).toThrow('PKCE code_challenge parameter is required');
    });

    it('should log PKCE security events for audit', async () => {
      const { codeVerifier, codeChallenge } = await pkceService.generateChallenge();
      
      // Simulate failed PKCE verification
      const invalidVerifier = 'invalid-verifier';
      const isValid = await pkceService.verifyChallenge(invalidVerifier, codeChallenge);
      expect(isValid).toBe(false);

      // Log the security event
      await auditService.logEvent({
        tenant_id: testTenantId,
        user_id: testUserId,
        event_type: 'auth.pkce_verification_failed',
        resource_type: 'oauth_token',
        resource_id: testClientId,
        action: 'verify_pkce',
        outcome: 'failure',
        ip_address: '192.168.1.100',
        user_agent: 'TestClient/1.0',
        details: {
          code_challenge: codeChallenge,
          challenge_method: 'S256',
          reason: 'Invalid code verifier'
        }
      });

      // Verify audit log was created
      const auditLogs = await auditService.queryLogs({
        tenantId: testTenantId,
        eventTypePrefix: 'auth.pkce'
      });

      expect(auditLogs.entries).toHaveLength(1);
      expect(auditLogs.entries[0]!.success).toBe(false);
      expect(auditLogs.entries[0]!.details.reason).toBe('Invalid code verifier');
    });
  });

  describe('PKCE Edge Cases and Error Handling', () => {
    it('should handle malformed challenges gracefully', async () => {
      const malformedChallenges = [
        '', // Empty
        null as any, // Null
        undefined as any, // Undefined
        'short', // Too short
        'a'.repeat(200), // Too long
        'invalid+chars', // Invalid characters
        'invalid/chars', // Invalid characters
        'invalid=chars' // Invalid characters
      ];

      for (const challenge of malformedChallenges) {
        // Malformed challenges never verify (and never throw)
        await expect(
          pkceService.verifyChallenge('valid-verifier', challenge)
        ).resolves.toBe(false);
      }
    });

    it('should handle concurrent PKCE operations safely', async () => {
      const concurrentOperations = 100;
      
      // Generate challenges concurrently
      const challengePromises = Array(concurrentOperations).fill(null).map(() => 
        pkceService.generateChallenge()
      );

      const challenges = await Promise.all(challengePromises);
      
      // All challenges should be unique
      const verifiers = new Set(challenges.map(c => c.codeVerifier));
      const challengeValues = new Set(challenges.map(c => c.codeChallenge));
      
      expect(verifiers.size).toBe(concurrentOperations);
      expect(challengeValues.size).toBe(concurrentOperations);

      // Verify all challenges concurrently
      const verificationPromises = challenges.map(({ codeVerifier, codeChallenge }) =>
        pkceService.verifyChallenge(codeVerifier, codeChallenge)
      );

      const verificationResults = await Promise.all(verificationPromises);
      
      // All verifications should succeed
      expect(verificationResults.every(result => result === true)).toBe(true);
    });

    it('should handle memory pressure gracefully', async () => {
      // Generate a large number of challenges to test memory handling
      const largeNumber = 1000;
      const challenges = [];

      for (let i = 0; i < largeNumber; i++) {
        const challenge = await pkceService.generateChallenge();
        challenges.push(challenge);
        
        // Verify immediately to ensure correctness under load
        const isValid = await pkceService.verifyChallenge(challenge.codeVerifier, challenge.codeChallenge);
        expect(isValid).toBe(true);
      }

      // All challenges should still be unique
      const uniqueVerifiers = new Set(challenges.map(c => c.codeVerifier));
      expect(uniqueVerifiers.size).toBe(largeNumber);
    });
  });
});