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

# Cloudflare Workers Script
resource "cloudflare_worker_script" "gateway" {
  name = "${local.name_prefix}-worker"
  
  content = file("${path.module}/../dist/worker.js")
  
  module = true
  
  # Secrets
  secret {
    name  = "JWT_SECRET"
    value = var.jwt_secret
  }
  
  secret {
    name  = "DATABASE_URL"
    value = var.database_url
  }
  
  # Environment variables
  plain_text_binding {
    name  = "ENVIRONMENT"
    value = var.environment
  }
  
  plain_text_binding {
    name  = "LOG_LEVEL"
    value = var.log_level
  }
}

# KV Namespace for sessions
resource "cloudflare_workers_kv_namespace" "sessions" {
  account_id = var.cloudflare_account_id
  title      = "${local.name_prefix}-sessions"
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
}

# Worker bindings
resource "cloudflare_worker_script" "gateway_with_bindings" {
  depends_on = [
    cloudflare_workers_kv_namespace.sessions,
    cloudflare_d1_database.main,
    cloudflare_r2_bucket.storage
  ]
  
  name = cloudflare_worker_script.gateway.name
  
  content = cloudflare_worker_script.gateway.content
  
  module = true
  
  # KV Namespace binding
  kv_namespace_binding {
    name         = "SESSION_STORE"
    namespace_id = cloudflare_workers_kv_namespace.sessions.id
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
  
  # Secrets
  secret_binding {
    name = "JWT_SECRET"
    value = var.jwt_secret
  }
  
  secret_binding {
    name = "DATABASE_URL"
    value = var.database_url
  }
  
  # Environment variables
  plain_text_binding {
    name  = "ENVIRONMENT"
    value = var.environment
  }
  
  plain_text_binding {
    name  = "LOG_LEVEL"
    value = var.log_level
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

# Outputs
output "worker_url" {
  description = "URL of the deployed worker"
  value       = "https://${var.domain_name}"
}

output "worker_script_name" {
  description = "Name of the worker script"
  value       = cloudflare_worker_script.gateway_with_bindings.name
}

output "kv_namespace_id" {
  description = "ID of the KV namespace"
  value       = cloudflare_workers_kv_namespace.sessions.id
}

output "d1_database_id" {
  description = "ID of the D1 database"
  value       = cloudflare_d1_database.main.id
}

output "r2_bucket_name" {
  description = "Name of the R2 bucket"
  value       = cloudflare_r2_bucket.storage.name
}