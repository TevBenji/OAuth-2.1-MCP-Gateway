/**
 * Cloudflare KV Session Storage Implementation
 *
 * Implements session storage using Cloudflare KV with TTL support.
 */
import { Session, SessionStorage } from '../../types/session';
/**
 * KV Namespace binding type
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
 * Session Storage using Cloudflare KV
 */
export declare class SessionStorageKV implements SessionStorage {
    private kv;
    private keyPrefix;
    constructor(kv: KVNamespace, keyPrefix?: string);
    /**
     * Generate KV key for session
     */
    private getSessionKey;
    /**
     * Generate KV key for user session index
     */
    private getUserSessionIndexKey;
    /**
     * Create a new session
     */
    create(session: Session): Promise<void>;
    /**
     * Get a session by ID
     */
    get(sessionId: string): Promise<Session | null>;
    /**
     * Update a session
     */
    update(sessionId: string, updates: Partial<Session>): Promise<void>;
    /**
     * Delete a session
     */
    delete(sessionId: string): Promise<void>;
    /**
     * Get all sessions for a user
     */
    getUserSessions(tenantId: string, userId: string): Promise<Session[]>;
    /**
     * Delete all sessions for a user
     */
    deleteUserSessions(tenantId: string, userId: string): Promise<number>;
    /**
     * Cleanup expired sessions
     */
    cleanupExpiredSessions(): Promise<number>;
    /**
     * Add session to user index
     */
    private addToUserIndex;
    /**
     * Remove session from user index
     */
    private removeFromUserIndex;
    /**
     * Update user index with new session list
     */
    private updateUserIndex;
    /**
     * Serialize session for storage
     */
    private serializeSession;
    /**
     * Deserialize session from storage
     */
    private deserializeSession;
}
/**
 * Create a session storage instance
 */
export declare function createSessionStorage(kv: KVNamespace): SessionStorage;
export {};
