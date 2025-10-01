/**
 * Application Constants
 *
 * Centralized constants for OAuth 2.1, MCP, and application-wide settings.
 */
export declare const OAUTH_CONSTANTS: {
    readonly GRANT_TYPES: {
        readonly AUTHORIZATION_CODE: "authorization_code";
        readonly REFRESH_TOKEN: "refresh_token";
    };
    readonly RESPONSE_TYPES: {
        readonly CODE: "code";
    };
    readonly TOKEN_TYPES: {
        readonly BEARER: "Bearer";
    };
    readonly PKCE: {
        readonly CODE_CHALLENGE_METHOD: "S256";
        readonly CODE_VERIFIER_MIN_LENGTH: 43;
        readonly CODE_VERIFIER_MAX_LENGTH: 128;
        readonly CODE_CHALLENGE_LENGTH: 43;
    };
    readonly TOKEN_EXPIRY: {
        readonly ACCESS_TOKEN: 3600;
        readonly REFRESH_TOKEN: number;
        readonly AUTHORIZATION_CODE: 600;
        readonly ID_TOKEN: 3600;
    };
    readonly ERROR_CODES: {
        readonly INVALID_REQUEST: "invalid_request";
        readonly INVALID_CLIENT: "invalid_client";
        readonly INVALID_GRANT: "invalid_grant";
        readonly UNAUTHORIZED_CLIENT: "unauthorized_client";
        readonly UNSUPPORTED_GRANT_TYPE: "unsupported_grant_type";
        readonly INVALID_SCOPE: "invalid_scope";
        readonly INVALID_TARGET: "invalid_target";
        readonly ACCESS_DENIED: "access_denied";
    };
};
export declare const MCP_CONSTANTS: {
    readonly DEFAULT_SCOPES: readonly ["mcp:tools:read", "mcp:resources:read"];
    readonly SCOPE_HIERARCHY: {
        readonly 'mcp:tools:*': readonly ["mcp:tools:read", "mcp:tools:write", "mcp:tools:execute"];
        readonly 'mcp:resources:*': readonly ["mcp:resources:read", "mcp:resources:write", "mcp:resources:delete"];
        readonly 'mcp:admin:*': readonly ["mcp:admin:read", "mcp:admin:write"];
    };
    readonly HEADERS: {
        readonly TENANT_ID: "X-Tenant-ID";
        readonly USER_ID: "X-User-ID";
        readonly SESSION_ID: "X-Session-ID";
        readonly DEVICE_ID: "X-Device-ID";
        readonly REQUEST_ID: "X-Request-ID";
        readonly CORRELATION_ID: "X-Correlation-ID";
    };
    readonly TIMEOUTS: {
        readonly DEFAULT_REQUEST: 30000;
        readonly HEALTH_CHECK: 5000;
        readonly CONNECTION: 10000;
    };
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly METHOD_NOT_ALLOWED: 405;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
export declare const RATE_LIMIT_CONSTANTS: {
    readonly WINDOWS: {
        readonly MINUTE: 60;
        readonly HOUR: 3600;
        readonly DAY: 86400;
    };
    readonly DEFAULT_LIMITS: {
        readonly REQUESTS_PER_MINUTE: 1000;
        readonly REQUESTS_PER_HOUR: 10000;
        readonly REQUESTS_PER_DAY: 100000;
        readonly BURST_LIMIT: 100;
    };
    readonly HEADERS: {
        readonly LIMIT: "X-RateLimit-Limit";
        readonly REMAINING: "X-RateLimit-Remaining";
        readonly RESET: "X-RateLimit-Reset";
        readonly RETRY_AFTER: "Retry-After";
    };
};
export declare const SECURITY_CONSTANTS: {
    readonly PASSWORD: {
        readonly MIN_LENGTH: 12;
        readonly MAX_LENGTH: 128;
        readonly REQUIRE_UPPERCASE: true;
        readonly REQUIRE_LOWERCASE: true;
        readonly REQUIRE_NUMBERS: true;
        readonly REQUIRE_SYMBOLS: true;
    };
    readonly SESSION: {
        readonly MAX_DURATION: number;
        readonly IDLE_TIMEOUT: 3600;
        readonly MAX_CONCURRENT: 10;
        readonly RENEWAL_THRESHOLD: 300;
    };
    readonly RISK_SCORES: {
        readonly LOW: 0;
        readonly MEDIUM: 0.5;
        readonly HIGH: 0.8;
        readonly CRITICAL: 1;
    };
    readonly CRYPTO: {
        readonly JWT_ALGORITHM: "RS256";
        readonly HASH_ALGORITHM: "SHA-256";
        readonly KEY_LENGTH: 2048;
        readonly SALT_LENGTH: 32;
    };
};
export declare const DATABASE_CONSTANTS: {
    readonly TABLES: {
        readonly TENANTS: "tenants";
        readonly OAUTH_CLIENTS: "oauth_clients";
        readonly AUTHORIZATION_CODES: "authorization_codes";
        readonly REFRESH_TOKENS: "refresh_tokens";
        readonly MCP_SERVERS: "mcp_servers";
        readonly API_KEYS: "api_keys";
        readonly AUDIT_LOGS: "audit_logs";
        readonly SESSIONS: "sessions";
        readonly USERS: "users";
    };
    readonly CONNECTION: {
        readonly TIMEOUT: 5000;
        readonly RETRY_ATTEMPTS: 3;
        readonly RETRY_DELAY: 1000;
        readonly MAX_CONNECTIONS: 10;
    };
    readonly QUERY_LIMITS: {
        readonly MAX_RESULTS: 1000;
        readonly DEFAULT_PAGE_SIZE: 100;
        readonly MAX_PAGE_SIZE: 1000;
    };
};
export declare const AUDIT_CONSTANTS: {
    readonly BATCH: {
        readonly SIZE: 100;
        readonly FLUSH_INTERVAL: 60000;
        readonly MAX_QUEUE_SIZE: 10000;
    };
    readonly RETENTION: {
        readonly STANDARD: 365;
        readonly HIPAA: 2555;
        readonly PCI_DSS: 365;
        readonly SOX: 2555;
    };
    readonly COMPLIANCE_TAGS: {
        readonly PCI_DSS: "pci-dss";
        readonly HIPAA: "hipaa";
        readonly GDPR: "gdpr";
        readonly SOX: "sox";
        readonly ISO27001: "iso27001";
    };
};
export declare const CACHE_CONSTANTS: {
    readonly TTL: {
        readonly SHORT: 300;
        readonly MEDIUM: 3600;
        readonly LONG: 86400;
        readonly VERY_LONG: 604800;
    };
    readonly KEY_PREFIXES: {
        readonly SESSION: "session:";
        readonly USER: "user:";
        readonly TENANT: "tenant:";
        readonly CLIENT: "client:";
        readonly RATE_LIMIT: "rate_limit:";
        readonly HEALTH_CHECK: "health:";
        readonly CONFIG: "config:";
    };
};
export declare const API_KEY_CONSTANTS: {
    readonly PREFIXES: {
        readonly LIVE: "mcp_live_";
        readonly TEST: "mcp_test_";
    };
    readonly KEY_LENGTH: 32;
    readonly PREFIX_LENGTH: 8;
    readonly TOTAL_LENGTH: 40;
    readonly ROTATION_OVERLAP_HOURS: 24;
    readonly ROTATION_WARNING_DAYS: 7;
};
export declare const BILLING_CONSTANTS: {
    readonly TIERS: {
        readonly FREE: "free";
        readonly PRO: "pro";
        readonly BUSINESS: "business";
        readonly ENTERPRISE: "enterprise";
    };
    readonly TIER_LIMITS: {
        readonly FREE: {
            readonly REQUESTS_PER_MONTH: 10000;
            readonly MCP_SERVERS: 3;
            readonly USERS: 5;
            readonly STORAGE_GB: 1;
        };
        readonly PRO: {
            readonly REQUESTS_PER_MONTH: 1000000;
            readonly MCP_SERVERS: 25;
            readonly USERS: 50;
            readonly STORAGE_GB: 10;
        };
        readonly BUSINESS: {
            readonly REQUESTS_PER_MONTH: 10000000;
            readonly MCP_SERVERS: 100;
            readonly USERS: 500;
            readonly STORAGE_GB: 100;
        };
        readonly ENTERPRISE: {
            readonly REQUESTS_PER_MONTH: -1;
            readonly MCP_SERVERS: -1;
            readonly USERS: -1;
            readonly STORAGE_GB: -1;
        };
    };
    readonly OVERAGE_PRICING: {
        readonly REQUESTS_PER_MILLION: 1.5;
        readonly STORAGE_PER_GB: 0.1;
        readonly ADDITIONAL_USER: 5;
    };
};
