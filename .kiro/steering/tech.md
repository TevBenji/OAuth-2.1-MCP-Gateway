# Technology Stack

## Runtime & Deployment

- **Primary Platform**: Cloudflare Workers (edge computing)
- **Alternative Platforms**: Vercel Edge Functions, AWS Lambda@Edge
- **Language**: TypeScript with strict type checking
- **Build System**: Wrangler CLI for Cloudflare Workers deployment

## Core Technologies

### Backend Framework
- **Runtime**: Cloudflare Workers Runtime (V8 isolates)
- **HTTP Framework**: Hono.js (lightweight, edge-optimized)
- **Validation**: Zod for runtime type validation
- **JWT**: jose library for JWT handling (edge-compatible)

### Database & Storage
- **Primary Database**: Turso (edge SQLite) or Cloudflare D1
- **Session Storage**: Cloudflare KV (key-value store)
- **Audit Logs**: ClickHouse or Cloudflare Analytics Engine
- **File Storage**: Cloudflare R2 (S3-compatible)

### Security & Authentication
- **OAuth 2.1**: Custom implementation with PKCE enforcement
- **Cryptography**: Web Crypto API (native edge support)
- **Rate Limiting**: Cloudflare KV-based sliding window
- **CORS**: Configured for MCP client origins

### Testing & Quality
- **Test Framework**: Vitest with edge runtime compatibility
- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint with security rules
- **Code Formatting**: Prettier

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run type-check

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Build & Deployment
```bash
# Build for production
npm run build

# Deploy to Cloudflare Workers
npm run deploy

# Deploy to staging
npm run deploy:staging

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

### Testing & Quality
```bash
# Run all tests
npm run test:all

# Run integration tests
npm run test:integration

# Run security tests
npm run test:security

# Run performance tests
npm run test:performance

# Lint code
npm run lint

# Format code
npm run format
```

## Architecture Constraints

- **Stateless Design**: All components must be stateless for edge deployment
- **Cold Start Optimization**: Sub-10ms initialization time required
- **Memory Limits**: 128MB memory limit on Cloudflare Workers
- **CPU Limits**: 50ms CPU time per request (can be extended with paid plans)
- **Edge Compatibility**: All dependencies must work in V8 isolates (no Node.js APIs)

## Security Requirements

- **HTTPS Only**: All endpoints must use HTTPS
- **CORS Policy**: Strict CORS configuration for MCP clients
- **Rate Limiting**: Implement at multiple levels (IP, user, tenant)
- **Input Validation**: All inputs validated with Zod schemas
- **SQL Injection Prevention**: Use parameterized queries only
- **XSS Prevention**: Proper content-type headers and sanitization