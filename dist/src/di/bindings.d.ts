/**
 * DI Container Service Bindings
 *
 * Registers all application services with the DI container.
 * Centralizes service initialization logic.
 */
import { Container } from './container';
import type { Bindings } from '../types/bindings';
/**
 * Configure DI container with all application services
 *
 * @param container - DI container instance
 * @param env - Environment bindings
 */
export declare function configureServices(container: Container, env: Bindings): void;
/**
 * Create and configure a new DI container
 *
 * @param env - Environment bindings
 * @returns Configured container instance
 */
export declare function createContainer(env: Bindings): Container;
