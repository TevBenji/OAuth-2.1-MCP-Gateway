import { useState, useEffect, useCallback } from 'react';
import { OAuthMCPClient, MCPRequestOptions, TokenExpiredError } from '@oauth-mcp-gateway/sdk';

interface UseOAuthMCPConfig {
  gatewayUrl: string;
  clientId: string;
  redirectUri: string;
  scopes?: string[];
}

interface UseOAuthMCPReturn {
  client: OAuthMCPClient;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  mcpRequest: <T = any>(options: MCPRequestOptions) => Promise<T>;
  tokenInfo: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
  };
}

export function useOAuthMCP(config: UseOAuthMCPConfig): UseOAuthMCPReturn {
  const [client] = useState(() => new OAuthMCPClient(config));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing tokens on mount
  useEffect(() => {
    const accessToken = localStorage.getItem('oauth_access_token');
    const refreshToken = localStorage.getItem('oauth_refresh_token');
    const expiresAt = localStorage.getItem('oauth_expires_at');

    if (accessToken && refreshToken) {
      client.setAccessToken(accessToken);
      client.setRefreshToken(refreshToken);
      
      // Check if token is still valid
      if (expiresAt && new Date(expiresAt) > new Date()) {
        setIsAuthenticated(true);
      } else {
        // Try to refresh token
        refreshTokens();
      }
    }
  }, [client]);

  const refreshTokens = useCallback(async () => {
    try {
      const tokens = await client.refreshAccessToken();
      
      // Store new tokens
      localStorage.setItem('oauth_access_token', tokens.access_token);
      if (tokens.refresh_token) {
        localStorage.setItem('oauth_refresh_token', tokens.refresh_token);
      }
      localStorage.setItem('oauth_expires_at', 
        new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      );
      
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
    }
  }, [client]);

  const login = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { url, state, codeVerifier } = await client.getAuthorizationUrl();
      
      // Store PKCE parameters
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('code_verifier', codeVerifier);
      
      // Redirect to authorization URL
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  }, [client]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      
      // Revoke tokens if available
      if (client.getAccessToken()) {
        await client.revokeToken();
      }
    } catch (err) {
      console.error('Token revocation failed:', err);
    } finally {
      // Clear stored tokens
      localStorage.removeItem('oauth_access_token');
      localStorage.removeItem('oauth_refresh_token');
      localStorage.removeItem('oauth_expires_at');
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('code_verifier');
      
      setIsAuthenticated(false);
      setLoading(false);
      setError(null);
    }
  }, [client]);

  const mcpRequest = useCallback(async <T = any>(options: MCPRequestOptions): Promise<T> => {
    try {
      setLoading(true);
      setError(null);

      const response = await client.mcpRequest<T>(options);
      return response.result!;
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        // Try to refresh token and retry
        await refreshTokens();
        const response = await client.mcpRequest<T>(options);
        return response.result!;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'MCP request failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client, refreshTokens]);

  // Handle OAuth callback
  const handleCallback = useCallback(async (code: string, state: string) => {
    try {
      setLoading(true);
      setError(null);

      // Verify state
      const storedState = sessionStorage.getItem('oauth_state');
      if (state !== storedState) {
        throw new Error('State mismatch - possible CSRF attack');
      }

      // Exchange code for tokens
      const codeVerifier = sessionStorage.getItem('code_verifier');
      if (!codeVerifier) {
        throw new Error('Missing code verifier');
      }

      const tokens = await client.exchangeCode(code, codeVerifier);
      
      // Store tokens
      localStorage.setItem('oauth_access_token', tokens.access_token);
      if (tokens.refresh_token) {
        localStorage.setItem('oauth_refresh_token', tokens.refresh_token);
      }
      localStorage.setItem('oauth_expires_at', 
        new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      );
      
      // Clean up session storage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('code_verifier');
      
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, [client]);

  const tokenInfo = {
    accessToken: client.getAccessToken(),
    refreshToken: client.getRefreshToken(),
    expiresAt: localStorage.getItem('oauth_expires_at') 
      ? new Date(localStorage.getItem('oauth_expires_at')!) 
      : undefined
  };

  return {
    client,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    mcpRequest,
    tokenInfo,
    handleCallback
  } as UseOAuthMCPReturn & { handleCallback: typeof handleCallback };
}