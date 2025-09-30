# Production environment variables

environment         = "production"
domain_name         = "oauth-mcp-gateway.example.com"
log_level           = "warn"
database_url        = ""  # Will use D1 database
jwt_secret          = "production-jwt-secret-key-replace-with-secure-value"
enable_analytics    = true
enable_monitoring   = true
cors_origins        = ["https://claude.ai", "https://chatgpt.com", "https://cursor.sh"]
notification_email_id = ""  # Set to actual email integration ID