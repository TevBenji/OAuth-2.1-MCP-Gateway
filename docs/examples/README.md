# OAuth 2.1 MCP Gateway - Code Examples

This directory contains practical examples demonstrating how to integrate the OAuth 2.1 MCP Gateway with various frameworks and platforms.

## Examples Overview

### Frontend Applications

- **[React SPA](./react-spa/)** - Single Page Application with React hooks
- **[Vue.js App](./vue-app/)** - Vue.js application with Composition API
- **[Angular App](./angular-app/)** - Angular application with services
- **[Vanilla JavaScript](./vanilla-js/)** - Pure JavaScript implementation

### Backend Applications

- **[Flask App](./flask-app/)** - Python Flask web application
- **[Django Project](./django-project/)** - Django web framework
- **[FastAPI Service](./fastapi-service/)** - Modern Python API framework
- **[Express.js Server](./express-server/)** - Node.js Express application
- **[Next.js App](./nextjs-app/)** - Full-stack React framework

### Mobile Applications

- **[React Native](./react-native/)** - Cross-platform mobile app
- **[Flutter App](./flutter-app/)** - Dart-based mobile application
- **[iOS Swift](./ios-swift/)** - Native iOS application
- **[Android Kotlin](./android-kotlin/)** - Native Android application

### Desktop Applications

- **[Electron App](./electron-app/)** - Cross-platform desktop app
- **[Tauri App](./tauri-app/)** - Rust-based desktop application

### CLI Tools

- **[Python CLI](./python-cli/)** - Command-line interface tool
- **[Node.js CLI](./nodejs-cli/)** - JavaScript CLI application

### Specialized Examples

- **[Jupyter Notebook](./jupyter-notebook/)** - Interactive Python notebook
- **[Chrome Extension](./chrome-extension/)** - Browser extension
- **[VS Code Extension](./vscode-extension/)** - Editor extension
- **[GitHub Action](./github-action/)** - CI/CD integration

## Quick Start

Each example includes:

- **README.md** - Setup instructions and overview
- **Source code** - Complete working implementation
- **Configuration** - Environment variables and settings
- **Documentation** - Usage guide and API reference

## Common Patterns

### 1. Authorization Code Flow with PKCE

All examples implement the secure OAuth 2.1 authorization code flow with PKCE:

```typescript
// 1. Get authorization URL with PKCE challenge
const { url, state, codeVerifier } = await client.getAuthorizationUrl();

// 2. Redirect user to authorization server
window.location.href = url;

// 3. Handle callback and exchange code for tokens
const tokens = await client.exchangeCode(code, codeVerifier);
```

### 2. Automatic Token Refresh

Examples demonstrate automatic token refresh:

```typescript
try {
  const response = await client.mcpRequest({ method: 'tools/list' });
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // SDK automatically attempts refresh
    const response = await client.mcpRequest({ method: 'tools/list' });
  }
}
```

### 3. Error Handling

Comprehensive error handling for different scenarios:

```typescript
import {
  TokenExpiredError,
  InvalidClientError,
  NetworkError
} from '@oauth-mcp-gateway/sdk';

try {
  // MCP request
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Handle token expiration
  } else if (error instanceof InvalidClientError) {
    // Handle client authentication failure
  } else if (error instanceof NetworkError) {
    // Handle network issues
  }
}
```

### 4. Secure Token Storage

Platform-appropriate token storage:

- **Browser**: Secure session storage or encrypted localStorage
- **Server**: Encrypted session storage or database
- **Mobile**: Secure keychain/keystore
- **Desktop**: OS credential manager

## Environment Setup

Most examples require these environment variables:

```bash
# Gateway configuration
GATEWAY_URL=https://your-gateway.com
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret  # Optional for public clients
REDIRECT_URI=https://yourapp.com/callback

# Application configuration
SECRET_KEY=your-secret-key  # For session encryption
```

## Testing

Examples include test suites demonstrating:

- OAuth flow testing with mocked responses
- MCP request/response handling
- Error scenario testing
- Token refresh testing
- Security validation

## Production Considerations

Examples include production-ready features:

- **Security**: HTTPS enforcement, CSRF protection, secure storage
- **Performance**: Token caching, request optimization
- **Monitoring**: Logging, metrics, error tracking
- **Scalability**: Stateless design, horizontal scaling
- **Reliability**: Retry logic, circuit breakers, graceful degradation

## Contributing

To add a new example:

1. Create a new directory with descriptive name
2. Include complete working code
3. Add comprehensive README.md
4. Include environment configuration
5. Add tests where applicable
6. Update this main README.md

## Support

For help with examples:

- Check the individual README files
- Review the [main documentation](../README.md)
- Open an issue on [GitHub](https://github.com/oauth-mcp-gateway/gateway/issues)
- Join our [community forum](https://community.oauth-mcp-gateway.com)