/**
 * Test Setup and Configuration
 *
 * Global test setup for Vitest with Cloudflare Workers environment
 * and common test utilities.
 */
import { beforeAll, afterEach } from 'vitest';
// Mock Cloudflare Workers environment
export const mockEnv = {
    SESSIONS: {},
    CACHE: {},
    DB: {},
    ENVIRONMENT: 'development',
    JWT_ISSUER: 'https://test.oauth-mcp-gateway.com',
    CORS_ORIGINS: 'http://localhost:3000,https://test.example.com'
};
// Mock KV Namespace
class MockKVNamespace {
    store = new Map();
    async get(key) {
        return this.store.get(key) || null;
    }
    async put(key, value) {
        this.store.set(key, value);
    }
    async delete(key) {
        this.store.delete(key);
    }
    async list() {
        return {
            keys: Array.from(this.store.keys()).map(name => ({ name })),
            list_complete: true,
            cacheStatus: null
        };
    }
    // Implement other KV methods as needed
    getWithMetadata = async () => ({ value: null, metadata: null, cacheStatus: null });
    putWithMetadata = async () => { };
}
// Mock D1 Database
class MockD1Database {
    prepare(query) {
        return new MockD1PreparedStatement(query);
    }
    async dump() {
        return new ArrayBuffer(0);
    }
    async batch(statements) {
        return statements.map(() => ({
            success: true,
            results: [],
            meta: {
                duration: 0,
                size_after: 0,
                rows_read: 0,
                rows_written: 0,
                last_row_id: 0,
                changed_db: false,
                changes: 0
            }
        }));
    }
    async exec(query) {
        return {
            count: 0,
            duration: 0
        };
    }
    withSession(callback) {
        return callback(this);
    }
}
class MockD1PreparedStatement {
    query;
    constructor(query) {
        this.query = query;
    }
    bind(...values) {
        return this;
    }
    async first() {
        return null;
    }
    async run() {
        return {
            success: true,
            results: [],
            meta: {
                duration: 0,
                size_after: 0,
                rows_read: 0,
                rows_written: 0,
                last_row_id: 0,
                changed_db: false,
                changes: 0
            }
        };
    }
    async all() {
        return {
            success: true,
            results: [],
            meta: {
                duration: 0,
                size_after: 0,
                rows_read: 0,
                rows_written: 0,
                last_row_id: 0,
                changed_db: false,
                changes: 0
            }
        };
    }
    async raw(options) {
        return [];
    }
}
// Setup mock environment
beforeAll(() => {
    // Initialize mock KV namespaces
    mockEnv.SESSIONS = new MockKVNamespace();
    mockEnv.CACHE = new MockKVNamespace();
    mockEnv.DB = new MockD1Database();
});
// Clean up after each test
afterEach(async () => {
    // Clear KV stores
    const sessionStore = mockEnv.SESSIONS;
    const cacheStore = mockEnv.CACHE;
    // Clear the internal stores
    sessionStore.store.clear();
    cacheStore.store.clear();
});
// Test utilities
export const testUtils = {
    /**
     * Generate a mock JWT token for testing
     */
    generateMockJWT: (payload = {}) => {
        const header = { alg: 'RS256', typ: 'JWT' };
        const defaultPayload = {
            iss: 'https://test.oauth-mcp-gateway.com',
            sub: 'test-user-123',
            aud: 'mcp://test-server',
            exp: Math.floor(Date.now() / 1000) + 3600,
            iat: Math.floor(Date.now() / 1000),
            tenant_id: 'test-tenant-123',
            scope: 'mcp:tools:read mcp:resources:read',
            ...payload
        };
        // Simple base64 encoding for testing (not cryptographically secure)
        const encodedHeader = btoa(JSON.stringify(header));
        const encodedPayload = btoa(JSON.stringify(defaultPayload));
        const signature = 'mock-signature';
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    },
    /**
     * Generate a mock PKCE challenge/verifier pair
     */
    generateMockPKCE: () => {
        const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
        const codeChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
        return {
            code_verifier: codeVerifier,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        };
    },
    /**
     * Create a mock HTTP request
     */
    createMockRequest: (options = {}) => {
        const { method = 'GET', url = 'https://test.oauth-mcp-gateway.com/', headers = {}, body } = options;
        return new Request(url, {
            method,
            headers: new Headers(headers),
            body: body || null
        });
    },
    /**
     * Wait for a specified number of milliseconds
     */
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};
