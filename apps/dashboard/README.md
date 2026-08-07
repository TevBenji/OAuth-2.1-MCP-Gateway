# Dashboard

Admin dashboard for the OAuth 2.1 MCP Gateway. Next.js 15, better-auth
(email/password, sessions in Postgres), and the gateway's admin API as its
only data source — the dashboard holds no domain data of its own.

## Development

```bash
# from the repo root
docker compose up -d postgres gateway
pnpm install
pnpm --filter @oauth-mcp-gateway/dashboard dev
```

Environment (see the root `.env.example`): `DATABASE_URL`,
`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GATEWAY_URL`,
`GATEWAY_ADMIN_TOKEN`, `DASHBOARD_ALLOW_SIGNUP`.

Sign up at `/sign-up` to create the first admin account, then set
`DASHBOARD_ALLOW_SIGNUP=false`.
