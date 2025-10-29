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
  SESSION_KV?: KVNamespace; // Optional session KV namespace
  
  // D1 Database
  DB: D1Database;
  
  // Environment Variables
  ENVIRONMENT: 'development' | 'staging' | 'production';
  JWT_ISSUER: string;
  JWT_SECRET?: string; // Optional JWT secret for token generation
  JWT_ALGORITHM?: string; // Optional JWT algorithm
  TENANT_ID?: string; // Optional tenant ID
  CORS_ORIGINS: string;
  
  // Rate limiting Durable Objects
  RATE_LIMIT_DO?: DurableObjectNamespace; // Optional rate limit DO
  RATE_LIMIT_KV?: KVNamespace; // Optional rate limit KV
  
  // Optional secrets (set via wrangler secret)
  JWT_PRIVATE_KEY?: string;
  JWT_PUBLIC_KEY?: string;
  DATABASE_URL?: string;
  
  // Index signature for Hono compatibility
  [key: string]: unknown;
}