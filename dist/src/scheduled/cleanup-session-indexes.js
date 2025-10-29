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
import { SessionStorageKV } from '../services/security/session-storage-kv';
/**
 * Scheduled handler for session index cleanup
 *
 * Triggered by Cloudflare Cron (see wrangler.toml)
 */
export async function handleScheduledCleanup(event, env, ctx) {
    const startTime = Date.now();
    try {
        console.log('[Cron] Starting session index cleanup');
        // Initialize session storage
        const sessionStorage = new SessionStorageKV(env.SESSIONS, 'session');
        // Clean up indexes (max 100 per run)
        const cleaned = await sessionStorage.cleanupIndexes(100);
        const duration = Date.now() - startTime;
        console.log(`[Cron] Cleaned ${cleaned} session indexes in ${duration}ms`);
        // Log metrics (could be sent to analytics service)
        if (env.ENVIRONMENT === 'production') {
            // TODO: Send to metrics service
            console.log({
                event: 'session_cleanup',
                cleaned,
                duration,
                timestamp: new Date().toISOString(),
            });
        }
    }
    catch (error) {
        console.error('[Cron] Session cleanup failed:', error);
        // Don't throw - allow cron to retry next scheduled time
    }
}
/**
 * Export for Cloudflare Workers scheduled event
 */
export default {
    async scheduled(event, env, ctx) {
        ctx.waitUntil(handleScheduledCleanup(event, env, ctx));
    },
};
