# Contributing

Thanks for your interest in improving the OAuth 2.1 MCP Gateway.

## Setup

Requirements: Node.js 20+, [pnpm](https://pnpm.io), Docker.

```bash
git clone https://github.com/TevBenji/OAuth-2.1-MCP-Gateway.git
cd oauth-mcp-gateway
docker compose up -d postgres
pnpm install
pnpm dev        # gateway on :8787, migrations run automatically
```

Dashboard: `pnpm --filter @oauth-mcp-gateway/dashboard dev` (see
`.env.example` for its environment variables).

## Checks

All of these must pass before a PR is merged (CI runs them too):

```bash
pnpm lint
pnpm type-check
pnpm test          # needs the Postgres container running
pnpm build
```

## Database changes

The schema lives in `packages/db/src/schema.ts` (and `auth-schema.ts` for the
dashboard's auth tables). After editing it:

```bash
pnpm --filter @oauth-mcp-gateway/db generate   # writes a SQL migration
```

Commit the generated migration together with the schema change. Migrations
are applied automatically when the gateway boots.

## Pull requests

- Keep PRs focused; one change per PR.
- Add or update tests for behavior changes — the suite runs against real
  Postgres (`apps/gateway/tests`).
- Security-sensitive changes (token handling, PKCE, tenant isolation) get
  extra scrutiny; explain your reasoning in the PR description.
