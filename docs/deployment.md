# Deployment Guide

The OAuth 2.1 MCP Gateway is a Node.js 20+ application (Hono) backed by PostgreSQL. The primary deployment path is Docker + docker-compose; Railway is the supported hosted option.

## Components

| Service | Source | Port | Notes |
|-----------|--------|------|-------|
| gateway | `Dockerfile` (repo root) | 8787 | OAuth server + MCP proxy. Runs Drizzle migrations automatically at boot. |
| dashboard | `apps/dashboard/Dockerfile` | 3000 | Next.js admin UI (better-auth email/password). |
| postgres | `postgres:16-alpine` | 5432 | Single database shared by gateway and dashboard. |

## Docker Compose (self-host)

```bash
git clone <repository-url>
cd oauth-mcp-gateway
docker compose up -d
```

- Gateway: http://localhost:8787 (`GET /health` to verify)
- Dashboard: http://localhost:3000

The bundled `docker-compose.yml` ships development defaults (`JWT_SECRET`, `ADMIN_TOKEN`, Postgres credentials). Override every secret before exposing the stack to a network.

### Development without containers for the apps

```bash
docker compose up -d postgres
pnpm install
pnpm dev          # gateway on :8787 (tsx watch)
```

Database migrations live in `packages/db/migrations` (drizzle-kit) and are applied automatically when the gateway boots. To generate a new migration after a schema change: `pnpm db:generate`.

## Environment Variables

### Gateway

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENVIRONMENT` | No | `development` | `development` or `production`. |
| `PORT` | No | `8787` | HTTP listen port. |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string. |
| `JWT_SECRET` | Yes | dev fallback | Signing secret for access tokens. Must be >= 32 characters in production. |
| `JWT_ISSUER` | Yes | — | Public base URL of the gateway (used in discovery metadata and token `iss`). |
| `CORS_ORIGINS` | No | — | Comma-separated list of allowed origins. |
| `ADMIN_TOKEN` | Prod: yes | — | Service token for `/admin/api/*`. Without it the admin API returns 503 in production. |
| `TENANT_ID` | No | `default` | Tenant used for single-tenant deployments. |

### Dashboard

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Same PostgreSQL database as the gateway. |
| `BETTER_AUTH_SECRET` | Yes | Secret for better-auth session signing. |
| `BETTER_AUTH_URL` | Yes | Public URL of the dashboard (e.g. `https://dashboard.example.com`). |
| `GATEWAY_URL` | Yes | URL the dashboard uses to reach the gateway (`http://gateway:8787` inside compose). |
| `GATEWAY_ADMIN_TOKEN` | Yes | Must match the gateway's `ADMIN_TOKEN`. |
| `DASHBOARD_ALLOW_SIGNUP` | No | `true` to allow open registration. Set `false` after creating the first admin account. |

## Production Notes

- **Secrets**: generate strong values — `openssl rand -base64 48` for `JWT_SECRET`, `ADMIN_TOKEN`, and `BETTER_AUTH_SECRET`. Never reuse the compose defaults.
- **TLS**: the gateway serves plain HTTP. Terminate TLS with a reverse proxy such as Caddy or nginx:

  ```
  # Caddyfile
  gateway.example.com {
      reverse_proxy localhost:8787
  }
  dashboard.example.com {
      reverse_proxy localhost:3000
  }
  ```

  Set `JWT_ISSUER` to the public HTTPS URL and add the dashboard origin to `CORS_ORIGINS`.
- **Backups**: schedule `pg_dump`:

  ```bash
  docker compose exec postgres pg_dump -U gateway gateway > backup-$(date +%F).sql
  ```

  Restore with `psql -U gateway gateway < backup.sql`.
- **Rate limiting** is in-process (per gateway instance). If you run multiple gateway replicas, limits apply per replica.
- **Lock down signup**: set `DASHBOARD_ALLOW_SIGNUP=false` once your admin accounts exist.

## Railway (hosted)

1. **Create a project** at https://railway.app and connect the repository.
2. **Add PostgreSQL** via the Railway Postgres plugin. Note the generated `DATABASE_URL`.
3. **Create the gateway service** from the repo. Set the build to use the `Dockerfile` at the repo root. Configure:
   - `DATABASE_URL` — reference the Postgres plugin variable
   - `ENVIRONMENT=production`, `JWT_SECRET`, `JWT_ISSUER`, `ADMIN_TOKEN`, `CORS_ORIGINS`
   - Expose port 8787.
4. **Create the dashboard service** from the same repo with `apps/dashboard/Dockerfile`. Configure:
   - `DATABASE_URL` (same Postgres), `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GATEWAY_URL` (the gateway service's URL), `GATEWAY_ADMIN_TOKEN`, `DASHBOARD_ALLOW_SIGNUP`
   - Expose port 3000.
5. **Attach domains** to both services (Railway-generated or custom). Update `JWT_ISSUER`, `BETTER_AUTH_URL`, and `CORS_ORIGINS` to the final URLs and redeploy.

Migrations run automatically when the gateway starts, so no separate migration step is needed on deploy.

## Verify

```bash
curl https://gateway.example.com/health
curl https://gateway.example.com/.well-known/oauth-authorization-server
```
