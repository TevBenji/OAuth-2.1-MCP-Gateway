# Development environment variables

environment         = "development"
domain_name         = "dev.oauth-mcp-gateway.example.com"
log_level           = "debug"
database_url        = ""  # Will use D1 database
jwt_secret          = "dev-jwt-secret-key-change-in-production"
enable_analytics    = false
enable_monitoring   = false
cors_origins        = ["http://localhost:3000", "https://claude.ai"]
notification_email_id = ""