# API Reference

Complete reference for the OAuth 2.1 MCP Gateway API.

## Base URL

```
Local development: http://localhost:8787
Production:        https://gateway.example.com (your deployment)
```

## Authentication

Two auth models:

- **MCP endpoints** (`/mcp/...`): OAuth 2.1 Bearer JWT obtained via the authorization code flow with mandatory PKCE.
- **Admin API** (`/admin/api/...`): service token — `Authorization: Bearer <ADMIN_TOKEN>` (the `ADMIN_TOKEN` environment variable). In development, if no `ADMIN_TOKEN` is configured, access is allowed; in production the admin API returns 503 until one is set.

## Rate Limiting

Rate limiting is enforced in-process. OAuth endpoints are limited per IP; MCP endpoints per token. Responses expose:

```
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## Health

### GET /health

Gateway health check. Returns status JSON, no auth required.

### GET /mcp/health

MCP subsystem health check. No auth required.

## Discovery

### GET /.well-known/oauth-authorization-server

OAuth 2.1 server metadata (RFC 8414).

**Response:**
```json
{
  "issuer": "http://localhost:8787",
  "authorization_endpoint": "http://localhost:8787/oauth/authorize",
  "token_endpoint": "http://localhost:8787/oauth/token",
  "registration_endpoint": "http://localhost:8787/oauth/register",
  "scopes_supported": [
    "mcp:tools:read",
    "mcp:tools:write",
    "mcp:resources:read",
    "mcp:resources:write"
  ],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"],
  "token_endpoint_auth_methods_supported": ["none", "client_secret_post"]
}
```

## OAuth 2.1 Endpoints

### GET /oauth/authorize

Authorization endpoint with mandatory PKCE. `POST` is also accepted with the same parameters.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| response_type | string | Yes | Must be `code` |
| client_id | string | Yes | OAuth client ID |
| redirect_uri | string | Yes | Callback URL (must match a registered URI) |
| scope | string | No | Space-separated scopes |
| state | string | Yes | CSRF protection token |
| code_challenge | string | Yes | PKCE code challenge (base64url) |
| code_challenge_method | string | Yes | `S256` (recommended) |

**Example:**
```
GET /oauth/authorize?response_type=code
  &client_id=abc123
  &redirect_uri=http://localhost:3000/callback
  &scope=mcp:tools:read%20mcp:resources:read
  &state=xyz789
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
```

**Response:**
```
HTTP/1.1 302 Found
Location: http://localhost:3000/callback?code=auth_...&state=xyz789
```

Errors are returned as query parameters on the redirect (`error`, `error_description`, `state`).

### POST /oauth/token

Exchange an authorization code or refresh token for access tokens. Body must be `application/x-www-form-urlencoded`.

#### Authorization Code Grant

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| grant_type | string | Yes | `authorization_code` |
| code | string | Yes | Authorization code |
| redirect_uri | string | Yes | Same as authorization request |
| client_id | string | Yes | OAuth client ID |
| code_verifier | string | Yes | PKCE code verifier |
| client_secret | string | No* | Required for confidential clients |

**Example:**
```bash
curl -X POST http://localhost:8787/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=auth_..." \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=abc123" \
  -d "code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 900,
  "refresh_token": "...",
  "scope": "mcp:tools:read mcp:resources:read"
}
```

#### Refresh Token Grant

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| grant_type | string | Yes | `refresh_token` |
| refresh_token | string | Yes | Refresh token |
| client_id | string | Yes | OAuth client ID |
| client_secret | string | No* | Required for confidential clients |
| scope | string | No | Must be a subset of the original scopes |

## Client Registration

### POST /oauth/register

Dynamic client registration (RFC 7591). `POST /register` is a legacy alias.

**Request:**
```json
{
  "client_name": "My MCP Client",
  "redirect_uris": ["http://localhost:3000/callback"],
  "token_endpoint_auth_method": "client_secret_post",
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "scope": "mcp:tools:read mcp:resources:read"
}
```

**Response (201):**
```json
{
  "client_id": "abc123",
  "client_secret": "secret456",
  "client_secret_expires_at": 0,
  "client_id_issued_at": 1640991600
}
```

Registration is single-tenant: clients are registered under the tenant configured server-side via the `TENANT_ID` environment variable (defaults to `default`). The `X-Tenant-ID` request header is ignored — tenant identity never comes from client-supplied input.

## MCP Proxy Endpoints

All MCP endpoints require `Authorization: Bearer <access_token>` and enforce scopes.

### ALL /mcp/:serverId/*

Proxy any method/path to the MCP server registered under `serverId`. Requires `mcp:tools:read` or `mcp:resources:read` scope.

```bash
curl -X POST http://localhost:8787/mcp/<serverId>/ \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}'
```

### ALL /mcp/resource/*

Proxy by resource identifier instead of server ID. Requires `mcp:resources:read` or `mcp:resources:write` scope.

## Admin API

All routes below are prefixed with `/admin/api` and require `Authorization: Bearer <ADMIN_TOKEN>`. This is the API consumed by the dashboard.

### Tenants

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/api/tenants` | List tenants |
| POST | `/admin/api/tenants` | Create tenant (`name`, `domain` required; optional `tenant_id`, `compliance_tier`, `max_users`, `max_mcp_servers`, `audit_retention_days`) |
| GET | `/admin/api/tenants/:id` | Get tenant |
| PUT | `/admin/api/tenants/:id` | Update tenant (`name`, `description`, `compliance_tier`, `limits`, `settings`) |
| DELETE | `/admin/api/tenants/:id` | Delete tenant |

### OAuth Clients

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/api/tenants/:id/clients` | List clients (secrets omitted) |
| POST | `/admin/api/tenants/:id/clients` | Register client (`redirect_uris` required) |
| DELETE | `/admin/api/tenants/:id/clients/:clientId` | Delete client |

### MCP Servers

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/api/tenants/:id/servers` | List MCP servers |
| POST | `/admin/api/tenants/:id/servers` | Register server (`name`, `endpoint_url`, `resource_identifier` required; optional `required_scopes`, `health_check_url`, `status`, `timeout_ms`, `retry_attempts`) |
| PUT | `/admin/api/tenants/:id/servers/:serverId` | Update server (partial body accepted) |
| DELETE | `/admin/api/tenants/:id/servers/:serverId` | Delete server |

### Audit Logs and Metrics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/api/audit-logs` | Query audit logs. Query params: `action`, `tenantId`, `userId`, `startDate`, `endDate`, `limit` (max 500), `offset` |
| GET | `/admin/api/usage-metrics` | Aggregated request counts per tenant. Query params: `tenantId`, `startDate`, `endDate` |

### API Keys

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/api/tenants/:id/rotate-api-keys` | Retire active keys and issue a new one. The plaintext key is returned once. |

**Example:**
```bash
curl http://localhost:8787/admin/api/tenants \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

## Error Responses

OAuth errors follow the standard format:

```json
{
  "error": "invalid_request",
  "error_description": "Missing required parameter: code_verifier"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| invalid_request | 400 | Malformed or missing required parameters |
| invalid_client | 401 | Client authentication failed |
| invalid_grant | 400 | Authorization code or refresh token is invalid |
| unauthorized_client | 400 | Client not authorized for requested grant type |
| unsupported_grant_type | 400 | Grant type not supported |
| invalid_scope | 400 | Requested scope is invalid or exceeds granted scope |
| access_denied | 403 | Request denied / insufficient scope |
| rate_limit_exceeded | 429 | Too many requests |

## SDK Reference

- [TypeScript SDK Documentation](./sdk/typescript.md)
- [Python SDK Documentation](./sdk/python.md)
