"""
PKCE (Proof Key for Code Exchange) Utilities
"""

import secrets
import hashlib
import base64
from typing import Tuple


def generate_code_verifier() -> str:
    """Generate random code verifier"""
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode("utf-8").rstrip("=")


def generate_code_challenge(verifier: str) -> str:
    """Generate code challenge from verifier using S256 method"""
    digest = hashlib.sha256(verifier.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest).decode("utf-8").rstrip("=")


def generate_pkce_pair() -> Tuple[str, str]:
    """Generate both verifier and challenge"""
    verifier = generate_code_verifier()
    challenge = generate_code_challenge(verifier)
    return verifier, challenge


def generate_state() -> str:
    """Generate random state parameter"""
    return generate_code_verifier()
