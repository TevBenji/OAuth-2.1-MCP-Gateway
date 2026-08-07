import { v4 as uuidv4 } from 'uuid';
import { createHmac } from 'crypto';

/**
 * API Key Management System with rotation capabilities
 * Implements dual-key rotation for zero-downtime updates
 */

// API Key representation
export interface APIKey {
  id: string;
  key: string;           // The actual API key (hashed for storage)
  prefix: string;        // Prefix for identifying the key without full disclosure
  tenantId: string;      // Associated tenant
  userId?: string;       // Associated user (optional)
  name: string;          // Descriptive name for the key
  description?: string;  // Optional description
  createdAt: string;     // Creation timestamp
  lastUsedAt?: string;   // Last usage timestamp
  expiresAt?: string;    // Optional expiration date
  status: 'active' | 'inactive' | 'revoked' | 'expired';
  permissions: string[]; // Associated permissions/scopes
  rotationDate?: string; // When the key was last rotated
  rotatedToKeyId?: string; // ID of the new key after rotation
  metadata?: Record<string, any>; // Additional metadata
}

// API Key creation options
export interface APIKeyOptions {
  tenantId: string;
  userId?: string;
  name: string;
  description?: string;
  permissions?: string[];
  expiresAt?: string; // ISO date string
  metadata?: Record<string, any>;
}

// API Key rotation options
export interface APIKeyRotationOptions {
  keyId: string;
  newKeyName?: string;
  newPermissions?: string[];
  notify?: boolean; // Whether to notify about rotation
}

// API Key validation result
export interface APIKeyValidationResult {
  isValid: boolean;
  key?: APIKey;
  error?: string;
  permissions?: string[];
}

/**
 * APIKeyManager handles API key generation, validation, and rotation
 */
export class APIKeyManager {
  private keys: Map<string, APIKey> = new Map(); // In-memory storage for development
  private keyPrefixMap: Map<string, string> = new Map(); // Maps prefix to key ID
  private keyIdToHash: Map<string, string> = new Map(); // Maps key ID to hashed key

  /**
   * Generates a secure API key with prefix
   */
  // 'sk-' + 8 hex chars — validation must slice exactly this many characters
  static readonly PREFIX_LENGTH = 11;

  generateAPIKey(): { key: string; prefix: string } {
    // Generate a random UUID and take first 8 characters for the prefix
    const prefix = 'sk-' + uuidv4().slice(0, 8);
    
    // Generate a secure random token (32 bytes = 256 bits of entropy)
    // Using a cryptographically secure method
    const randomBytes = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBytes);
    } else {
      // Fallback for environments where crypto is not available
      for (let i = 0; i < randomBytes.length; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256);
      }
    }
    
    // Convert to base64url format and add prefix
    let token = Array.from(randomBytes)
      .map(byte => String.fromCharCode(byte))
      .join('');
    
    token = btoa(token)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // Limit length to 32 characters for the token part (prefix is 10 characters)
    token = token.substring(0, 32);
    
    const fullKey = prefix + token;
    
    return { key: fullKey, prefix };
  }

  /**
   * Creates a new API key
   */
  async createAPIKey(options: APIKeyOptions): Promise<APIKey & { plaintextKey: string }> {
    const { key, prefix } = this.generateAPIKey();

    // Hash the key for secure storage
    const keyHash = this.hashAPIKey(key);

    const apiKey: APIKey = {
      id: uuidv4(),
      key: keyHash, // Store the hash, not the actual key
      prefix,
      tenantId: options.tenantId,
      userId: options.userId,
      name: options.name,
      description: options.description,
      createdAt: new Date().toISOString(),
      status: 'active',
      permissions: options.permissions || [],
      expiresAt: options.expiresAt,
      metadata: options.metadata
    };

    // Store in maps
    this.keys.set(apiKey.id, apiKey);
    this.keyPrefixMap.set(prefix, apiKey.id);
    this.keyIdToHash.set(apiKey.id, keyHash);

    // The plaintext key is returned exactly once and never stored
    return { ...apiKey, plaintextKey: key };
  }

  /**
   * Validates an API key
   */
  async validateAPIKey(providedKey: string): Promise<APIKeyValidationResult> {
    if (!providedKey || typeof providedKey !== 'string' || providedKey.length < 16) {
      return { isValid: false, error: 'Invalid API key format' };
    }

    // Extract the prefix from the provided key
    if (providedKey.length < APIKeyManager.PREFIX_LENGTH) {
      return { isValid: false, error: 'Invalid API key format' };
    }

    const prefix = providedKey.substring(0, APIKeyManager.PREFIX_LENGTH);
    
    // Find the key ID based on the prefix
    const keyId = this.keyPrefixMap.get(prefix);
    if (!keyId) {
      return { isValid: false, error: 'Invalid API key' };
    }

    // Get the stored key
    const storedKey = this.keys.get(keyId);
    if (!storedKey) {
      return { isValid: false, error: 'Invalid API key' };
    }

    // Check if the key is expired
    if (storedKey.expiresAt && new Date(storedKey.expiresAt) < new Date()) {
      storedKey.status = 'expired';
      return { isValid: false, error: 'API key has expired' };
    }

    // Check if the key is active
    if (storedKey.status !== 'active') {
      return { isValid: false, error: 'API key is not active' };
    }

    // Hash the provided key and compare with stored hash
    const providedKeyHash = this.hashAPIKey(providedKey);
    const storedKeyHash = this.keyIdToHash.get(keyId);

    if (providedKeyHash !== storedKeyHash) {
      return { isValid: false, error: 'Invalid API key' };
    }

    // Update last used timestamp
    storedKey.lastUsedAt = new Date().toISOString();
    
    return {
      isValid: true,
      key: storedKey,
      permissions: storedKey.permissions
    };
  }

  /**
   * Revokes an API key
   */
  async revokeAPIKey(keyId: string, reason?: string): Promise<boolean> {
    const key = this.keys.get(keyId);
    if (!key) {
      return false;
    }

    key.status = 'revoked';
    if (reason) {
      if (!key.metadata) key.metadata = {};
      key.metadata.revocationReason = reason;
      key.metadata.revokedAt = new Date().toISOString();
    }
    
    return true;
  }

  /**
   * Updates an API key's properties
   */
  async updateAPIKey(
    keyId: string, 
    updates: Partial<Omit<APIKey, 'id' | 'key' | 'prefix' | 'createdAt' | 'rotationDate' | 'rotatedToKeyId'>>
  ): Promise<boolean> {
    const key = this.keys.get(keyId);
    if (!key) {
      return false;
    }

    // Update allowed fields
    if (updates.name !== undefined) key.name = updates.name;
    if (updates.description !== undefined) key.description = updates.description;
    if (updates.expiresAt !== undefined) key.expiresAt = updates.expiresAt;
    if (updates.status !== undefined) key.status = updates.status;
    if (updates.permissions !== undefined) key.permissions = updates.permissions;
    if (updates.metadata !== undefined) key.metadata = { ...key.metadata, ...updates.metadata };
    if (updates.lastUsedAt !== undefined) key.lastUsedAt = updates.lastUsedAt;

    return true;
  }

  /**
   * Retrieves an API key by ID (without the secret key value)
   */
  async getAPIKeyById(keyId: string): Promise<APIKey | null> {
    const key = this.keys.get(keyId);
    if (!key) {
      return null;
    }

    // Return key but without the sensitive key field
    return {
      ...key,
      key: '' // Don't return the actual key
    };
  }

  /**
   * Retrieves all API keys for a tenant
   */
  async getAPIKeysByTenant(tenantId: string): Promise<APIKey[]> {
    const tenantKeys: APIKey[] = [];
    
    for (const key of this.keys.values()) {
      if (key.tenantId === tenantId) {
        tenantKeys.push({
          ...key,
          key: '' // Don't return the actual key
        });
      }
    }
    
    return tenantKeys;
  }

  /**
   * Performs API key rotation (dual-key rotation for zero-downtime)
   */
  async rotateAPIKey(options: APIKeyRotationOptions): Promise<{ oldKey: APIKey; newKey: APIKey } | null> {
    const oldKey = this.keys.get(options.keyId);
    if (!oldKey) {
      throw new Error('API key not found for rotation');
    }

    // Create a new key with the same properties but new values
    const newKeyName = options.newKeyName || `${oldKey.name} (rotated)`;
    const newPermissions = options.newPermissions || oldKey.permissions;

    const newKey = await this.createAPIKey({
      tenantId: oldKey.tenantId,
      userId: oldKey.userId,
      name: newKeyName,
      description: oldKey.description,
      permissions: newPermissions,
      expiresAt: oldKey.expiresAt,
      metadata: {
        ...oldKey.metadata,
        rotatedFromKeyId: oldKey.id,
        rotatedAt: new Date().toISOString()
      }
    });

    // Update the old key to mark it as rotated
    oldKey.status = 'inactive';
    oldKey.rotatedToKeyId = newKey.id;
    if (!oldKey.metadata) oldKey.metadata = {};
    oldKey.metadata.rotatedAt = new Date().toISOString();

    // Optionally notify about rotation
    if (options.notify) {
      await this.notifyAboutRotation(oldKey, newKey);
    }

    // Schedule the old key for deletion after a grace period (e.g., 24 hours)
    // This allows any in-flight requests to complete
    this.scheduleKeyDeletion(oldKey.id, 24 * 60 * 60 * 1000); // 24 hours

    return { oldKey, newKey };
  }

  /**
   * Schedules automated rotation for an API key
   */
  async scheduleAutomatedRotation(keyId: string, intervalDays: number = 90): Promise<void> {
    // In a real implementation, this would schedule the rotation using
    // a proper scheduling system like Cloudflare Queues or external services
    // For this implementation, we'll just log that rotation is scheduled
    
    const key = this.keys.get(keyId);
    if (!key) {
      throw new Error('API key not found for scheduling rotation');
    }
    
    console.log(`Scheduled rotation for key ${keyId} every ${intervalDays} days`);
    
    // In production, you would schedule this properly
    // For example, using Cloudflare Workers Alarms or external schedulers
  }

  /**
   * Performs automated rotation for keys that are due
   */
  async performAutomatedRotations(tenantId?: string): Promise<void> {
    const now = new Date();
    const keysToRotate: APIKey[] = [];
    
    for (const key of this.keys.values()) {
      // Only check active keys
      if (key.status !== 'active') {
        continue;
      }
      
      // If tenantId is specified, only check keys for that tenant
      if (tenantId && key.tenantId !== tenantId) {
        continue;
      }
      
      // Check if the key should be rotated (e.g., based on creation date or last rotation)
      const creationDate = new Date(key.createdAt);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90); // Default rotation every 90 days
      
      if (creationDate < ninetyDaysAgo) {
        keysToRotate.push(key);
      }
    }
    
    // Rotate all keys that are due
    for (const key of keysToRotate) {
      try {
        await this.rotateAPIKey({
          keyId: key.id,
          newKeyName: `${key.name} (automated rotation)`,
          notify: true
        });
      } catch (error) {
        console.error(`Failed to rotate key ${key.id}:`, error);
      }
    }
  }

  /**
   * Schedules a key for deletion after a certain period
   * In a production environment with Cloudflare Workers, you would use
   * a different approach like Cloudflare Queues or external scheduling
   */
  private scheduleKeyDeletion(keyId: string, delayMs: number): void {
    // For development purposes, we'll use a simple timeout
    // In production with Cloudflare Workers, you would use a different approach
    setTimeout(() => {
      this.keys.delete(keyId);
      this.keyPrefixMap.delete(this.keys.get(keyId)?.prefix || '');
      this.keyIdToHash.delete(keyId);
    }, delayMs);
  }

  /**
   * Notifies about API key rotation
   */
  private async notifyAboutRotation(oldKey: APIKey, newKey: APIKey): Promise<void> {
    // In a real implementation, this would send notifications via email, webhook, etc.
    console.log(`API Key rotated for tenant ${oldKey.tenantId}: ${oldKey.name}`);
    console.log(`Old key ID: ${oldKey.id}, New key ID: ${newKey.id}`);
  }

  /**
   * Hashes an API key for secure storage
   */
  private hashAPIKey(key: string): string {
    // In a real implementation, we'd use a proper hashing algorithm
    // and potentially salt the hash. For this implementation, we'll 
    // use a simple HMAC for demonstration purposes
    return createHmac('sha256', process.env.API_KEY_SECRET || 'default-secret-key')
      .update(key)
      .digest('hex');
  }

  /**
   * Performs cleanup of expired keys
   */
  async cleanupExpiredKeys(): Promise<void> {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [keyId, key] of this.keys.entries()) {
      if (key.expiresAt && new Date(key.expiresAt) < now) {
        keysToDelete.push(keyId);
      }
    }

    for (const keyId of keysToDelete) {
      const apiKey = this.keys.get(keyId);
      this.keys.delete(keyId);
      // Also remove from other maps
      if (this.keyIdToHash.has(keyId)) {
        this.keyIdToHash.delete(keyId);
      }
      // Remove from prefix map if needed
      if (apiKey && this.keyPrefixMap.has(apiKey.prefix)) {
        this.keyPrefixMap.delete(apiKey.prefix);
      }
    }
  }

  /**
   * Finds an API key by its prefix (first 10 characters)
   */
  async getAPIKeyByPrefix(prefix: string): Promise<APIKey | null> {
    const keyId = this.keyPrefixMap.get(prefix);
    if (!keyId) {
      return null;
    }
    return await this.getAPIKeyById(keyId);
  }

  /**
   * Gets usage statistics for an API key
   */
  async getAPIKeyUsage(keyId: string): Promise<{ lastUsedAt?: string; usageCount?: number } | null> {
    const key = this.keys.get(keyId);
    if (!key) {
      return null;
    }

    // In a real implementation, this would retrieve usage data from a metrics system
    return {
      lastUsedAt: key.lastUsedAt,
      usageCount: 0 // Placeholder - would come from actual metrics
    };
  }
}

// Export a singleton instance
export const apiKeyManager = new APIKeyManager();