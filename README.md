# OAuth 2.1 MCP Gateway

An authentication and authorization proxy that transforms the Model Context Protocol (MCP) ecosystem from insecure static API keys to enterprise-grade OAuth 2.1 authentication.

## Overview

The OAuth 2.1 MCP Gateway acts as a security layer between MCP clients (AI agents like Claude, ChatGPT, Cursor) and MCP servers, implementing OAuth 2.1 with PKCE to solve the critical security gap in MCP deployments.

### Key Features

- **OAuth 2.1 Compliance**: Full OAuth 2.1 authorization server with mandatory PKCE
- **Multi-Tenant Architecture**: Complete tenant isolation and management
- **Edge Computing**: Sub-10ms global latency using Cloudflare Workers
- **Enterprise Security**: Audit logging, session management, and compliance features
- **Zero Configuration**: Simple setup with comprehensive documentation

## Quick Start

### Prerequisites

- Node.js 18+ 
- Cloudflare Workers account
- Wrangler CLI installed

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/oauth-mcp-gateway.git
cd oauth-mcp-gateway

# Install dependencies
npm install

# Configure environment
cp wrangler.toml.example wrangler.toml
# Edit wrangler.toml with your configuration

# Run development server
npm run dev
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

### Deployment

```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy

# Run database migrations
npm run db:migrate
```

## Architecture

The gateway implements a separation of concerns where it acts as the OAuth 2.1 authorization server while MCP servers become stateless resource servers that only validate JWT tokens.

### Core Components

- **OAuth 2.1 Authorization Server**: Handles authentication flows with PKCE
- **Multi-Tenant Management**: Complete tenant isolation and configuration
- **MCP Request Proxy**: Routes authenticated requests to MCP servers
- **Audit System**: Comprehensive logging for compliance and security
- **Edge Runtime**: Cloudflare Workers for global performance

## Configuration

### Environment Variables

- `JWT_ISSUER`: OAuth issuer URL
- `CORS_ORIGINS`: Comma-separated list of allowed origins
- `ENVIRONMENT`: Runtime environment (development/staging/production)

### Cloudflare Workers Bindings

- `SESSIONS`: KV namespace for session storage
- `CACHE`: KV namespace for caching
- `DB`: D1 database for persistent storage

## API Documentation

### OAuth 2.1 Endpoints

- `GET /.well-known/oauth-authorization-server`: Authorization server metadata
- `GET /.well-known/oauth-protected-resource`: Protected resource metadata
- `GET /authorize`: Authorization endpoint
- `POST /token`: Token endpoint
- `POST /register`: Dynamic client registration

### MCP Integration

The gateway automatically handles MCP authentication by:

1. Intercepting unauthenticated MCP requests
2. Returning 401 with OAuth discovery information
3. Processing OAuth 2.1 flows with PKCE
4. Issuing JWT tokens with audience-specific claims
5. Proxying authenticated requests to MCP servers

## Security

### OAuth 2.1 Compliance

- Mandatory PKCE for all authorization code flows
- Resource Indicators (RFC 8707) for audience-specific tokens
- Dynamic Client Registration (RFC 7591)
- Proper error handling and security headers

### Multi-Tenant Isolation

- Row-level security in database
- Tenant-specific JWT claims
- Isolated API key management
- Separate audit logs per tenant

### Enterprise Features

- Comprehensive audit logging
- Session management with concurrent limits
- Risk-based authentication
- Compliance support (PCI-DSS, HIPAA, GDPR)

## Testing

```bash
# Run all tests
npm run test:all

# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run security tests
npm run test:security

# Run performance tests
npm run test:performance
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: [docs/](./docs/)
- Issues: [GitHub Issues](https://github.com/your-org/oauth-mcp-gateway/issues)
- Security: security@your-org.com