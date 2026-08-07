/**
 * Global vitest setup (wired via setupFiles in vitest.config.ts).
 *
 * Migrates the test database once, truncates all domain tables before every
 * test, and closes the pool when the run ends. Tests run serially
 * (singleFork) so the shared database never sees concurrent truncation.
 */
import { beforeAll, beforeEach, afterAll } from 'vitest';
import { migrateTestDb, truncateAll, closeDb, getTestDb } from './helpers/db';
import { AuditService } from '../src/services/security/audit';

beforeAll(async () => {
  await migrateTestDb();
  // The AuditService singleton survives across test files (single fork);
  // re-attach the current pool so it never points at a closed one.
  AuditService.getInstance().attachDatabase(getTestDb().db);
});

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await closeDb();
});
