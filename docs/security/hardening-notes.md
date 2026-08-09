# Security hardening notes (sec/hardening-v1)

Patched on this branch: header-derived tenant on DCR removed; addAuthHeaders defaults to false; inbound identity headers stripped before injection; access-token TTL lowered to 15 minutes; rate-limiter docs made honest. Remaining items below are designed here and belong in a local dev loop with tests, because they touch schema and storage interfaces.

## 1. Refresh-token reuse detection (family revocation, RFC 9700)
Current behavior deletes a refresh token on use; a replayed (stolen, already-rotated) token is indistinguishable from a never-issued one, so the thief's rotated chain survives while the victim sees invalid_grant.
Plan: stop deleting on rotation. Schema: add `family_id UUID` and `status TEXT CHECK (status IN ('active','rotated','revoked'))` to refresh tokens; a family is created at authorization-code exchange and inherited on every rotation. Handler logic on presentation: status=active -> rotate normally (mark rotated, issue child in same family); status=rotated -> REUSE DETECTED -> set every token in the family to revoked, log a security event, return invalid_grant; unknown -> invalid_grant. Prune terminal-status rows past REFRESH_TOKEN_LIFETIME. The vestigial `rotatedRefreshToken?` field in pg-refresh-token-storage.ts becomes the rotation linkage. Tests: replay-after-rotation kills the whole family; legitimate double-submit race (client retry within a small grace window) documented as accepted invalid_grant or handled with a 10s reuse-grace on the immediate parent only.

## 2. Gateway->upstream context authentication
Identity headers are now stripped inbound, but an upstream reachable directly still trusts bare headers. Options, pick one: (a) hard requirement in docs: upstreams bind to a private network reachable only by the gateway; (b) HMAC: per-upstream shared secret, header `X-Gateway-Signature: v1=HMAC_SHA256(secret, tenant|user|client|scopes|ts)` plus `X-Gateway-Ts`, upstream rejects skew > 60s and bad MACs. (b) composes with (a); implement in MCPProxyService.buildHeaders and ship a 20-line verification snippet for upstream authors.

## 3. Postgres-backed RateLimitStorage
Single UPSERT token-bucket per (key, window): `INSERT ... ON CONFLICT DO UPDATE SET count = ..., window_start = ... RETURNING count` keeps it one round trip and race-safe; IP blocks in a `rate_limit_blocks` table checked in the same query or a cheap second indexed lookup; prune expired windows on a timer. Keep the memory implementation for single-instance dev; select backend via env. Update README's rate-limiting claim once this lands.

## 4. Access-token revocation (post-TTL-reduction)
15-minute TTL bounds damage but is not revocation. If/when needed: `revoked_jti(jti, exp)` table, middleware does an indexed lookup per request (or a 30s in-process negative cache), rows pruned past exp.
