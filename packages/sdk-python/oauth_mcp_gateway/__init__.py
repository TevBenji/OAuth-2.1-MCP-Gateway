"""
OAuth 2.1 MCP Gateway - Python SDK

Official Python client for integrating with the OAuth 2.1 MCP Gateway.
"""

__version__ = "1.0.0"

from .client import OAuthMCPClient
from .errors import (
    OAuthError,
    InvalidRequestError,
    InvalidClientError,
    InvalidGrantError,
    UnauthorizedClientError,
    UnsupportedGrantTypeError,
    InvalidScopeError,
    AccessDeniedError,
    NetworkError,
    TokenExpiredError,
)
from .pkce import generate_pkce_pair, generate_code_verifier, generate_code_challenge

__all__ = [
    "OAuthMCPClient",
    "OAuthError",
    "InvalidRequestError",
    "InvalidClientError",
    "InvalidGrantError",
    "UnauthorizedClientError",
    "UnsupportedGrantTypeError",
    "InvalidScopeError",
    "AccessDeniedError",
    "NetworkError",
    "TokenExpiredError",
    "generate_pkce_pair",
    "generate_code_verifier",
    "generate_code_challenge",
]
