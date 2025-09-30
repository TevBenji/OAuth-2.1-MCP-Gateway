-- Migration: Add Rate Limiting Tables
-- Created: 2024-01-15T01:00:00Z

-- UP migration

-- Rate limiting buckets for sliding window algorithm
CREATE TABLE IF NOT EXISTS rate_limit_buckets (
  bucket_id TEXT PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  user_id TEXT,
  ip_address TEXT,
  endpoint TEXT NOT NULL,
  window_start TEXT NOT NULL,
  request_count INTEGER DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Rate limiting rules per tenant
CREATE TABLE IF NOT EXISTS rate_limit_rules (
  rule_id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  endpoint_pattern TEXT NOT NULL,
  limit_type TEXT NOT NULL CHECK (limit_type IN ('per_ip', 'per_user', 'per_tenant')),
  max_requests INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,
  burst_allowance INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for rate limiting performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_tenant_id ON rate_limit_buckets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_user_id ON rate_limit_buckets(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_ip_address ON rate_limit_buckets(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_endpoint ON rate_limit_buckets(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_buckets_expires_at ON rate_limit_buckets(expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_tenant_id ON rate_limit_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_rules_endpoint_pattern ON rate_limit_rules(endpoint_pattern);

-- Create trigger for rate_limit_rules updated_at
CREATE TRIGGER IF NOT EXISTS update_rate_limit_rules_updated_at
  AFTER UPDATE ON rate_limit_rules
  BEGIN
    UPDATE rate_limit_rules SET updated_at = datetime('now') WHERE rule_id = NEW.rule_id;
  END;

-- Create trigger for rate_limit_buckets updated_at
CREATE TRIGGER IF NOT EXISTS update_rate_limit_buckets_updated_at
  AFTER UPDATE ON rate_limit_buckets
  BEGIN
    UPDATE rate_limit_buckets SET updated_at = datetime('now') WHERE bucket_id = NEW.bucket_id;
  END;

-- DOWN migration (rollback)
-- Uncomment the following lines to enable rollback
/*
DROP TRIGGER IF EXISTS update_rate_limit_buckets_updated_at;
DROP TRIGGER IF EXISTS update_rate_limit_rules_updated_at;
DROP INDEX IF EXISTS idx_rate_limit_rules_endpoint_pattern;
DROP INDEX IF EXISTS idx_rate_limit_rules_tenant_id;
DROP INDEX IF EXISTS idx_rate_limit_buckets_expires_at;
DROP INDEX IF EXISTS idx_rate_limit_buckets_endpoint;
DROP INDEX IF EXISTS idx_rate_limit_buckets_ip_address;
DROP INDEX IF EXISTS idx_rate_limit_buckets_user_id;
DROP INDEX IF EXISTS idx_rate_limit_buckets_tenant_id;
DROP TABLE IF EXISTS rate_limit_rules;
DROP TABLE IF EXISTS rate_limit_buckets;
*/