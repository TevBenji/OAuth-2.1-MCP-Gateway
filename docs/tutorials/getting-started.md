# Getting Started with OAuth 2.1 MCP Gateway

This tutorial will walk you through setting up and using the OAuth 2.1 MCP Gateway to secure your MCP servers.

## What You'll Learn

- How to set up the OAuth 2.1 MCP Gateway
- How to register OAuth clients
- How to implement the OAuth 2.1 flow in your application
- How to make authenticated MCP requests
- Best practices for security and error handling

## Prerequisites

- Basic understanding of OAuth 2.1 and MCP
- A running MCP server (or access to one)
- Docker (with Compose), Node.js 20+/Python development environment

## Step 1: Gateway Setup

Run the gateway with Docker Compose:

```bash
# Clone the repository
git clone <repository-url>
cd oauth-mcp-gateway

# Start PostgreSQL, gateway (:8787), and dashboard (:3000)
docker compose up -d

# Verify
curl http://localhost:8787/health
```

For development with hot reload:

```bash
docker compose up -d postgres
pnpm install
pnpm dev
```

See the [Deployment Guide](../deployment.md) for production configuration (secrets, TLS, Railway).

## Step 2: Register Your MCP Server

Register your MCP server with the gateway's admin API (Bearer `ADMIN_TOKEN`; the compose default is `dev-admin-token`):

```bash
curl -X POST http://localhost:8787/admin/api/tenants/default/servers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "My Weather API",
    "endpoint_url": "https://my-weather-api.com",
    "resource_identifier": "https://my-weather-api.com",
    "required_scopes": ["mcp:tools:read", "mcp:tools:write"]
  }'
```

You can also do this from the dashboard at http://localhost:3000.

## Step 3: Register Your Client Application

### Dynamic Registration (Recommended)

**TypeScript:**
```typescript
import { OAuthMCPClient } from '@oauth-mcp-gateway/sdk';

const registration = await OAuthMCPClient.register(
  'http://localhost:8787',
  {
    client_name: 'My MCP Client',
    redirect_uris: ['https://myapp.com/callback'],
    grant_types: ['authorization_code', 'refresh_token'],
    scope: 'mcp:tools:read mcp:tools:write',
  }
);

console.log('Client ID:', registration.client_id);
console.log('Client Secret:', registration.client_secret);
```

**Python:**
```python
from oauth_mcp_gateway import OAuthMCPClient

registration = OAuthMCPClient.register(
    gateway_url='http://localhost:8787',
    registration={
        'client_name': 'My MCP Client',
        'redirect_uris': ['https://myapp.com/callback'],
        'grant_types': ['authorization_code', 'refresh_token'],
        'scope': 'mcp:tools:read mcp:tools:write',
    }
)

print(f"Client ID: {registration['client_id']}")
print(f"Client Secret: {registration['client_secret']}")
```

### Manual Registration

Contact your gateway administrator to manually register your client.

## Step 4: Implement OAuth Flow

### Initialize the Client

**TypeScript:**
```typescript
import { OAuthMCPClient } from '@oauth-mcp-gateway/sdk';

const client = new OAuthMCPClient({
  gatewayUrl: 'http://localhost:8787',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret', // Optional for public clients
  redirectUri: 'https://myapp.com/callback',
  scopes: ['mcp:tools:read', 'mcp:tools:write'],
});
```

**Python:**
```python
from oauth_mcp_gateway import OAuthMCPClient

client = OAuthMCPClient(
    gateway_url='http://localhost:8787',
    client_id='your-client-id',
    client_secret='your-client-secret',  # Optional for public clients
    redirect_uri='https://myapp.com/callback',
    scopes=['mcp:tools:read', 'mcp:tools:write']
)
```

### Start Authorization Flow

**TypeScript:**
```typescript
// Get authorization URL
const { url, state, codeVerifier } = await client.getAuthorizationUrl({
  resource: 'https://my-weather-api.com' // Target specific MCP server
});

// Store PKCE parameters securely
sessionStorage.setItem('oauth_state', state);
sessionStorage.setItem('code_verifier', codeVerifier);

// Redirect user to authorization URL
window.location.href = url;
```

**Python:**
```python
# Get authorization URL
auth_data = client.get_authorization_url(
    resource='https://my-weather-api.com'  # Target specific MCP server
)

# Store PKCE parameters securely
session['oauth_state'] = auth_data['state']
session['code_verifier'] = auth_data['code_verifier']

# Redirect user to authorization URL
return redirect(auth_data['url'])
```

### Handle Authorization Callback

**TypeScript:**
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

// Store tokens securely
localStorage.setItem('access_token', tokens.access_token);
localStorage.setItem('refresh_token', tokens.refresh_token);

console.log('Authentication successful!');
```

**Python:**
```python
@app.route('/callback')
def callback():
    code = request.args.get('code')
    returned_state = request.args.get('state')
    
    # Verify state to prevent CSRF attacks
    if returned_state != session.get('oauth_state'):
        return 'State mismatch - possible CSRF attack', 400
    
    # Exchange code for tokens
    code_verifier = session.get('code_verifier')
    tokens = client.exchange_code(code, code_verifier)
    
    # Store tokens securely
    session['access_token'] = tokens['access_token']
    session['refresh_token'] = tokens.get('refresh_token')
    
    return 'Authentication successful!'
```

## Step 5: Make MCP Requests

### List Available Tools

**TypeScript:**
```typescript
// Set the access token
client.setAccessToken(localStorage.getItem('access_token')!);

// List available tools
const toolsResponse = await client.mcpRequest({
  method: 'tools/list',
  params: {}
});

console.log('Available tools:', toolsResponse.result);
```

**Python:**
```python
# Set the access token
client.set_access_token(session['access_token'])

# List available tools
tools_response = client.mcp_request(
    method='tools/list',
    params={}
)

print('Available tools:', tools_response['result'])
```

### Call a Tool

**TypeScript:**
```typescript
const weatherResponse = await client.mcpRequest({
  method: 'tools/call',
  params: {
    name: 'get_weather',
    arguments: {
      location: 'San Francisco',
      units: 'celsius'
    }
  }
});

console.log('Weather data:', weatherResponse.result);
```

**Python:**
```python
weather_response = client.mcp_request(
    method='tools/call',
    params={
        'name': 'get_weather',
        'arguments': {
            'location': 'San Francisco',
            'units': 'celsius'
        }
    }
)

print('Weather data:', weather_response['result'])
```

## Step 6: Handle Token Refresh

### Automatic Refresh (Recommended)

The SDK automatically handles token refresh when making requests:

**TypeScript:**
```typescript
try {
  const response = await client.mcpRequest({ method: 'tools/list' });
  // Token is automatically refreshed if expired
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Redirect to login if refresh fails
    window.location.href = '/login';
  }
}
```

**Python:**
```python
from oauth_mcp_gateway import TokenExpiredError

try:
    response = client.mcp_request(method='tools/list')
    # Token is automatically refreshed if expired
except TokenExpiredError:
    # Redirect to login if refresh fails
    return redirect('/login')
```

### Manual Refresh

**TypeScript:**
```typescript
if (client.isTokenExpired()) {
  const newTokens = await client.refreshAccessToken();
  localStorage.setItem('access_token', newTokens.access_token);
  if (newTokens.refresh_token) {
    localStorage.setItem('refresh_token', newTokens.refresh_token);
  }
}
```

**Python:**
```python
if client.is_token_expired():
    new_tokens = client.refresh_access_token()
    session['access_token'] = new_tokens['access_token']
    if 'refresh_token' in new_tokens:
        session['refresh_token'] = new_tokens['refresh_token']
```

## Step 7: Error Handling

### Common Error Scenarios

**TypeScript:**
```typescript
import {
  TokenExpiredError,
  InvalidClientError,
  NetworkError,
  OAuthError
} from '@oauth-mcp-gateway/sdk';

try {
  const response = await client.mcpRequest({ method: 'tools/list' });
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Token expired - redirect to login
    window.location.href = '/login';
  } else if (error instanceof InvalidClientError) {
    // Client credentials invalid
    console.error('Invalid client credentials');
  } else if (error instanceof NetworkError) {
    // Network or server error
    console.error('Network error:', error.originalError);
  } else if (error instanceof OAuthError) {
    // Other OAuth errors
    console.error('OAuth error:', error.code, error.description);
  } else {
    // Unexpected error
    console.error('Unexpected error:', error);
  }
}
```

**Python:**
```python
from oauth_mcp_gateway import (
    TokenExpiredError,
    InvalidClientError,
    NetworkError,
    OAuthError
)

try:
    response = client.mcp_request(method='tools/list')
except TokenExpiredError:
    # Token expired - redirect to login
    return redirect('/login')
except InvalidClientError as e:
    # Client credentials invalid
    print(f'Invalid client credentials: {e.description}')
except NetworkError as e:
    # Network or server error
    print(f'Network error: {e.original_error}')
except OAuthError as e:
    # Other OAuth errors
    print(f'OAuth error: {e.code} - {e.description}')
except Exception as e:
    # Unexpected error
    print(f'Unexpected error: {e}')
```

## Security Best Practices

### 1. State Parameter Validation

Always verify the state parameter to prevent CSRF attacks:

```typescript
// Store state securely
const state = generateRandomString();
sessionStorage.setItem('oauth_state', state);

// Verify state in callback
if (returnedState !== sessionStorage.getItem('oauth_state')) {
  throw new Error('State mismatch');
}
```

### 2. Secure Token Storage

- **Browser**: Use secure storage (avoid localStorage for sensitive data)
- **Server**: Use secure session storage with proper encryption
- **Mobile**: Use secure keychain/keystore

### 3. Token Rotation

Implement proper token rotation:

```typescript
// Refresh tokens before they expire
if (client.isTokenExpired()) {
  await client.refreshAccessToken();
}

// Revoke tokens on logout
await client.revokeToken();
```

### 4. HTTPS Only

Always use HTTPS for all OAuth endpoints and redirects.

### 5. Scope Minimization

Request only the scopes you need:

```typescript
const client = new OAuthMCPClient({
  // ...
  scopes: ['mcp:tools:read'], // Minimal scopes
});
```

## Next Steps

- [API Reference](../api-reference.md)
- [Deployment Guide](../deployment.md)
- [Production Checklist](../deployment/production-checklist.md)
- [Architecture Overview](../architecture/README.md)

## Troubleshooting

### Common Issues

1. **State mismatch error**
   - Ensure state parameter is properly stored and verified
   - Check for session storage issues

2. **Token expired error**
   - Implement proper token refresh logic
   - Check token expiration handling

3. **Invalid client error**
   - Verify client ID and secret
   - Check client registration

4. **Network errors**
   - Verify gateway URL is correct
   - Check network connectivity
   - Review CORS configuration

### Getting Help

- [Project README](../../README.md)
- Open an issue on the project's GitHub repository