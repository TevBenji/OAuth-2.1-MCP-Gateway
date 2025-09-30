#!/usr/bin/env python3
"""
Simple test runner for OAuth MCP Gateway Python SDK
"""

import sys
import os
import unittest
from unittest.mock import Mock, patch

# Add the package to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from oauth_mcp_gateway import (
    OAuthMCPClient,
    TokenExpiredError,
    InvalidGrantError,
    NetworkError
)


class TestOAuthMCPClient(unittest.TestCase):
    """Test OAuth MCP Client functionality"""

    def setUp(self):
        """Set up test client"""
        self.client = OAuthMCPClient(
            gateway_url='https://test-gateway.com',
            client_id='test-client-id',
            client_secret='test-client-secret',
            redirect_uri='https://test-app.com/callback',
            scopes=['mcp:read', 'mcp:write']
        )

    @patch('oauth_mcp_gateway.client.requests.Session')
    def test_discover(self, mock_session_class):
        """Test OAuth server metadata discovery"""
        mock_session = mock_session_class.return_value
        
        mock_metadata = {
            'issuer': 'https://test-gateway.com',
            'authorization_endpoint': 'https://test-gateway.com/authorize',
            'token_endpoint': 'https://test-gateway.com/token',
            'jwks_uri': 'https://test-gateway.com/.well-known/jwks.json',
            'response_types_supported': ['code'],
            'grant_types_supported': ['authorization_code', 'refresh_token'],
            'code_challenge_methods_supported': ['S256']
        }

        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = mock_metadata
        mock_session.get.return_value = mock_response

        metadata = self.client.discover()

        mock_session.get.assert_called_once_with(
            'https://test-gateway.com/.well-known/oauth-authorization-server'
        )
        self.assertEqual(metadata, mock_metadata)

    @patch('oauth_mcp_gateway.client.requests.Session')
    def test_get_authorization_url(self, mock_session_class):
        """Test authorization URL generation"""
        mock_session = mock_session_class.return_value
        
        mock_metadata = {
            'authorization_endpoint': 'https://test-gateway.com/authorize'
        }

        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = mock_metadata
        mock_session.get.return_value = mock_response

        result = self.client.get_authorization_url()

        self.assertIn('url', result)
        self.assertIn('state', result)
        self.assertIn('code_verifier', result)

        url = result['url']
        self.assertIn('https://test-gateway.com/authorize', url)
        self.assertIn('response_type=code', url)
        self.assertIn('client_id=test-client-id', url)
        self.assertIn('redirect_uri=https%3A//test-app.com/callback', url)
        self.assertIn('scope=mcp%3Aread+mcp%3Awrite', url)
        self.assertIn('code_challenge=', url)
        self.assertIn('code_challenge_method=S256', url)

    @patch('oauth_mcp_gateway.client.requests.Session')
    def test_mcp_request(self, mock_session_class):
        """Test MCP request"""
        mock_session = mock_session_class.return_value
        
        self.client.set_access_token('test-access-token', expires_in=3600)

        mock_response_data = {
            'result': {
                'tools': [
                    {
                        'name': 'get_weather',
                        'description': 'Get weather information'
                    }
                ]
            }
        }

        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = mock_response_data

        mock_session.post.return_value = mock_response

        response = self.client.mcp_request(
            method='tools/list',
            params={}
        )

        self.assertEqual(response, mock_response_data)

        mock_session.post.assert_called_once_with(
            'https://test-gateway.com/mcp',
            json={'method': 'tools/list', 'params': {}},
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-access-token'
            },
            timeout=30
        )

    def test_token_management(self):
        """Test manual token management"""
        self.client.set_access_token('test-access-token', expires_in=3600)
        self.client.set_refresh_token('test-refresh-token')

        self.assertEqual(self.client.get_access_token(), 'test-access-token')
        self.assertEqual(self.client.get_refresh_token(), 'test-refresh-token')
        self.assertFalse(self.client.is_token_expired())

    def test_token_expiration_check(self):
        """Test token expiration checking"""
        # No token set
        self.assertTrue(self.client.is_token_expired())

        # Set token with future expiration
        self.client.set_access_token('test-token', expires_in=3600)
        self.assertFalse(self.client.is_token_expired())


if __name__ == '__main__':
    print("Running OAuth MCP Gateway Python SDK Tests...")
    unittest.main(verbosity=2)