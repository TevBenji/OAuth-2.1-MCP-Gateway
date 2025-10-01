/**
 * Cloudflare KV Rate Limit Storage Implementation
 *
 * Implements rate limit storage using Cloudflare KV with sliding window algorithm.
 */
import { RateLimitStorage, RateLimitWindow, IPBlockEntry } from '../../types/rate-limit';
/**
 * KV Namespace type (reuse from session storage)
 */
export interface KVNamespace {
    get(key: string, type?: 'text'): Promise<string | null>;
    get(key: string, type: 'json'): Promise<any | null>;
    put(key: string, value: string, options?: KVPutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: KVListOptions): Promise<KVListResult>;
}
interface KVPutOptions {
    expiration?: number;
    expirationTtl?: number;
    metadata?: any;
}
interface KVListOptions {
    prefix?: string;
    limit?: number;
    cursor?: string;
}
interface KVListResult {
    keys: Array<{
        name: string;
        expiration?: number;
        metadata?: any;
    }>;
    list_complete: boolean;
    cursor?: string;
}
/**
 * Rate Limit Storage using Cloudflare KV
 */
export declare class RateLimitStorageKV implements RateLimitStorage {
    private kv;
    private keyPrefix;
    constructor(kv: KVNamespace, keyPrefix?: string);
    /**
     * Generate KV key for rate limit counter
     */
    private getRateLimitKey;
    /**
     * Generate KV key for IP block
     */
    private getBlockKey;
    /**
     * Get window key based on current time
     */
    private getWindowKey;
    /**
     * Increment counter for rate limit window
     */
    increment(key: string, window: RateLimitWindow, ttl: number): Promise<number>;
    /**
     * Get current count for a key
     */
    get(key: string): Promise<number>;
    /**
     * Reset rate limit counter
     */
    reset(key: string): Promise<void>;
    /**
     * Check if IP is blocked
     */
    isBlocked(ipAddress: string): Promise<boolean>;
    /**
     * Block an IP address
     */
    block(ipAddress: string, duration: number, reason: string): Promise<void>;
    /**
     * Unblock an IP address
     */
    unblock(ipAddress: string): Promise<void>;
    /**
     * Get block information for an IP
     */
    getBlockInfo(ipAddress: string): Promise<IPBlockEntry | null>;
    /**
     * Serialize block entry for storage
     */
    private serializeBlockEntry;
    /**
     * Deserialize block entry from storage
     */
    private deserializeBlockEntry;
    /**
     * Clean up expired rate limit entries (for maintenance)
     */
    cleanup(): Promise<number>;
}
/**
 * Create a rate limit storage instance
 */
export declare function createRateLimitStorage(kv: KVNamespace): RateLimitStorage;
export {};
