# Staging environment variables

environment         = "staging"
domain_name         = "staging.oauth-mcp-gateway.example.com"
log_level           = "info"
database_url        = ""  # Will use D1 database
jwt_secret          = "staging-jwt-secret-key-replace-with-secure-value"
enable_analytics    = true
enable_monitoring   = true
cors_origins        = ["https://staging.example.com", "https://claude.ai"]
notification_email_id = ""  # Set to actual email integration ID