/**
 * PKCE Service Unit Tests
 * 
 * Test PKCE (Proof Key for Code Exchange) implementation for OAuth 2.1.
 */

import { describe, it, expect } from 'vitest';
import { 
  generatePKCE, 
  validatePKCE, 
  isValidCodeVerifier, 
  isValidCodeChallenge 
} from '@/services/oauth/pkce';

describe('PKCE Service', () => {
  describe('generatePKCE', () => {
    it('should generate valid PKCE challenge/verifier pair', async () => {
      const pkce = await generatePKCE();
      
      expect(pkce.code_verifier).toBeDefined();
      expect(pkce.code_challenge).toBeDefined();
      expect(pkce.code_challenge_method).toBe('S256');
      
      // Verify format
      expect(isValidCodeVerifier(pkce.code_verifier)).toBe(true);
      expect(isValidCodeChallenge(pkce.code_challenge)).toBe(true);
    });
    
    it('should generate unique values each time', async () => {
      const pkce1 = await generatePKCE();
      const pkce2 = await generatePKCE();
      
      expect(pkce1.code_verifier).not.toBe(pkce2.code_verifier);
      expect(pkce1.code_challenge).not.toBe(pkce2.code_challenge);
    });
    
    it('should generate code verifier with correct length', async () => {
      const pkce = await generatePKCE();
      
      expect(pkce.code_verifier.length).toBeGreaterThanOrEqual(43);
      expect(pkce.code_verifier.length).toBeLessThanOrEqual(128);
    });
    
    it('should generate code challenge with correct length', async () => {
      const pkce = await generatePKCE();
      
      // SHA256 hash encoded as base64url should be 43 characters
      expect(pkce.code_challenge.length).toBe(43);
    });
  });
  
  describe('validatePKCE', () => {
    it('should validate correct PKCE pair', async () => {
      const pkce = await generatePKCE();
      
      const isValid = await validatePKCE(
        pkce.code_verifier,
        pkce.code_challenge,
        'S256'
      );
      
      expect(isValid).toBe(true);
    });
    
    it('should reject incorrect verifier', async () => {
      const pkce = await generatePKCE();
      const wrongVerifier = 'wrong-verifier-that-does-not-match-challenge';
      
      const isValid = await validatePKCE(
        wrongVerifier,
        pkce.code_challenge,
        'S256'
      );
      
      expect(isValid).toBe(false);
    });
    
    it('should reject incorrect challenge', async () => {
      const pkce = await generatePKCE();
      const wrongChallenge = 'wrong-challenge-that-does-not-match-verifier';
      
      const isValid = await validatePKCE(
        pkce.code_verifier,
        wrongChallenge,
        'S256'
      );
      
      expect(isValid).toBe(false);
    });
    
    it('should reject empty verifier', async () => {
      const pkce = await generatePKCE();
      
      const isValid = await validatePKCE('', pkce.code_challenge, 'S256');
      
      expect(isValid).toBe(false);
    });
    
    it('should reject empty challenge', async () => {
      const pkce = await generatePKCE();
      
      const isValid = await validatePKCE(pkce.code_verifier, '', 'S256');
      
      expect(isValid).toBe(false);
    });
    
    it('should reject unsupported method', async () => {
      const pkce = await generatePKCE();
      
      await expect(
        validatePKCE(pkce.code_verifier, pkce.code_challenge, 'plain')
      ).rejects.toThrow('Only S256 PKCE method is supported');
    });
  });
  
  describe('isValidCodeVerifier', () => {
    it('should accept valid code verifier', () => {
      const validVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      
      expect(isValidCodeVerifier(validVerifier)).toBe(true);
    });
    
    it('should reject too short verifier', () => {
      const shortVerifier = 'too-short';
      
      expect(isValidCodeVerifier(shortVerifier)).toBe(false);
    });
    
    it('should reject too long verifier', () => {
      const longVerifier = 'a'.repeat(129);
      
      expect(isValidCodeVerifier(longVerifier)).toBe(false);
    });
    
    it('should reject verifier with invalid characters', () => {
      const invalidVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk!@#';
      
      expect(isValidCodeVerifier(invalidVerifier)).toBe(false);
    });
  });
  
  describe('isValidCodeChallenge', () => {
    it('should accept valid code challenge', () => {
      const validChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
      
      expect(isValidCodeChallenge(validChallenge)).toBe(true);
    });
    
    it('should reject wrong length challenge', () => {
      const wrongLengthChallenge = 'too-short';
      
      expect(isValidCodeChallenge(wrongLengthChallenge)).toBe(false);
    });
    
    it('should reject challenge with invalid characters', () => {
      const invalidChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-c!';
      
      expect(isValidCodeChallenge(invalidChallenge)).toBe(false);
    });
  });
});