/**
 * DI Container Service Bindings
 *
 * Registers all application services with the DI container.
 * Centralizes service initialization logic.
 */

import { Container, SERVICE_IDS } from './container';
import { getJWTService } from '../services/oauth/jwt-factory';
import { RateLimiter } from '../services/security/rate-limiter';
import { RateLimitStorageKV } from '../services/security/rate-limit-storage-kv';
import { createRateLimitStorageDO } from '../services/security/rate-limit-storage-do';
import type { Bindings } from '../types/bindings';

/**
 * Configure DI container with all application services
 *
 * @param container - DI container instance
 * @param env - Environment bindings
 */
export function configureServices(container: Container, env: Bindings): void {
  // JWT Service (singleton)
  container.register(
    SERVICE_IDS.JWT,
    () => getJWTService({
      JWT_SECRET: env.JWT_SECRET,
      JWT_ALGORITHM: (env as any).JWT_ALGORITHM || 'HS256',
      JWT_ISSUER: (env as any).JWT_ISSUER || 'oauth-mcp-gateway',
    }),
    true
  );

  // Rate Limiter Service (singleton)
  container.register(
    SERVICE_IDS.RATE_LIMITER,
    () => {
      // Prefer Durable Objects, fallback to KV
      const storage = (env as any).RATE_LIMIT_DO
        ? createRateLimitStorageDO(
            (env as any).RATE_LIMIT_DO,
            (env as any).RATE_LIMIT_KV || env.CACHE
          )
        : new RateLimitStorageKV(
            (env as any).RATE_LIMIT_KV || env.CACHE,
            'oauth-gateway'
          );

      return new RateLimiter(storage);
    },
    true
  );

  // Add more service bindings as needed
}

/**
 * Create and configure a new DI container
 *
 * @param env - Environment bindings
 * @returns Configured container instance
 */
export function createContainer(env: Bindings): Container {
  const container = new Container();
  configureServices(container, env);
  return container;
}
