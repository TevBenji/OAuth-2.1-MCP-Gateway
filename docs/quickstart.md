# Quickstart Guide

Run the OAuth 2.1 MCP Gateway locally and complete a full PKCE flow with curl.

## Prerequisites

- Docker (with Compose)
- curl and openssl (for the PKCE example)

## Step 1: Start the Stack

```bash
git clone <repository-url>
cd oauth-mcp-gateway
docker compose up -d
```

- Gateway: http://localhost:8787
- Dashboard: http://localhost:3000

Verify:

```bash
curl http://localhost:8787/health
curl http://localhost:8787/.well-known/oauth-authorization-server
```

Alternatively, for development with hot reload:

```bash
docker compose up -d postgres
pnpm install
pnpm dev
```

## Step 2: Register a Client

Dynamic client registration (RFC 7591) via `POST /oauth/register`:

```bash
curl -s -X POST http://localhost:8787/oauth/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "Quickstart Client",
    "redirect_uris": ["http://localhost:3000/callback"],
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code"],
    "scope": "mcp:tools:read mcp:resources:read"
  }'
```

Save the `client_id` (and `client_secret`, if issued) from the response:

```bash
CLIENT_ID=<client_id from response>
```

## Step 3: Run the PKCE Flow

Generate a PKCE verifier and challenge:

```bash
CODE_VERIFIER=$(openssl rand -hex 32)
CODE_CHALLENGE=$(printf %s "$CODE_VERIFIER" | openssl dgst -binary -sha256 | openssl base64 -A | tr '+/' '-_' | tr -d '=')
```

Request an authorization code from `GET /oauth/authorize`. The gateway redirects to your `redirect_uri` with `code` in the query string — capture the `Location` header:

```bash
curl -si "http://localhost:8787/oauth/authorize?response_type=code&client_id=$CLIENT_ID&redirect_uri=http://localhost:3000/callback&scope=mcp:tools:read%20mcp:resources:read&state=xyz123&code_challenge=$CODE_CHALLENGE&code_challenge_method=S256" \
  | grep -i '^location'
# location: http://localhost:3000/callback?code=auth_...&state=xyz123
```

```bash
CODE=<code from the Location header>
```

Exchange the code for tokens at `POST /oauth/token` (form-encoded):

```bash
curl -s -X POST http://localhost:8787/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=$CODE" \
  -d "redirect_uri=http://localhost:3000/callback" \
  -d "client_id=$CLIENT_ID" \
  -d "code_verifier=$CODE_VERIFIER"
```

Response:

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "scope": "mcp:tools:read mcp:resources:read"
}
```

Refresh later with:

```bash
curl -s -X POST http://localhost:8787/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=$REFRESH_TOKEN" \
  -d "client_id=$CLIENT_ID"
```

## Step 4: Register an MCP Server and Proxy Requests

Register an upstream MCP server through the admin API (Bearer `ADMIN_TOKEN`; the compose default is `dev-admin-token`):

```bash
curl -s -X POST http://localhost:8787/admin/api/tenants/default/servers \
  -H "Authorization: Bearer dev-admin-token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My MCP Server",
    "endpoint_url": "https://my-mcp-server.example.com",
    "resource_identifier": "https://my-mcp-server.example.com",
    "required_scopes": ["mcp:tools:read"]
  }'
```

The response includes the server's ID. Proxy MCP requests through the gateway with your access token:

```bash
curl -s -X POST http://localhost:8787/mcp/<serverId>/ \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}'
```

## Step 5: Use the Dashboard

Open http://localhost:3000, sign up (email/password), and manage tenants, OAuth clients, MCP servers, and audit logs from the UI. The dashboard talks to the gateway's admin API using `GATEWAY_ADMIN_TOKEN`.

## Next Steps

- [API Reference](./api-reference.md) - Endpoint documentation
- [Deployment Guide](./deployment.md) - Docker and Railway deployment
- [Getting Started Tutorial](./tutorials/getting-started.md) - SDK-based integration
- [TypeScript SDK](./sdk/typescript.md) / [Python SDK](./sdk/python.md)
