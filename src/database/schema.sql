-- OAuth 2.1 MCP Gateway Database Schema
-- Supports multi-tenant architecture with row-level security

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  tenant_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  compliance_tier TEXT DEFAULT 'standard' CHECK (compliance_tier IN ('standard', 'hipaa', 'pci-dss', 'sox')),
  max_users INTEGER DEFAULT 100,
  max_mcp_servers INTEGER DEFAULT 10,
  audit_retention_days INTEGER DEFAULT 365,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- OAuth clients table with PKCE support
CREATE TABLE IF NOT EXISTS oauth_clients (
  client_id TEXT PRIMARY KEY,
  client_secret TEXT, -- Optional for public clients
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  redirect_uris TEXT NOT NULL, -- JSON array
  grant_types TEXT NOT NULL DEFAULT '["authorization_code", "refresh_token"]', -- JSON array
  response_types TEXT NOT NULL DEFAULT '["code"]', -- JSON array
  scope TEXT,
  client_name TEXT,
  client_uri TEXT,
  logo_uri TEXT,
  contacts TEXT, -- JSON array of emails
  tos_uri TEXT,
  policy_uri TEXT,
  token_endpoint_auth_method TEXT DEFAULT 'client_secret_post' CHECK (
    token_endpoint_auth_method IN ('none', 'client_secret_post', 'client_secret_basic')
  ),
  client_id_issued_at INTEGER NOT NULL,
  client_secret_expires_at INTEGER, -- Unix timestamp
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Authorization codes with PKCE challenge
CREATE TABLE IF NOT EXISTS authorization_codes (
  code TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  scope TEXT,
  code_challenge TEXT NOT NULL,
  code_challenge_method TEXT DEFAULT 'S256' CHECK (code_challenge_method = 'S256'),
  resource TEXT, -- RFC 8707 Resource Indicators
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used_at DATETIME -- Track when code was exchanged
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id TEXT PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  scope TEXT,
  resource TEXT, -- RFC 8707 Resource Indicators
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME,
  revoked_at DATETIME
);

-- MCP server registry
CREATE TABLE IF NOT EXISTS mcp_servers (
  server_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  resource_identifier TEXT UNIQUE NOT NULL, -- For RFC 8707
  required_scopes TEXT, -- JSON array
  health_check_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API keys with rotation support
CREATE TABLE IF NOT EXISTS api_keys (
  key_id TEXT PRIMARY KEY,
  key_hash TEXT UNIQUE NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  key_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'revoked')),
  expires_at DATETIME,
  last_used DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs with compliance tagging
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  user_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  ip_address TEXT,
  user_agent TEXT,
  compliance_tags TEXT, -- JSON array
  risk_score REAL,
  metadata TEXT, -- JSON object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions for user management
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  device_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  revoked_at DATETIME
);

-- Users table (basic user information)
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  name TEXT,
  picture TEXT,
  locale TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  UNIQUE(tenant_id, email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_clients_tenant_id ON oauth_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_authorization_codes_client_id ON authorization_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_authorization_codes_expires_at ON authorization_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_client_id ON refresh_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_tenant_id ON mcp_servers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_resource_identifier ON mcp_servers(resource_identifier);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_tenants_updated_at
  AFTER UPDATE ON tenants
  BEGIN
    UPDATE tenants SET updated_at = CURRENT_TIMESTAMP WHERE tenant_id = NEW.tenant_id;
  END;

CREATE TRIGGER IF NOT EXISTS update_oauth_clients_updated_at
  AFTER UPDATE ON oauth_clients
  BEGIN
    UPDATE oauth_clients SET updated_at = CURRENT_TIMESTAMP WHERE client_id = NEW.client_id;
  END;

CREATE TRIGGER IF NOT EXISTS update_mcp_servers_updated_at
  AFTER UPDATE ON mcp_servers
  BEGIN
    UPDATE mcp_servers SET updated_at = CURRENT_TIMESTAMP WHERE server_id = NEW.server_id;
  END;

CREATE TRIGGER IF NOT EXISTS update_users_updated_at
  AFTER UPDATE ON users
  BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = NEW.user_id;
  END;

-- Insert default tenant for development
INSERT OR IGNORE INTO tenants (tenant_id, name, domain) 
VALUES ('default', 'Default Tenant', 'localhost');