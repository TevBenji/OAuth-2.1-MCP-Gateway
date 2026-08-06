/**
 * Cloudflare KV Rate Limit Storage Implementation
 *
 * Implements rate limit storage using Cloudflare KV with sliding window algorithm.
 */

import {
  RateLimitStorage,
  RateLimitWindow,
  IPBlockEntry,
} from '../../types/rate-limit';

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
  keys: Array<{ name: string; expiration?: number; metadata?: any }>;
  list_complete: boolean;
  cursor?: string;
}

/**
 * Rate Limit Storage using Cloudflare KV
 */
export class RateLimitStorageKV implements RateLimitStorage {
  private kv: KVNamespace;
  private keyPrefix: string;

  constructor(kv: KVNamespace, keyPrefix: string = 'ratelimit') {
    this.kv = kv;
    this.keyPrefix = keyPrefix;
  }

  /**
   * Generate KV key for rate limit counter
   */
  private getRateLimitKey(key: string, window: RateLimitWindow): string {
    const now = Math.floor(Date.now() / 1000);
    const windowKey = this.getWindowKey(now, window);
    return `${this.keyPrefix}:${key}:${window}:${windowKey}`;
  }

  /**
   * Generate KV key for IP block
   */
  private getBlockKey(ipAddress: string): string {
    return `${this.keyPrefix}:block:${ipAddress}`;
  }

  /**
   * Get window key based on current time
   */
  private getWindowKey(timestamp: number, window: RateLimitWindow): number {
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
  async increment(key: string, window: RateLimitWindow, ttl: number): Promise<number> {
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
  async get(key: string): Promise<number> {
    // We need to check current window for each type
    // For simplicity, check minute window
    const kvKey = this.getRateLimitKey(key, RateLimitWindow.MINUTE);
    const value = await this.kv.get(kvKey, 'text');
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Reset rate limit counter
   */
  async reset(key: string): Promise<void> {
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
  async isBlocked(ipAddress: string): Promise<boolean> {
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
  async block(ipAddress: string, duration: number, reason: string): Promise<void> {
    const blockKey = this.getBlockKey(ipAddress);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 1000);

    // Get existing block info to track violation count
    const existingBlock = await this.kv.get(blockKey, 'json');
    const violationCount = existingBlock ? (existingBlock.violation_count || 0) + 1 : 1;

    const blockInfo: IPBlockEntry = {
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
  async unblock(ipAddress: string): Promise<void> {
    const blockKey = this.getBlockKey(ipAddress);
    await this.kv.delete(blockKey);
  }

  /**
   * Get block information for an IP
   */
  async getBlockInfo(ipAddress: string): Promise<IPBlockEntry | null> {
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
  private serializeBlockEntry(entry: IPBlockEntry): any {
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
  private deserializeBlockEntry(data: any): IPBlockEntry {
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
  async cleanup(): Promise<number> {
    // KV automatically cleans up expired keys based on TTL
    // This method is here for interface compatibility
    let cleaned = 0;
    let cursor: string | undefined;

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
export function createRateLimitStorage(kv: KVNamespace): RateLimitStorage {
  return new RateLimitStorageKV(kv);
}
