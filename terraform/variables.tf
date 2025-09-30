# Variables for OAuth 2.1 MCP Gateway Terraform configuration

variable "cloudflare_api_token" {
  description = "Cloudflare API token with appropriate permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for the domain"
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
    error_message = "Environment must be one of: development, staging, production"
  }
}

variable "jwt_secret" {
  description = "JWT secret key for token signing"
  type        = string
  sensitive   = true
}

variable "database_url" {
  description = "Database connection URL"
  type        = string
  sensitive   = true
}

variable "log_level" {
  description = "Logging level (debug, info, warn, error)"
  type        = string
  default     = "info"
  
  validation {
    condition     = contains(["debug", "info", "warn", "error"], var.log_level)
    error_message = "Log level must be one of: debug, info, warn, error"
  }
}

# Environment-specific defaults
variable "development_defaults" {
  description = "Default values for development environment"
  type = object({
    domain_name = string
    log_level   = string
  })
  default = {
    domain_name = "dev.oauth-mcp-gateway.example.com"
    log_level   = "debug"
  }
}

variable "staging_defaults" {
  description = "Default values for staging environment"
  type = object({
    domain_name = string
    log_level   = string
  })
  default = {
    domain_name = "staging.oauth-mcp-gateway.example.com"
    log_level   = "info"
  }
}

variable "production_defaults" {
  description = "Default values for production environment"
  type = object({
    domain_name = string
    log_level   = string
  })
  default = {
    domain_name = "oauth-mcp-gateway.example.com"
    log_level   = "warn"
  }
}