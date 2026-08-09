# Hardening report — `sec/hardening-v1`

Scope of this pass: validate the five unreviewed hardening commits already on the branch, make the suite green **without weakening any of them**, and record what shipped. See `docs/security/hardening-notes.md` for the design document and its new **Completed** section.

## Commits added

| Commit | What |
|---|---|
| `30b12cb` | `test:` authenticate the MCP test upstream on injected context, not a forwarded bearer |
| `1f26bab` | `test:` assert the access-token TTL ceiling instead of the old 3600 literal |
| `92ae9d5` | `test:` lock proxy identity invariants — no bearer upstream, inbound headers stripped |
| `aefa875` | `docs:` record shipped hardening in the notes doc's Completed section |

…plus the commit adding this report.

No production behaviour changed on this pass. The only `src/` edit is a one-word comment fix in `jwt.ts` (`ACCESS_TOKEN_LIFETIME: 900` was still commented `// 1 hour in seconds`).

## Test counts

| | Files | Tests |
|---|---|---|
| Before | 26 passed / 2 failed (28) | 417 passed / **5 failed** (422) |
| After  | 28 passed (28) | **423 passed** (423) |

The +1 is the new proxy-invariant regression test. `pnpm -r type-check` passes; `pnpm -r lint` reports 0 errors / 46 warnings, all pre-existing unused-import warnings in tests.

### Why the 5 were failing

All five were fallout from `3d81d8b` (`addAuthHeaders` default → false) and `89b8598` (TTL → 900s), confirmed by checking out `441460b -- apps/gateway/src` and watching the same tests pass, then restoring.

- **4 failures**: the test upstream (`tests/helpers/real-mcp-server.ts`) 401s anything without an `Authorization: Bearer …` header. The gateway now correctly strips the client bearer, so proxied requests arrived without one and the mock's 401 was passed through. Fixed in the **fixture**, not the default: the mock now accepts *either* a bearer (for callers hitting it directly) *or* the gateway's injected `X-Tenant-ID` + `X-User-ID` context. That is §2 option (a) — upstream reachable only by the gateway — applied to a test double.
- **1 failure**: an end-to-end test asserted `expires_in === 3600`. Now asserts `JWT_CONFIG.ACCESS_TOKEN_LIFETIME` **and** `<= 900`, so raising the TTL past the ceiling fails the suite rather than silently passing.

## Deviations from the brief / notes doc

1. **The brief's Repo A item list never arrived.** The message I received contains the ground rules, a `Repo B — MCP-Warden` section (B0–B3), and the final-report instructions. There is no `Repo A` section with numbered items. I therefore did only what the ground rules explicitly require for this repo — "Step zero is making the existing state build and pass tests" — and did not improvise the rest. **Nothing in notes §1–§4 was implemented.** Asked about it, TevBenji confirmed the remaining scope was MCP-Warden only, so §1–§4 stay design deliberately, not by omission.
2. **Added one test that was not asked for** (`92ae9d5`). The invariants the brief says must not be weakened had nothing locking them in; a future contributor could flip `addAuthHeaders` back to `true` and the suite would stay green. 22 lines.
3. **Fixed a stale comment in `src/services/oauth/jwt.ts`** rather than leaving `900 // 1 hour in seconds`. Folded into `1f26bab` (same concern) instead of its own commit.

## Deliberately left open

- **§1 refresh-token family revocation** — design only. Rotation still deletes on use, so a replayed token is indistinguishable from a never-issued one.
- **§2 gateway→upstream authentication** — design only. The notes say "Options, pick one: (a) private-network requirement in docs, or (b) per-upstream HMAC"; per the stop-and-ask rule I did not pick, and TevBenji deferred the choice. The fixture change above does not commit the product to either.
- **§3 Postgres-backed `RateLimitStorage`** — design only. Rate limits still multiply per replica and IP blocks do not propagate.
- **§4 jti denylist** — explicitly out of scope per the brief.
- **Multi-tenant DCR.** `633dbef` makes `/oauth/register` single-tenant (`TENANT_ID` env, default `default`), matching `token.ts` and `authorize.ts`. Anyone who relied on `X-Tenant-ID` for multi-tenant registration has no replacement path and no migration note. That is the correct security outcome but it is a behaviour break worth calling out in the PR description.

## Verify locally before merging

```bash
docker compose up -d postgres        # tests need postgres://gateway:gateway@localhost:5432/gateway
pnpm install
pnpm -r type-check                   # expect: clean
pnpm -r lint                         # expect: 0 errors, 46 pre-existing warnings
pnpm -r test                         # expect: 28 files, 423 tests, all passing
```

To confirm the security defaults are actually load-bearing, break one on purpose and watch the suite fail:

```bash
# flip addAuthHeaders back to `?? true` in apps/gateway/src/services/mcp/proxy.ts
pnpm --filter @oauth-mcp-gateway/gateway test -- real-mcp-server
# expect: "must not forward the client bearer upstream" FAILS
```
