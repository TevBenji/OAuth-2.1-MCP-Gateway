/**
 * Scheduled Session Index Cleanup
 *
 * Cron job to clean up orphaned session indexes from KV.
 * Runs daily to maintain index integrity without impacting request path.
 *
 * Architecture Decision:
 * - Separated from request path to avoid latency impact
 * - Batch size limited to 100 to prevent timeouts
 * - Uses scheduled triggers (wrangler.toml)
 *
 * Performance Impact:
 * - Removes expensive cleanup from session operations
 * - Expected improvement: ~50-100ms per session operation
 * - Runs daily outside peak hours
 */
import type { Bindings } from '../types/bindings';
/**
 * Scheduled handler for session index cleanup
 *
 * Triggered by Cloudflare Cron (see wrangler.toml)
 */
export declare function handleScheduledCleanup(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext): Promise<void>;
/**
 * Export for Cloudflare Workers scheduled event
 */
declare const _default: {
    scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext): Promise<void>;
};
export default _default;
