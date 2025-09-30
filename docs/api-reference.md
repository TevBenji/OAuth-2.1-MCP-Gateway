# API Reference

Complete reference for the OAuth 2.1 MCP Gateway API.

## Base URL

```
Production: https://gateway.example.com
Staging: https://staging.gateway.example.com
```

## Authentication

The gateway uses OAuth 2.1 with mandatory PKCE for authentication. All MCP requests require a valid Bearer token.

```
Authorization: Bearer <access_token>
```

## Rate Limiting

API requests are rate-limited based on your tenant tier:

| Tier | Requests/Minute | Requests/Day |
|------|----------------|--------------|
| FREE | 100 | 10,000 |
| PRO | 1,000 | 100,000 |
| BUSINESS | 5,000 | 500,000 |
| ENTERPRISE | 20,000 | 2,000,000 |

Rate limit information is returned in response headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

## Discovery Endpoints

### GET /.well-known/oauth-authorization-server

Discover OAuth 2.1 server metadata (RFC 8414).

**Response:**
```json
{
  "issuer": "https://gateway.example.com",
  "authorization_endpoint": "https://gateway.example.com/authorize",
  "token_endpoint": "https://gateway.example.com/token",
  "introspection_endpoint": "https://gateway.example.com/introspect",
  "revocation_endpoint": "https://gateway.example.com/revoke",
  "registration_endpoint": "https://gateway.example.com/register",
  "jwks_uri": "https://gateway.example.com/.well-known/jwks.json",
  "scopes_supported": ["mcp:read", "mcp:write", "mcp:admin"],
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "code_challenge_methods_supported": ["S256"]
}
```

## OAuth 2.1 Endpoints

### GET /authorize

OAuth 2.1 authorization endpoint with mandatory PKCE.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| response_type | string | Yes | Must be "code" |
| client_id | string | Yes | OAuth client ID |
| redirect_uri | string | Yes | Callback URL |
| scope | string | No | Space-separated scopes |
| state | string | Yes | CSRF protection token |
| code_challenge | string | Yes | PKCE code challenge |
| code_challenge_method | string | Yes | Must be "S256" |
| resource | string | No | Resource indicator (RFC 8707) |

**Example:**
```
GET /authorize?response_type=code
  &client_id=abc123
  &redirect_uri=https://myapp.com/callback
  &scope=mcp:read%20mcp:write
  &state=xyz789
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
```

**Response:**
```
HTTP/1.1 302 Found
Location: https://myapp.com/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=xyz789
```

### POST /token

Exchange authorization code or refresh token for access tokens.

#### Authorization Code Grant

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| grant_type | string | Yes | "authorization_code" |
| code | string | Yes | Authorization code |
| redirect_uri | string | Yes | Same as authorization request |
| client_id | string | Yes | OAuth client ID |
| code_verifier | string | Yes | PKCE code verifier |
| client_secret | string | No* | Client secret (*required for confidential clients) |

**Example:**
```bash
curl -X POST https://gateway.example.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=SplxlOBeZQQYbYS6WxSbIA" \
  -d "redirect_uri=https://myapp.com/callback" \
  -d "client_id=abc123" \
  -d "code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "scope": "mcp:read mcp:write"
}
```

#### Refresh Token Grant

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| grant_type | string | Yes | "refresh_token" |
| refresh_token | string | Yes | Refresh token |
| client_id | string | Yes | OAuth client ID |
| client_secret | string | No* | Client secret (*required for confidential clients) |
| scope | string | No | Requested scopes (must be subset of original) |

**Example:**
```bash
curl -X POST https://gateway.example.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token" \
  -d "refresh_token=tGzv3JOkF0XG5Qx2TlKWIA" \
  -d "client_id=abc123"
```

### POST /revoke

Revoke access or refresh token (RFC 7009).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| token | string | Yes | Token to revoke |
| token_type_hint | string | No | "access_token" or "refresh_token" |
| client_id | string | Yes | OAuth client ID |
| client_secret | string | No* | Client secret (*required for confidential clients) |

**Example:**
```bash
curl -X POST https://gateway.example.com/revoke \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=tGzv3JOkF0XG5Qx2TlKWIA" \
  -d "token_type_hint=refresh_token" \
  -d "client_id=abc123"
```

**Response:**
```
HTTP/1.1 200 OK
```

### POST /introspect

Introspect token to get metadata (RFC 7662).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| token | string | Yes | Token to introspect |
| token_type_hint | string | No | "access_token" or "refresh_token" |
| client_id | string | Yes | OAuth client ID |
| client_secret | string | No* | Client secret (*required for confidential clients) |

**Example:**
```bash
curl -X POST https://gateway.example.com/introspect \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d "client_id=abc123"
```

**Response:**
```json
{
  "active": true,
  "scope": "mcp:read mcp:write",
  "client_id": "abc123",
  "username": "user@example.com",
  "token_type": "Bearer",
  "exp": 1640995200,
  "iat": 1640991600,
  "sub": "user-123",
  "aud": "https://mcp-server.example.com",
  "iss": "https://gateway.example.com"
}
```

## Client Registration

### POST /register

Register new OAuth client dynamically (RFC 7591).

**Request:**
```json
{
  "client_name": "My MCP Client",
  "redirect_uris": [
    "https://myapp.com/callback"
  ],
  "token_endpoint_auth_method": "client_secret_post",
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "scope": "mcp:read mcp:write",
  "contacts": ["admin@myapp.com"],
  "logo_uri": "https://myapp.com/logo.png",
  "client_uri": "https://myapp.com"
}
```

**Response:**
```json
{
  "client_id": "abc123",
  "client_secret": "secret456",
  "client_secret_expires_at": 0,
  "client_id_issued_at": 1640991600
}
```

## MCP Endpoints

### POST /mcp

Forward authenticated MCP requests to upstream servers.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "method": "tools/list",
  "params": {}
}
```

**Response:**
```json
{
  "result": {
    "tools": [
      {
        "name": "get_weather",
        "description": "Get weather for a location",
        "inputSchema": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string"
            }
          }
        }
      }
    ]
  }
}
```

### POST /mcp/{server}

Target specific MCP server in multi-server setup.

**Example:**
```bash
curl -X POST https://gateway.example.com/mcp/weather-api \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_weather",
      "arguments": {
        "location": "San Francisco"
      }
    }
  }'
```

## Error Responses

All errors follow the OAuth 2.1 error format:

```json
{
  "error": "invalid_request",
  "error_description": "Missing required parameter: code_verifier",
  "error_uri": "https://docs.oauth-mcp-gateway.com/errors#invalid_request"
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
| access_denied | 403 | Resource owner or authorization server denied request |
| token_expired | 401 | Access token has expired |
| rate_limit_exceeded | 429 | Too many requests |

## Webhooks

### Webhook Events

The gateway can send webhook notifications for:

- `token.created` - New access token issued
- `token.refreshed` - Token refreshed
- `token.revoked` - Token revoked
- `session.created` - New session created
- `session.ended` - Session ended
- `client.registered` - New client registered

**Webhook Payload:**
```json
{
  "event": "token.created",
  "timestamp": "2024-01-01T00:00:00Z",
  "tenant_id": "tenant-123",
  "data": {
    "client_id": "abc123",
    "user_id": "user-456",
    "scope": "mcp:read mcp:write"
  }
}
```

## SDK Reference

### TypeScript

See [TypeScript SDK Documentation](./sdk/typescript.md)

### Python

See [Python SDK Documentation](./sdk/python.md)

## Support

- [Full Documentation](https://docs.oauth-mcp-gateway.com)
- [GitHub Issues](https://github.com/oauth-mcp-gateway/gateway/issues)
- [Email Support](mailto:support@oauth-mcp-gateway.com)
