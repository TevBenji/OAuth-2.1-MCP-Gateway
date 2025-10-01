/**
 * Test Setup and Configuration
 *
 * Global test setup for Vitest with Cloudflare Workers environment
 * and common test utilities.
 */
import type { Bindings } from '@/types/bindings';
export declare const mockEnv: Bindings;
export declare const testUtils: {
    /**
     * Generate a mock JWT token for testing
     */
    generateMockJWT: (payload?: Record<string, any>) => string;
    /**
     * Generate a mock PKCE challenge/verifier pair
     */
    generateMockPKCE: () => {
        code_verifier: string;
        code_challenge: string;
        code_challenge_method: "S256";
    };
    /**
     * Create a mock HTTP request
     */
    createMockRequest: (options?: {
        method?: string;
        url?: string;
        headers?: Record<string, string>;
        body?: string;
    }) => Request<unknown, CfProperties<unknown>>;
    /**
     * Wait for a specified number of milliseconds
     */
    sleep: (ms: number) => Promise<unknown>;
};
