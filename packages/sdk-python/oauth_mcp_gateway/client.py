"""
OAuth 2.1 MCP Gateway Client
"""

import time
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode
import requests

from .errors import parse_oauth_error, NetworkError, TokenExpiredError
from .pkce import generate_pkce_pair, generate_state


class OAuthMCPClient:
    """OAuth 2.1 MCP Gateway Client"""

    def __init__(
        self,
        gateway_url: str,
        client_id: str,
        redirect_uri: str,
        client_secret: Optional[str] = None,
        scopes: Optional[List[str]] = None,
        tenant_id: Optional[str] = None,
    ):
        """
        Initialize OAuth MCP Client

        Args:
            gateway_url: Gateway base URL (e.g., https://gateway.example.com)
            client_id: OAuth client ID
            redirect_uri: Redirect URI for authorization code flow
            client_secret: OAuth client secret (for confidential clients)
            scopes: OAuth scopes to request
            tenant_id: Tenant ID (for multi-tenant deployments)
        """
        self.gateway_url = gateway_url.rstrip("/")
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri
        self.scopes = scopes or ["mcp:read", "mcp:write"]
        self.tenant_id = tenant_id

        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.token_expiry: Optional[float] = None
        self.code_verifier: Optional[str] = None

        self.session = requests.Session()

    def discover(self) -> Dict[str, Any]:
        """Discover OAuth server metadata"""
        try:
            url = f"{self.gateway_url}/.well-known/oauth-authorization-server"
            response = self.session.get(url)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise NetworkError("Failed to discover OAuth metadata", e)

    def get_authorization_url(
        self,
        state: Optional[str] = None,
        additional_scopes: Optional[List[str]] = None,
        resource: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        Get authorization URL for browser redirect

        Args:
            state: OAuth state parameter for CSRF protection
            additional_scopes: Additional scopes beyond default
            resource: Optional resource indicators (RFC 8707)

        Returns:
            Dictionary with 'url', 'state', and 'code_verifier'
        """
        # Generate PKCE parameters
        verifier, challenge = generate_pkce_pair()
        self.code_verifier = verifier

        # Generate state
        state = state or generate_state()

        # Build authorization URL
        scopes = self.scopes.copy()
        if additional_scopes:
            scopes.extend(additional_scopes)

        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": " ".join(scopes),
            "state": state,
            "code_challenge": challenge,
            "code_challenge_method": "S256",
        }

        if resource:
            params["resource"] = resource

        if self.tenant_id:
            params["tenant_id"] = self.tenant_id

        metadata = self.discover()
        url = f"{metadata['authorization_endpoint']}?{urlencode(params)}"

        return {
            "url": url,
            "state": state,
            "code_verifier": verifier,
        }

    def exchange_code(
        self, code: str, code_verifier: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Exchange authorization code for tokens

        Args:
            code: Authorization code from callback
            code_verifier: PKCE code verifier (optional if stored)

        Returns:
            Token response dictionary
        """
        verifier = code_verifier or self.code_verifier
        if not verifier:
            raise ValueError("Code verifier is required")

        try:
            metadata = self.discover()
            data = {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": self.redirect_uri,
                "client_id": self.client_id,
                "code_verifier": verifier,
            }

            if self.client_secret:
                data["client_secret"] = self.client_secret

            response = self.session.post(
                metadata["token_endpoint"],
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            response_data = response.json()

            if not response.ok:
                raise parse_oauth_error(response_data)

            # Store tokens
            self.access_token = response_data["access_token"]
            self.refresh_token = response_data.get("refresh_token")
            self.token_expiry = time.time() + response_data["expires_in"]

            return response_data
        except requests.RequestException as e:
            raise NetworkError("Failed to exchange authorization code", e)

    def refresh_access_token(
        self, refresh_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Refresh access token using refresh token

        Args:
            refresh_token: Refresh token (optional if stored)

        Returns:
            Token response dictionary
        """
        token = refresh_token or self.refresh_token
        if not token:
            raise ValueError("Refresh token is required")

        try:
            metadata = self.discover()
            data = {
                "grant_type": "refresh_token",
                "refresh_token": token,
                "client_id": self.client_id,
            }

            if self.client_secret:
                data["client_secret"] = self.client_secret

            response = self.session.post(
                metadata["token_endpoint"],
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            response_data = response.json()

            if not response.ok:
                raise parse_oauth_error(response_data)

            # Update stored tokens
            self.access_token = response_data["access_token"]
            if "refresh_token" in response_data:
                self.refresh_token = response_data["refresh_token"]
            self.token_expiry = time.time() + response_data["expires_in"]

            return response_data
        except requests.RequestException as e:
            raise NetworkError("Failed to refresh access token", e)

    def revoke_token(
        self,
        token: Optional[str] = None,
        token_type_hint: Optional[str] = None,
    ) -> None:
        """
        Revoke token

        Args:
            token: Token to revoke (optional if using stored token)
            token_type_hint: 'access_token' or 'refresh_token'
        """
        token_to_revoke = token or self.access_token
        if not token_to_revoke:
            raise ValueError("Token is required")

        try:
            metadata = self.discover()
            if "revocation_endpoint" not in metadata:
                raise ValueError("Revocation endpoint not available")

            data = {
                "token": token_to_revoke,
                "client_id": self.client_id,
            }

            if token_type_hint:
                data["token_type_hint"] = token_type_hint

            if self.client_secret:
                data["client_secret"] = self.client_secret

            response = self.session.post(
                metadata["revocation_endpoint"],
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if not response.ok:
                response_data = response.json()
                raise parse_oauth_error(response_data)

            # Clear stored tokens if revoking current token
            if token == self.access_token or not token:
                self.access_token = None
                self.token_expiry = None
            if token_type_hint == "refresh_token" or token == self.refresh_token:
                self.refresh_token = None
        except requests.RequestException as e:
            raise NetworkError("Failed to revoke token", e)

    def introspect_token(self, token: Optional[str] = None) -> Dict[str, Any]:
        """
        Introspect token

        Args:
            token: Token to introspect (optional if using stored token)

        Returns:
            Token introspection response
        """
        token_to_introspect = token or self.access_token
        if not token_to_introspect:
            raise ValueError("Token is required")

        try:
            metadata = self.discover()
            if "introspection_endpoint" not in metadata:
                raise ValueError("Introspection endpoint not available")

            data = {
                "token": token_to_introspect,
                "client_id": self.client_id,
            }

            if self.client_secret:
                data["client_secret"] = self.client_secret

            response = self.session.post(
                metadata["introspection_endpoint"],
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if not response.ok:
                response_data = response.json()
                raise parse_oauth_error(response_data)

            return response.json()
        except requests.RequestException as e:
            raise NetworkError("Failed to introspect token", e)

    @classmethod
    def register(
        cls, gateway_url: str, registration: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Register new OAuth client dynamically

        Args:
            gateway_url: Gateway base URL
            registration: Client registration request

        Returns:
            Client registration response
        """
        try:
            discovery_url = (
                f"{gateway_url}/.well-known/oauth-authorization-server"
            )
            response = requests.get(discovery_url)
            response.raise_for_status()
            metadata = response.json()

            if "registration_endpoint" not in metadata:
                raise ValueError("Dynamic client registration not supported")

            response = requests.post(
                metadata["registration_endpoint"],
                json=registration,
                headers={"Content-Type": "application/json"},
            )

            response_data = response.json()

            if not response.ok:
                raise parse_oauth_error(response_data)

            return response_data
        except requests.RequestException as e:
            raise NetworkError("Failed to register client", e)

    def mcp_request(
        self,
        method: str,
        params: Optional[Dict[str, Any]] = None,
        server: Optional[str] = None,
        timeout: int = 30,
    ) -> Dict[str, Any]:
        """
        Make authenticated MCP request

        Args:
            method: MCP method to invoke
            params: Request parameters
            server: Target MCP server (if using multiple)
            timeout: Request timeout in seconds

        Returns:
            MCP response
        """
        # Ensure we have a valid token
        self._ensure_valid_token()

        url = (
            f"{self.gateway_url}/mcp/{server}"
            if server
            else f"{self.gateway_url}/mcp"
        )

        try:
            response = self.session.post(
                url,
                json={"method": method, "params": params},
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.access_token}",
                },
                timeout=timeout,
            )

            response_data = response.json()

            if not response.ok:
                if response.status_code == 401:
                    raise TokenExpiredError()
                raise parse_oauth_error(response_data)

            return response_data
        except requests.RequestException as e:
            raise NetworkError("MCP request failed", e)

    def set_access_token(self, token: str, expires_in: Optional[int] = None) -> None:
        """Set access token manually"""
        self.access_token = token
        if expires_in:
            self.token_expiry = time.time() + expires_in

    def set_refresh_token(self, token: str) -> None:
        """Set refresh token manually"""
        self.refresh_token = token

    def get_access_token(self) -> Optional[str]:
        """Get current access token"""
        return self.access_token

    def get_refresh_token(self) -> Optional[str]:
        """Get current refresh token"""
        return self.refresh_token

    def is_token_expired(self) -> bool:
        """Check if token is expired"""
        if not self.token_expiry:
            return True
        # Add 60 second buffer
        return time.time() >= self.token_expiry - 60

    def _ensure_valid_token(self) -> None:
        """Ensure valid token (refresh if needed)"""
        if not self.access_token:
            raise ValueError(
                "No access token available. Please authenticate first."
            )

        if self.is_token_expired() and self.refresh_token:
            self.refresh_access_token()
        elif self.is_token_expired():
            raise TokenExpiredError()
