# OAuth 2.1 MCP Gateway - Architecture Diagrams

This document provides C4 model diagrams at multiple levels of abstraction to help understand the system architecture.

## Table of Contents

1. [Level 1: System Context Diagram](#level-1-system-context-diagram)
2. [Level 2: Container Diagram](#level-2-container-diagram)
3. [Level 3: Component Diagram](#level-3-component-diagram)
4. [Deployment Diagram](#deployment-diagram)

## Level 1: System Context Diagram

Shows the OAuth 2.1 MCP Gateway system and its interactions with external actors and systems.

```mermaid
C4Context
    title System Context Diagram for OAuth 2.1 MCP Gateway

    Person(developer, "Developer", "Develops AI applications using MCP servers")
    Person(admin, "Administrator", "Manages gateway configuration and monitors usage")

    System(gateway, "OAuth 2.1 MCP Gateway", "Provides OAuth 2.1 authentication and authorization for MCP servers")

    System_Ext(aiClient, "AI Clients", "Claude, ChatGPT, Cursor, custom AI applications")
    System_Ext(mcpServer, "MCP Servers", "Filesystem, Database, API integration servers")
    System_Ext(monitoring, "Monitoring System", "Uptime and log monitoring")

    Rel(developer, aiClient, "Builds applications with")
    Rel(aiClient, gateway, "Authenticates via OAuth 2.1 with PKCE")
    Rel(gateway, mcpServer, "Proxies authenticated requests to")
    Rel(admin, gateway, "Configures and monitors")
    Rel(gateway, monitoring, "Exposes health endpoints and logs to")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

### Key Relationships

- **Developers** build AI applications that use **AI Clients**
- **AI Clients** authenticate with the **Gateway** using OAuth 2.1
- **Gateway** proxies authenticated requests to **MCP Servers**
- **Administrators** manage the **Gateway** through the dashboard
- **Gateway** exposes health checks and logs to **Monitoring Systems**

## Level 2: Container Diagram

Shows the major containers (applications, data stores) that make up the OAuth 2.1 MCP Gateway.

```mermaid
C4Container
    title Container Diagram for OAuth 2.1 MCP Gateway

    Person(user, "End User", "User authenticating via AI client")
    Person(admin, "Administrator", "System administrator")

    Container_Boundary(gateway, "OAuth 2.1 MCP Gateway") {
        Container(server, "Gateway Server", "Node.js, Hono", "Handles HTTP requests, OAuth flows, MCP proxying, and the admin API")
        Container(dashboard, "Admin Dashboard", "Next.js 15, React, better-auth", "Web-based administration interface")
        ContainerDb(pg, "PostgreSQL", "postgres:16", "Stores tenants, clients, tokens, MCP server registry, audit logs")
    }

    System_Ext(aiClient, "AI Client", "Claude, ChatGPT, etc.")
    System_Ext(mcpServer, "MCP Server", "Backend MCP servers")

    Rel(user, aiClient, "Uses")
    Rel(aiClient, server, "Makes OAuth requests to", "HTTPS/OAuth 2.1")
    Rel(server, pg, "Reads/writes data", "SQL (Drizzle ORM)")
    Rel(server, mcpServer, "Proxies requests to", "HTTPS/MCP")
    Rel(admin, dashboard, "Manages gateway via", "HTTPS")
    Rel(dashboard, server, "Calls admin API with service token", "HTTPS/REST")
    Rel(dashboard, pg, "Stores dashboard users/sessions", "SQL")

    UpdateRelStyle(user, aiClient, $offsetY="-40")
    UpdateRelStyle(server, mcpServer, $offsetY="20")
```

### Container Responsibilities

| Container | Technology | Responsibility |
|-----------|-----------|----------------|
| **Gateway Server** | Node.js 20+ / Hono 4 | OAuth 2.1 flows, MCP proxying, admin API, rate limiting |
| **Admin Dashboard** | Next.js 15 / better-auth | Configuration UI, tenant/client/server management, audit log views |
| **PostgreSQL** | postgres:16 | All persistent state: tenants, clients, tokens, servers, audit logs, dashboard auth |

Rate limiting and caching are in-process within the gateway server — there is no separate cache store.

## Level 3: Component Diagram

Shows the internal components within the gateway server container.

```mermaid
C4Component
    title Component Diagram for Gateway Server Container

    Container_Boundary(server, "Gateway Server (Node.js + Hono)") {
        Component(router, "HTTP Router", "Hono", "Routes requests to appropriate handlers")

        Component(authHandler, "Authorization Handler", "TypeScript", "Handles /oauth/authorize endpoint")
        Component(tokenHandler, "Token Handler", "TypeScript", "Handles /oauth/token endpoint")
        Component(registerHandler, "Registration Handler", "TypeScript", "Handles /oauth/register")
        Component(mcpProxy, "MCP Proxy Handler", "TypeScript", "Proxies /mcp/* requests")
        Component(adminApi, "Admin API", "TypeScript", "Handles /admin/api/* (service token)")

        Component(authMiddleware, "Auth Middleware", "TypeScript", "Validates OAuth tokens and scopes")
        Component(rateLimiter, "Rate Limiter", "TypeScript", "In-process counters")

        Component(tokenService, "Token Service", "TypeScript", "Generates and validates JWT tokens")
        Component(pkceService, "PKCE Service", "TypeScript", "Validates PKCE challenges")
        Component(clientService, "Client Service", "TypeScript", "Manages OAuth clients")
        Component(auditService, "Audit Service", "TypeScript", "Logs security events")
        Component(registry, "MCP Server Registry", "TypeScript", "Resolves tenant MCP servers")
    }

    ContainerDb_Ext(pg, "PostgreSQL", "Drizzle ORM")
    System_Ext(aiClient, "AI Client")
    System_Ext(mcpServer, "MCP Server")
    System_Ext(dashboard, "Admin Dashboard")

    Rel(aiClient, router, "Makes request to")
    Rel(dashboard, router, "Makes admin calls to")
    Rel(router, authHandler, "Routes to")
    Rel(router, tokenHandler, "Routes to")
    Rel(router, registerHandler, "Routes to")
    Rel(router, mcpProxy, "Routes to")
    Rel(router, adminApi, "Routes to")

    Rel(mcpProxy, authMiddleware, "Uses")
    Rel(mcpProxy, rateLimiter, "Checks limits via")
    Rel(mcpProxy, registry, "Resolves servers via")
    Rel(mcpProxy, auditService, "Logs events via")
    Rel(mcpProxy, mcpServer, "Proxies to")

    Rel(authHandler, pkceService, "Stores challenge via")
    Rel(authHandler, clientService, "Validates client via")
    Rel(tokenHandler, tokenService, "Generates tokens via")
    Rel(tokenHandler, pkceService, "Validates PKCE via")

    Rel(clientService, pg, "Reads/writes")
    Rel(tokenService, pg, "Reads/writes")
    Rel(registry, pg, "Reads")
    Rel(auditService, pg, "Writes logs")
    Rel(adminApi, pg, "Reads/writes")
```

### Component Details

#### HTTP Handlers

| Component | Endpoint | Responsibility |
|-----------|----------|----------------|
| **Authorization Handler** | `GET/POST /oauth/authorize` | OAuth authorization flow with PKCE |
| **Token Handler** | `POST /oauth/token` | Token exchange and refresh |
| **Registration Handler** | `POST /oauth/register` | Dynamic client registration (RFC 7591) |
| **MCP Proxy Handler** | `ALL /mcp/:serverId/*`, `ALL /mcp/resource/*` | Proxies authenticated requests to MCP servers |
| **Admin API** | `/admin/api/*` | Tenant, client, server, audit-log management (Bearer `ADMIN_TOKEN`) |

#### Middleware Components

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| **Auth Middleware** | Validates Bearer tokens and required scopes | JWT verification |
| **Rate Limiter** | Prevents abuse | In-process counters (per-IP on OAuth endpoints, per-token on MCP endpoints) |

#### Service Components

| Component | Responsibility | Dependencies |
|-----------|---------------|--------------|
| **Token Service** | JWT generation/validation | PostgreSQL (refresh tokens) |
| **PKCE Service** | PKCE challenge validation | Crypto API |
| **Client Service** | OAuth client CRUD | PostgreSQL |
| **Audit Service** | Security event logging | PostgreSQL |
| **MCP Server Registry** | Tenant-scoped server lookup with in-memory TTL cache | PostgreSQL |

## Deployment Diagram

Shows the default docker-compose deployment. Railway mirrors the same topology with managed services.

```mermaid
graph TB
    subgraph "Internet"
        User[End Users]
        AI[AI Clients]
    end

    subgraph "Host / Docker Compose"
        Proxy[Reverse Proxy<br/>Caddy or nginx<br/>TLS termination]

        subgraph "gateway container :8787"
            GW[Gateway Server<br/>Node.js + Hono]
        end

        subgraph "dashboard container :3000"
            Dash[Next.js Dashboard]
        end

        subgraph "postgres container :5432"
            PG[(PostgreSQL 16<br/>pgdata volume)]
        end
    end

    subgraph "External Services"
        MCPServers[MCP Servers<br/>Customer Infrastructure]
    end

    User --> Proxy
    AI --> Proxy
    Proxy --> GW
    Proxy --> Dash

    GW --> PG
    Dash --> PG
    Dash -->|Admin API + service token| GW
    GW --> MCPServers

    style GW fill:#4A90E2
    style Dash fill:#50C878
    style PG fill:#F5A623
```

### Deployment Characteristics

| Characteristic | Implementation |
|---------------|----------------|
| **Packaging** | One Docker image per app (`Dockerfile` for gateway, `apps/dashboard/Dockerfile` for dashboard) |
| **Database** | Single PostgreSQL 16 instance with a persistent volume; back up with `pg_dump` |
| **Migrations** | Drizzle migrations from `packages/db/migrations` applied automatically at gateway boot |
| **TLS** | Terminated at a reverse proxy (Caddy/nginx) or the hosting platform |
| **Scaling** | Run additional gateway replicas behind a load balancer; note rate limits are per replica |
| **Hosted option** | Railway: two services from the repo Dockerfiles + Railway Postgres plugin |

## Related Documentation

- [Architecture Overview](./README.md) - High-level architecture description
- [Sequence Diagrams](./flows.md) - Detailed flow documentation
- [API Reference](../api-reference.md) - Complete API documentation
- [Deployment Guide](../deployment.md) - Docker and Railway setup
