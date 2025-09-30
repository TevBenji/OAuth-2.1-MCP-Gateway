# Quickstart Guide

Get started with the OAuth 2.1 MCP Gateway in minutes.

## Prerequisites

- An OAuth 2.1 MCP Gateway instance (or use our hosted version)
- A registered OAuth client (see [Client Registration](#client-registration))
- Basic understanding of OAuth 2.1 and MCP

## Step 1: Register Your Client

### Option A: Using Dynamic Client Registration (Recommended)

**TypeScript:**
```typescript
import { OAuthMCPClient } from '@oauth-mcp-gateway/sdk';

const registration = await OAuthMCPClient.register(
  'https://gateway.example.com',
  {
    client_name: 'My MCP Client',
    redirect_uris: ['https://myapp.com/callback'],
    grant_types: ['authorization_code', 'refresh_token'],
    scope: 'mcp:read mcp:write',
  }
);

console.log('Client ID:', registration.client_id);
console.log('Client Secret:', registration.client_secret);
```

**Python:**
```python
from oauth_mcp_gateway import OAuthMCPClient

registration = OAuthMCPClient.register(
    gateway_url='https://gateway.example.com',
    registration={
        'client_name': 'My MCP Client',
        'redirect_uris': ['https://myapp.com/callback'],
        'grant_types': ['authorization_code', 'refresh_token'],
        'scope': 'mcp:read mcp:write',
    }
)

print(f"Client ID: {registration['client_id']}")
print(f"Client Secret: {registration['client_secret']}")
```

### Option B: Manual Registration

Contact your gateway administrator to manually register your client.

## Step 2: Initialize the Client

**TypeScript:**
```typescript
import { OAuthMCPClient } from '@oauth-mcp-gateway/sdk';

const client = new OAuthMCPClient({
  gatewayUrl: 'https://gateway.example.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret', // Optional for public clients
  redirectUri: 'https://myapp.com/callback',
  scopes: ['mcp:read', 'mcp:write'],
});
```

**Python:**
```python
from oauth_mcp_gateway import OAuthMCPClient

client = OAuthMCPClient(
    gateway_url='https://gateway.example.com',
    client_id='your-client-id',
    client_secret='your-client-secret',  # Optional for public clients
    redirect_uri='https://myapp.com/callback',
    scopes=['mcp:read', 'mcp:write']
)
```

## Step 3: Implement OAuth Flow

### Authorization Code Flow with PKCE

**TypeScript:**
```typescript
// 1. Get authorization URL
const { url, state, codeVerifier } = await client.getAuthorizationUrl();

// Store state and codeVerifier in session for verification
sessionStorage.setItem('oauth_state', state);
sessionStorage.setItem('code_verifier', codeVerifier);

// 2. Redirect user to authorization URL
window.location.href = url;

// 3. Handle callback (in your /callback route)
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const returnedState = urlParams.get('state');

// Verify state
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

**Python:**
```python
from flask import Flask, request, redirect, session

app = Flask(__name__)
app.secret_key = 'your-secret-key'

@app.route('/login')
def login():
    # 1. Get authorization URL
    auth_data = client.get_authorization_url()

    # Store state and code_verifier in session
    session['oauth_state'] = auth_data['state']
    session['code_verifier'] = auth_data['code_verifier']

    # 2. Redirect to authorization URL
    return redirect(auth_data['url'])

@app.route('/callback')
def callback():
    # 3. Handle callback
    code = request.args.get('code')
    returned_state = request.args.get('state')

    # Verify state
    if returned_state != session.get('oauth_state'):
        return 'State mismatch - possible CSRF attack', 400

    # Exchange code for tokens
    code_verifier = session.get('code_verifier')
    tokens = client.exchange_code(code, code_verifier)

    # Store tokens in session
    session['access_token'] = tokens['access_token']
    session['refresh_token'] = tokens.get('refresh_token')

    return 'Authentication successful!'
```

## Step 4: Make MCP Requests

**TypeScript:**
```typescript
// Make authenticated MCP request
const response = await client.mcpRequest({
  method: 'tools/list',
  params: {},
});

console.log('Available tools:', response.result);

// Invoke a tool
const toolResponse = await client.mcpRequest({
  method: 'tools/call',
  params: {
    name: 'get_weather',
    arguments: {
      location: 'San Francisco',
    },
  },
});

console.log('Weather data:', toolResponse.result);
```

**Python:**
```python
# Make authenticated MCP request
response = client.mcp_request(
    method='tools/list',
    params={}
)

print('Available tools:', response['result'])

# Invoke a tool
tool_response = client.mcp_request(
    method='tools/call',
    params={
        'name': 'get_weather',
        'arguments': {
            'location': 'San Francisco'
        }
    }
)

print('Weather data:', tool_response['result'])
```

## Step 5: Handle Token Refresh

**TypeScript:**
```typescript
// The SDK automatically refreshes tokens, but you can do it manually:
try {
  await client.mcpRequest({ method: 'tools/list' });
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Token expired, refresh it
    await client.refreshAccessToken();

    // Retry request
    const response = await client.mcpRequest({ method: 'tools/list' });
  }
}
```

**Python:**
```python
from oauth_mcp_gateway import TokenExpiredError

# The SDK automatically refreshes tokens, but you can do it manually:
try:
    response = client.mcp_request(method='tools/list')
except TokenExpiredError:
    # Token expired, refresh it
    client.refresh_access_token()

    # Retry request
    response = client.mcp_request(method='tools/list')
```

## Complete Examples

### TypeScript Express Server

```typescript
import express from 'express';
import { OAuthMCPClient } from '@oauth-mcp-gateway/sdk';

const app = express();
const client = new OAuthMCPClient({
  gatewayUrl: process.env.GATEWAY_URL!,
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: 'http://localhost:3000/callback',
  scopes: ['mcp:read', 'mcp:write'],
});

app.get('/login', async (req, res) => {
  const { url, state, codeVerifier } = await client.getAuthorizationUrl();
  req.session.oauth_state = state;
  req.session.code_verifier = codeVerifier;
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (state !== req.session.oauth_state) {
    return res.status(400).send('State mismatch');
  }

  const tokens = await client.exchangeCode(
    code as string,
    req.session.code_verifier
  );

  req.session.access_token = tokens.access_token;
  req.session.refresh_token = tokens.refresh_token;

  res.redirect('/dashboard');
});

app.get('/api/tools', async (req, res) => {
  client.setAccessToken(req.session.access_token);

  try {
    const response = await client.mcpRequest({ method: 'tools/list' });
    res.json(response.result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Python Flask Application

```python
from flask import Flask, request, redirect, session, jsonify
from oauth_mcp_gateway import OAuthMCPClient, TokenExpiredError
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)

client = OAuthMCPClient(
    gateway_url=os.environ['GATEWAY_URL'],
    client_id=os.environ['CLIENT_ID'],
    client_secret=os.environ.get('CLIENT_SECRET'),
    redirect_uri='http://localhost:5000/callback',
    scopes=['mcp:read', 'mcp:write']
)

@app.route('/login')
def login():
    auth_data = client.get_authorization_url()
    session['oauth_state'] = auth_data['state']
    session['code_verifier'] = auth_data['code_verifier']
    return redirect(auth_data['url'])

@app.route('/callback')
def callback():
    code = request.args.get('code')
    state = request.args.get('state')

    if state != session.get('oauth_state'):
        return 'State mismatch', 400

    tokens = client.exchange_code(code, session['code_verifier'])
    session['access_token'] = tokens['access_token']
    session['refresh_token'] = tokens.get('refresh_token')

    return redirect('/dashboard')

@app.route('/api/tools')
def get_tools():
    client.set_access_token(session['access_token'])

    try:
        response = client.mcp_request(method='tools/list')
        return jsonify(response['result'])
    except TokenExpiredError:
        client.refresh_access_token(session['refresh_token'])
        session['access_token'] = client.get_access_token()
        response = client.mcp_request(method='tools/list')
        return jsonify(response['result'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
```

## Next Steps

- [API Reference](./api-reference.md) - Detailed API documentation
- [Authentication Guide](./authentication.md) - Deep dive into OAuth 2.1 flows
- [MCP Integration](./mcp-integration.md) - Advanced MCP server integration
- [Security Best Practices](./security.md) - Secure your implementation
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

## Support

Need help? Check out:

- [Documentation](https://docs.oauth-mcp-gateway.com)
- [GitHub Issues](https://github.com/oauth-mcp-gateway/gateway/issues)
- [Community Forum](https://community.oauth-mcp-gateway.com)
- [Email Support](mailto:support@oauth-mcp-gateway.com)
