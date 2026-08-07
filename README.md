# OAuth 2.1 MCP Gateway

![CI](https://github.com/TevBenji/OAuth-2.1-MCP-Gateway/actions/workflows/ci.yml/badge.svg) ![license](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square) ![oauth](https://img.shields.io/badge/OAuth_2.1-PKCE_required-f97316?style=flat-square) ![mcp](https://img.shields.io/badge/MCP-gateway-8b5cf6?style=flat-square) ![pg](https://img.shields.io/badge/PostgreSQL-self--hosted-4169E1?style=flat-square&logo=postgresql&logoColor=white)

A self-hosted OAuth 2.1 authorization server and reverse proxy for
[Model Context Protocol](https://modelcontextprotocol.io) servers. Put it in
front of your MCP servers and replace static API keys with PKCE-mandatory
OAuth flows, audience-scoped JWTs, and per-tenant access control.

Built entirely on free, open-source software: Node.js, [Hono](https://hono.dev),
PostgreSQL, [Drizzle ORM](https://orm.drizzle.team), Next.js, and
[better-auth](https://better-auth.com). No vendor lock-in — it runs anywhere a
container and a Postgres database run.

## Features

- **OAuth 2.1 authorization server** — PKCE required (S256), authorization
  code + refresh token grants with rotation, RFC 7591 dynamic client
  registration, RFC 8414 discovery, RFC 8707 resource indicators
- **MCP reverse proxy** — routes `/mcp/:serverId/*` to registered upstream
  MCP servers behind Bearer-JWT auth and scope checks
- **Multi-tenant** — tenants, per-tenant OAuth clients, MCP servers, and
  API keys, with parameterized tenant isolation in every query
- **Audit logging** — structured, compliance-taggable audit trail with
  retention policies
- **Admin dashboard** — Next.js UI for tenants, clients, MCP servers, audit
  logs, and analytics, authenticated with email/password (better-auth)
- **Rate limiting** and session management out of the box

## Quickstart

```bash
git clone https://github.com/TevBenji/OAuth-2.1-MCP-Gateway.git
cd oauth-mcp-gateway
docker compose up
```

- Gateway: http://localhost:8787 (`/health`, discovery at
  `/.well-known/oauth-authorization-server`)
- Dashboard: http://localhost:3000 — sign up to create the first admin
  account, then walk through the onboarding wizard

Register an OAuth client and run a PKCE flow:

```bash
curl -X POST http://localhost:8787/oauth/register \
  -H "Content-Type: application/json" \
  -d '{"redirect_uris": ["http://localhost:3000/callback"], "client_name": "my-client", "token_endpoint_auth_method": "none"}'
```

See [docs/quickstart.md](docs/quickstart.md) for the full flow.

## Development

Requirements: Node.js 20+, pnpm, Docker (for Postgres).

```bash
docker compose up -d postgres
pnpm install
pnpm dev                     # gateway on :8787 (migrations run at boot)
pnpm --filter @oauth-mcp-gateway/dashboard dev   # dashboard on :3000
```

Copy `.env.example` to `.env` and adjust as needed. Run the test suite with
`pnpm test` (needs the Postgres container).

## Repository layout

```
apps/gateway/          # The OAuth 2.1 gateway (Hono on Node.js)
apps/dashboard/        # Admin dashboard (Next.js + better-auth)
packages/db/           # Shared PostgreSQL schema + migrations (Drizzle)
packages/sdk-typescript/
packages/sdk-python/
docs/                  # API reference, architecture, deployment guides
```

## Deployment

**Docker (any host):** `docker compose up -d` — see
[docs/deployment.md](docs/deployment.md) for production notes (TLS, secrets,
backups).

**Railway:** create a project with a Postgres database and two services built
from `Dockerfile` (gateway) and `apps/dashboard/Dockerfile` (dashboard).
Step-by-step in [docs/deployment.md](docs/deployment.md).

## Configuration

| Variable | Service | Description |
|---|---|---|
| `DATABASE_URL` | both | PostgreSQL connection string |
| `JWT_SECRET` | gateway | JWT signing secret (≥ 32 chars in production) |
| `JWT_ISSUER` | gateway | Public base URL of the gateway |
| `CORS_ORIGINS` | gateway | Comma-separated allowed origins |
| `ADMIN_TOKEN` | gateway | Service token for `/admin/api/*` (required in production) |
| `BETTER_AUTH_SECRET` | dashboard | Session signing secret |
| `GATEWAY_URL` / `GATEWAY_ADMIN_TOKEN` | dashboard | How the dashboard reaches the gateway |
| `DASHBOARD_ALLOW_SIGNUP` | dashboard | Allow account creation (disable after first admin) |

Full list in [.env.example](.env.example).

## Contributing

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
Security issues: see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
