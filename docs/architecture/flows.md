# OAuth 2.1 MCP Gateway - Sequence Diagrams

This document provides detailed sequence diagrams for all major flows in the OAuth 2.1 MCP Gateway system.

## Table of Contents

1. [OAuth 2.1 Authorization Code Flow](#oauth-21-authorization-code-flow)
2. [Token Refresh Flow](#token-refresh-flow)
3. [MCP Request Proxying](#mcp-request-proxying)
4. [Client Registration Flow](#client-registration-flow)
5. [Multi-Tenant Request Handling](#multi-tenant-request-handling)
6. [Rate Limiting Flow](#rate-limiting-flow)
7. [Session Management Flow](#session-management-flow)
8. [Error Handling Flow](#error-handling-flow)

## OAuth 2.1 Authorization Code Flow

Complete flow from initial authorization request through token exchange with PKCE.

```mermaid
sequenceDiagram
    autonumber
    participant User as End User
    participant AI as AI Client
    participant Gateway as OAuth Gateway
    participant DB as PostgreSQL
    participant Mem as In-Memory Store
    participant MCP as MCP Server

    Note over AI: Generate PKCE challenge
    AI->>AI: code_verifier = random(43-128 chars)
    AI->>AI: code_challenge = SHA256(code_verifier)

    Note over User,Gateway: Authorization Phase
    User->>AI: Initiate OAuth flow
    AI->>Gateway: GET /oauth/authorize?client_id=...&<br/>redirect_uri=...&<br/>response_type=code&<br/>scope=read write&<br/>state=random123&<br/>code_challenge=...&<br/>code_challenge_method=S256

    Gateway->>DB: SELECT * FROM clients<br/>WHERE client_id = ?
    DB-->>Gateway: Client details

    alt Client not found
        Gateway-->>AI: 401 Unauthorized<br/>(invalid_client error)
    else Redirect URI mismatch
        Gateway-->>AI: 400 Bad Request<br/>(invalid_request error)
    else Missing PKCE challenge
        Gateway-->>AI: 400 Bad Request<br/>(invalid_pkce error)
    end

    Gateway->>User: Show consent screen
    User->>Gateway: Grant consent

    Note over Gateway,DB: Store authorization code with PKCE
    Gateway->>Gateway: Generate auth code
    Gateway->>DB: INSERT INTO authorization_codes<br/>(code, client_id, user_id,<br/>code_challenge, code_challenge_method,<br/>expires_at)
    DB-->>Gateway: Success

    Gateway->>Gateway: Build redirect URL
    Gateway-->>AI: 302 Redirect to<br/>redirect_uri?code=AUTH_CODE&state=random123

    Note over AI,Gateway: Token Exchange Phase
    AI->>Gateway: POST /oauth/token<br/>grant_type=authorization_code&<br/>code=AUTH_CODE&<br/>redirect_uri=...&<br/>client_id=...&<br/>client_secret=...&<br/>code_verifier=CODE_VERIFIER

    Gateway->>DB: SELECT * FROM authorization_codes<br/>WHERE code = ? AND used = false
    DB-->>Gateway: Code details + PKCE challenge

    alt Code not found or used
        Gateway-->>AI: 400 Bad Request<br/>(invalid_grant error)
    else Code expired
        Gateway->>DB: DELETE FROM authorization_codes<br/>WHERE code = ?
        Gateway-->>AI: 400 Bad Request<br/>(invalid_grant error)
    end

    Note over Gateway: Validate PKCE
    Gateway->>Gateway: calculated_challenge = SHA256(code_verifier)
    Gateway->>Gateway: Compare calculated_challenge<br/>with stored code_challenge

    alt PKCE validation fails
        Gateway-->>AI: 400 Bad Request<br/>(invalid_grant - PKCE failed)
    end

    Note over Gateway: Validate client credentials
    Gateway->>DB: SELECT * FROM clients<br/>WHERE client_id = ? AND client_secret = ?
    DB-->>Gateway: Client valid

    Note over Gateway: Generate tokens
    Gateway->>Gateway: Generate access_token (JWT)<br/>Claims: sub, aud, scope, tenant_id<br/>Expiry: 15 minutes
    Gateway->>Gateway: Generate refresh_token<br/>Expiry: 30 days

    Gateway->>DB: INSERT INTO tokens<br/>(access_token, refresh_token,<br/>client_id, user_id, expires_at)
    Gateway->>DB: UPDATE authorization_codes<br/>SET used = true<br/>WHERE code = ?
    DB-->>Gateway: Success

    Gateway->>Mem: PUT token:<TOKEN_ID><br/>TTL: 900 seconds
    Mem-->>Gateway: Cached

    Gateway-->>AI: 200 OK<br/>{<br/>  "access_token": "eyJ...",<br/>  "token_type": "Bearer",<br/>  "expires_in": 900,<br/>  "refresh_token": "ref_...",<br/>  "scope": "read write"<br/>}

    Note over AI,MCP: Use Access Token
    AI->>Gateway: GET /mcp/files<br/>Authorization: Bearer eyJ...
    Gateway->>MCP: Proxied request
    MCP-->>Gateway: Response
    Gateway-->>AI: Response
```

### Key Security Features

1. **PKCE Protection**: Prevents authorization code interception
2. **One-Time Code**: Authorization codes can only be used once
3. **Code Expiry**: Codes expire after 10 minutes
4. **State Validation**: Prevents CSRF attacks
5. **Client Authentication**: Validates client credentials
6. **Short-Lived Tokens**: Access tokens expire in 15 minutes

## Token Refresh Flow

Refreshing an expired access token using a refresh token.

```mermaid
sequenceDiagram
    autonumber
    participant AI as AI Client
    participant Gateway as OAuth Gateway
    participant Mem as In-Memory Store
    participant DB as PostgreSQL

    AI->>Gateway: POST /oauth/token<br/>grant_type=refresh_token&<br/>refresh_token=ref_...&<br/>client_id=...&<br/>client_secret=...&<br/>scope=read

    Note over Gateway: Validate client credentials
    Gateway->>DB: SELECT * FROM clients<br/>WHERE client_id = ? AND client_secret = ?
    DB-->>Gateway: Client valid

    Note over Gateway: Validate refresh token
    Gateway->>DB: SELECT * FROM tokens<br/>WHERE refresh_token = ? AND revoked = false
    DB-->>Gateway: Token details

    alt Refresh token not found
        Gateway-->>AI: 400 Bad Request<br/>(invalid_grant error)
    else Refresh token revoked
        Gateway-->>AI: 400 Bad Request<br/>(invalid_grant - token revoked)
    else Refresh token expired
        Gateway->>DB: DELETE FROM tokens<br/>WHERE refresh_token = ?
        Gateway-->>AI: 400 Bad Request<br/>(invalid_grant - token expired)
    end

    Note over Gateway: Check scope downgrade
    alt Requested scope > Original scope
        Gateway-->>AI: 400 Bad Request<br/>(invalid_scope error)
    end

    Note over Gateway: Generate new access token
    Gateway->>Gateway: Generate new access_token (JWT)<br/>Claims: sub, aud, scope, tenant_id<br/>Expiry: 15 minutes

    Gateway->>DB: UPDATE tokens<br/>SET access_token = ?,<br/>    access_token_expires_at = ?<br/>WHERE refresh_token = ?
    DB-->>Gateway: Success

    Gateway->>Mem: PUT token:<TOKEN_ID><br/>TTL: 900 seconds
    Mem-->>Gateway: Cached

    Gateway-->>AI: 200 OK<br/>{<br/>  "access_token": "eyJ...",<br/>  "token_type": "Bearer",<br/>  "expires_in": 900,<br/>  "scope": "read"<br/>}
```

### Refresh Token Security

1. **Single Use**: Option to rotate refresh tokens on use
2. **Revocation**: Can be revoked independently
3. **Scope Reduction**: Can request narrower scope
4. **Client Binding**: Tied to specific client
5. **Long TTL**: 30 days (configurable)

## MCP Request Proxying

Authenticated request proxying to MCP servers with tenant isolation.

```mermaid
sequenceDiagram
    autonumber
    participant AI as AI Client
    participant Gateway as OAuth Gateway
    participant Mem as In-Memory Store
    participant DB as PostgreSQL
    participant Rate as Rate Limiter
    participant Audit as Audit Service
    participant MCP as MCP Server

    AI->>Gateway: GET /mcp/files/list<br/>Authorization: Bearer eyJ...

    Note over Gateway: Extract and validate token
    Gateway->>Gateway: Extract token from header
    Gateway->>Mem: GET token:<TOKEN_ID>

    alt Token in cache
        Mem-->>Gateway: Token data (cached)
    else Token not in cache
        Gateway->>Gateway: Verify JWT signature
        Gateway->>Gateway: Validate claims:<br/>- exp (not expired)<br/>- aud (correct audience)<br/>- iss (correct issuer)
        Gateway->>DB: SELECT * FROM tokens<br/>WHERE access_token_hash = ?
        DB-->>Gateway: Token details

        alt Token revoked
            Gateway-->>AI: 401 Unauthorized<br/>(token_revoked error)
        end

        Gateway->>Mem: PUT token:<TOKEN_ID><br/>TTL: remaining time
    end

    Note over Gateway: Extract tenant context
    Gateway->>Gateway: tenant_id = JWT claims.tenant_id
    Gateway->>Gateway: user_id = JWT claims.sub
    Gateway->>Gateway: scopes = JWT claims.scope

    Note over Gateway: Validate scope for endpoint
    alt Required scope not in token scopes
        Gateway-->>AI: 403 Forbidden<br/>(insufficient_scope error)
    end

    Note over Gateway: Check rate limits
    Gateway->>Rate: Check rate limit<br/>Key: tenant:<TENANT_ID>:user:<USER_ID>
    Rate->>Mem: INCR rate:tenant:<TENANT_ID>:...
    Mem-->>Rate: Current count

    alt Rate limit exceeded
        Rate-->>Gateway: 429 Rate Limit<br/>Retry-After: 60
        Gateway->>Audit: LOG rate_limit_exceeded
        Gateway-->>AI: 429 Too Many Requests<br/>(rate_limit_exceeded error)
    end

    Note over Gateway: Get MCP endpoint
    Gateway->>DB: SELECT endpoint FROM mcp_servers<br/>WHERE tenant_id = ? AND active = true
    DB-->>Gateway: MCP endpoint URL

    Note over Gateway: Transform request
    Gateway->>Gateway: Add headers:<br/>- X-Tenant-ID<br/>- X-User-ID<br/>- X-Request-ID<br/>- X-Original-Scopes

    Note over Gateway: Proxy to MCP server
    Gateway->>MCP: GET /files/list<br/>Headers: X-Tenant-ID, X-User-ID

    alt MCP server error
        MCP-->>Gateway: 500 Internal Server Error
        Gateway->>Audit: LOG mcp_server_error
        Gateway-->>AI: 502 Bad Gateway<br/>(upstream_error)
    else MCP server timeout
        Gateway->>Audit: LOG mcp_timeout
        Gateway-->>AI: 504 Gateway Timeout<br/>(upstream_timeout)
    end

    MCP-->>Gateway: 200 OK + Response data

    Note over Gateway: Transform response
    Gateway->>Gateway: Remove internal headers
    Gateway->>Gateway: Add response headers:<br/>- X-Request-ID<br/>- X-RateLimit-Remaining

    Gateway->>Audit: LOG successful_request<br/>Details: tenant, user, endpoint, latency
    Audit->>DB: INSERT INTO audit_logs

    Gateway-->>AI: 200 OK + Transformed response
```

### MCP Proxy Features

1. **Token Validation**: JWT verification with caching
2. **Tenant Isolation**: Tenant-aware routing
3. **Scope Enforcement**: Per-endpoint scope requirements
4. **Rate Limiting**: Per-tenant and per-user limits
5. **Audit Logging**: Complete request audit trail
6. **Circuit Breaker**: Prevents cascading failures

## Client Registration Flow

Dynamic client registration (RFC 7591) for self-service onboarding.

```mermaid
sequenceDiagram
    autonumber
    participant Dev as Developer
    participant Dashboard as Admin Dashboard
    participant Gateway as OAuth Gateway
    participant DB as PostgreSQL
    participant Audit as Audit Service

    Dev->>Dashboard: Navigate to /clients/new

    Dashboard->>Dev: Show registration form

    Dev->>Dashboard: Submit form:<br/>- name: "My App"<br/>- redirect_uris: [...]<br/>- application_type: "web"<br/>- description: "..."

    Dashboard->>Gateway: POST /admin/api/tenants/:id/clients<br/>Authorization: Bearer <ADMIN_TOKEN><br/>{<br/>  "client_name": "My App",<br/>  "redirect_uris": [...],<br/>  "grant_types": ["authorization_code"],<br/>  "response_types": ["code"],<br/>  "token_endpoint_auth_method": "client_secret_post"<br/>}

    Note over Gateway: Validate service token
    Gateway->>Gateway: Constant-time compare with ADMIN_TOKEN
    Gateway->>Gateway: tenant_id from URL path

    Note over Gateway: Validate registration request
    alt Missing required fields
        Gateway-->>Dashboard: 400 Bad Request<br/>(invalid_client_metadata)
    else Invalid redirect URI
        Gateway-->>Dashboard: 400 Bad Request<br/>(invalid_redirect_uri)
    else Unsupported grant type
        Gateway-->>Dashboard: 400 Bad Request<br/>(unsupported_grant_type)
    end

    Note over Gateway: Generate client credentials
    Gateway->>Gateway: client_id = generate_id()<br/>client_secret = generate_secret(32)<br/>client_id_issued_at = now()<br/>client_secret_expires_at = null

    Note over Gateway: Store client
    Gateway->>DB: INSERT INTO clients<br/>(client_id, client_secret,<br/>tenant_id, name, redirect_uris,<br/>grant_types, created_at)
    DB-->>Gateway: Success

    Gateway->>Audit: LOG client_registered<br/>Details: client_id, tenant_id, admin_user
    Audit->>DB: INSERT INTO audit_logs

    Gateway-->>Dashboard: 201 Created<br/>{<br/>  "client_id": "client_...",<br/>  "client_secret": "secret_...",<br/>  "client_id_issued_at": 1234567890,<br/>  "client_name": "My App",<br/>  "redirect_uris": [...],<br/>  "grant_types": ["authorization_code"],<br/>  "response_types": ["code"]<br/>}

    Dashboard->>Dev: Display credentials<br/>⚠️ Save client_secret now!

    Note over Dev: Developer saves credentials securely
```

Clients can also self-register directly against the public `POST /oauth/register` endpoint (RFC 7591) without an admin token.

### Registration Security

1. **Admin Authentication**: Dashboard-driven registration uses the `ADMIN_TOKEN` service token
2. **Tenant Isolation**: Clients scoped to tenant
3. **URI Validation**: Strict redirect URI validation
4. **Secure Secret Generation**: Cryptographically random secrets
5. **Audit Trail**: All registrations logged

## Multi-Tenant Request Handling

How tenant isolation is enforced throughout the request lifecycle.

```mermaid
sequenceDiagram
    autonumber
    participant AI1 as AI Client<br/>(Tenant A)
    participant AI2 as AI Client<br/>(Tenant B)
    participant Gateway as OAuth Gateway
    participant DB as PostgreSQL
    participant Mem as In-Memory Store

    Note over AI1,AI2: Both clients make requests

    AI1->>Gateway: GET /mcp/data<br/>Authorization: Bearer <TOKEN_A>
    AI2->>Gateway: GET /mcp/data<br/>Authorization: Bearer <TOKEN_B>

    Note over Gateway: Extract tenant from token A
    Gateway->>Gateway: Verify JWT A
    Gateway->>Gateway: tenant_id_A = claims.tenant_id
    Gateway->>Gateway: user_id_A = claims.sub

    Note over Gateway: Extract tenant from token B
    Gateway->>Gateway: Verify JWT B
    Gateway->>Gateway: tenant_id_B = claims.tenant_id
    Gateway->>Gateway: user_id_B = claims.sub

    Note over Gateway: Query with tenant isolation (Tenant A)
    Gateway->>DB: SELECT * FROM mcp_servers<br/>WHERE tenant_id = '<TENANT_A>'<br/>AND active = true
    DB-->>Gateway: MCP endpoint for Tenant A

    Note over Gateway: Query with tenant isolation (Tenant B)
    Gateway->>DB: SELECT * FROM mcp_servers<br/>WHERE tenant_id = '<TENANT_B>'<br/>AND active = true
    DB-->>Gateway: MCP endpoint for Tenant B

    Note over Gateway: Rate limiting per tenant
    Gateway->>Mem: INCR rate:tenant:<TENANT_A>:user:<USER_A>
    Gateway->>Mem: INCR rate:tenant:<TENANT_B>:user:<USER_B>

    Note over Gateway: Proxy with tenant headers
    Gateway->>MCP_A: GET /data<br/>X-Tenant-ID: <TENANT_A><br/>X-User-ID: <USER_A>
    Gateway->>MCP_B: GET /data<br/>X-Tenant-ID: <TENANT_B><br/>X-User-ID: <USER_B>

    MCP_A-->>Gateway: Tenant A data
    MCP_B-->>Gateway: Tenant B data

    Gateway-->>AI1: Response (Tenant A data only)
    Gateway-->>AI2: Response (Tenant B data only)

    Note over Gateway,DB: Audit logs with tenant isolation
    Gateway->>DB: INSERT INTO audit_logs<br/>(tenant_id='<TENANT_A>', ...)
    Gateway->>DB: INSERT INTO audit_logs<br/>(tenant_id='<TENANT_B>', ...)
```

### Tenant Isolation Guarantees

1. **JWT Claims**: Tenant ID embedded in token
2. **Database Queries**: All queries include `WHERE tenant_id = ?`
3. **Rate Limits**: Separate limits per tenant
4. **Cache Keys**: Tenant ID in all cache keys
5. **Audit Logs**: Tenant-scoped logging
6. **Row-Level Security**: Database-level isolation

## Rate Limiting Flow

Token bucket algorithm implementation for rate limiting.

```mermaid
sequenceDiagram
    autonumber
    participant AI as AI Client
    participant Gateway as OAuth Gateway
    participant Rate as Rate Limiter
    participant Mem as In-Memory Store

    AI->>Gateway: API Request
    Gateway->>Rate: Check rate limit<br/>tenant_id, user_id, endpoint

    Rate->>Rate: Calculate rate limit key:<br/>rate:tenant:<ID>:user:<ID>:endpoint:<EP>

    Rate->>Mem: GET rate limit key
    Mem-->>Rate: {count: 95, reset_at: timestamp}

    alt No existing rate limit data
        Rate->>Rate: Initialize:<br/>count = 0<br/>reset_at = now + window<br/>limit = 100 (configured)
    end

    Rate->>Rate: Check if reset_at expired
    alt Window expired
        Rate->>Rate: Reset:<br/>count = 0<br/>reset_at = now + window
    end

    Rate->>Rate: Increment count
    Rate->>Rate: count = count + 1

    alt count > limit
        Rate->>Mem: Save current state<br/>TTL: until reset_at
        Rate-->>Gateway: RATE_LIMIT_EXCEEDED<br/>retry_after: reset_at - now
        Gateway-->>AI: 429 Too Many Requests<br/>Retry-After: 60<br/>X-RateLimit-Limit: 100<br/>X-RateLimit-Remaining: 0<br/>X-RateLimit-Reset: <timestamp>
    else count <= limit
        Rate->>Mem: Save updated state<br/>TTL: until reset_at
        Rate-->>Gateway: OK<br/>remaining: limit - count
        Gateway->>Gateway: Add rate limit headers
        Gateway-->>AI: 200 OK<br/>X-RateLimit-Limit: 100<br/>X-RateLimit-Remaining: 5<br/>X-RateLimit-Reset: <timestamp>
    end
```

### Rate Limiting Configuration

| Level | Window | Limit | Scope |
|-------|--------|-------|-------|
| **Per-IP** | 1 minute | 60 | Global |
| **Per-Client** | 1 hour | 10,000 | Per endpoint type |
| **Per-Tenant** | 1 hour | 100,000 | All endpoints |
| **Per-User** | 1 hour | 1,000 | Per endpoint |

## Session Management Flow

Secure session lifecycle with regeneration on authentication.

```mermaid
sequenceDiagram
    autonumber
    participant User as End User
    participant Browser as Browser
    participant Gateway as OAuth Gateway
    participant Mem as In-Memory Store

    Note over Browser,Gateway: Initial Session Creation
    Browser->>Gateway: GET /oauth/authorize (first visit)
    Gateway->>Gateway: Generate session ID
    Gateway->>Gateway: session_data = {<br/>  id: uuid(),<br/>  created_at: now(),<br/>  csrf_token: random()<br/>}
    Gateway->>Mem: PUT session:<SESSION_ID><br/>TTL: 1800 seconds
    Gateway-->>Browser: Set-Cookie: session_id=...<br/>HttpOnly; Secure; SameSite=Strict

    Note over User,Gateway: User Authentication
    User->>Browser: Enter credentials
    Browser->>Gateway: POST /login<br/>Cookie: session_id=OLD_ID

    Gateway->>Mem: GET session:OLD_ID
    Mem-->>Gateway: Old session data

    Gateway->>Gateway: Validate CSRF token
    Gateway->>Gateway: Authenticate user

    Note over Gateway: Session Regeneration (Security)
    Gateway->>Gateway: Generate NEW session ID
    Gateway->>Gateway: new_session_data = {<br/>  id: new_uuid(),<br/>  user_id: USER_ID,<br/>  authenticated_at: now(),<br/>  csrf_token: new_random()<br/>}

    Gateway->>Mem: PUT session:NEW_ID<br/>TTL: 3600 seconds
    Gateway->>Mem: DELETE session:OLD_ID

    Gateway-->>Browser: Set-Cookie: session_id=NEW_ID<br/>HttpOnly; Secure; SameSite=Strict

    Note over Browser,Gateway: Subsequent Requests
    Browser->>Gateway: GET /dashboard<br/>Cookie: session_id=NEW_ID

    Gateway->>Mem: GET session:NEW_ID
    Mem-->>Gateway: Session data with user_id

    alt Session expired
        Gateway->>Mem: DELETE session:NEW_ID
        Gateway-->>Browser: 401 Unauthorized<br/>Redirect to /login
    else Session valid
        Gateway->>Gateway: Extend session TTL
        Gateway->>Mem: EXPIRE session:NEW_ID 3600
        Gateway-->>Browser: 200 OK + Page content
    end

    Note over User,Gateway: Logout
    User->>Browser: Click logout
    Browser->>Gateway: POST /logout<br/>Cookie: session_id=NEW_ID

    Gateway->>Mem: DELETE session:NEW_ID
    Gateway-->>Browser: Clear-Cookie: session_id<br/>Redirect to /login
```

### Session Security Features

1. **Session Regeneration**: New ID after authentication
2. **HttpOnly Cookies**: Prevents XSS access
3. **Secure Flag**: HTTPS only
4. **SameSite=Strict**: CSRF protection
5. **Short TTL**: 30-minute inactivity timeout
6. **CSRF Tokens**: Per-session tokens

## Error Handling Flow

Enhanced error responses with user guidance and resolution steps.

```mermaid
sequenceDiagram
    autonumber
    participant AI as AI Client
    participant Gateway as OAuth Gateway
    participant ErrorHandler as Error Handler
    participant Audit as Audit Logger

    AI->>Gateway: Request with invalid parameters

    Note over Gateway: Error occurs
    Gateway->>Gateway: Validation fails:<br/>Missing code_challenge

    Gateway->>ErrorHandler: Handle error:<br/>OAuthError(invalid_pkce)

    ErrorHandler->>ErrorHandler: Generate request_id

    ErrorHandler->>ErrorHandler: Format error response:<br/>{<br/>  error: "invalid_request",<br/>  error_description: "PKCE validation failed",<br/>  error_uri: "/docs/errors/invalid-pkce",<br/>  guidance: {<br/>    user_message: "...",<br/>    resolution_steps: [...],<br/>    documentation: "..."<br/>  }<br/>}

    ErrorHandler->>Audit: LOG error event<br/>Details: error_code, request_id, client_id
    Audit->>DB: INSERT INTO audit_logs

    ErrorHandler-->>Gateway: Formatted error response

    Gateway-->>AI: 400 Bad Request<br/>Content-Type: application/json<br/>X-Request-ID: <UUID><br/>{<br/>  "error": "invalid_request",<br/>  "error_description": "PKCE validation failed: code_challenge parameter is required",<br/>  "error_uri": "https://gateway.com/docs/errors/invalid-pkce",<br/>  "guidance": {<br/>    "user_message": "The PKCE code challenge validation failed.",<br/>    "technical_details": "code_challenge parameter is required",<br/>    "resolution_steps": [<br/>      "Ensure code_challenge is included in authorization request",<br/>      "Verify code_verifier is included in token request",<br/>      "Check that code_challenge_method is S256",<br/>      "Use a reliable PKCE library to generate pairs"<br/>    ],<br/>    "documentation": "https://gateway.com/docs/oauth/pkce",<br/>    "support": "https://support.example.com"<br/>  },<br/>  "timestamp": "2025-01-15T10:30:00Z",<br/>  "request_id": "req_abc123"<br/>}
```

### Error Response Features

1. **OAuth 2.1 Compliance**: Standard error codes
2. **User Guidance**: Clear, actionable messages
3. **Resolution Steps**: Step-by-step fixes
4. **Documentation Links**: Relevant docs
5. **Request Tracking**: Unique request IDs
6. **Audit Logging**: All errors logged

## Related Documentation

- [Architecture Overview](./README.md) - System architecture
- [Component Diagrams](./diagrams.md) - C4 diagrams
- [API Reference](../api-reference.md) - Endpoint documentation
- [Deployment Guide](../deployment.md) - Docker and Railway setup
