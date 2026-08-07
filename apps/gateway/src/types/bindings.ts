/**
 * Per-request environment passed to Hono via `app.fetch(request, env)`.
 *
 * In production this is built once at startup (see server.ts); tests build
 * lightweight fakes of the same shape.
 */
import type { Db } from '@oauth-mcp-gateway/db';
import type { SessionStorage } from './session';
import type { KVLike } from '../lib/memory-kv';

export interface Bindings {
  ENVIRONMENT: 'development' | 'staging' | 'production';
  JWT_ISSUER: string;
  JWT_SECRET: string;
  JWT_ALGORITHM?: string;
  TENANT_ID?: string;
  CORS_ORIGINS: string;
  /** Bearer token protecting /admin/api/* */
  ADMIN_TOKEN?: string;

  DB: Db;
  SESSIONS: SessionStorage;
  CACHE: KVLike;

  // Index signature for Hono compatibility
  [key: string]: unknown;
}
