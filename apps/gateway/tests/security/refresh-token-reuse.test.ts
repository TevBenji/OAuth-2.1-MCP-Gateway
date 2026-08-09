/**
 * Refresh-token rotation and reuse detection (RFC 9700 family revocation).
 *
 * Rotation keeps rotated rows around as a tripwire: presenting one again
 * revokes the entire family, so a thief's rotated chain dies with it.
 */

import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { refreshTokens } from '@oauth-mcp-gateway/db';
import app from '../../src/index';
import { AuditService } from '../../src/services/security/audit';
import { PgRefreshTokenStorage } from '../../src/storage/pg-refresh-token-storage';
import { makeTestEnv } from '../helpers/env';
import { getTestDb } from '../helpers/db';
import { form, completeOAuthFlow, registerTestClient } from '../helpers/oauth';

const testEnv = makeTestEnv();

const refresh = (refreshToken: string, clientId: string) =>
  app.request(
    '/oauth/token',
    form({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId }),
    testEnv
  );

const allRows = () => getTestDb().db.select().from(refreshTokens);

describe('Refresh token rotation families', () => {
  it('keeps one family across a chain of rotations', async () => {
    const flow = await completeOAuthFlow(testEnv);

    let current = flow.refresh_token!;
    for (let i = 0; i < 3; i++) {
      const res = await refresh(current, flow.client.client_id);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.refresh_token).toBeDefined();
      expect(body.refresh_token).not.toBe(current);
      current = body.refresh_token;
    }

    const rows = await allRows();
    expect(rows).toHaveLength(4); // original + 3 children
    const families = new Set(rows.map(r => r.familyId));
    expect(families.size).toBe(1);
    expect(rows.filter(r => r.status === 'rotated')).toHaveLength(3);
    expect(rows.filter(r => r.status === 'active')).toHaveLength(1);
    // each rotated row links to the child it was rotated into
    for (const row of rows.filter(r => r.status === 'rotated')) {
      expect(rows.some(r => r.tokenId === row.rotatedTo)).toBe(true);
    }
  });

  it('revokes the whole family, including the newest token, on replay of a rotated token', async () => {
    const flow = await completeOAuthFlow(testEnv);
    const stolen = flow.refresh_token!;

    // Legitimate rotation: stolen token becomes 'rotated', child is active
    const first = await refresh(stolen, flow.client.client_id);
    expect(first.status).toBe(200);
    const child = (await first.json()).refresh_token as string;

    // Replay of the rotated token: reuse detected
    const replay = await refresh(stolen, flow.client.client_id);
    expect(replay.status).toBe(400);
    expect((await replay.json()).error).toBe('invalid_grant');

    // Every row in the family is revoked — the newest token dies too
    const rows = await allRows();
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every(r => r.status === 'revoked')).toBe(true);

    // ...so the descendant no longer works
    const useChild = await refresh(child, flow.client.client_id);
    expect(useChild.status).toBe(400);
    expect((await useChild.json()).error).toBe('invalid_grant');

    // and the incident left a security audit event
    const logs = await AuditService.getInstance().queryLogs({
      tenantId: 'default',
      event: 'security.suspicious.activity',
    });
    expect(logs.totalCount).toBeGreaterThan(0);
  });

  it('rejects an unknown token without touching existing families', async () => {
    const flow = await completeOAuthFlow(testEnv);

    const res = await refresh('refresh_00000000000000000000000000000000', flow.client.client_id);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_grant');

    const rows = await allRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.status).toBe('active');
  });

  it('markRotated is atomic: only the first rotation of a token wins', async () => {
    const client = await registerTestClient(testEnv);
    const storage = new PgRefreshTokenStorage(getTestDb().db);
    await storage.storeRefreshToken('rt-race', 'at', client.client_id, 'user-1', ['s'], Date.now() + 60_000, {
      tokenId: 'parent-id',
    });

    expect(await storage.markRotated('parent-id', 'child-a')).toBe(true);
    expect(await storage.markRotated('parent-id', 'child-b')).toBe(false);
  });

  it('prunes only terminal expired rows', async () => {
    const client = await registerTestClient(testEnv);
    const storage = new PgRefreshTokenStorage(getTestDb().db);
    const { db } = getTestDb();
    const past = Date.now() - 1000;
    const future = Date.now() + 60_000;

    const seed = async (id: string, status: 'active' | 'rotated' | 'revoked', expiresAt: number) => {
      await storage.storeRefreshToken(`rt-${id}`, 'at', client.client_id, 'user-1', ['s'], expiresAt, {
        tokenId: id,
      });
      await db.update(refreshTokens).set({ status }).where(eq(refreshTokens.tokenId, id));
    };

    await seed('rotated-expired', 'rotated', past);
    await seed('revoked-expired', 'revoked', past);
    await seed('rotated-live', 'rotated', future);
    await seed('active-expired', 'active', past);
    await seed('active-live', 'active', future);

    expect(await storage.cleanupExpiredTokens()).toBe(2);

    const remaining = (await allRows()).map(r => r.tokenId).sort();
    expect(remaining).toEqual(['active-expired', 'active-live', 'rotated-live']);
  });
});
