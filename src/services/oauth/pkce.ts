/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.1
 * Implements RFC 7636 for public clients to secure authorization code flows
 */

/**
 * Generates a random code verifier string (43-128 characters)
 * Uses base64url encoding without padding as per RFC 7636
 */
export function generateCodeVerifier(): string {
  // Generate 32-96 bytes of randomness (which becomes 43-128 characters after base64url encoding)
  const randomBytes = new Uint8Array(32 + Math.floor(Math.random() * 64)); // 32 to 96 bytes
  crypto.getRandomValues(randomBytes);
  
  // Convert to base64url encoding
  const verifier = base64URLEncode(randomBytes);
  
  // Ensure length is within RFC 7636 requirements (43-128 characters)
  return verifier.substring(0, 128);
}

/**
 * Creates a code challenge from the code verifier using S256 method
 * @param verifier - The code verifier string
 * @returns The S256 code challenge
 */
export async function createS256CodeChallenge(verifier: string): Promise<string> {
  // Create SHA-256 hash of the verifier
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert hash to Uint8Array and encode as base64url
  const hashArray = new Uint8Array(hashBuffer);
  return base64URLEncode(hashArray);
}

/**
 * Creates a code challenge from the code verifier using plain method
 * (Not recommended, but included for completeness)
 * @param verifier - The code verifier string
 * @returns The plain code challenge
 */
export function createPlainCodeChallenge(verifier: string): string {
  // For plain method, the challenge is the same as the verifier
  return verifier;
}

/**
 * Validates a code verifier against a stored code challenge
 * @param verifier - The code verifier provided by the client
 * @param challenge - The stored code challenge
 * @param method - The challenge method ('S256' or 'plain')
 * @returns True if the verifier is valid for the challenge, false otherwise
 */
export async function validateCodeVerifier(
  verifier: string,
  challenge: string,
  method: 'S256' | 'plain'
): Promise<boolean> {
  try {
    // Validate verifier length (43-128 characters as per RFC 7636)
    if (verifier.length < 43 || verifier.length > 128) {
      return false;
    }

    // Check that verifier contains only allowed characters (base64url)
    const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
    if (!base64UrlRegex.test(verifier)) {
      return false;
    }

    // Validate based on the method
    if (method === 'S256') {
      const expectedChallenge = await createS256CodeChallenge(verifier);
      return timingSafeEqual(challenge, expectedChallenge);
    } else if (method === 'plain') {
      return timingSafeEqual(verifier, challenge);
    } else {
      throw new Error(`Unsupported code challenge method: ${method}`);
    }
  } catch (error) {
    console.error('Error validating code verifier:', error);
    return false;
  }
}

/**
 * Encodes a byte array to base64url format (no padding)
 * @param bytes - The byte array to encode
 * @returns The base64url-encoded string
 */
function base64URLEncode(bytes: Uint8Array): string {
  // Convert bytes to base64 string
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  
  // Convert to base64url by replacing + with -, / with _, and removing padding
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Performs a timing-safe string comparison to prevent timing attacks
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns True if the strings are equal, false otherwise
 */
function timingSafeEqual(a: string, b: string): boolean {
  // First check length to prevent early exit
  if (a.length !== b.length) {
    // Still perform the comparison to maintain constant time
    let result = 0;
    for (let i = 0; i < b.length; i++) {
      result |= b.charCodeAt(i);
    }
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * PKCE storage interface for code challenges
 * This can be implemented with various backends (KV, database, etc.)
 */
export interface PKCEStorage {
  /**
   * Stores a code challenge with optional expiration
   * @param challenge - The code challenge to store
   * @param verifier - The corresponding code verifier
   * @param expiresAt - When the challenge should expire (in milliseconds since epoch)
   */
  storeChallenge(challenge: string, verifier: string, expiresAt: number): Promise<void>;
  
  /**
   * Retrieves and removes a stored code challenge
   * @param challenge - The code challenge to retrieve
   * @returns The stored code verifier, or null if not found or expired
   */
  retrieveAndDeleteChallenge(challenge: string): Promise<string | null>;
}

/**
 * In-memory PKCE storage implementation (for testing/development only)
 * In production, use a persistent storage like Cloudflare KV
 */
export class InMemoryPKCEStorage implements PKCEStorage {
  private store: Map<string, { verifier: string; expiresAt: number }> = new Map();

  async storeChallenge(challenge: string, verifier: string, expiresAt: number): Promise<void> {
    this.store.set(challenge, { verifier, expiresAt });
  }

  async retrieveAndDeleteChallenge(challenge: string): Promise<string | null> {
    const entry = this.store.get(challenge);
    
    if (!entry) {
      return null;
    }
    
    // Check if the entry has expired
    if (entry.expiresAt < Date.now()) {
      this.store.delete(challenge);
      return null;
    }
    
    // Remove and return the verifier
    this.store.delete(challenge);
    return entry.verifier;
  }
}