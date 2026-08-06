"""
SDK Error Classes
"""

from typing import Optional, Dict, Any


class OAuthError(Exception):
    """Base OAuth error"""

    def __init__(
        self,
        message: str,
        code: str,
        description: Optional[str] = None,
        status_code: Optional[int] = None,
    ):
        super().__init__(message)
        self.code = code
        self.description = description
        self.status_code = status_code


class InvalidRequestError(OAuthError):
    """Invalid request error"""

    def __init__(self, description: str):
        super().__init__("Invalid request", "invalid_request", description, 400)


class InvalidClientError(OAuthError):
    """Invalid client error"""

    def __init__(self, description: str):
        super().__init__("Invalid client", "invalid_client", description, 401)


class InvalidGrantError(OAuthError):
    """Invalid grant error"""

    def __init__(self, description: str):
        super().__init__("Invalid grant", "invalid_grant", description, 400)


class UnauthorizedClientError(OAuthError):
    """Unauthorized client error"""

    def __init__(self, description: str):
        super().__init__(
            "Unauthorized client", "unauthorized_client", description, 400
        )


class UnsupportedGrantTypeError(OAuthError):
    """Unsupported grant type error"""

    def __init__(self, description: str):
        super().__init__(
            "Unsupported grant type", "unsupported_grant_type", description, 400
        )


class InvalidScopeError(OAuthError):
    """Invalid scope error"""

    def __init__(self, description: str):
        super().__init__("Invalid scope", "invalid_scope", description, 400)


class AccessDeniedError(OAuthError):
    """Access denied error"""

    def __init__(self, description: str):
        super().__init__("Access denied", "access_denied", description, 403)


class NetworkError(Exception):
    """Network error"""

    def __init__(self, message: str, original_error: Optional[Exception] = None):
        super().__init__(message)
        self.original_error = original_error


class TokenExpiredError(OAuthError):
    """Token expired error"""

    def __init__(self):
        super().__init__(
            "Token expired", "token_expired", "The access token has expired", 401
        )


def parse_oauth_error(error_data: Dict[str, Any]) -> OAuthError:
    """Parse OAuth error from response"""
    code = error_data.get("error", "unknown_error")
    description = error_data.get(
        "error_description", "An unknown error occurred"
    )
    status_code = error_data.get("status", 400)

    error_map = {
        "invalid_request": InvalidRequestError,
        "invalid_client": InvalidClientError,
        "invalid_grant": InvalidGrantError,
        "unauthorized_client": UnauthorizedClientError,
        "unsupported_grant_type": UnsupportedGrantTypeError,
        "invalid_scope": InvalidScopeError,
        "access_denied": AccessDeniedError,
    }

    error_class = error_map.get(code, OAuthError)
    if error_class == OAuthError:
        return OAuthError("OAuth error", code, description, status_code)
    return error_class(description)
