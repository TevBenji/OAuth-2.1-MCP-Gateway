/**
 * Cloudflare KV Session Storage Implementation
 *
 * Implements session storage using Cloudflare KV with TTL support.
 */
import { SessionStatus } from '../../types/session';
/**
 * Session Storage using Cloudflare KV
 */
export class SessionStorageKV {
    kv;
    keyPrefix;
    constructor(kv, keyPrefix = 'session') {
        this.kv = kv;
        this.keyPrefix = keyPrefix;
    }
    /**
     * Generate KV key for session
     */
    getSessionKey(sessionId) {
        return `${this.keyPrefix}:${sessionId}`;
    }
    /**
     * Generate KV key for user session index
     */
    getUserSessionIndexKey(tenantId, userId) {
        return `${this.keyPrefix}:user:${tenantId}:${userId}`;
    }
    /**
     * Create a new session
     */
    async create(session) {
        const key = this.getSessionKey(session.session_id);
        const value = JSON.stringify(this.serializeSession(session));
        // Calculate TTL based on session expiry
        const ttl = Math.floor((session.expires_at.getTime() - Date.now()) / 1000);
        // Store session with TTL
        await this.kv.put(key, value, {
            expirationTtl: Math.max(ttl, 60), // Minimum 60 seconds
            metadata: {
                tenant_id: session.tenant_id,
                user_id: session.user_id,
                status: session.status,
            },
        });
        // Add session to user index
        await this.addToUserIndex(session.tenant_id, session.user_id, session.session_id);
    }
    /**
     * Get a session by ID
     */
    async get(sessionId) {
        const key = this.getSessionKey(sessionId);
        const value = await this.kv.get(key, 'json');
        if (!value) {
            return null;
        }
        return this.deserializeSession(value);
    }
    /**
     * Update a session
     */
    async update(sessionId, updates) {
        const session = await this.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        // Apply updates
        const updatedSession = { ...session, ...updates };
        // Recalculate TTL
        const ttl = Math.floor((updatedSession.expires_at.getTime() - Date.now()) / 1000);
        if (ttl <= 0) {
            // Session has expired, delete it
            await this.delete(sessionId);
            return;
        }
        const key = this.getSessionKey(sessionId);
        const value = JSON.stringify(this.serializeSession(updatedSession));
        await this.kv.put(key, value, {
            expirationTtl: Math.max(ttl, 60),
            metadata: {
                tenant_id: updatedSession.tenant_id,
                user_id: updatedSession.user_id,
                status: updatedSession.status,
            },
        });
    }
    /**
     * Delete a session
     */
    async delete(sessionId) {
        const session = await this.get(sessionId);
        if (session) {
            // Remove from user index
            await this.removeFromUserIndex(session.tenant_id, session.user_id, sessionId);
        }
        const key = this.getSessionKey(sessionId);
        await this.kv.delete(key);
    }
    /**
     * Get all sessions for a user
     */
    async getUserSessions(tenantId, userId) {
        const indexKey = this.getUserSessionIndexKey(tenantId, userId);
        const indexValue = await this.kv.get(indexKey, 'json');
        if (!indexValue || !Array.isArray(indexValue)) {
            return [];
        }
        const sessionIds = indexValue;
        const sessions = [];
        // Fetch all sessions
        for (const sessionId of sessionIds) {
            const session = await this.get(sessionId);
            if (session) {
                sessions.push(session);
            }
        }
        // Update index to remove expired sessions
        const validSessionIds = sessions.map(s => s.session_id);
        if (validSessionIds.length !== sessionIds.length) {
            await this.updateUserIndex(tenantId, userId, validSessionIds);
        }
        return sessions;
    }
    /**
     * Delete all sessions for a user
     */
    async deleteUserSessions(tenantId, userId) {
        const sessions = await this.getUserSessions(tenantId, userId);
        for (const session of sessions) {
            await this.delete(session.session_id);
        }
        // Clear user index
        const indexKey = this.getUserSessionIndexKey(tenantId, userId);
        await this.kv.delete(indexKey);
        return sessions.length;
    }
    /**
     * Cleanup expired sessions
     */
    async cleanupExpiredSessions() {
        // Note: Cloudflare KV automatically removes expired keys based on TTL
        // This method is here for interface compatibility
        // In a real implementation, you might scan and clean up orphaned user indexes
        let cleaned = 0;
        let cursor;
        do {
            const result = await this.kv.list({
                prefix: `${this.keyPrefix}:user:`,
                limit: 100,
                cursor,
            });
            for (const key of result.keys) {
                const indexValue = await this.kv.get(key.name, 'json');
                if (Array.isArray(indexValue)) {
                    const sessionIds = indexValue;
                    const validSessionIds = [];
                    for (const sessionId of sessionIds) {
                        const session = await this.get(sessionId);
                        if (session && session.status === SessionStatus.ACTIVE) {
                            validSessionIds.push(sessionId);
                        }
                        else {
                            cleaned++;
                        }
                    }
                    if (validSessionIds.length === 0) {
                        await this.kv.delete(key.name);
                    }
                    else if (validSessionIds.length !== sessionIds.length) {
                        await this.kv.put(key.name, JSON.stringify(validSessionIds));
                    }
                }
            }
            cursor = result.cursor;
        } while (cursor);
        return cleaned;
    }
    /**
     * Add session to user index
     */
    async addToUserIndex(tenantId, userId, sessionId) {
        const indexKey = this.getUserSessionIndexKey(tenantId, userId);
        const indexValue = await this.kv.get(indexKey, 'json');
        let sessionIds = [];
        if (indexValue && Array.isArray(indexValue)) {
            sessionIds = indexValue;
        }
        if (!sessionIds.includes(sessionId)) {
            sessionIds.push(sessionId);
        }
        // Store index with a long TTL (30 days)
        await this.kv.put(indexKey, JSON.stringify(sessionIds), {
            expirationTtl: 30 * 24 * 60 * 60,
        });
    }
    /**
     * Remove session from user index
     */
    async removeFromUserIndex(tenantId, userId, sessionId) {
        const indexKey = this.getUserSessionIndexKey(tenantId, userId);
        const indexValue = await this.kv.get(indexKey, 'json');
        if (!indexValue || !Array.isArray(indexValue)) {
            return;
        }
        const sessionIds = indexValue.filter(id => id !== sessionId);
        if (sessionIds.length === 0) {
            await this.kv.delete(indexKey);
        }
        else {
            await this.kv.put(indexKey, JSON.stringify(sessionIds), {
                expirationTtl: 30 * 24 * 60 * 60,
            });
        }
    }
    /**
     * Update user index with new session list
     */
    async updateUserIndex(tenantId, userId, sessionIds) {
        const indexKey = this.getUserSessionIndexKey(tenantId, userId);
        if (sessionIds.length === 0) {
            await this.kv.delete(indexKey);
        }
        else {
            await this.kv.put(indexKey, JSON.stringify(sessionIds), {
                expirationTtl: 30 * 24 * 60 * 60,
            });
        }
    }
    /**
     * Serialize session for storage
     */
    serializeSession(session) {
        return {
            ...session,
            created_at: session.created_at.toISOString(),
            last_accessed_at: session.last_accessed_at.toISOString(),
            expires_at: session.expires_at.toISOString(),
            idle_timeout_at: session.idle_timeout_at.toISOString(),
            revoked_at: session.revoked_at?.toISOString(),
        };
    }
    /**
     * Deserialize session from storage
     */
    deserializeSession(data) {
        return {
            ...data,
            created_at: new Date(data.created_at),
            last_accessed_at: new Date(data.last_accessed_at),
            expires_at: new Date(data.expires_at),
            idle_timeout_at: new Date(data.idle_timeout_at),
            revoked_at: data.revoked_at ? new Date(data.revoked_at) : undefined,
        };
    }
}
/**
 * Create a session storage instance
 */
export function createSessionStorage(kv) {
    return new SessionStorageKV(kv);
}
