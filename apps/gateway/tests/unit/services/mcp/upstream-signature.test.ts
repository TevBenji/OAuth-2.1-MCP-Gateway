/**
 * Pins the gateway->upstream signature format. Upstream verifiers implement
 * this byte-for-byte (docs/security/upstream-verification.md); any change
 * here is a breaking protocol change and must bump the v1= prefix.
 */

import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { signGatewayContext } from '../../../../src/services/mcp/proxy';

const context = {
  tenant_id: 'tenant-1',
  user_id: 'user-1',
  client_id: 'client-1',
  scopes: ['mcp:tools:read', 'mcp:resources:read'],
};

describe('signGatewayContext', () => {
  it('matches the pinned v1 test vector', async () => {
    // HMAC-SHA256('test-secret', 'tenant-1|user-1|client-1|mcp:tools:read mcp:resources:read|1700000000')
    expect(await signGatewayContext('test-secret', context, 1700000000)).toBe(
      '4763c85b72887b3193c5a4db47d1dd3ee0d54eb5ea0cdc742b51363b916ac1f4'
    );
  });

  it('agrees with an independent node:crypto implementation', async () => {
    const ts = 1712345678;
    const expected = createHmac('sha256', 'other-secret')
      .update('tenant-1|user-1|client-1|mcp:tools:read mcp:resources:read|1712345678')
      .digest('hex');
    expect(await signGatewayContext('other-secret', context, ts)).toBe(expected);
  });

  it('signs empty scopes as an empty field', async () => {
    const expected = createHmac('sha256', 's')
      .update('t|u|c||1')
      .digest('hex');
    expect(
      await signGatewayContext('s', { tenant_id: 't', user_id: 'u', client_id: 'c', scopes: [] }, 1)
    ).toBe(expected);
  });
});
