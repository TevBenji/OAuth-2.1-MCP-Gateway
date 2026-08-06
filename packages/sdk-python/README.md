# OAuth 2.1 MCP Gateway - Python SDK

Official Python client for integrating with the OAuth 2.1 MCP Gateway.

## Installation

```bash
pip install oauth-mcp-gateway
```

## Quick Start

```python
from oauth_mcp_gateway import OAuthMCPClient

# Initialize client
client = OAuthMCPClient(
    gateway_url="https://gateway.example.com",
    client_id="your-client-id",
    redirect_uri="https://yourapp.com/callback",
    scopes=["mcp:read", "mcp:write"]
)

# Get authorization URL
auth_data = client.get_authorization_url()
print(f"Visit: {auth_data['url']}")

# After user authorizes and you receive the code:
tokens = client.exchange_code(code="authorization_code")

# Make MCP requests
response = client.mcp_request(
    method="tools/list",
    params={}
)
```

## Features

- ✅ Full OAuth 2.1 support with mandatory PKCE
- ✅ Automatic token refresh
- ✅ MCP request helpers
- ✅ Dynamic client registration
- ✅ Type hints for better IDE support
- ✅ Comprehensive error handling

## Documentation

See [full documentation](https://docs.oauth-mcp-gateway.com/sdk/python) for detailed usage.
