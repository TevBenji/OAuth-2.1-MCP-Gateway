import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  generateCodeVerifier, 
  createS256CodeChallenge, 
  createPlainCodeChallenge, 
  validateCodeVerifier,
  InMemoryPKCEStorage
} from '../../../src/services/oauth/pkce';

describe('PKCE Utilities', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a code verifier with length between 43 and 128 characters', () => {
      const verifier = generateCodeVerifier();
      
      expect(verifier).toBeDefined();
      expect(typeof verifier).toBe('string');
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });

    it('should contain only base64url-safe characters', () => {
      const verifier = generateCodeVerifier();
      const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
      
      expect(base64UrlRegex.test(verifier)).toBe(true);
    });
  });

  describe('createS256CodeChallenge', () => {
    it('should create a valid S256 code challenge', async () => {
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const challenge = await createS256CodeChallenge(verifier);
      
      expect(challenge).toBeDefined();
      expect(typeof challenge).toBe('string');
      // For this test we'll just check that it produces a proper base64url string
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should create different challenges for different verifiers', async () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      
      const challenge1 = await createS256CodeChallenge(verifier1);
      const challenge2 = await createS256CodeChallenge(verifier2);
      
      expect(challenge1).not.toBe(challenge2);
    });
  });

  describe('createPlainCodeChallenge', () => {
    it('should return the same value as the input verifier', () => {
      const verifier = 'some-test-verifier-string';
      const challenge = createPlainCodeChallenge(verifier);
      
      expect(challenge).toBe(verifier);
    });
  });

  describe('validateCodeVerifier', () => {
    it('should validate a correct S256 code verifier successfully', async () => {
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const challenge = await createS256CodeChallenge(verifier);
      
      const isValid = await validateCodeVerifier(verifier, challenge, 'S256');
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect S256 code verifier', async () => {
      const verifier1 = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const verifier2 = 'different-verifier-string';
      const challenge = await createS256CodeChallenge(verifier1);
      
      const isValid = await validateCodeVerifier(verifier2, challenge, 'S256');
      expect(isValid).toBe(false);
    });

    it('should validate a correct plain code verifier successfully', async () => {
      const verifier = 'some-plain-verifier';
      const challenge = createPlainCodeChallenge(verifier);
      
      const isValid = await validateCodeVerifier(verifier, challenge, 'plain');
      expect(isValid).toBe(true);
    });

    it('should reject an incorrect plain code verifier', async () => {
      const verifier1 = 'verifier1';
      const verifier2 = 'verifier2';
      const challenge = createPlainCodeChallenge(verifier1);
      
      const isValid = await validateCodeVerifier(verifier2, challenge, 'plain');
      expect(isValid).toBe(false);
    });

    it('should reject a verifier that is too short', async () => {
      const shortVerifier = 'short';
      const challenge = 'some-challenge';
      
      const isValid = await validateCodeVerifier(shortVerifier, challenge, 'S256');
      expect(isValid).toBe(false);
    });

    it('should reject a verifier that is too long', async () => {
      const longVerifier = 'a'.repeat(129); // More than 128 characters
      const challenge = 'some-challenge';
      
      const isValid = await validateCodeVerifier(longVerifier, challenge, 'S256');
      expect(isValid).toBe(false);
    });

    it('should reject a verifier with invalid characters', async () => {
      const invalidVerifier = 'invalid@characters!';
      const challenge = 'some-challenge';
      
      const isValid = await validateCodeVerifier(invalidVerifier, challenge, 'S256');
      expect(isValid).toBe(false);
    });

    it('should throw an error for unsupported challenge method', async () => {
      const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const challenge = 'some-challenge';
      
      await expect(validateCodeVerifier(verifier, challenge, 'unsupported' as any))
        .rejects.toThrow('Unsupported code challenge method: unsupported');
    });
  });

  describe('InMemoryPKCEStorage', () => {
    let storage: InMemoryPKCEStorage;

    beforeEach(() => {
      storage = new InMemoryPKCEStorage();
    });

    it('should store and retrieve a code challenge', async () => {
      const challenge = 'test-challenge';
      const verifier = 'test-verifier';
      const expiresAt = Date.now() + 3600000; // 1 hour from now

      await storage.storeChallenge(challenge, verifier, expiresAt);
      const retrievedVerifier = await storage.retrieveAndDeleteChallenge(challenge);

      expect(retrievedVerifier).toBe(verifier);
    });

    it('should return null for non-existent challenge', async () => {
      const retrievedVerifier = await storage.retrieveAndDeleteChallenge('non-existent');
      expect(retrievedVerifier).toBeNull();
    });

    it('should return null for expired challenge', async () => {
      const challenge = 'expired-challenge';
      const verifier = 'expired-verifier';
      const expiresAt = Date.now() - 1000; // 1 second ago (already expired)

      await storage.storeChallenge(challenge, verifier, expiresAt);
      const retrievedVerifier = await storage.retrieveAndDeleteChallenge(challenge);

      expect(retrievedVerifier).toBeNull();
    });

    it('should only allow retrieval once (challenge is deleted after retrieval)', async () => {
      const challenge = 'single-use-challenge';
      const verifier = 'single-use-verifier';
      const expiresAt = Date.now() + 3600000; // 1 hour from now

      await storage.storeChallenge(challenge, verifier, expiresAt);
      
      // First retrieval should succeed
      const firstRetrieval = await storage.retrieveAndDeleteChallenge(challenge);
      expect(firstRetrieval).toBe(verifier);
      
      // Second retrieval should return null since it was deleted
      const secondRetrieval = await storage.retrieveAndDeleteChallenge(challenge);
      expect(secondRetrieval).toBeNull();
    });
  });
});