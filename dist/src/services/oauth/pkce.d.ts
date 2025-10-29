/**
 * PKCE (Proof Key for Code Exchange) Service
 *
 * Implementation of RFC 7636 PKCE for OAuth 2.1 security.
 * Provides code challenge/verifier generation and validation.
 */
import type { PKCEChallenge } from '@/types/oauth';
/**
 * Generate a cryptographically secure random string for PKCE code verifier
 */
export declare function generateCodeVerifier(): string;
/**
 * Generate SHA256 hash and encode as base64url (also exported as createS256CodeChallenge)
 */
export declare function sha256(plain: string): Promise<string>;
/**
 * Generate PKCE challenge/verifier pair
 */
export declare function generatePKCE(): Promise<PKCEChallenge>;
/**
 * Alias for sha256 - creates S256 code challenge from verifier
 */
export declare const createS256CodeChallenge: typeof sha256;
/**
 * Constant-time string comparison to prevent timing attacks
 *
 * Security: This prevents attackers from using timing differences to guess
 * the PKCE challenge character by character.
 */
export declare function constantTimeCompare(a: string, b: string): boolean;
/**
 * Validate PKCE verifier against challenge
 *
 * Security Enhancements:
 * - Uses constant-time comparison to prevent timing attacks
 * - Validates format before comparison
 * - Only supports S256 method (most secure)
 */
export declare function validatePKCE(codeVerifier: string, codeChallenge: string, method?: string): Promise<boolean>;
/**
 * Validate code verifier format according to RFC 7636
 */
export declare function isValidCodeVerifier(codeVerifier: string): boolean;
/**
 * Validate code challenge format
 */
export declare function isValidCodeChallenge(codeChallenge: string): boolean;
/**
 * In-memory PKCE storage for development/testing
 * In production, this should be replaced with a persistent storage solution
 */
export declare class InMemoryPKCEStorage {
    private storage;
    store(code: string, verifier: string, challenge: string): Promise<void>;
    get(code: string): Promise<{
        verifier: string;
        challenge: string;
    } | null>;
    cleanup(maxAge?: number): Promise<void>;
}
