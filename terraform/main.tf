# Terraform configuration for OAuth 2.1 MCP Gateway

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
  
  required_version = ">= 1.0"
}

# Provider configuration
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# Variables
variable "cloudflare_api_token" {
  description = "Cloudflare API token"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for domain"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the gateway"
  type        = string
  default     = "oauth-mcp-gateway.example.com"
}

variable "environment" {
  description = "Environment (development, staging, production)"
  type        = string
  default     = "development"
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "database_url" {
  description = "Database connection URL"
  type        = string
  sensitive   = true
  default     = ""
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "info"
  
  validation {
    condition     = contains(["debug", "info", "warn", "error"], var.log_level)
    error_message = "Log level must be one of: debug, info, warn, error."
  }
}

variable "enable_analytics" {
  description = "Enable Cloudflare Analytics Engine"
  type        = bool
  default     = true
}

variable "enable_monitoring" {
  description = "Enable monitoring and alerting"
  type        = bool
  default     = true
}

variable "cors_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["https://claude.ai", "https://chatgpt.com"]
}

variable "notification_email_id" {
  description = "Cloudflare notification email integration ID"
  type        = string
  default     = ""
}

# Local values
locals {
  name_prefix = "${var.environment}-oauth-mcp-gateway"
  tags = {
    Environment = var.environment
    Project     = "OAuth 2.1 MCP Gateway"
    ManagedBy   = "Terraform"
  }
}

# Data source for worker script content
data "local_file" "worker_script" {
  filename = "${path.module}/../dist/index.js"
}

# Cloudflare Workers Script
resource "cloudflare_worker_script" "gateway" {
  account_id = var.cloudflare_account_id
  name       = "${local.name_prefix}-worker"
  content    = data.local_file.worker_script.content
  module     = true
  
  # Compatibility settings
  compatibility_date  = "2024-01-15"
  compatibility_flags = ["nodejs_compat"]
  
  # Secrets
  secret_text_binding {
    name = "JWT_SECRET"
    text = var.jwt_secret
  }
  
  secret_text_binding {
    name = "DATABASE_URL"
    text = var.database_url != "" ? var.database_url : "cloudflare-d1://${cloudflare_d1_database.main.id}"
  }
  
  # Environment variables
  plain_text_binding {
    name = "ENVIRONMENT"
    text = var.environment
  }
  
  plain_text_binding {
    name = "LOG_LEVEL"
    text = var.log_level
  }
  
  plain_text_binding {
    name = "CORS_ORIGINS"
    text = join(",", var.cors_origins)
  }
  
  plain_text_binding {
    name = "DOMAIN_NAME"
    text = var.domain_name
  }
}

# KV Namespace for sessions
resource "cloudflare_workers_kv_namespace" "sessions" {
  account_id = var.cloudflare_account_id
  title      = "${local.name_prefix}-sessions"
}

# KV Namespace for caching
resource "cloudflare_workers_kv_namespace" "cache" {
  account_id = var.cloudflare_account_id
  title      = "${local.name_prefix}-cache"
}

# D1 Database
resource "cloudflare_d1_database" "main" {
  account_id = var.cloudflare_account_id
  name       = "${local.name_prefix}-database"
}

# R2 Bucket for file storage
resource "cloudflare_r2_bucket" "storage" {
  account_id = var.cloudflare_account_id
  name       = "${local.name_prefix}-storage"
  location   = "auto"
}

# Analytics Engine dataset (if enabled)
resource "cloudflare_logpush_job" "analytics" {
  count = var.enable_analytics ? 1 : 0
  
  account_id          = var.cloudflare_account_id
  name                = "${local.name_prefix}-analytics"
  destination_conf    = "analytics_engine://${var.cloudflare_account_id}/oauth_mcp_gateway_analytics"
  dataset             = "workers_trace_events"
  enabled             = true
  frequency           = "high"
  max_upload_bytes    = 5000000
  max_upload_records  = 1000
  
  filter = jsonencode({
    where = {
      and = [
        {
          key      = "WorkerName"
          operator = "eq"
          value    = cloudflare_worker_script.gateway_with_bindings.name
        }
      ]
    }
  })
}

# Page Rules for caching and security
resource "cloudflare_page_rule" "api_cache" {
  zone_id  = var.cloudflare_zone_id
  target   = "${var.domain_name}/.well-known/*"
  priority = 1
  
  actions {
    cache_level = "cache_everything"
    edge_cache_ttl = 3600
  }
}

resource "cloudflare_page_rule" "security_headers" {
  zone_id  = var.cloudflare_zone_id
  target   = "${var.domain_name}/*"
  priority = 2
  
  actions {
    security_level = "medium"
    ssl           = "strict"
  }
}

# Update worker script with bindings
resource "cloudflare_worker_script" "gateway_with_bindings" {
  depends_on = [
    cloudflare_workers_kv_namespace.sessions,
    cloudflare_workers_kv_namespace.cache,
    cloudflare_d1_database.main,
    cloudflare_r2_bucket.storage
  ]
  
  account_id = var.cloudflare_account_id
  name       = cloudflare_worker_script.gateway.name
  content    = cloudflare_worker_script.gateway.content
  module     = true
  
  # Compatibility settings
  compatibility_date  = "2024-01-15"
  compatibility_flags = ["nodejs_compat"]
  
  # KV Namespace bindings
  kv_namespace_binding {
    name         = "SESSIONS"
    namespace_id = cloudflare_workers_kv_namespace.sessions.id
  }
  
  kv_namespace_binding {
    name         = "CACHE"
    namespace_id = cloudflare_workers_kv_namespace.cache.id
  }
  
  # D1 Database binding
  d1_database_binding {
    name        = "DB"
    database_id = cloudflare_d1_database.main.id
  }
  
  # R2 Bucket binding
  r2_bucket_binding {
    name        = "STORAGE"
    bucket_name = cloudflare_r2_bucket.storage.name
  }
  
  # Analytics Engine binding (if enabled)
  dynamic "analytics_engine_binding" {
    for_each = var.enable_analytics ? [1] : []
    content {
      name    = "ANALYTICS"
      dataset = cloudflare_logpush_job.analytics[0].dataset
    }
  }
  
  # Secrets
  secret_text_binding {
    name = "JWT_SECRET"
    text = var.jwt_secret
  }
  
  secret_text_binding {
    name = "DATABASE_URL"
    text = var.database_url != "" ? var.database_url : "cloudflare-d1://${cloudflare_d1_database.main.id}"
  }
  
  # Environment variables
  plain_text_binding {
    name = "ENVIRONMENT"
    text = var.environment
  }
  
  plain_text_binding {
    name = "LOG_LEVEL"
    text = var.log_level
  }
  
  plain_text_binding {
    name = "CORS_ORIGINS"
    text = join(",", var.cors_origins)
  }
  
  plain_text_binding {
    name = "DOMAIN_NAME"
    text = var.domain_name
  }
}

# Worker route
resource "cloudflare_worker_route" "gateway" {
  zone_id     = var.cloudflare_zone_id
  pattern     = "${var.domain_name}/*"
  script_name = cloudflare_worker_script.gateway_with_bindings.name
}

# Worker domain
resource "cloudflare_worker_domain" "gateway" {
  zone_id              = var.cloudflare_zone_id
  hostname             = var.domain_name
  service              = cloudflare_worker_script.gateway_with_bindings.name
  environment          = var.environment
}

# Monitoring and alerting (if enabled)
resource "cloudflare_notification_policy" "worker_errors" {
  count = var.enable_monitoring ? 1 : 0
  
  account_id  = var.cloudflare_account_id
  name        = "${local.name_prefix}-worker-errors"
  description = "Alert on worker errors"
  enabled     = true
  
  alert_type = "workers_alert"
  
  filters = {
    zones = [var.cloudflare_zone_id]
    services = [cloudflare_worker_script.gateway_with_bindings.name]
  }
  
  dynamic "email_integration" {
    for_each = var.notification_email_id != "" ? [1] : []
    content {
      id = var.notification_email_id
    }
  }
}

# WAF Rules for additional security
resource "cloudflare_ruleset" "waf_custom" {
  zone_id     = var.cloudflare_zone_id
  name        = "${local.name_prefix}-waf-rules"
  description = "Custom WAF rules for OAuth MCP Gateway"
  kind        = "zone"
  phase       = "http_request_firewall_custom"
  
  rules {
    action = "block"
    expression = "(http.request.uri.path contains \"/oauth/\" and http.request.method eq \"POST\" and rate(5m) > 10)"
    description = "Rate limit OAuth endpoints"
    enabled = true
  }
  
  rules {
    action = "challenge"
    expression = "(cf.threat_score > 50)"
    description = "Challenge high threat score requests"
    enabled = true
  }
}
# Outputs

output "worker_url" {
  description = "URL of the deployed worker"
  value       = "https://${var.domain_name}"
}

output "worker_script_name" {
  description = "Name of the worker script"
  value       = cloudflare_worker_script.gateway_with_bindings.name
}

output "sessions_kv_namespace_id" {
  description = "ID of the sessions KV namespace"
  value       = cloudflare_workers_kv_namespace.sessions.id
}

output "cache_kv_namespace_id" {
  description = "ID of the cache KV namespace"
  value       = cloudflare_workers_kv_namespace.cache.id
}

output "d1_database_id" {
  description = "ID of the D1 database"
  value       = cloudflare_d1_database.main.id
}

output "d1_database_name" {
  description = "Name of the D1 database"
  value       = cloudflare_d1_database.main.name
}

output "r2_bucket_name" {
  description = "Name of the R2 bucket"
  value       = cloudflare_r2_bucket.storage.name
}

output "environment" {
  description = "Deployment environment"
  value       = var.environment
}

output "analytics_enabled" {
  description = "Whether analytics are enabled"
  value       = var.enable_analytics
}

output "monitoring_enabled" {
  description = "Whether monitoring is enabled"
  value       = var.enable_monitoring
}