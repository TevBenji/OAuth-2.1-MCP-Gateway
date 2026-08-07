# Production Readiness Checklist

OAuth 2.1 MCP Gateway - Production deployment validation checklist

## Pre-Deployment Validation

### Code Quality
- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript strict mode passing (`pnpm type-check`)
- [ ] No critical or high-severity linter warnings (`pnpm lint`)
- [ ] Dependencies up to date and security scanned (`pnpm audit`)

### Security
- [ ] OAuth 2.1 compliance verified (PKCE, no implicit flow)
- [ ] `JWT_SECRET` is a strong random value (>= 32 characters, not the compose default)
- [ ] `ADMIN_TOKEN` set to a strong random value (admin API returns 503 in production without it)
- [ ] `BETTER_AUTH_SECRET` set to a strong random value
- [ ] `DASHBOARD_ALLOW_SIGNUP=false` after admin accounts are created
- [ ] TLS terminated at a reverse proxy (Caddy/nginx); gateway not directly exposed over HTTP
- [ ] `CORS_ORIGINS` restricted to known origins
- [ ] Audit logging enabled for all tenants

### Database
- [ ] PostgreSQL reachable via `DATABASE_URL` with TLS where applicable
- [ ] Drizzle migrations verified against a staging database (they auto-run at gateway boot)
- [ ] `pg_dump` backup schedule in place and restore tested
- [ ] Database credentials are not the compose defaults

### Infrastructure
- [ ] Docker images build cleanly (`docker compose build`)
- [ ] `JWT_ISSUER` and `BETTER_AUTH_URL` set to final public HTTPS URLs
- [ ] DNS records configured; certificates valid
- [ ] Note: rate limiting is in-process — limits are per gateway replica

### Monitoring & Observability
- [ ] `GET /health` and `GET /mcp/health` wired into uptime monitoring
- [ ] Container logs aggregated (gateway logs to stdout)
- [ ] Alerting on error rates and health-check failures

## Deployment Execution

### Pre-Flight
- [ ] Deployment approval obtained
- [ ] Database backup taken (`pg_dump`)
- [ ] Rollback plan documented (previous image tag + backup restore)

### Deployment
- [ ] Build and push images (or trigger Railway deploy)
- [ ] Start services; confirm migrations applied at gateway boot
- [ ] Verify `GET /health` and `GET /.well-known/oauth-authorization-server`

### Post-Deployment
- [ ] Smoke test: client registration, PKCE flow, token exchange, MCP proxy call
- [ ] Dashboard login and tenant management verified
- [ ] No error spikes in logs

## Post-Deployment Monitoring (First 24 hours)

- [ ] Monitor error rates (<1%)
- [ ] Monitor response times
- [ ] Monitor authentication success rate
- [ ] Review audit logs for anomalies

## Sign-Off

- [ ] Technical Lead approval
- [ ] Documentation updated

**Deployment Date**: _____________
**Deployed By**: _____________
