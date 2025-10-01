/**
 * Cloudflare Workers Bindings
 *
 * Type definitions for Cloudflare Workers environment bindings
 * including KV namespaces, D1 databases, and environment variables.
 */
export interface Bindings {
    SESSIONS: KVNamespace;
    CACHE: KVNamespace;
    DB: D1Database;
    ENVIRONMENT: 'development' | 'staging' | 'production';
    JWT_ISSUER: string;
    CORS_ORIGINS: string;
    JWT_PRIVATE_KEY?: string;
    JWT_PUBLIC_KEY?: string;
    DATABASE_URL?: string;
    [key: string]: unknown;
}
