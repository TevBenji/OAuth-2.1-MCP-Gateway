/**
 * Node.js entry point: builds the environment, starts the HTTP server, and
 * runs the hourly cleanup of expired codes, tokens, and sessions.
 */
import { serve } from '@hono/node-server';
import { createDb, runMigrations } from '@oauth-mcp-gateway/db';
import app from './index';
import { loadConfig } from './config';
import { auditService } from './services/security/audit';
import { MemoryKV } from './lib/memory-kv';
import { PgSessionStorage } from './storage/pg-session-storage';
import { PgAuthorizationCodeStorage } from './storage/pg-authorization-code-storage';
import { PgRefreshTokenStorage } from './storage/pg-refresh-token-storage';
import type { Bindings } from './types/bindings';

const config = loadConfig();
const { db } = createDb(config.DATABASE_URL);
await runMigrations(db);
auditService.attachDatabase(db);

const env: Bindings = {
  ENVIRONMENT: config.ENVIRONMENT,
  JWT_ISSUER: config.JWT_ISSUER,
  JWT_SECRET: config.JWT_SECRET,
  TENANT_ID: config.TENANT_ID,
  CORS_ORIGINS: config.CORS_ORIGINS,
  ADMIN_TOKEN: config.ADMIN_TOKEN,
  DB: db,
  SESSIONS: new PgSessionStorage(db),
  CACHE: new MemoryKV(),
};

serve({ fetch: req => app.fetch(req, env), port: config.PORT }, info => {
  console.log(`oauth-mcp-gateway listening on :${info.port} (${config.ENVIRONMENT})`);
});

async function cleanupExpired(): Promise<void> {
  try {
    const codes = await new PgAuthorizationCodeStorage(db).cleanupExpiredCodes();
    const tokens = await new PgRefreshTokenStorage(db).cleanupExpiredTokens();
    const sessions = await new PgSessionStorage(db).cleanupExpiredSessions();
    if (codes || tokens || sessions) {
      console.log(`cleanup: ${codes} codes, ${tokens} tokens, ${sessions} sessions removed`);
    }
  } catch (error) {
    console.error('cleanup failed:', error);
  }
}

setInterval(cleanupExpired, 60 * 60 * 1000);
void cleanupExpired();
