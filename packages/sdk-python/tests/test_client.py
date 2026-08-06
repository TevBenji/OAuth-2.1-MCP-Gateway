"""
OAuth MCP Client Tests
"""

import pytest
import time
from unittest.mock import Mock, patch
from oauth_mcp_gateway import (
    OAuthMCPClient,
    TokenExpiredError,
    InvalidGrantError,
    NetworkError
)


class TestOAuthMCPClient:
    """Test OAuth MCP Client functionality"""

    @pytest.fixture
    def client(self):
        """Create test client"""
        return OAuthMCPClient(
            gateway_url='https://test-gateway.com',
            client_id='test-client-id',
            client_secret='test-client-secret',
            redirect_uri='https://test-app.com/callback',
            scopes=['mcp:read', 'mcp:write']
        )

    @pytest.fixture
    def mock_session(self):
        """Mock requests session"""
        with patch('oauth_mcp_gateway.client.requests.Session') as mock:
            yield mock.return_value

    def test_discover(self, client, mock_session):
        """Test OAuth server metadata discovery"""
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

        metadata = client.discover()

        mock_session.get.assert_called_once_with(
            'https://test-gateway.com/.well-known/oauth-authorization-server'
        )
        assert metadata == mock_metadata

    def test_discover_failure(self, client, mock_session):
        """Test discovery failure handling"""
        mock_session.get.side_effect = Exception('Network error')

        with pytest.raises(NetworkError):
            client.discover()

    def test_get_authorization_url(self, client, mock_session):
        """Test authorization URL generation"""
        mock_metadata = {
            'authorization_endpoint': 'https://test-gateway.com/authorize'
        }

        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = mock_metadata
        mock_session.get.return_value = mock_response

        result = client.get_authorization_url()

        assert 'url' in result
        assert 'state' in result
        assert 'code_verifier' in result

        url = result['url']
        assert 'https://test-gateway.com/authorize' in url
        assert 'response_type=code' in url
        assert 'client_id=test-client-id' in url
        assert 'redirect_uri=https%3A//test-app.com/callback' in url
        assert 'scope=mcp%3Aread+mcp%3Awrite' in url
        assert 'code_challenge=' in url
        assert 'code_challenge_method=S256' in url

    def test_get_authorization_url_with_options(self, client, mock_session):
        """Test authorization URL with additional options"""
        mock_metadata = {
            'authorization_endpoint': 'https://test-gateway.com/authorize'
        }

        mock_response = Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = mock_metadata
        mock_session.get.return_value = mock_response

        result = client.get_authorization_url(
            additional_scopes=['mcp:admin'],
            resource='https://my-mcp-server.com'
        )

        url = result['url']
        assert 'scope=mcp%3Aread+mcp%3Awrite+mcp%3Aadmin' in url
        assert 'resource=https%3A//my-mcp-server.com' in url

    def test_exchange_code(self, client, mock_session):
        """Test authorization code exchange"""
        mock_metadata = {
            'token_endpoint': 'https://test-gateway.com/token'
        }

        mock_tokens = {
            'access_token': 'test-access-token',
            'token_type': 'Bearer',
            'expires_in': 3600,
            'refresh_token': 'test-refresh-token',
            'scope': 'mcp:read mcp:write'
        }

        # Mock discovery call
        discovery_response = Mock()
        discovery_response.raise_for_status.return_value = None
        discovery_response.json.return_value = mock_metadata

        # Mock token exchange call
        token_response = Mock()
        token_response.ok = True
        token_response.json.return_value = mock_tokens

        mock_session.get.return_value = discovery_response
        mock_session.post.return_value = token_response

        tokens = client.exchange_code('test-code', 'test-verifier')

        assert tokens == mock_tokens
        assert client.get_access_token() == 'test-access-token'
        assert client.get_refresh_token() == 'test-refresh-token'

        # Verify token endpoint was called correctly
        mock_session.post.assert_called_once_with(
            'https://test-gateway.com/token',
            data={
                'grant_type': 'authorization_code',
                'code': 'test-code',
                'redirect_uri': 'https://test-app.com/callback',
                'client_id': 'test-client-id',
                'code_verifier': 'test-verifier',
                'client_secret': 'test-client-secret'
            },
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )

    def test_exchange_code_invalid_grant(self, client, mock_session):
        """Test invalid grant error handling"""
        mock_metadata = {
            'token_endpoint': 'https://test-gateway.com/token'
        }

        mock_error = {
            'error': 'invalid_grant',
            'error_description': 'Authorization code is invalid'
        }

        discovery_response = Mock()
        discovery_response.raise_for_status.return_value = None
        discovery_response.json.return_value = mock_metadata

        token_response = Mock()
        token_response.ok = False
        token_response.json.return_value = mock_error

        mock_session.get.return_value = discovery_response
        mock_session.post.return_value = token_response

        with pytest.raises(InvalidGrantError) as exc_info:
            client.exchange_code('invalid-code', 'test-verifier')

        assert 'Authorization code is invalid' in str(exc_info.value)

    def test_refresh_access_token(self, client, mock_session):
        """Test access token refresh"""
        client.set_refresh_token('test-refresh-token')

        mock_metadata = {
            'token_endpoint': 'https://test-gateway.com/token'
        }

        mock_tokens = {
            'access_token': 'new-access-token',
            'token_type': 'Bearer',
            'expires_in': 3600,
            'refresh_token': 'new-refresh-token'
        }

        discovery_response = Mock()
        discovery_response.raise_for_status.return_value = None
        discovery_response.json.return_value = mock_metadata

        token_response = Mock()
        token_response.ok = True
        token_response.json.return_value = mock_tokens

        mock_session.get.return_value = discovery_response
        mock_session.post.return_value = token_response

        tokens = client.refresh_access_token()

        assert tokens == mock_tokens
        assert client.get_access_token() == 'new-access-token'
        assert client.get_refresh_token() == 'new-refresh-token'

    def test_refresh_without_token(self, client):
        """Test refresh without refresh token"""
        with pytest.raises(ValueError, match='Refresh token is required'):
            client.refresh_access_token()

    def test_mcp_request(self, client, mock_session):
        """Test MCP request"""
        client.set_access_token('test-access-token')

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

        response = client.mcp_request(
            method='tools/list',
            params={}
        )

        assert response == mock_response_data

        mock_session.post.assert_called_once_with(
            'https://test-gateway.com/mcp',
            json={'method': 'tools/list', 'params': {}},
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-access-token'
            },
            timeout=30
        )

    def test_mcp_request_with_server(self, client, mock_session):
        """Test MCP request targeting specific server"""
        client.set_access_token('test-access-token')

        mock_response = Mock()
        mock_response.ok = True
        mock_response.json.return_value = {'result': {}}

        mock_session.post.return_value = mock_response

        client.mcp_request(
            method='tools/list',
            server='weather-api'
        )

        mock_session.post.assert_called_once_with(
            'https://test-gateway.com/mcp/weather-api',
            json={'method': 'tools/list', 'params': None},
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-access-token'
            },
            timeout=30
        )

    def test_mcp_request_token_expired(self, client, mock_session):
        """Test MCP request with expired token"""
        client.set_access_token('expired-token')

        mock_response = Mock()
        mock_response.ok = False
        mock_response.status_code = 401
        mock_response.json.return_value = {
            'error': 'token_expired',
            'error_description': 'Token has expired'
        }

        mock_session.post.return_value = mock_response

        with pytest.raises(TokenExpiredError):
            client.mcp_request(method='tools/list')

    def test_mcp_request_without_token(self, client):
        """Test MCP request without access token"""
        with pytest.raises(ValueError, match='No access token available'):
            client.mcp_request(method='tools/list')

    def test_revoke_token(self, client, mock_session):
        """Test token revocation"""
        client.set_access_token('test-access-token')

        mock_metadata = {
            'revocation_endpoint': 'https://test-gateway.com/revoke'
        }

        discovery_response = Mock()
        discovery_response.raise_for_status.return_value = None
        discovery_response.json.return_value = mock_metadata

        revoke_response = Mock()
        revoke_response.ok = True

        mock_session.get.return_value = discovery_response
        mock_session.post.return_value = revoke_response

        client.revoke_token()

        assert client.get_access_token() is None

    def test_introspect_token(self, client, mock_session):
        """Test token introspection"""
        client.set_access_token('test-access-token')

        mock_metadata = {
            'introspection_endpoint': 'https://test-gateway.com/introspect'
        }

        mock_introspection = {
            'active': True,
            'scope': 'mcp:read mcp:write',
            'client_id': 'test-client-id',
            'exp': int(time.time()) + 3600
        }

        discovery_response = Mock()
        discovery_response.raise_for_status.return_value = None
        discovery_response.json.return_value = mock_metadata

        introspect_response = Mock()
        introspect_response.ok = True
        introspect_response.json.return_value = mock_introspection

        mock_session.get.return_value = discovery_response
        mock_session.post.return_value = introspect_response

        introspection = client.introspect_token()

        assert introspection == mock_introspection

    def test_register_client(self, mock_session):
        """Test dynamic client registration"""
        mock_metadata = {
            'registration_endpoint': 'https://test-gateway.com/register'
        }

        mock_registration = {
            'client_id': 'new-client-id',
            'client_secret': 'new-client-secret',
            'client_secret_expires_at': 0,
            'client_id_issued_at': int(time.time())
        }

        # Mock discovery call
        discovery_response = Mock()
        discovery_response.raise_for_status.return_value = None
        discovery_response.json.return_value = mock_metadata

        # Mock registration call
        register_response = Mock()
        register_response.ok = True
        register_response.json.return_value = mock_registration

        with patch('requests.get', return_value=discovery_response), \
             patch('requests.post', return_value=register_response):

            registration = OAuthMCPClient.register(
                gateway_url='https://test-gateway.com',
                registration={
                    'client_name': 'Test Client',
                    'redirect_uris': ['https://test-app.com/callback']
                }
            )

            assert registration == mock_registration

    def test_token_expiration_check(self, client):
        """Test token expiration checking"""
        # No token set
        assert client.is_token_expired() is True

        # Set token with future expiration
        client.set_access_token('test-token', expires_in=3600)
        assert client.is_token_expired() is False

        # Set token with past expiration (simulate expired token)
        client.token_expiry = time.time() - 3600
        assert client.is_token_expired() is True

    def test_token_management(self, client):
        """Test manual token management"""
        client.set_access_token('test-access-token', expires_in=3600)
        client.set_refresh_token('test-refresh-token')

        assert client.get_access_token() == 'test-access-token'
        assert client.get_refresh_token() == 'test-refresh-token'
        assert client.is_token_expired() is False

    def test_ensure_valid_token_refresh(self, client, mock_session):
        """Test automatic token refresh in _ensure_valid_token"""
        # Set expired token with refresh token
        client.set_access_token('expired-token')
        client.set_refresh_token('refresh-token')
        client.token_expiry = time.time() - 3600  # Expired

        # Mock refresh token response
        mock_metadata = {
            'token_endpoint': 'https://test-gateway.com/token'
        }

        mock_tokens = {
            'access_token': 'new-access-token',
            'token_type': 'Bearer',
            'expires_in': 3600
        }

        discovery_response = Mock()
        discovery_response.raise_for_status.return_value = None
        discovery_response.json.return_value = mock_metadata

        token_response = Mock()
        token_response.ok = True
        token_response.json.return_value = mock_tokens

        mock_session.get.return_value = discovery_response
        mock_session.post.return_value = token_response

        # This should trigger token refresh
        client._ensure_valid_token()

        assert client.get_access_token() == 'new-access-token'

    def test_ensure_valid_token_no_refresh(self, client):
        """Test _ensure_valid_token without refresh token"""
        # Set expired token without refresh token
        client.set_access_token('expired-token')
        client.token_expiry = time.time() - 3600  # Expired

        with pytest.raises(TokenExpiredError):
            client._ensure_valid_token()


if __name__ == '__main__':
    pytest.main([__file__])