/**
 * API Key Management System with rotation capabilities
 * Implements dual-key rotation for zero-downtime updates
 */
export interface APIKey {
    id: string;
    key: string;
    prefix: string;
    tenantId: string;
    userId?: string;
    name: string;
    description?: string;
    createdAt: string;
    lastUsedAt?: string;
    expiresAt?: string;
    status: 'active' | 'inactive' | 'revoked' | 'expired';
    permissions: string[];
    rotationDate?: string;
    rotatedToKeyId?: string;
    metadata?: Record<string, any>;
}
export interface APIKeyOptions {
    tenantId: string;
    userId?: string;
    name: string;
    description?: string;
    permissions?: string[];
    expiresAt?: string;
    metadata?: Record<string, any>;
}
export interface APIKeyRotationOptions {
    keyId: string;
    newKeyName?: string;
    newPermissions?: string[];
    notify?: boolean;
}
export interface APIKeyValidationResult {
    isValid: boolean;
    key?: APIKey;
    error?: string;
    permissions?: string[];
}
/**
 * APIKeyManager handles API key generation, validation, and rotation
 */
export declare class APIKeyManager {
    private keys;
    private keyPrefixMap;
    private keyIdToHash;
    /**
     * Generates a secure API key with prefix
     */
    generateAPIKey(): {
        key: string;
        prefix: string;
    };
    /**
     * Creates a new API key
     */
    createAPIKey(options: APIKeyOptions): Promise<APIKey>;
    /**
     * Validates an API key
     */
    validateAPIKey(providedKey: string): Promise<APIKeyValidationResult>;
    /**
     * Revokes an API key
     */
    revokeAPIKey(keyId: string, reason?: string): Promise<boolean>;
    /**
     * Updates an API key's properties
     */
    updateAPIKey(keyId: string, updates: Partial<Omit<APIKey, 'id' | 'key' | 'prefix' | 'createdAt' | 'rotationDate' | 'rotatedToKeyId'>>): Promise<boolean>;
    /**
     * Retrieves an API key by ID (without the secret key value)
     */
    getAPIKeyById(keyId: string): Promise<APIKey | null>;
    /**
     * Retrieves all API keys for a tenant
     */
    getAPIKeysByTenant(tenantId: string): Promise<APIKey[]>;
    /**
     * Performs API key rotation (dual-key rotation for zero-downtime)
     */
    rotateAPIKey(options: APIKeyRotationOptions): Promise<{
        oldKey: APIKey;
        newKey: APIKey;
    } | null>;
    /**
     * Schedules automated rotation for an API key
     */
    scheduleAutomatedRotation(keyId: string, intervalDays?: number): Promise<void>;
    /**
     * Performs automated rotation for keys that are due
     */
    performAutomatedRotations(tenantId?: string): Promise<void>;
    /**
     * Schedules a key for deletion after a certain period
     * In a production environment with Cloudflare Workers, you would use
     * a different approach like Cloudflare Queues or external scheduling
     */
    private scheduleKeyDeletion;
    /**
     * Notifies about API key rotation
     */
    private notifyAboutRotation;
    /**
     * Hashes an API key for secure storage
     */
    private hashAPIKey;
    /**
     * Performs cleanup of expired keys
     */
    cleanupExpiredKeys(): Promise<void>;
    /**
     * Finds an API key by its prefix (first 10 characters)
     */
    getAPIKeyByPrefix(prefix: string): Promise<APIKey | null>;
    /**
     * Gets usage statistics for an API key
     */
    getAPIKeyUsage(keyId: string): Promise<{
        lastUsedAt?: string;
        usageCount?: number;
    } | null>;
}
export declare const apiKeyManager: APIKeyManager;
