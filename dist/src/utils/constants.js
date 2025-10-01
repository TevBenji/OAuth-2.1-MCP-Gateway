/**
 * Application Constants
 *
 * Centralized constants for OAuth 2.1, MCP, and application-wide settings.
 */
// OAuth 2.1 Constants
export const OAUTH_CONSTANTS = {
    // Grant Types
    GRANT_TYPES: {
        AUTHORIZATION_CODE: 'authorization_code',
        REFRESH_TOKEN: 'refresh_token'
    },
    // Response Types
    RESPONSE_TYPES: {
        CODE: 'code'
    },
    // Token Types
    TOKEN_TYPES: {
        BEARER: 'Bearer'
    },
    // PKCE
    PKCE: {
        CODE_CHALLENGE_METHOD: 'S256',
        CODE_VERIFIER_MIN_LENGTH: 43,
        CODE_VERIFIER_MAX_LENGTH: 128,
        CODE_CHALLENGE_LENGTH: 43
    },
    // Token Expiry (seconds)
    TOKEN_EXPIRY: {
        ACCESS_TOKEN: 3600, // 1 hour
        REFRESH_TOKEN: 86400 * 30, // 30 days
        AUTHORIZATION_CODE: 600, // 10 minutes
        ID_TOKEN: 3600 // 1 hour
    },
    // Error Codes
    ERROR_CODES: {
        INVALID_REQUEST: 'invalid_request',
        INVALID_CLIENT: 'invalid_client',
        INVALID_GRANT: 'invalid_grant',
        UNAUTHORIZED_CLIENT: 'unauthorized_client',
        UNSUPPORTED_GRANT_TYPE: 'unsupported_grant_type',
        INVALID_SCOPE: 'invalid_scope',
        INVALID_TARGET: 'invalid_target',
        ACCESS_DENIED: 'access_denied'
    }
};
// MCP Constants
export const MCP_CONSTANTS = {
    // Default Scopes
    DEFAULT_SCOPES: [
        'mcp:tools:read',
        'mcp:resources:read'
    ],
    // Scope Hierarchy
    SCOPE_HIERARCHY: {
        'mcp:tools:*': ['mcp:tools:read', 'mcp:tools:write', 'mcp:tools:execute'],
        'mcp:resources:*': ['mcp:resources:read', 'mcp:resources:write', 'mcp:resources:delete'],
        'mcp:admin:*': ['mcp:admin:read', 'mcp:admin:write']
    },
    // Headers
    HEADERS: {
        TENANT_ID: 'X-Tenant-ID',
        USER_ID: 'X-User-ID',
        SESSION_ID: 'X-Session-ID',
        DEVICE_ID: 'X-Device-ID',
        REQUEST_ID: 'X-Request-ID',
        CORRELATION_ID: 'X-Correlation-ID'
    },
    // Timeouts
    TIMEOUTS: {
        DEFAULT_REQUEST: 30000, // 30 seconds
        HEALTH_CHECK: 5000, // 5 seconds
        CONNECTION: 10000 // 10 seconds
    }
};
// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
};
// Rate Limiting Constants
export const RATE_LIMIT_CONSTANTS = {
    // Window Types
    WINDOWS: {
        MINUTE: 60,
        HOUR: 3600,
        DAY: 86400
    },
    // Default Limits
    DEFAULT_LIMITS: {
        REQUESTS_PER_MINUTE: 1000,
        REQUESTS_PER_HOUR: 10000,
        REQUESTS_PER_DAY: 100000,
        BURST_LIMIT: 100
    },
    // Headers
    HEADERS: {
        LIMIT: 'X-RateLimit-Limit',
        REMAINING: 'X-RateLimit-Remaining',
        RESET: 'X-RateLimit-Reset',
        RETRY_AFTER: 'Retry-After'
    }
};
// Security Constants
export const SECURITY_CONSTANTS = {
    // Password Requirements
    PASSWORD: {
        MIN_LENGTH: 12,
        MAX_LENGTH: 128,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBERS: true,
        REQUIRE_SYMBOLS: true
    },
    // Session Management
    SESSION: {
        MAX_DURATION: 86400 * 7, // 7 days
        IDLE_TIMEOUT: 3600, // 1 hour
        MAX_CONCURRENT: 10,
        RENEWAL_THRESHOLD: 300 // 5 minutes
    },
    // Risk Scoring
    RISK_SCORES: {
        LOW: 0.0,
        MEDIUM: 0.5,
        HIGH: 0.8,
        CRITICAL: 1.0
    },
    // Cryptography
    CRYPTO: {
        JWT_ALGORITHM: 'RS256',
        HASH_ALGORITHM: 'SHA-256',
        KEY_LENGTH: 2048,
        SALT_LENGTH: 32
    }
};
// Database Constants
export const DATABASE_CONSTANTS = {
    // Table Names
    TABLES: {
        TENANTS: 'tenants',
        OAUTH_CLIENTS: 'oauth_clients',
        AUTHORIZATION_CODES: 'authorization_codes',
        REFRESH_TOKENS: 'refresh_tokens',
        MCP_SERVERS: 'mcp_servers',
        API_KEYS: 'api_keys',
        AUDIT_LOGS: 'audit_logs',
        SESSIONS: 'sessions',
        USERS: 'users'
    },
    // Connection Settings
    CONNECTION: {
        TIMEOUT: 5000,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        MAX_CONNECTIONS: 10
    },
    // Query Limits
    QUERY_LIMITS: {
        MAX_RESULTS: 1000,
        DEFAULT_PAGE_SIZE: 100,
        MAX_PAGE_SIZE: 1000
    }
};
// Audit Constants
export const AUDIT_CONSTANTS = {
    // Batch Processing
    BATCH: {
        SIZE: 100,
        FLUSH_INTERVAL: 60000, // 1 minute
        MAX_QUEUE_SIZE: 10000
    },
    // Retention Periods (days)
    RETENTION: {
        STANDARD: 365, // 1 year
        HIPAA: 2555, // 7 years
        PCI_DSS: 365, // 1 year
        SOX: 2555 // 7 years
    },
    // Compliance Tags
    COMPLIANCE_TAGS: {
        PCI_DSS: 'pci-dss',
        HIPAA: 'hipaa',
        GDPR: 'gdpr',
        SOX: 'sox',
        ISO27001: 'iso27001'
    }
};
// Cache Constants
export const CACHE_CONSTANTS = {
    // TTL Values (seconds)
    TTL: {
        SHORT: 300, // 5 minutes
        MEDIUM: 3600, // 1 hour
        LONG: 86400, // 1 day
        VERY_LONG: 604800 // 1 week
    },
    // Key Prefixes
    KEY_PREFIXES: {
        SESSION: 'session:',
        USER: 'user:',
        TENANT: 'tenant:',
        CLIENT: 'client:',
        RATE_LIMIT: 'rate_limit:',
        HEALTH_CHECK: 'health:',
        CONFIG: 'config:'
    }
};
// API Key Constants
export const API_KEY_CONSTANTS = {
    // Key Formats
    PREFIXES: {
        LIVE: 'mcp_live_',
        TEST: 'mcp_test_'
    },
    // Key Properties
    KEY_LENGTH: 32,
    PREFIX_LENGTH: 8,
    TOTAL_LENGTH: 40,
    // Rotation
    ROTATION_OVERLAP_HOURS: 24,
    ROTATION_WARNING_DAYS: 7
};
// Billing Constants
export const BILLING_CONSTANTS = {
    // Tiers
    TIERS: {
        FREE: 'free',
        PRO: 'pro',
        BUSINESS: 'business',
        ENTERPRISE: 'enterprise'
    },
    // Limits
    TIER_LIMITS: {
        FREE: {
            REQUESTS_PER_MONTH: 10000,
            MCP_SERVERS: 3,
            USERS: 5,
            STORAGE_GB: 1
        },
        PRO: {
            REQUESTS_PER_MONTH: 1000000,
            MCP_SERVERS: 25,
            USERS: 50,
            STORAGE_GB: 10
        },
        BUSINESS: {
            REQUESTS_PER_MONTH: 10000000,
            MCP_SERVERS: 100,
            USERS: 500,
            STORAGE_GB: 100
        },
        ENTERPRISE: {
            REQUESTS_PER_MONTH: -1, // Unlimited
            MCP_SERVERS: -1, // Unlimited
            USERS: -1, // Unlimited
            STORAGE_GB: -1 // Unlimited
        }
    },
    // Pricing
    OVERAGE_PRICING: {
        REQUESTS_PER_MILLION: 1.50,
        STORAGE_PER_GB: 0.10,
        ADDITIONAL_USER: 5.00
    }
};
