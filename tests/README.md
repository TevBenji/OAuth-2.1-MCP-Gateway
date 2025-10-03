# OAuth 2.1 MCP Gateway - Integration Testing Suite

This directory contains comprehensive integration tests for the OAuth 2.1 MCP Gateway, covering all aspects of the system including end-to-end flows, security, performance, and failure scenarios.

## Test Structure

```
tests/
├── integration/           # End-to-end integration tests
│   ├── end-to-end-oauth-flow.test.ts      # Complete OAuth 2.1 flows with real MCP servers
│   ├── multi-tenant-isolation.test.ts      # Multi-tenant isolation verification
│   └── test-runner.ts                       # Test suite orchestrator
├── performance/           # Load and performance tests
│   └── load-testing.test.ts                # Sub-10ms performance requirements
├── security/             # Security-focused tests
│   ├── pkce-security.test.ts               # PKCE implementation security
│   └── token-validation-security.test.ts   # JWT token validation security
├── chaos/                # Chaos engineering tests
│   └── failure-scenarios.test.ts          # System behavior under failures
├── unit/                 # Unit tests (existing)
├── deployment/           # Deployment verification tests (existing)
└── setup.ts              # Global test setup and utilities
```

## Test Categories

### 1. End-to-End OAuth 2.1 Flow Tests (`integration/end-to-end-oauth-flow.test.ts`)

Tests complete OAuth 2.1 authorization code flows with PKCE using real MCP server interactions:

- **Complete Authorization Flow**: Full OAuth 2.1 flow from client registration to MCP resource access
- **PKCE Validation**: Proper PKCE challenge/verifier validation
- **Token Exchange**: Authorization code to access token exchange
- **MCP Resource Access**: Using tokens to access MCP resources with proper context injection
- **Error Handling**: Invalid tokens, expired codes, wrong audiences

**Key Features Tested:**
- RFC 6749 OAuth 2.0 compliance
- RFC 8252 OAuth 2.1 security enhancements
- RFC 7636 PKCE implementation
- RFC 8707 Resource Indicators
- MCP protocol integration

### 2. Multi-Tenant Isolation Tests (`integration/multi-tenant-isolation.test.ts`)

Comprehensive verification of tenant isolation across all system components:

- **OAuth Client Isolation**: Cross-tenant client access prevention
- **MCP Server Registry Isolation**: Tenant-specific server access
- **JWT Token Isolation**: Tenant context in tokens
- **Audit Log Isolation**: Tenant-specific audit trails
- **API Key Isolation**: Per-tenant key management
- **Session Isolation**: Tenant-specific session management
- **Database Row-Level Security**: Automatic tenant filtering
- **Attack Prevention**: Cross-tenant privilege escalation prevention

**Security Guarantees:**
- Complete data isolation between tenants
- Prevention of cross-tenant data access
- Secure tenant context propagation
- Audit trail integrity per tenant

### 3. Load Testing and Performance (`performance/load-testing.test.ts`)

Performance tests to verify sub-10ms requirements and high concurrency handling:

- **Token Validation Performance**: Sub-10ms JWT validation
- **MCP Proxy Performance**: Sub-50ms request proxying
- **Concurrent Request Handling**: 1000+ concurrent requests with 99% success rate
- **Sustained Load Testing**: Performance under continuous load
- **Rate Limiting Performance**: Efficient rate limit enforcement
- **Session Management Performance**: Fast session operations

**Performance Targets:**
- Token validation: < 10ms average
- MCP proxy: < 50ms average
- P95 latency: < 25ms
- P99 latency: < 100ms
- Success rate: > 99%
- Concurrent requests: 1000+

### 4. PKCE Security Tests (`security/pkce-security.test.ts`)

Comprehensive PKCE implementation security verification:

- **Challenge Generation Security**: Cryptographically secure verifiers
- **S256 Challenge Verification**: Proper SHA256 challenge validation
- **Attack Vector Prevention**: Authorization code interception, replay attacks
- **RFC 7636 Compliance**: Full PKCE specification compliance
- **Timing Attack Resistance**: Constant-time verification
- **Storage Security**: Secure challenge storage and expiration

**Security Features:**
- Cryptographically secure random generation
- Timing attack resistance
- Replay attack prevention
- Proper challenge expiration
- Audit logging of security events

### 5. Token Validation Security (`security/token-validation-security.test.ts`)

JWT token security and attack prevention:

- **Token Structure Security**: Proper JWT format validation
- **Signature Security**: Signature tampering detection
- **Payload Security**: Payload modification prevention
- **Expiration Security**: Proper token expiration handling
- **Audience Validation**: Audience confusion attack prevention
- **Issuer Validation**: Issuer substitution attack prevention
- **Replay Attack Prevention**: Token reuse detection
- **Performance Under Attack**: Maintaining performance during attacks

**Attack Vectors Tested:**
- Token tampering
- Signature forgery
- Algorithm confusion
- Privilege escalation
- Tenant isolation bypass
- Timing attacks

### 6. Chaos Engineering Tests (`chaos/failure-scenarios.test.ts`)

System behavior under various failure conditions:

- **Network Failure Scenarios**: Complete and partial network failures
- **Database Failure Scenarios**: Connection failures, query timeouts
- **Cache/KV Store Failures**: Storage system unavailability
- **Service Degradation**: Upstream service performance issues
- **Cascading Failure Prevention**: Tenant isolation during failures
- **Recovery and Resilience**: System recovery from transient failures

**Failure Types:**
- Complete service failures
- Intermittent failures
- Slow network conditions
- Resource exhaustion
- Partial service degradation
- Database connectivity issues

## Running Tests

### Individual Test Suites

```bash
# End-to-end OAuth flow tests
npm run test:integration:e2e

# Multi-tenant isolation tests
npm run test:integration:isolation

# Performance and load tests
npm run test:performance:load

# PKCE security tests
npm run test:security:pkce

# Token validation security tests
npm run test:security:tokens

# Chaos engineering tests
npm run test:chaos:failures
```

### Test Categories

```bash
# All integration tests
npm run test:integration

# All security tests
npm run test:security

# All performance tests
npm run test:performance

# All chaos tests
npm run test:chaos
```

### Complete Test Suite

```bash
# Run complete integration test suite
npm run test:suite

# Run all tests with coverage
npm run test:all

# Watch mode for development
npm run test:watch
```

## Test Environment

### Requirements

- **Node.js**: >= 18.0.0
- **Vitest**: Test framework with Cloudflare Workers support
- **Miniflare**: Cloudflare Workers runtime simulation
- **Web APIs**: Crypto, Performance, Fetch APIs

### Environment Variables

```bash
ENVIRONMENT=test
JWT_ISSUER=https://test.oauth-mcp-gateway.com
CORS_ORIGINS=http://localhost:3000,https://test.example.com
```

### Mock Services

The test suite includes comprehensive mocking for:

- **Cloudflare KV**: Session and cache storage
- **Cloudflare D1**: Database operations
- **MCP Servers**: Upstream service responses
- **Network Requests**: Fetch API mocking
- **Crypto APIs**: Secure random generation

## Performance Benchmarks

### Target Metrics

| Metric | Target | Test Coverage |
|--------|--------|---------------|
| Token Validation | < 10ms | ✅ |
| MCP Proxy Latency | < 50ms | ✅ |
| P95 Latency | < 25ms | ✅ |
| P99 Latency | < 100ms | ✅ |
| Success Rate | > 99% | ✅ |
| Concurrent Requests | 1000+ | ✅ |

### Load Testing Results

The performance tests validate:
- Sub-10ms token validation under load
- High concurrency handling (1000+ requests)
- Sustained performance over time
- Graceful degradation under stress
- Rate limiting efficiency

## Security Testing

### Attack Vectors Covered

1. **OAuth 2.1 Attacks**
   - Authorization code interception
   - PKCE bypass attempts
   - State parameter manipulation
   - Redirect URI validation bypass

2. **JWT Token Attacks**
   - Signature tampering
   - Algorithm confusion
   - Token replay
   - Privilege escalation

3. **Multi-Tenant Attacks**
   - Cross-tenant data access
   - Tenant ID manipulation
   - Privilege escalation across tenants
   - Data leakage through errors

4. **System-Level Attacks**
   - Timing attacks
   - Resource exhaustion
   - Cascading failures
   - Service degradation

### Compliance Verification

- **RFC 6749**: OAuth 2.0 Authorization Framework
- **RFC 8252**: OAuth 2.1 Security Best Practices
- **RFC 7636**: PKCE (Proof Key for Code Exchange)
- **RFC 8707**: Resource Indicators
- **RFC 8414**: Authorization Server Metadata
- **RFC 9728**: Protected Resource Metadata

## Chaos Engineering

### Failure Scenarios

1. **Network Failures**
   - Complete network outages
   - Intermittent connectivity issues
   - High latency conditions
   - Partial service degradation

2. **Infrastructure Failures**
   - Database connection failures
   - Cache/KV store unavailability
   - Service timeouts
   - Resource exhaustion

3. **Cascading Failures**
   - Multi-tenant failure isolation
   - Service dependency failures
   - Recovery mechanisms
   - Graceful degradation

### Resilience Testing

- Circuit breaker patterns
- Retry mechanisms
- Timeout handling
- Graceful degradation
- Error propagation
- Audit logging during failures

## Continuous Integration

### Pre-deployment Testing

```bash
# Complete pre-deployment test suite
npm run test:pre-deploy
```

This runs:
1. Code linting and formatting
2. TypeScript type checking
3. Unit tests
4. Integration tests
5. Security tests
6. Performance benchmarks

### Test Reporting

Tests generate comprehensive reports including:
- Test execution results
- Performance metrics
- Security validation results
- Coverage reports
- Failure analysis

## Contributing

### Adding New Tests

1. **Integration Tests**: Add to `tests/integration/`
2. **Security Tests**: Add to `tests/security/`
3. **Performance Tests**: Add to `tests/performance/`
4. **Chaos Tests**: Add to `tests/chaos/`

### Test Guidelines

1. **Isolation**: Each test should be independent
2. **Cleanup**: Proper setup and teardown
3. **Assertions**: Clear, specific assertions
4. **Documentation**: Comprehensive test descriptions
5. **Performance**: Include timing assertions where relevant
6. **Security**: Test both positive and negative cases

### Mock Guidelines

1. **Realistic**: Mocks should behave like real services
2. **Configurable**: Support different failure scenarios
3. **Deterministic**: Consistent behavior across runs
4. **Performance**: Don't add unnecessary delays
5. **Cleanup**: Restore original implementations

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout values for slow operations
2. **Mock Conflicts**: Ensure proper mock cleanup between tests
3. **Environment Issues**: Verify all required APIs are available
4. **Performance Variance**: Account for system performance differences
5. **Async Issues**: Proper async/await usage in tests

### Debug Mode

```bash
# Run tests with debug output
DEBUG=* npm run test:integration

# Run specific test with verbose output
npm run test:integration:e2e -- --reporter=verbose
```

This comprehensive integration testing suite ensures the OAuth 2.1 MCP Gateway meets all security, performance, and reliability requirements while maintaining excellent developer experience and system resilience.