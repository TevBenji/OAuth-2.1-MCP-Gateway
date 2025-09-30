# Project Structure

## Root Directory Organization

```
oauth-mcp-gateway/
├── src/                    # Source code
├── tests/                  # Test files
├── docs/                   # Documentation
├── scripts/                # Build and deployment scripts
├── migrations/             # Database migrations
├── .kiro/                  # Kiro configuration and specs
├── wrangler.toml          # Cloudflare Workers configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vitest.config.ts       # Test configuration
└── README.md              # Project documentation
```

## Source Code Structure (`src/`)

```
src/
├── index.ts               # Main entry point for Cloudflare Workers
├── types/                 # TypeScript type definitions
│   ├── oauth.ts          # OAuth 2.1 types
│   ├── mcp.ts            # MCP protocol types
│   ├── tenant.ts         # Multi-tenant types
│   └── audit.ts          # Audit logging types
├── handlers/              # HTTP request handlers
│   ├── oauth/            # OAuth 2.1 endpoints
│   │   ├── authorize.ts  # /authorize endpoint
│   │   ├── token.ts      # /token endpoint
│   │   ├── register.ts   # /register endpoint (RFC 7591)
│   │   └── discovery.ts  # /.well-known endpoints
│   ├── mcp/              # MCP request handling
│   │   ├── proxy.ts      # MCP request proxying
│   │   ├── validation.ts # Token validation middleware
│   │   └── routing.ts    # MCP server routing
│   └── admin/            # Admin API endpoints
│       ├── tenants.ts    # Tenant management
│       ├── clients.ts    # OAuth client management
│       └── audit.ts      # Audit log queries
├── services/              # Business logic services
│   ├── oauth/            # OAuth 2.1 services
│   │   ├── pkce.ts       # PKCE utilities
│   │   ├── jwt.ts        # JWT token handling
│   │   └── client.ts     # Client management
│   ├── tenant/           # Multi-tenant services
│   │   ├── isolation.ts  # Tenant isolation logic
│   │   ├── config.ts     # Tenant configuration
│   │   └── billing.ts    # Usage tracking
│   ├── security/         # Security services
│   │   ├── rate-limit.ts # Rate limiting
│   │   ├── audit.ts      # Audit logging
│   │   └── risk.ts       # Risk scoring
│   └── mcp/              # MCP services
│       ├── registry.ts   # MCP server registry
│       ├── proxy.ts      # Request proxying
│       └── scopes.ts     # Scope validation
├── database/              # Database layer
│   ├── schema.ts         # Database schema definitions
│   ├── migrations/       # SQL migration files
│   ├── queries/          # SQL query builders
│   │   ├── tenants.ts    # Tenant queries
│   │   ├── clients.ts    # OAuth client queries
│   │   └── audit.ts      # Audit log queries
│   └── connection.ts     # Database connection management
├── middleware/            # HTTP middleware
│   ├── cors.ts           # CORS handling
│   ├── auth.ts           # Authentication middleware
│   ├── tenant.ts         # Tenant context middleware
│   ├── rate-limit.ts     # Rate limiting middleware
│   └── error.ts          # Error handling middleware
├── utils/                 # Utility functions
│   ├── crypto.ts         # Cryptographic utilities
│   ├── validation.ts     # Input validation schemas
│   ├── errors.ts         # Custom error classes
│   └── constants.ts      # Application constants
└── config/                # Configuration
    ├── environment.ts    # Environment variables
    ├── database.ts       # Database configuration
    └── oauth.ts          # OAuth configuration
```

## Test Structure (`tests/`)

```
tests/
├── unit/                  # Unit tests
│   ├── services/         # Service layer tests
│   ├── handlers/         # Handler tests
│   ├── middleware/       # Middleware tests
│   └── utils/            # Utility tests
├── integration/           # Integration tests
│   ├── oauth-flow.test.ts # Complete OAuth flows
│   ├── mcp-proxy.test.ts  # MCP request proxying
│   └── tenant-isolation.test.ts # Multi-tenant isolation
├── security/              # Security tests
│   ├── pkce.test.ts      # PKCE security validation
│   ├── jwt.test.ts       # JWT security tests
│   └── rate-limit.test.ts # Rate limiting tests
├── performance/           # Performance tests
│   ├── token-validation.test.ts # Token validation speed
│   └── concurrent-requests.test.ts # Load testing
├── fixtures/              # Test data and mocks
│   ├── oauth-clients.json # Mock OAuth clients
│   ├── mcp-servers.json  # Mock MCP servers
│   └── tenants.json      # Mock tenant data
└── helpers/               # Test utilities
    ├── mock-server.ts    # Mock MCP server
    ├── test-client.ts    # OAuth test client
    └── database.ts       # Test database setup
```

## Documentation Structure (`docs/`)

```
docs/
├── api/                   # API documentation
│   ├── oauth-endpoints.md # OAuth 2.1 API reference
│   ├── mcp-integration.md # MCP integration guide
│   └── admin-api.md      # Admin API reference
├── guides/                # Developer guides
│   ├── quickstart.md     # Getting started guide
│   ├── deployment.md     # Deployment instructions
│   ├── multi-tenant.md   # Multi-tenant setup
│   └── security.md       # Security best practices
├── architecture/          # Architecture documentation
│   ├── overview.md       # System architecture
│   ├── oauth-flow.md     # OAuth 2.1 flow diagrams
│   └── database.md       # Database design
└── compliance/            # Compliance documentation
    ├── security.md       # Security controls
    ├── audit.md          # Audit logging
    └── privacy.md        # Privacy controls
```

## Configuration Files

- **wrangler.toml**: Cloudflare Workers deployment configuration
- **package.json**: Dependencies, scripts, and project metadata
- **tsconfig.json**: TypeScript compiler configuration with strict settings
- **vitest.config.ts**: Test framework configuration for edge runtime
- **eslint.config.js**: Linting rules with security focus
- **prettier.config.js**: Code formatting configuration

## Naming Conventions

- **Files**: kebab-case (e.g., `oauth-client.ts`)
- **Directories**: kebab-case (e.g., `oauth/`, `multi-tenant/`)
- **Classes**: PascalCase (e.g., `OAuthClient`, `TenantManager`)
- **Functions**: camelCase (e.g., `validateToken`, `generatePKCE`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `JWT_EXPIRY_TIME`)
- **Interfaces**: PascalCase with descriptive names (e.g., `TokenPayload`, `TenantConfig`)

## Import Organization

1. External libraries (e.g., `hono`, `jose`)
2. Internal types (e.g., `../types/oauth`)
3. Internal services (e.g., `../services/tenant`)
4. Internal utilities (e.g., `../utils/validation`)
5. Relative imports (e.g., `./helpers`)

## Environment-Specific Structure

- **Development**: Local SQLite database, mock external services
- **Staging**: Cloudflare D1, real external integrations
- **Production**: Turso or D1, full monitoring and logging