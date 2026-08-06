-- Migration: Initial OAuth 2.1 MCP Gateway Schema
-- Created: 2024-01-15T00:00:00Z

-- UP migration

-- Tenants table with compliance configuration
CREATE TABLE IF NOT EXISTS tenants (
  tenant_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  compliance_tier TEXT DEFAULT 'standard' CHECK (compliance_tier IN ('standard', 'hipaa', 'pci-dss')),
  max_users INTEGER DEFAULT 100,
  max_mcp_servers INTEGER DEFAULT 10,
  audit_retention_days INTEGER DEFAULT 365,
  api_key_hash TEXT UNIQUE NOT NULL,
  api_key_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- OAuth clients with PKCE support
CREATE TABLE IF NOT EXISTS oauth_clients (
  client_id TEXT PRIMARY KEY,
  client_secret TEXT, -- Optional for public clients
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  redirect_uris TEXT NOT NULL, -- JSON array as text
  grant_types TEXT DEFAULT '["authorization_code","refresh_token"]', -- JSON array as text
  response_types TEXT DEFAULT '["code"]', -- JSON array as text
  scope TEXT DEFAULT 'mcp:tools:read mcp:resources:read',
  client_type TEXT DEFAULT 'public' CHECK (client_type IN ('public', 'confidential')),
  token_endpoint_auth_method TEXT DEFAULT 'none' CHECK (token_endpoint_auth_method IN ('none', 'client_secret_basic', 'client_secret_post')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT -- For client credential rotation
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
  resource TEXT, -- RFC 8707
  state TEXT,
  expires_at TEXT NOT NULL,
  used_at TEXT, -- Track when code was used
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(32)))),
  token_hash TEXT UNIQUE NOT NULL,
  client_id TEXT NOT NULL REFERENCES oauth_clients(client_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  scope TEXT,
  resource TEXT,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- MCP server registry
CREATE TABLE IF NOT EXISTS mcp_servers (
  server_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  resource_identifier TEXT UNIQUE NOT NULL, -- For RFC 8707
  required_scopes TEXT, -- JSON array as text
  health_check_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  metadata TEXT, -- JSON metadata as text
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Audit logs with compliance tagging
CREATE TABLE IF NOT EXISTS audit_logs (
  log_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  user_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  action TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  ip_address TEXT,
  user_agent TEXT,
  compliance_tags TEXT, -- JSON array as text
  risk_score REAL CHECK (risk_score >= 0 AND risk_score <= 1),
  metadata TEXT, -- JSON metadata as text
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User sessions for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(32)))),
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  device_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  last_activity TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_oauth_clients_tenant_id ON oauth_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_authorization_codes_client_id ON authorization_codes(client_id);
CREATE INDEX IF NOT EXISTS idx_authorization_codes_expires_at ON authorization_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_client_id ON refresh_tokens(client_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_tenant_id ON mcp_servers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_resource_identifier ON mcp_servers(resource_identifier);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_tenants_updated_at
  AFTER UPDATE ON tenants
  BEGIN
    UPDATE tenants SET updated_at = datetime('now') WHERE tenant_id = NEW.tenant_id;
  END;

CREATE TRIGGER IF NOT EXISTS update_mcp_servers_updated_at
  AFTER UPDATE ON mcp_servers
  BEGIN
    UPDATE mcp_servers SET updated_at = datetime('now') WHERE server_id = NEW.server_id;
  END;

-- DOWN migration (rollback)
-- Uncomment the following lines to enable rollback
/*
DROP TRIGGER IF EXISTS update_mcp_servers_updated_at;
DROP TRIGGER IF EXISTS update_tenants_updated_at;
DROP INDEX IF EXISTS idx_user_sessions_expires_at;
DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_audit_logs_created_at;
DROP INDEX IF EXISTS idx_audit_logs_event_type;
DROP INDEX IF EXISTS idx_audit_logs_tenant_id;
DROP INDEX IF EXISTS idx_mcp_servers_resource_identifier;
DROP INDEX IF EXISTS idx_mcp_servers_tenant_id;
DROP INDEX IF EXISTS idx_refresh_tokens_expires_at;
DROP INDEX IF EXISTS idx_refresh_tokens_user_id;
DROP INDEX IF EXISTS idx_refresh_tokens_client_id;
DROP INDEX IF EXISTS idx_authorization_codes_expires_at;
DROP INDEX IF EXISTS idx_authorization_codes_client_id;
DROP INDEX IF EXISTS idx_oauth_clients_tenant_id;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS mcp_servers;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS authorization_codes;
DROP TABLE IF EXISTS oauth_clients;
DROP TABLE IF EXISTS tenants;
*/