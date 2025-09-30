/**
 * Cloudflare Workers Bindings
 * 
 * Type definitions for Cloudflare Workers environment bindings
 * including KV namespaces, D1 databases, and environment variables.
 */

export interface Bindings {
  // KV Namespaces
  SESSIONS: KVNamespace;
  CACHE: KVNamespace;
  
  // D1 Database
  DB: D1Database;
  
  // Environment Variables
  ENVIRONMENT: 'development' | 'staging' | 'production';
  JWT_ISSUER: string;
  CORS_ORIGINS: string;
  
  // Optional secrets (set via wrangler secret)
  JWT_PRIVATE_KEY?: string;
  JWT_PUBLIC_KEY?: string;
  DATABASE_URL?: string;
}