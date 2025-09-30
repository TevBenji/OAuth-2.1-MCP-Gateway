# Python SDK Documentation

The OAuth 2.1 MCP Gateway Python SDK provides a complete client library for integrating with the gateway from Python applications.

## Installation

```bash
pip install oauth-mcp-gateway
```

For development dependencies:

```bash
pip install oauth-mcp-gateway[dev]
```

## Quick Start

```python
from oauth_mcp_gateway import OAuthMCPClient

client = OAuthMCPClient(
    gateway_url='https://gateway.example.com',
    client_id='your-client-id',
    redirect_uri='https://yourapp.com/callback',
    scopes=['mcp:read', 'mcp:write']
)
```

## Configuration

### Constructor Parameters

```python
def __init__(
    self,
    gateway_url: str,
    client_id: str,
    redirect_uri: str,
    client_secret: Optional[str] = None,
    scopes: Optional[List[str]] = None,
    tenant_id: Optional[str] = None,
):
```

- `gateway_url`: Gateway base URL (e.g., https://gateway.example.com)
- `client_id`: OAuth client ID
- `redirect_uri`: Redirect URI for authorization code flow
- `client_secret`: OAuth client secret (for confidential clients)
- `scopes`: OAuth scopes to request (defaults to ['mcp:read', 'mcp:write'])
- `tenant_id`: Tenant ID (for multi-tenant deployments)

## Authentication Flow

### 1. Get Authorization URL

```python
auth_data = client.get_authorization_url(
    additional_scopes=['mcp:admin'],
    resource='https://my-mcp-server.com'
)

# Store state and code_verifier for verification
session['oauth_state'] = auth_data['state']
session['code_verifier'] = auth_data['code_verifier']

# Redirect user to authorization URL
return redirect(auth_data['url'])
```

### 2. Handle Authorization Callback

```python
from flask import request, session

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
    
    # Store tokens in session
    session['access_token'] = tokens['access_token']
    session['refresh_token'] = tokens.get('refresh_token')
    
    return 'Authentication successful!'
```

### 3. Make MCP Requests

```python
# List available tools
tools_response = client.mcp_request(
    method='tools/list',
    params={}
)

print('Available tools:', tools_response['result'])

# Call a specific tool
weather_response = client.mcp_request(
    method='tools/call',
    params={
        'name': 'get_weather',
        'arguments': {
            'location': 'San Francisco'
        }
    }
)

print('Weather data:', weather_response['result'])
```

## Advanced Usage

### Token Management

```python
# Set tokens manually
client.set_access_token('your-access-token', expires_in=3600)
client.set_refresh_token('your-refresh-token')

# Check token expiration
if client.is_token_expired():
    client.refresh_access_token()

# Get current tokens
access_token = client.get_access_token()
refresh_token = client.get_refresh_token()
```

### Token Introspection

```python
introspection = client.introspect_token()
print('Token active:', introspection['active'])
print('Token scopes:', introspection.get('scope'))
print('Token expires at:', introspection.get('exp'))
```

### Token Revocation

```python
# Revoke current access token
client.revoke_token()

# Revoke specific token
client.revoke_token(token='token-to-revoke', token_type_hint='access_token')
```

### Dynamic Client Registration

```python
registration = OAuthMCPClient.register(
    gateway_url='https://gateway.example.com',
    registration={
        'client_name': 'My MCP Application',
        'redirect_uris': ['https://myapp.com/callback'],
        'grant_types': ['authorization_code', 'refresh_token'],
        'scope': 'mcp:read mcp:write',
        'contacts': ['admin@myapp.com'],
        'logo_uri': 'https://myapp.com/logo.png',
        'client_uri': 'https://myapp.com'
    }
)

print('Client ID:', registration['client_id'])
print('Client Secret:', registration['client_secret'])
```

### Multi-Server MCP Requests

```python
# Target specific MCP server
response = client.mcp_request(
    method='tools/list',
    server='weather-api'
)

# Or use different servers for different requests
weather_tools = client.mcp_request(
    method='tools/list',
    server='weather-api'
)

db_tools = client.mcp_request(
    method='tools/list',
    server='database-tools'
)
```

## Error Handling

The SDK provides specific exception classes for different scenarios:

```python
from oauth_mcp_gateway import (
    OAuthError,
    InvalidRequestError,
    InvalidClientError,
    TokenExpiredError,
    NetworkError
)

try:
    response = client.mcp_request(method='tools/list')
except TokenExpiredError:
    # Token expired, refresh it
    client.refresh_access_token()
    # Retry request
    response = client.mcp_request(method='tools/list')
except InvalidClientError as e:
    # Client authentication failed
    print(f'Invalid client credentials: {e.description}')
except NetworkError as e:
    # Network or server error
    print(f'Network error: {e.original_error}')
except OAuthError as e:
    # Other OAuth errors
    print(f'OAuth error: {e.code} - {e.description}')
```

## Framework Integration

### Flask Application

```python
from flask import Flask, session, request, redirect, jsonify
from oauth_mcp_gateway import OAuthMCPClient, TokenExpiredError

app = Flask(__name__)
app.secret_key = 'your-secret-key'

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
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    client.set_access_token(session['access_token'])
    
    try:
        response = client.mcp_request(method='tools/list')
        return jsonify(response['result'])
    except TokenExpiredError:
        if 'refresh_token' in session:
            client.refresh_access_token(session['refresh_token'])
            session['access_token'] = client.get_access_token()
            response = client.mcp_request(method='tools/list')
            return jsonify(response['result'])
        else:
            return jsonify({'error': 'Token expired'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

### Django Integration

```python
# views.py
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from oauth_mcp_gateway import OAuthMCPClient, TokenExpiredError

def login(request):
    client = OAuthMCPClient(
        gateway_url=settings.GATEWAY_URL,
        client_id=settings.CLIENT_ID,
        redirect_uri=request.build_absolute_uri('/callback/')
    )
    
    auth_data = client.get_authorization_url()
    request.session['oauth_state'] = auth_data['state']
    request.session['code_verifier'] = auth_data['code_verifier']
    
    return redirect(auth_data['url'])

def callback(request):
    code = request.GET.get('code')
    state = request.GET.get('state')
    
    if state != request.session.get('oauth_state'):
        return JsonResponse({'error': 'State mismatch'}, status=400)
    
    client = OAuthMCPClient(
        gateway_url=settings.GATEWAY_URL,
        client_id=settings.CLIENT_ID,
        redirect_uri=request.build_absolute_uri('/callback/')
    )
    
    tokens = client.exchange_code(code, request.session['code_verifier'])
    request.session['access_token'] = tokens['access_token']
    request.session['refresh_token'] = tokens.get('refresh_token')
    
    return redirect('/dashboard/')

@csrf_exempt
def api_tools(request):
    if 'access_token' not in request.session:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    client = OAuthMCPClient(
        gateway_url=settings.GATEWAY_URL,
        client_id=settings.CLIENT_ID,
        redirect_uri=request.build_absolute_uri('/callback/')
    )
    
    client.set_access_token(request.session['access_token'])
    
    try:
        response = client.mcp_request(method='tools/list')
        return JsonResponse(response['result'])
    except TokenExpiredError:
        # Handle token refresh
        if 'refresh_token' in request.session:
            client.refresh_access_token(request.session['refresh_token'])
            request.session['access_token'] = client.get_access_token()
            response = client.mcp_request(method='tools/list')
            return JsonResponse(response['result'])
        else:
            return JsonResponse({'error': 'Token expired'}, status=401)
```

### FastAPI Integration

```python
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from oauth_mcp_gateway import OAuthMCPClient, TokenExpiredError
import os

app = FastAPI()

def get_oauth_client():
    return OAuthMCPClient(
        gateway_url=os.environ['GATEWAY_URL'],
        client_id=os.environ['CLIENT_ID'],
        client_secret=os.environ.get('CLIENT_SECRET'),
        redirect_uri='http://localhost:8000/callback',
        scopes=['mcp:read', 'mcp:write']
    )

@app.get('/login')
async def login(request: Request, client: OAuthMCPClient = Depends(get_oauth_client)):
    auth_data = client.get_authorization_url()
    request.session['oauth_state'] = auth_data['state']
    request.session['code_verifier'] = auth_data['code_verifier']
    return RedirectResponse(auth_data['url'])

@app.get('/callback')
async def callback(
    request: Request,
    code: str,
    state: str,
    client: OAuthMCPClient = Depends(get_oauth_client)
):
    if state != request.session.get('oauth_state'):
        raise HTTPException(status_code=400, detail='State mismatch')
    
    tokens = client.exchange_code(code, request.session['code_verifier'])
    request.session['access_token'] = tokens['access_token']
    request.session['refresh_token'] = tokens.get('refresh_token')
    
    return RedirectResponse('/dashboard')

@app.get('/api/tools')
async def get_tools(
    request: Request,
    client: OAuthMCPClient = Depends(get_oauth_client)
):
    if 'access_token' not in request.session:
        raise HTTPException(status_code=401, detail='Not authenticated')
    
    client.set_access_token(request.session['access_token'])
    
    try:
        response = client.mcp_request(method='tools/list')
        return response['result']
    except TokenExpiredError:
        if 'refresh_token' in request.session:
            client.refresh_access_token(request.session['refresh_token'])
            request.session['access_token'] = client.get_access_token()
            response = client.mcp_request(method='tools/list')
            return response['result']
        else:
            raise HTTPException(status_code=401, detail='Token expired')
```

## Type Hints

The SDK includes comprehensive type hints for better IDE support:

```python
from typing import Dict, List, Optional, Any
from oauth_mcp_gateway import OAuthMCPClient

# All methods are properly typed
client: OAuthMCPClient = OAuthMCPClient(...)
auth_data: Dict[str, str] = client.get_authorization_url()
tokens: Dict[str, Any] = client.exchange_code(code, verifier)
response: Dict[str, Any] = client.mcp_request(method='tools/list')
```

## Testing

The SDK includes utilities for testing:

```python
import pytest
from unittest.mock import Mock, patch
from oauth_mcp_gateway import OAuthMCPClient

@pytest.fixture
def mock_client():
    with patch('requests.Session') as mock_session:
        client = OAuthMCPClient(
            gateway_url='https://test.example.com',
            client_id='test-client',
            redirect_uri='http://localhost/callback'
        )
        yield client, mock_session

def test_mcp_request(mock_client):
    client, mock_session = mock_client
    
    # Mock successful response
    mock_response = Mock()
    mock_response.ok = True
    mock_response.json.return_value = {
        'result': {'tools': [{'name': 'test_tool'}]}
    }
    mock_session.return_value.post.return_value = mock_response
    
    client.set_access_token('test-token')
    response = client.mcp_request(method='tools/list')
    
    assert response['result']['tools'][0]['name'] == 'test_tool'
```

## Examples

See the [examples directory](../examples/) for complete working examples:

- [Flask Web App](../examples/flask-app/)
- [Django Project](../examples/django-project/)
- [FastAPI Service](../examples/fastapi-service/)
- [CLI Tool](../examples/cli-tool/)
- [Jupyter Notebook](../examples/jupyter-notebook/)

## Requirements

- Python 3.8+
- requests >= 2.31.0

## Development

To contribute to the SDK:

```bash
git clone https://github.com/oauth-mcp-gateway/sdk-python
cd sdk-python
pip install -e .[dev]
pytest
```