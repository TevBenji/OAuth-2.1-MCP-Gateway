# Hardening report — `sec/hardening-v1`

Scope of this pass: validate the five unreviewed hardening commits already on the branch (A0), then implement notes §1–§3 with tests (A1–A3). §4 stays design by decision. Design record: `docs/security/hardening-notes.md` (all shipped items in its **Completed** section). A0 validation ran first in a parallel session (`30b12cb`…`40ef689`); this session verified that work and built §1–§3 on top.

## Commits added

| Group | Commits |
|---|---|
| A0 validate | `30b12cb` `1f26bab` `92ae9d5` test fallout fixes + invariant lock; `f3f3de6` registration ignores `X-Tenant-ID` (asserts server-side tenant wins); `48516c2` CORS allow-lists drop `X-Tenant-ID`; `7f8db22` stale 3600s constants → 900s; `5fb1919` docs examples |
| §1 family revocation | `4a987cd` schema (`family_id`, `status`, `rotated_to`, backfill = own family); `e857ef2` rotate/reuse-detect/revoke-family handler + storage; `9171916` tests; `21aa906` notes |
| §2 upstream HMAC | `9592020` opt-in signing (`X-Gateway-Ts`, `X-Gateway-Signature: v1=…`), secrets via `UPSTREAM_HMAC_SECRETS` env; `8109bcd` `docs/security/upstream-verification.md`; `d98cd87` pinned vector + smuggle tests; `871ca6c` notes |
| §3 PG rate limits | `e147f39` `rate_limit_windows`/`rate_limit_blocks` tables; `c96e097` one-upsert storage, `RATE_LIMIT_STORAGE` env select, hourly prune; `9646572` tests; `092bdd9` README + notes |

## Test counts

| | Files | Tests |
|---|---|---|
| Before this pass | 26 passed / 2 failed (28) | 417 passed / **5 failed** (422) |
| After | **31 passed (31)** | **439 passed (439)** |

`pnpm build` clean (tsc + Next). `pnpm lint`: 0 errors, 46 pre-existing unused-import warnings.

## Deviations from the brief / notes doc, with reasoning

1. **§1 `status` is a typed text column, not a SQL CHECK** — the schema has no CHECK constraints anywhere; repo convention wins per the brief's own style rule.
2. **§1 expired-but-rotated tokens return plain `invalid_grant` without family revocation** — expiry is checked before status, so a replay of an *expired* rotated token is treated as unknown. Children expire at ~the same time, and prune deletes these rows anyway.
3. **§2 secrets live in an env JSON map, not the registry** — registry rows flow out through `/admin/api/*` to the dashboard; env keeps secrets server-side. The brief allowed either.
4. **§2 signing happens in `forwardRequest` immediately after `buildRequestHeaders`** (same request, same headers object) because HMAC via WebCrypto is async and `buildRequestHeaders` is sync.
5. **§2 no in-repo verification helper** — the 60s-skew verifier ships as a documented snippet only, so the skew-window test the brief conditions on an in-repo helper does not apply; the signature format itself is pinned by a hard-coded vector test.
6. **§3 `get(key)` reports the busiest live window** — the storage interface's `get` has no window parameter; the memory backend has a single counter per key, the PG backend may have several.
7. **A0 leftovers landed as `security:` commits, not `test:`/`docs:`** (CORS allow-list, stale constants) — they touch `src/`, so the prefixes stay honest.
8. **Race policy (§1): no grace window** — recorded in the notes doc as an accepted trade-off; `markRotated` is a conditional UPDATE, so a double-submit loses atomically and re-authenticates.

## Deliberately left open

- **§4 jti denylist** — design only, per the brief.
- **Multi-tenant DCR** — registration is now single-tenant (`TENANT_ID` env); callers that relied on `X-Tenant-ID` have no replacement path. Correct security outcome, but call it out in the PR description.
- **HMAC key rotation** — v1 has no key id; rotating means updating both ends (noted in the verification doc).

## Verify locally before merging

```bash
docker compose up -d postgres        # tests need postgres://gateway:gateway@localhost:5432/gateway
pnpm install
pnpm build                           # expect: clean
pnpm -r test                         # expect: 31 files, 439 tests, all passing
```

Spot-check the invariants are load-bearing (each should fail the suite):
flip `addAuthHeaders` back to `?? true` in `services/mcp/proxy.ts`, or raise
`ACCESS_TOKEN_LIFETIME` above 900, or replace `revokeFamily` in the rotated
branch of `handlers/oauth/token.ts` with a plain `invalid_grant`.
