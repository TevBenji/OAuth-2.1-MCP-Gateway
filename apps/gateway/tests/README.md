# OAuth 2.1 MCP Gateway - Test Suite

Vitest suite for the Node.js + PostgreSQL gateway. Integration tests drive the
real Hono app (`app.request(path, init, env)`) against a real Postgres
database; only upstream MCP servers are faked (either a local Node HTTP server
or a mocked `fetch`).

## Running the tests

Postgres must be running (the docker compose service from the repo root):

```sh
docker compose up -d postgres
pnpm --filter @oauth-mcp-gateway/gateway test        # run the suite
pnpm --filter @oauth-mcp-gateway/gateway type-check  # tsc over src + tests
```

The database connection defaults to
`postgres://gateway:gateway@localhost:5432/gateway`; override it with the
`TEST_DATABASE_URL` environment variable. Migrations are applied automatically
before the run, and all gateway tables are wiped between tests, so do not
point `TEST_DATABASE_URL` at a database whose data you care about.

Tests run serially (`singleFork` in `vitest.config.ts`) because they share
one database and truncate it between tests.

## Structure

```
tests/
├── helpers/
│   ├── db.ts               # shared pg pool, migrations, truncateAll(), createTenant()
│   ├── env.ts              # makeTestEnv(): full Bindings backed by real Postgres
│   ├── oauth.ts            # drive register/authorize/token through the real app
│   └── real-mcp-server.ts  # real local HTTP MCP server for proxy tests
├── setup.ts                # global hooks: migrate once, wipe DB before each test
├── unit/                   # service/handler unit tests (pkce, jwt, scopes, audit, ...)
├── integration/            # app-level tests: oauth flows, mcp proxy, tenancy, sessions
├── security/               # pkce, token, session, client-registration, rate-limit security
├── chaos/                  # failure injection: network, database, cache
└── performance/            # smoke-level latency/throughput sanity checks
```

## Conventions

- `setup.ts` is wired as a vitest `setupFiles` entry: it migrates the test
  database once per process, deletes all gateway rows before every test, and
  re-seeds the `default` tenant. Suites never clean up after themselves.
- Build request environments with `makeTestEnv(overrides?)` from
  `helpers/env.ts` — a complete `Bindings` object (real drizzle `DB`,
  `PgSessionStorage`, in-memory `CACHE`).
- Tests that need extra tenants create them via `createTenant()` from
  `helpers/db.ts` (most tables have a foreign key to `tenants`).
- Suites that replace `global.fetch` must restore it (`afterEach`/`afterAll`) —
  all files share one process.
