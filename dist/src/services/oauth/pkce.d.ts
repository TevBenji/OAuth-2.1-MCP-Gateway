/**
 * PKCE (Proof Key for Code Exchange) Service
 *
 * Implementation of RFC 7636 PKCE for OAuth 2.1 security.
 * Provides code challenge/verifier generation and validation.
 */
import type { PKCEChallenge } from '@/types/oauth';
/**
 * Generate PKCE challenge/verifier pair
 */
export declare function generatePKCE(): Promise<PKCEChallenge>;
/**
 * Validate PKCE verifier against challenge
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
