/**
 * PKCE (Proof Key for Code Exchange) Service
 *
 * Implementation of RFC 7636 PKCE for OAuth 2.1 security.
 * Provides code challenge/verifier generation and validation.
 */
/**
 * Generate a cryptographically secure random string for PKCE code verifier
 */
export function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    // Convert to base64url encoding
    let binary = '';
    for (let i = 0; i < array.length; i++) {
        const byte = array[i];
        if (byte !== undefined) {
            binary += String.fromCharCode(byte);
        }
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
/**
 * Generate SHA256 hash and encode as base64url (also exported as createS256CodeChallenge)
 */
export async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    // Convert ArrayBuffer to base64url
    const bytes = new Uint8Array(hash);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        if (byte !== undefined) {
            binary += String.fromCharCode(byte);
        }
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
/**
 * Generate PKCE challenge/verifier pair
 */
export async function generatePKCE() {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await sha256(codeVerifier);
    return {
        code_verifier: codeVerifier,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
    };
}
/**
 * Alias for sha256 - creates S256 code challenge from verifier
 */
export const createS256CodeChallenge = sha256;
/**
 * Constant-time string comparison to prevent timing attacks
 *
 * Security: This prevents attackers from using timing differences to guess
 * the PKCE challenge character by character.
 */
export function constantTimeCompare(a, b) {
    // If lengths differ, still perform comparison to prevent timing leak
    const aLen = a.length;
    const bLen = b.length;
    // Ensure we compare the full length (use the longer string's length)
    const maxLen = Math.max(aLen, bLen);
    let result = aLen === bLen ? 0 : 1;
    for (let i = 0; i < maxLen; i++) {
        const aChar = i < aLen ? a.charCodeAt(i) : 0;
        const bChar = i < bLen ? b.charCodeAt(i) : 0;
        result |= aChar ^ bChar;
    }
    return result === 0;
}
/**
 * Validate PKCE verifier against challenge
 *
 * Security Enhancements:
 * - Uses constant-time comparison to prevent timing attacks
 * - Validates format before comparison
 * - Only supports S256 method (most secure)
 */
export async function validatePKCE(codeVerifier, codeChallenge, method = 'S256') {
    if (method !== 'S256') {
        throw new Error('Only S256 PKCE method is supported');
    }
    if (!codeVerifier || !codeChallenge) {
        return false;
    }
    // Validate code verifier format (base64url, 43-128 characters)
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
        return false;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(codeVerifier)) {
        return false;
    }
    try {
        const expectedChallenge = await sha256(codeVerifier);
        // SECURITY FIX: Use constant-time comparison to prevent timing attacks
        return constantTimeCompare(expectedChallenge, codeChallenge);
    }
    catch {
        return false;
    }
}
/**
 * Validate code verifier format according to RFC 7636
 */
export function isValidCodeVerifier(codeVerifier) {
    // Must be 43-128 characters long
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
        return false;
    }
    // Must contain only unreserved characters: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
    // Note: We use base64url encoding which uses [A-Za-z0-9_-]
    return /^[A-Za-z0-9_-]+$/.test(codeVerifier);
}
/**
 * Validate code challenge format
 */
export function isValidCodeChallenge(codeChallenge) {
    // SHA256 hash encoded as base64url should be 43 characters
    if (codeChallenge.length !== 43) {
        return false;
    }
    // Must contain only base64url characters
    return /^[A-Za-z0-9_-]+$/.test(codeChallenge);
}
/**
 * In-memory PKCE storage for development/testing
 * In production, this should be replaced with a persistent storage solution
 */
export class InMemoryPKCEStorage {
    storage = new Map();
    async store(code, verifier, challenge) {
        this.storage.set(code, { verifier, challenge, timestamp: Date.now() });
    }
    async get(code) {
        const entry = this.storage.get(code);
        if (!entry)
            return null;
        // Clean up entry after retrieval
        this.storage.delete(code);
        return { verifier: entry.verifier, challenge: entry.challenge };
    }
    async cleanup(maxAge = 600000) {
        const now = Date.now();
        for (const [code, entry] of this.storage.entries()) {
            if (now - entry.timestamp > maxAge) {
                this.storage.delete(code);
            }
        }
    }
}
