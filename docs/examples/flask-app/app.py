"""
Flask application example using OAuth 2.1 MCP Gateway
"""

import os
from flask import Flask, request, redirect, session, jsonify, render_template, url_for
from oauth_mcp_gateway import OAuthMCPClient, TokenExpiredError, OAuthError

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# OAuth configuration
GATEWAY_URL = os.environ.get('GATEWAY_URL', 'https://gateway.example.com')
CLIENT_ID = os.environ.get('CLIENT_ID', 'your-client-id')
CLIENT_SECRET = os.environ.get('CLIENT_SECRET')  # Optional for public clients
REDIRECT_URI = os.environ.get('REDIRECT_URI', 'http://localhost:5000/callback')

def get_oauth_client():
    """Create OAuth client instance"""
    return OAuthMCPClient(
        gateway_url=GATEWAY_URL,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        redirect_uri=REDIRECT_URI,
        scopes=['mcp:read', 'mcp:write']
    )

@app.route('/')
def index():
    """Home page"""
    is_authenticated = 'access_token' in session
    return render_template('index.html', is_authenticated=is_authenticated)

@app.route('/login')
def login():
    """Initiate OAuth login flow"""
    try:
        client = get_oauth_client()
        auth_data = client.get_authorization_url()
        
        # Store PKCE parameters in session
        session['oauth_state'] = auth_data['state']
        session['code_verifier'] = auth_data['code_verifier']
        
        return redirect(auth_data['url'])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/callback')
def callback():
    """Handle OAuth callback"""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        error = request.args.get('error')
        
        if error:
            return jsonify({'error': f'OAuth error: {error}'}), 400
        
        if not code or not state:
            return jsonify({'error': 'Missing code or state parameter'}), 400
        
        # Verify state to prevent CSRF attacks
        stored_state = session.get('oauth_state')
        if state != stored_state:
            return jsonify({'error': 'State mismatch - possible CSRF attack'}), 400
        
        # Exchange code for tokens
        client = get_oauth_client()
        code_verifier = session.get('code_verifier')
        
        if not code_verifier:
            return jsonify({'error': 'Missing code verifier'}), 400
        
        tokens = client.exchange_code(code, code_verifier)
        
        # Store tokens in session
        session['access_token'] = tokens['access_token']
        session['refresh_token'] = tokens.get('refresh_token')
        session['token_expires_at'] = tokens.get('expires_in', 3600) + int(time.time())
        
        # Clean up PKCE parameters
        session.pop('oauth_state', None)
        session.pop('code_verifier', None)
        
        return redirect(url_for('dashboard'))
        
    except OAuthError as e:
        return jsonify({'error': f'OAuth error: {e.description}'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/logout')
def logout():
    """Logout and revoke tokens"""
    try:
        if 'access_token' in session:
            client = get_oauth_client()
            client.set_access_token(session['access_token'])
            
            # Revoke tokens
            try:
                client.revoke_token()
            except Exception as e:
                print(f'Token revocation failed: {e}')
        
        # Clear session
        session.clear()
        
        return redirect(url_for('index'))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/dashboard')
def dashboard():
    """Dashboard page (requires authentication)"""
    if 'access_token' not in session:
        return redirect(url_for('login'))
    
    return render_template('dashboard.html')

@app.route('/api/tools')
def api_tools():
    """Get available MCP tools"""
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        client = get_oauth_client()
        client.set_access_token(session['access_token'])
        
        response = client.mcp_request(method='tools/list')
        return jsonify(response['result'])
        
    except TokenExpiredError:
        # Try to refresh token
        if 'refresh_token' in session:
            try:
                client.refresh_access_token(session['refresh_token'])
                session['access_token'] = client.get_access_token()
                
                # Retry request
                response = client.mcp_request(method='tools/list')
                return jsonify(response['result'])
            except Exception as e:
                session.clear()
                return jsonify({'error': 'Token refresh failed', 'redirect': '/login'}), 401
        else:
            session.clear()
            return jsonify({'error': 'Token expired', 'redirect': '/login'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tools/call', methods=['POST'])
def api_call_tool():
    """Call an MCP tool"""
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        data = request.get_json()
        if not data or 'name' not in data:
            return jsonify({'error': 'Missing tool name'}), 400
        
        client = get_oauth_client()
        client.set_access_token(session['access_token'])
        
        response = client.mcp_request(
            method='tools/call',
            params={
                'name': data['name'],
                'arguments': data.get('arguments', {})
            }
        )
        
        return jsonify(response['result'])
        
    except TokenExpiredError:
        # Try to refresh token
        if 'refresh_token' in session:
            try:
                client.refresh_access_token(session['refresh_token'])
                session['access_token'] = client.get_access_token()
                
                # Retry request
                response = client.mcp_request(
                    method='tools/call',
                    params={
                        'name': data['name'],
                        'arguments': data.get('arguments', {})
                    }
                )
                return jsonify(response['result'])
            except Exception as e:
                session.clear()
                return jsonify({'error': 'Token refresh failed', 'redirect': '/login'}), 401
        else:
            session.clear()
            return jsonify({'error': 'Token expired', 'redirect': '/login'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/token/info')
def api_token_info():
    """Get token information"""
    if 'access_token' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        client = get_oauth_client()
        client.set_access_token(session['access_token'])
        
        introspection = client.introspect_token()
        return jsonify(introspection)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    import time
    
    # Check required environment variables
    if not CLIENT_ID or CLIENT_ID == 'your-client-id':
        print('Warning: CLIENT_ID not set. Please set the CLIENT_ID environment variable.')
    
    if not GATEWAY_URL or GATEWAY_URL == 'https://gateway.example.com':
        print('Warning: GATEWAY_URL not set. Please set the GATEWAY_URL environment variable.')
    
    print(f'Starting Flask app with:')
    print(f'  Gateway URL: {GATEWAY_URL}')
    print(f'  Client ID: {CLIENT_ID}')
    print(f'  Redirect URI: {REDIRECT_URI}')
    
    app.run(debug=True, port=5000)