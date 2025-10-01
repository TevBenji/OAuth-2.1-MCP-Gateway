/**
 * Cloudflare KV Rate Limit Storage Implementation
 *
 * Implements rate limit storage using Cloudflare KV with sliding window algorithm.
 */
import { RateLimitWindow, } from '../../types/rate-limit';
/**
 * Rate Limit Storage using Cloudflare KV
 */
export class RateLimitStorageKV {
    kv;
    keyPrefix;
    constructor(kv, keyPrefix = 'ratelimit') {
        this.kv = kv;
        this.keyPrefix = keyPrefix;
    }
    /**
     * Generate KV key for rate limit counter
     */
    getRateLimitKey(key, window) {
        const now = Math.floor(Date.now() / 1000);
        const windowKey = this.getWindowKey(now, window);
        return `${this.keyPrefix}:${key}:${window}:${windowKey}`;
    }
    /**
     * Generate KV key for IP block
     */
    getBlockKey(ipAddress) {
        return `${this.keyPrefix}:block:${ipAddress}`;
    }
    /**
     * Get window key based on current time
     */
    getWindowKey(timestamp, window) {
        switch (window) {
            case RateLimitWindow.SECOND:
                return timestamp;
            case RateLimitWindow.MINUTE:
                return Math.floor(timestamp / 60);
            case RateLimitWindow.HOUR:
                return Math.floor(timestamp / 3600);
            case RateLimitWindow.DAY:
                return Math.floor(timestamp / 86400);
            default:
                return Math.floor(timestamp / 60);
        }
    }
    /**
     * Increment counter for rate limit window
     */
    async increment(key, window, ttl) {
        const kvKey = this.getRateLimitKey(key, window);
        // Get current count
        const currentValue = await this.kv.get(kvKey, 'text');
        const count = currentValue ? parseInt(currentValue, 10) + 1 : 1;
        // Store updated count with TTL
        await this.kv.put(kvKey, count.toString(), {
            expirationTtl: ttl,
        });
        return count;
    }
    /**
     * Get current count for a key
     */
    async get(key) {
        // We need to check current window for each type
        // For simplicity, check minute window
        const kvKey = this.getRateLimitKey(key, RateLimitWindow.MINUTE);
        const value = await this.kv.get(kvKey, 'text');
        return value ? parseInt(value, 10) : 0;
    }
    /**
     * Reset rate limit counter
     */
    async reset(key) {
        // Delete all window keys for this rate limit key
        const windows = [
            RateLimitWindow.SECOND,
            RateLimitWindow.MINUTE,
            RateLimitWindow.HOUR,
            RateLimitWindow.DAY,
        ];
        for (const window of windows) {
            const kvKey = this.getRateLimitKey(key, window);
            await this.kv.delete(kvKey);
        }
    }
    /**
     * Check if IP is blocked
     */
    async isBlocked(ipAddress) {
        const blockKey = this.getBlockKey(ipAddress);
        const blockInfo = await this.kv.get(blockKey, 'json');
        if (!blockInfo) {
            return false;
        }
        const expiresAt = new Date(blockInfo.expires_at);
        const now = new Date();
        // Check if block has expired
        if (now > expiresAt) {
            await this.kv.delete(blockKey);
            return false;
        }
        return true;
    }
    /**
     * Block an IP address
     */
    async block(ipAddress, duration, reason) {
        const blockKey = this.getBlockKey(ipAddress);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + duration * 1000);
        // Get existing block info to track violation count
        const existingBlock = await this.kv.get(blockKey, 'json');
        const violationCount = existingBlock ? (existingBlock.violation_count || 0) + 1 : 1;
        const blockInfo = {
            ip_address: ipAddress,
            blocked_at: now,
            expires_at: expiresAt,
            reason,
            violation_count: violationCount,
        };
        await this.kv.put(blockKey, JSON.stringify(this.serializeBlockEntry(blockInfo)), {
            expirationTtl: duration,
        });
    }
    /**
     * Unblock an IP address
     */
    async unblock(ipAddress) {
        const blockKey = this.getBlockKey(ipAddress);
        await this.kv.delete(blockKey);
    }
    /**
     * Get block information for an IP
     */
    async getBlockInfo(ipAddress) {
        const blockKey = this.getBlockKey(ipAddress);
        const blockInfo = await this.kv.get(blockKey, 'json');
        if (!blockInfo) {
            return null;
        }
        return this.deserializeBlockEntry(blockInfo);
    }
    /**
     * Serialize block entry for storage
     */
    serializeBlockEntry(entry) {
        return {
            ip_address: entry.ip_address,
            blocked_at: entry.blocked_at.toISOString(),
            expires_at: entry.expires_at.toISOString(),
            reason: entry.reason,
            violation_count: entry.violation_count,
        };
    }
    /**
     * Deserialize block entry from storage
     */
    deserializeBlockEntry(data) {
        return {
            ip_address: data.ip_address,
            blocked_at: new Date(data.blocked_at),
            expires_at: new Date(data.expires_at),
            reason: data.reason,
            violation_count: data.violation_count,
        };
    }
    /**
     * Clean up expired rate limit entries (for maintenance)
     */
    async cleanup() {
        // KV automatically cleans up expired keys based on TTL
        // This method is here for interface compatibility
        let cleaned = 0;
        let cursor;
        do {
            const result = await this.kv.list({
                prefix: `${this.keyPrefix}:block:`,
                limit: 100,
                cursor,
            });
            for (const key of result.keys) {
                const blockInfo = await this.kv.get(key.name, 'json');
                if (blockInfo) {
                    const expiresAt = new Date(blockInfo.expires_at);
                    if (new Date() > expiresAt) {
                        await this.kv.delete(key.name);
                        cleaned++;
                    }
                }
            }
            cursor = result.cursor;
        } while (cursor);
        return cleaned;
    }
}
/**
 * Create a rate limit storage instance
 */
export function createRateLimitStorage(kv) {
    return new RateLimitStorageKV(kv);
}
