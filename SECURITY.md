# Security Policy

## Reporting a vulnerability

Please do not open public issues for security vulnerabilities. Instead, use
GitHub's private vulnerability reporting on this repository ("Security" tab →
"Report a vulnerability"). You will get a response within a week.

## Supported versions

Only the latest release on `main` receives security fixes.

## Deployment hardening

- Set a strong `JWT_SECRET` (≥ 32 random characters) and `ADMIN_TOKEN`;
  the gateway refuses to start in production without them.
- Terminate TLS in front of the gateway (reverse proxy or platform TLS).
- Set `DASHBOARD_ALLOW_SIGNUP=false` after creating your admin account.
- Restrict `CORS_ORIGINS` to the origins you actually serve.
- Tenant isolation is enforced with parameterized queries scoped by
  `tenant_id`. PostgreSQL row-level security is a possible additional
  hardening layer for multi-tenant deployments; it is not enabled by default.
