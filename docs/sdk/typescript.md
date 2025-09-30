# TypeScript SDK Documentation

The OAuth 2.1 MCP Gateway TypeScript SDK provides a complete client library for integrating with the gateway from TypeScript and JavaScript applications.

## Installation

```bash
npm install @oauth-mcp-gateway/sdk
```

## Quick Start

```typescript
import { OAuthMCPClient } from '@oauth-mcp-gateway/sdk';

const client = new OAuthMCPClient({
  gatewayUrl: 'https://gateway.example.com',
  clientId: 'your-client-id',
  redirectUri: 'https://yourapp.com/callback',
  scopes: ['mcp:read', 'mcp:write']
});
```

## Configuration

### OAuthClientConfig

```typescript
interface OAuthClientConfig {
  /** Gateway base URL (e.g., https://gateway.example.com) */
  gatewayUrl: string;
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret (for confidential clients) */
  clientSecret?: string;
  /** Redirect URI for authorization code flow */
  redirectUri: string;
  /** OAuth scopes to request */
  scopes?: string[];
  /** Tenant ID (for multi-tenant deployments) */
  tenantId?: string;
}
```

## Authentication Flow

### 1. Get Authorization URL

```typescript
const { url, state, codeVerifier } = await client.getAuthorizationUrl({
  additionalScopes: ['mcp:admin'],
  resource: 'https://my-mcp-server.com'
});

// Store state and codeVerifier for verification
sessionStorage.setItem('oauth_state', state);
sessionStorage.setItem('code_verifier', codeVerifier);

// Redirect user to authorization URL
window.location.href = url;
```

### 2. Handle Authorization Callback

```typescript
// In your callback route
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const returnedState = urlParams.get('state');

// Verify state to prevent CSRF attacks
const storedState = sessionStorage.getItem('oauth_state');
if (returnedState !== storedState) {
  throw new Error('State mismatch - possible CSRF attack');
}

// Exchange code for tokens
const codeVerifier = sessionStorage.getItem('code_verifier')!;
const tokens = await client.exchangeCode(code!, codeVerifier);

console.log('Access token:', tokens.access_token);
console.log('Refresh token:', tokens.refresh_token);
```

### 3. Make MCP Requests

```typescript
// List available tools
const toolsResponse = await client.mcpRequest({
  method: 'tools/list',
  params: {}
});

console.log('Available tools:', toolsResponse.result);

// Call a specific tool
const weatherResponse = await client.mcpRequest({
  method: 'tools/call',
  params: {
    name: 'get_weather',
    arguments: {
      location: 'San Francisco'
    }
  }
});

console.log('Weather data:', weatherResponse.result);
```

## Advanced Usage

### Token Management

```typescript
// Set tokens manually
client.setAccessToken('your-access-token', 3600);
client.setRefreshToken('your-refresh-token');

// Check token expiration
if (client.isTokenExpired()) {
  await client.refreshAccessToken();
}

// Get current tokens
const accessToken = client.getAccessToken();
const refreshToken = client.getRefreshToken();
```

### Token Introspection

```typescript
const introspection = await client.introspectToken();
console.log('Token active:', introspection.active);
console.log('Token scopes:', introspection.scope);
console.log('Token expires at:', new Date(introspection.exp! * 1000));
```

### Token Revocation

```typescript
// Revoke current access token
await client.revokeToken();

// Revoke specific token
await client.revokeToken('token-to-revoke', 'access_token');
```

### Dynamic Client Registration

```typescript
const registration = await OAuthMCPClient.register(
  'https://gateway.example.com',
  {
    client_name: 'My MCP Application',
    redirect_uris: ['https://myapp.com/callback'],
    grant_types: ['authorization_code', 'refresh_token'],
    scope: 'mcp:read mcp:write',
    contacts: ['admin@myapp.com'],
    logo_uri: 'https://myapp.com/logo.png',
    client_uri: 'https://myapp.com'
  }
);

console.log('Client ID:', registration.client_id);
console.log('Client Secret:', registration.client_secret);
```

### Multi-Server MCP Requests

```typescript
// Target specific MCP server
const response = await client.mcpRequest({
  method: 'tools/list',
  server: 'weather-api'
});

// Or use different servers for different requests
const weatherTools = await client.mcpRequest({
  method: 'tools/list',
  server: 'weather-api'
});

const dbTools = await client.mcpRequest({
  method: 'tools/list',
  server: 'database-tools'
});
```

## Error Handling

The SDK provides specific error classes for different scenarios:

```typescript
import {
  OAuthError,
  InvalidRequestError,
  InvalidClientError,
  TokenExpiredError,
  NetworkError
} from '@oauth-mcp-gateway/sdk';

try {
  const response = await client.mcpRequest({ method: 'tools/list' });
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Token expired, refresh it
    await client.refreshAccessToken();
    // Retry request
    const response = await client.mcpRequest({ method: 'tools/list' });
  } else if (error instanceof InvalidClientError) {
    // Client authentication failed
    console.error('Invalid client credentials');
  } else if (error instanceof NetworkError) {
    // Network or server error
    console.error('Network error:', error.originalError);
  } else if (error instanceof OAuthError) {
    // Other OAuth errors
    console.error('OAuth error:', error.code, error.description);
  }
}
```

## Framework Integration

### React Hook

```typescript
import { useState, useEffect } from 'react';
import { OAuthMCPClient } from '@oauth-mcp-gateway/sdk';

function useOAuthMCP(config: OAuthClientConfig) {
  const [client] = useState(() => new OAuthMCPClient(config));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    const { url, state, codeVerifier } = await client.getAuthorizationUrl();
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('code_verifier', codeVerifier);
    window.location.href = url;
  };

  const handleCallback = async (code: string, state: string) => {
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('State mismatch');
    }

    const codeVerifier = sessionStorage.getItem('code_verifier')!;
    await client.exchangeCode(code, codeVerifier);
    setIsAuthenticated(true);
  };

  const mcpRequest = async (options: MCPRequestOptions) => {
    setLoading(true);
    try {
      return await client.mcpRequest(options);
    } finally {
      setLoading(false);
    }
  };

  return {
    client,
    isAuthenticated,
    loading,
    login,
    handleCallback,
    mcpRequest
  };
}
```

### Express.js Middleware

```typescript
import express from 'express';
import { OAuthMCPClient } from '@oauth-mcp-gateway/sdk';

const app = express();

// OAuth middleware
app.use('/api', async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const client = new OAuthMCPClient({
      gatewayUrl: process.env.GATEWAY_URL!,
      clientId: process.env.CLIENT_ID!,
      redirectUri: 'http://localhost:3000/callback'
    });

    client.setAccessToken(token);
    const introspection = await client.introspectToken();

    if (!introspection.active) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = {
      sub: introspection.sub,
      scope: introspection.scope,
      client_id: introspection.client_id
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token validation failed' });
  }
});
```

## TypeScript Types

The SDK is fully typed with TypeScript. Key interfaces include:

- `OAuthClientConfig` - Client configuration
- `TokenResponse` - OAuth token response
- `TokenIntrospection` - Token introspection result
- `MCPRequestOptions` - MCP request parameters
- `MCPResponse<T>` - MCP response with generic result type
- `ClientRegistrationRequest` - Dynamic client registration
- `DiscoveryMetadata` - OAuth server metadata

## Browser Support

The SDK works in modern browsers that support:

- Fetch API
- Web Crypto API (for PKCE)
- ES2020 features

For older browsers, you may need polyfills for these features.

## Node.js Support

The SDK works in Node.js environments. For Node.js < 18, you may need to polyfill the Web Crypto API:

```typescript
import { webcrypto } from 'crypto';

// @ts-ignore
global.crypto = webcrypto;
```

## Examples

See the [examples directory](../examples/) for complete working examples:

- [React SPA](../examples/react-spa/)
- [Express Server](../examples/express-server/)
- [Next.js App](../examples/nextjs-app/)
- [Electron App](../examples/electron-app/)