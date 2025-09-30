-- Migration: Create MCP Servers Table
-- Description: Creates table for MCP server registry with tenant isolation
-- Version: 005
-- Date: 2025-01-XX

-- MCP Servers table for server registry and configuration
CREATE TABLE IF NOT EXISTS mcp_servers (
    server_id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    name TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    resource_identifier TEXT NOT NULL,
    required_scopes TEXT DEFAULT '[]', -- JSON array
    health_check_url TEXT,
    timeout_ms INTEGER DEFAULT 30000,
    retry_attempts INTEGER DEFAULT 3,
    status TEXT CHECK(status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
    metadata TEXT DEFAULT '{}', -- JSON object

    -- Health monitoring fields
    health_status TEXT CHECK(health_status IN ('healthy', 'unhealthy', 'unknown')) DEFAULT 'unknown',
    health_last_check TEXT NOT NULL,
    health_response_time_ms INTEGER,
    health_error_message TEXT,
    health_consecutive_failures INTEGER DEFAULT 0,

    -- Tracking fields
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_accessed TEXT NOT NULL DEFAULT (datetime('now')),
    access_count INTEGER DEFAULT 0,

    -- Foreign key to tenants table
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mcp_servers_tenant_id ON mcp_servers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_resource_identifier ON mcp_servers(resource_identifier, tenant_id);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_status ON mcp_servers(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mcp_servers_resource_unique ON mcp_servers(resource_identifier, tenant_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_mcp_servers_timestamp
AFTER UPDATE ON mcp_servers
BEGIN
    UPDATE mcp_servers
    SET updated_at = datetime('now')
    WHERE server_id = NEW.server_id;
END;
