# Security hardening notes (sec/hardening-v1)

Patched on this branch: header-derived tenant on DCR removed; addAuthHeaders defaults to false; inbound identity headers stripped before injection; access-token TTL lowered to 15 minutes; rate-limiter docs made honest. Remaining items below are designed here and belong in a local dev loop with tests, because they touch schema and storage interfaces.

## Completed

- **Tenant is server-side on DCR.** `/oauth/register` derives the tenant from `c.env.TENANT_ID`, never from the client-supplied `X-Tenant-ID` header, which is also gone from the CORS preflight allow-list. — `633dbef`
- **Gateway terminates auth.** `addAuthHeaders` defaults to false, so the client's bearer token is not forwarded upstream; `X-Tenant-ID`/`X-User-ID`/`X-Client-ID`/`X-Session-ID`/`X-Device-ID`/`X-OAuth-Scopes` are stripped from the inbound request before the gateway injects its own. — `3d81d8b`
- **Access-token TTL is 900s.** Lowered from 3600s because no revocation path exists; the end-to-end test now asserts `JWT_CONFIG.ACCESS_TOKEN_LIFETIME` and a `<= 900` ceiling instead of a literal, so raising it fails the suite. — `89b8598`, `1f26bab`
- **Rate-limiter docs are honest.** The header states the shipped backend is in-memory and single-instance. — `f6286d1`
- **Suite is green against all of the above, with none of it weakened.** The MCP test upstream authenticates on the gateway's injected context instead of a forwarded bearer (§2 option (a) applied to the fixture only, not to the product), and a regression test locks the two proxy invariants: no bearer upstream, smuggled identity headers replaced by token-derived values. — `30b12cb`, `92ae9d5`
- **§1 Refresh-token reuse detection (family revocation, RFC 9700).** Rotation no longer deletes: `refresh_tokens` gained `family_id`, `status` (active | rotated | revoked), and a `rotated_to` linkage; presenting a rotated token revokes the entire family, emits a `security.suspicious.activity` audit event, and returns invalid_grant; the hourly cleanup prunes only terminal expired rows. **Accepted trade-off: no reuse-grace window in v1** — a legitimate client double-submit loses the race, gets invalid_grant (the family is revoked), and re-authenticates; `markRotated` is a conditional UPDATE so the race is decided atomically in the database.
- **§2 Gateway->upstream context authentication (HMAC, option b — composing with a).** Opt-in per upstream via `UPSTREAM_HMAC_SECRETS` (env JSON map keyed by server_id or resource_identifier; env rather than the registry so secrets never flow through the admin API). Configured upstreams get `X-Gateway-Ts` plus `X-Gateway-Signature: v1=HMAC_SHA256(secret, tenant|user|client|scopes|ts)`; both headers are also stripped inbound so they cannot be smuggled. Verification snippet with 60s skew rejection and constant-time compare, plus the network-isolation baseline, in `docs/security/upstream-verification.md`. No secret configured -> behavior unchanged.

Sections 3–4 below are still design only; nothing in them has shipped.

## 2. Gateway->upstream context authentication
Identity headers are now stripped inbound, but an upstream reachable directly still trusts bare headers. Options, pick one: (a) hard requirement in docs: upstreams bind to a private network reachable only by the gateway; (b) HMAC: per-upstream shared secret, header `X-Gateway-Signature: v1=HMAC_SHA256(secret, tenant|user|client|scopes|ts)` plus `X-Gateway-Ts`, upstream rejects skew > 60s and bad MACs. (b) composes with (a); implement in MCPProxyService.buildHeaders and ship a 20-line verification snippet for upstream authors.

## 3. Postgres-backed RateLimitStorage
Single UPSERT token-bucket per (key, window): `INSERT ... ON CONFLICT DO UPDATE SET count = ..., window_start = ... RETURNING count` keeps it one round trip and race-safe; IP blocks in a `rate_limit_blocks` table checked in the same query or a cheap second indexed lookup; prune expired windows on a timer. Keep the memory implementation for single-instance dev; select backend via env. Update README's rate-limiting claim once this lands.

## 4. Access-token revocation (post-TTL-reduction)
15-minute TTL bounds damage but is not revocation. If/when needed: `revoked_jti(jti, exp)` table, middleware does an indexed lookup per request (or a 30s in-process negative cache), rows pruned past exp.
