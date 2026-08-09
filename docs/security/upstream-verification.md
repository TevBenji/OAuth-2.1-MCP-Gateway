# Verifying gateway-injected context on your MCP server

The gateway strips inbound identity headers and injects its own
(`X-Tenant-ID`, `X-User-ID`, `X-Client-ID`, `X-OAuth-Scopes`, ...). An
upstream that is reachable from anywhere cannot tell those headers came from
the gateway. Two defenses, which compose:

## Option A — network isolation

Bind your MCP server to a private network (or localhost / a compose-internal
network) reachable **only** by the gateway. If nothing but the gateway can
connect, bare headers are trustworthy and you need nothing below. This is the
recommended baseline even when signing is enabled.

## Option B — HMAC signature verification

Give the gateway a shared secret for your server
(`UPSTREAM_HMAC_SECRETS={"<server_id or resource_identifier>":"<secret>"}`).
Every proxied request then carries:

- `X-Gateway-Ts` — unix seconds when the request was signed
- `X-Gateway-Signature` — `v1=` + hex HMAC-SHA256 over the exact string
  `tenant|user|client|scopes|ts` (scopes space-joined, fields from the
  injected headers, `ts` from `X-Gateway-Ts`)

Verify with a constant-time comparison (`crypto.timingSafeEqual`, not `===`)
and reject stale timestamps:

```js
const crypto = require('node:crypto');

const SECRET = process.env.GATEWAY_SHARED_SECRET;
const MAX_SKEW_S = 60;

/** Returns true when the identity headers were signed by the gateway. */
function verifyGatewayContext(headers) {
  const ts = Number(headers['x-gateway-ts']);
  const sig = headers['x-gateway-signature'] ?? '';
  if (!Number.isFinite(ts) || !sig.startsWith('v1=')) return false;
  if (Math.abs(Date.now() / 1000 - ts) > MAX_SKEW_S) return false; // stale or future-dated

  const payload = [
    headers['x-tenant-id'] ?? '',
    headers['x-user-id'] ?? '',
    headers['x-client-id'] ?? '',
    headers['x-oauth-scopes'] ?? '',
    String(ts),
  ].join('|');

  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  const given = sig.slice(3);
  return (
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given, 'hex'), Buffer.from(expected, 'hex'))
  );
}
```

Notes:

- A missing `X-OAuth-Scopes` header means the token carried no scopes; verify
  against the empty string, as above.
- The 60s window still allows replay of an identical request within it. The
  signature authenticates *who the caller is according to the gateway*, not
  request uniqueness; idempotency is your server's concern.
- Rotate the secret by updating both ends; there is no key id in v1.
