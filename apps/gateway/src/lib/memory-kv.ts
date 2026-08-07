/**
 * In-process key-value cache with TTL, mirroring the small KV surface the
 * services use (get/put/delete/list).
 *
 * ponytail: in-memory, single instance; back with Redis or a Postgres table
 * if the gateway is ever scaled horizontally.
 */

export interface KVPutOptions {
  expirationTtl?: number; // seconds
  metadata?: unknown;
}

export interface KVLike {
  get(key: string, type?: 'text'): Promise<string | null>;
  get(key: string, type: 'json'): Promise<any | null>;
  put(key: string, value: string, options?: KVPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: Array<{ name: string }>;
    list_complete: boolean;
    cursor?: string;
  }>;
}

interface Entry {
  value: string;
  expiresAt?: number;
}

export class MemoryKV implements KVLike {
  private store = new Map<string, Entry>();

  private live(key: string): Entry | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== undefined && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  async get(key: string, type?: 'text' | 'json'): Promise<any> {
    const entry = this.live(key);
    if (!entry) return null;
    return type === 'json' ? JSON.parse(entry.value) : entry.value;
  }

  async put(key: string, value: string, options?: KVPutOptions): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: options?.expirationTtl ? Date.now() + options.expirationTtl * 1000 : undefined,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: { prefix?: string; limit?: number }) {
    const prefix = options?.prefix ?? '';
    const limit = options?.limit ?? 1000;
    const keys: Array<{ name: string }> = [];
    for (const key of this.store.keys()) {
      if (!key.startsWith(prefix)) continue;
      if (!this.live(key)) continue;
      keys.push({ name: key });
      if (keys.length >= limit) break;
    }
    return { keys, list_complete: true };
  }
}
