/**
 * Test Setup and Configuration
 *
 * Global test setup for Vitest with Cloudflare Workers environment
 * and common test utilities.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import type { Bindings } from '@/types/bindings';

// Mock Cloudflare Workers environment
export const mockEnv: Bindings = {
  SESSIONS: {} as KVNamespace,
  CACHE: {} as KVNamespace,
  RATE_LIMIT_KV: {} as KVNamespace,
  RATE_LIMIT: {} as KVNamespace,
  DB: {} as D1Database,
  ENVIRONMENT: 'development',
  JWT_ISSUER: 'https://test.oauth-mcp-gateway.com',
  CORS_ORIGINS: 'http://localhost:3000,https://test.example.com',
};

// Mock KV Namespace
class MockKVNamespace {
  public store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(): Promise<{
    keys: { name: string }[];
    list_complete: boolean;
    cacheStatus: string | null;
  }> {
    return {
      keys: Array.from(this.store.keys()).map(name => ({ name })),
      list_complete: true,
      cacheStatus: null,
    };
  }

  // Implement other KV methods as needed
  getWithMetadata = async () => ({ value: null, metadata: null, cacheStatus: null });
  putWithMetadata = async () => {};
}

// Mock D1 Database
class MockD1Database {
  prepare(query: string): D1PreparedStatement {
    return new MockD1PreparedStatement(query) as any;
  }

  async dump(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    return statements.map(() => ({
      success: true,
      results: [] as T[],
      meta: {
        duration: 0,
        size_after: 0,
        rows_read: 0,
        rows_written: 0,
        last_row_id: 0,
        changed_db: false,
        changes: 0,
      },
    }));
  }

  async exec(query: string): Promise<D1ExecResult> {
    return {
      count: 0,
      duration: 0,
    };
  }

  withSession<T>(callback: (db: D1Database) => Promise<T>): Promise<T> {
    return callback(this as any);
  }
}

class MockD1PreparedStatement {
  constructor(private query: string) {}

  bind(...values: any[]): D1PreparedStatement {
    return this as any;
  }

  async first<T = unknown>(): Promise<T | null> {
    return null;
  }

  async run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return {
      success: true,
      results: [] as T[],
      meta: {
        duration: 0,
        size_after: 0,
        rows_read: 0,
        rows_written: 0,
        last_row_id: 0,
        changed_db: false,
        changes: 0,
      },
    };
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    return {
      success: true,
      results: [] as T[],
      meta: {
        duration: 0,
        size_after: 0,
        rows_read: 0,
        rows_written: 0,
        last_row_id: 0,
        changed_db: false,
        changes: 0,
      },
    };
  }

  async raw<T = unknown[]>(options?: { columnNames?: boolean }): Promise<T[]> {
    return [] as T[];
  }
}

// Setup mock environment
beforeAll(() => {
  // Initialize mock KV namespaces
  mockEnv.SESSIONS = new MockKVNamespace() as any;
  mockEnv.CACHE = new MockKVNamespace() as any;
  mockEnv.RATE_LIMIT_KV = new MockKVNamespace() as any;
  mockEnv.RATE_LIMIT = new MockKVNamespace() as any;
  mockEnv.DB = new MockD1Database() as any;
});

// Clean up after each test
afterEach(async () => {
  // Clear KV stores
  const sessionStore = mockEnv.SESSIONS as any;
  const cacheStore = mockEnv.CACHE as any;
  const rateLimitStore = mockEnv.RATE_LIMIT_KV as any;
  const rateLimitStore2 = mockEnv.RATE_LIMIT as any;

  // Clear the internal stores
  sessionStore.store.clear();
  cacheStore.store.clear();
  rateLimitStore.store.clear();
  rateLimitStore2.store.clear();
});

// Test utilities
export const testUtils = {
  /**
   * Generate a mock JWT token for testing
   */
  generateMockJWT: (payload: Record<string, any> = {}) => {
    const header = { alg: 'RS256', typ: 'JWT' };
    const defaultPayload = {
      iss: 'https://test.oauth-mcp-gateway.com',
      sub: 'test-user-123',
      aud: 'mcp://test-server',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      tenant_id: 'test-tenant-123',
      scope: 'mcp:tools:read mcp:resources:read',
      ...payload,
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
      code_challenge_method: 'S256' as const,
    };
  },

  /**
   * Create a mock HTTP request
   */
  createMockRequest: (
    options: {
      method?: string;
      url?: string;
      headers?: Record<string, string>;
      body?: string;
    } = {}
  ) => {
    const {
      method = 'GET',
      url = 'https://test.oauth-mcp-gateway.com/',
      headers = {},
      body,
    } = options;

    return new Request(url, {
      method,
      headers: new Headers(headers),
      body: body || null,
    });
  },

  /**
   * Wait for a specified number of milliseconds
   */
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};
