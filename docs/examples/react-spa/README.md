# React SPA Example

This example demonstrates how to integrate the OAuth 2.1 MCP Gateway with a React Single Page Application.

## Features

- OAuth 2.1 authorization code flow with PKCE
- Automatic token refresh
- MCP tool listing and invocation
- Error handling and loading states
- TypeScript support

## Setup

```bash
npm install
npm start
```

## Key Files

- `src/hooks/useOAuthMCP.ts` - React hook for OAuth integration
- `src/components/LoginButton.tsx` - Login component
- `src/components/MCPTools.tsx` - MCP tools interface
- `src/pages/Callback.tsx` - OAuth callback handler

## Environment Variables

Create a `.env` file:

```
REACT_APP_GATEWAY_URL=https://gateway.example.com
REACT_APP_CLIENT_ID=your-client-id
REACT_APP_REDIRECT_URI=http://localhost:3000/callback
```

## Usage

1. Click "Login" to start OAuth flow
2. Complete authentication in popup/redirect
3. View and interact with MCP tools
4. Tokens are automatically refreshed when needed

## Code Structure

```
src/
├── hooks/
│   └── useOAuthMCP.ts      # OAuth hook
├── components/
│   ├── LoginButton.tsx     # Login component
│   ├── MCPTools.tsx        # Tools interface
│   └── TokenInfo.tsx       # Token display
├── pages/
│   ├── Home.tsx           # Main page
│   └── Callback.tsx       # OAuth callback
└── App.tsx                # App root
```