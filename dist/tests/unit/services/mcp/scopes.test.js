import { describe, it, expect, beforeEach } from 'vitest';
import { ScopeRegistry, ScopeValidator } from '../../../src/services/mcp/scopes';
describe('Scope-based Authorization System', () => {
    let scopeRegistry;
    let scopeValidator;
    beforeEach(() => {
        // Create a fresh instance for each test to avoid shared state
        scopeRegistry = new ScopeRegistry(); // Bypass private constructor for testing
        scopeValidator = new ScopeValidator(scopeRegistry);
        // Initialize default scopes by calling the private method
        scopeRegistry.initializeDefaultScopes();
    });
    describe('ScopeRegistry', () => {
        it('should initialize with default MCP scopes', () => {
            const defaultScopes = scopeRegistry.getAllScopes();
            expect(defaultScopes.length).toBeGreaterThan(0);
            // Check for some specific default scopes
            expect(scopeRegistry.getScope('mcp:tools:read')).toBeTruthy();
            expect(scopeRegistry.getScope('mcp:tools:write')).toBeTruthy();
            expect(scopeRegistry.getScope('mcp:tools:*')).toBeTruthy();
            expect(scopeRegistry.getScope('mcp:resources:read')).toBeTruthy();
        });
        it('should register and retrieve custom scopes', () => {
            const customScope = {
                name: 'custom:scope:test',
                description: 'A custom test scope',
                requiredPermissions: ['test'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            scopeRegistry.registerScope(customScope);
            const retrievedScope = scopeRegistry.getScope('custom:scope:test');
            expect(retrievedScope).toEqual(customScope);
        });
        it('should register tenant-specific scopes', () => {
            const tenantId = 'test-tenant-123';
            const tenantScope = {
                name: 'tenant:specific:scope',
                description: 'A tenant-specific scope',
                requiredPermissions: ['tenant_access'],
                tenantId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            scopeRegistry.registerScope(tenantScope, tenantId);
            const retrievedScope = scopeRegistry.getScope('tenant:specific:scope', tenantId);
            expect(retrievedScope).toEqual(tenantScope);
        });
        it('should validate scope existence', () => {
            expect(scopeRegistry.isValidScope('mcp:tools:read')).toBe(true);
            expect(scopeRegistry.isValidScope('nonexistent:scope')).toBe(false);
        });
    });
    describe('ScopeValidator', () => {
        it('should validate exact scope matches', () => {
            const result = scopeValidator.validateScopes(['mcp:tools:read'], ['mcp:tools:read', 'mcp:resources:write']);
            expect(result.isValid).toBe(true);
            expect(result.grantedPermissions).toContain('read');
            expect(result.mcpPermissions).toContain('read_tools');
        });
        it('should fail validation when required scopes are missing', () => {
            const result = scopeValidator.validateScopes(['mcp:tools:read', 'mcp:resources:write'], ['mcp:tools:read'] // Missing mcp:resources:write
            );
            expect(result.isValid).toBe(false);
            expect(result.missingScopes).toEqual(['mcp:resources:write']);
        });
        it('should handle hierarchical scope inheritance (wildcard patterns)', () => {
            // Token has wildcard scope mcp:tools:*
            // Requested scope is mcp:tools:read (should match)
            const result = scopeValidator.validateScopes(['mcp:tools:read'], ['mcp:tools:*'] // Wildcard should satisfy specific scope
            );
            expect(result.isValid).toBe(true);
        });
        it('should validate multiple scopes with wildcard inheritance', () => {
            const result = scopeValidator.validateScopes(['mcp:tools:read', 'mcp:resources:write'], ['mcp:tools:*', 'mcp:resources:write'] // Wildcard and exact match
            );
            expect(result.isValid).toBe(true);
        });
        it('should fail when wildcard does not match', () => {
            const result = scopeValidator.validateScopes(['mcp:config:read'], ['mcp:tools:*'] // tools:* should not match config:read
            );
            expect(result.isValid).toBe(false);
            expect(result.missingScopes).toEqual(['mcp:config:read']);
        });
        it('should return granted permissions for valid scopes', () => {
            const result = scopeValidator.validateScopes(['mcp:tools:read', 'mcp:resources:write'], ['mcp:tools:read', 'mcp:resources:write']);
            expect(result.isValid).toBe(true);
            expect(result.grantedPermissions).toEqual(expect.arrayContaining(['read', 'write']));
            expect(result.mcpPermissions).toEqual(expect.arrayContaining(['read_tools', 'write_resources']));
        });
        it('should handle duplicate permissions correctly', () => {
            // Both scopes require 'read' permission
            const result = scopeValidator.validateScopes(['mcp:tools:read', 'mcp:resources:read'], ['mcp:tools:read', 'mcp:resources:read']);
            expect(result.isValid).toBe(true);
            // Should have 'read' only once
            expect(result.grantedPermissions.filter(p => p === 'read')).toHaveLength(1);
            expect(result.mcpPermissions).toEqual(expect.arrayContaining(['read_tools', 'read_resources']));
        });
    });
    describe('MCP Tool Invocation Validation', () => {
        it('should validate MCP tool invocation with required scopes', () => {
            const request = {
                toolName: 'read_data',
                parameters: {},
                scopes: ['mcp:tools:read'],
                clientId: 'test-client',
                tenantId: 'test-tenant'
            };
            const result = scopeValidator.validateMCPToolInvocation(request, ['mcp:tools:read', 'mcp:tools:write']);
            expect(result.isValid).toBe(true);
            expect(result.grantedPermissions).toContain('read');
        });
        it('should fail MCP tool invocation when required permissions are missing', () => {
            const request = {
                toolName: 'write_data',
                parameters: {},
                scopes: ['mcp:tools:read'], // Only read scope
                clientId: 'test-client',
                tenantId: 'test-tenant'
            };
            const result = scopeValidator.validateMCPToolInvocation(request, ['mcp:tools:read'] // Token only has read, but tool needs write
            );
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Insufficient permissions');
        });
        it('should validate MCP tool invocation with wildcard scope inheritance', () => {
            const request = {
                toolName: 'read_data',
                parameters: {},
                scopes: ['mcp:tools:read'],
                clientId: 'test-client',
                tenantId: 'test-tenant'
            };
            // Token has wildcard that should satisfy the required scope
            const result = scopeValidator.validateMCPToolInvocation(request, ['mcp:tools:*'] // Wildcard should satisfy read
            );
            expect(result.isValid).toBe(true);
        });
        it('should handle MCP tool invocation without specific requested scopes', () => {
            const request = {
                toolName: 'read_profile',
                parameters: {},
                scopes: [], // No specific scopes requested
                clientId: 'test-client',
                tenantId: 'test-tenant'
            };
            const result = scopeValidator.validateMCPToolInvocation(request, ['mcp:tools:read']);
            expect(result.isValid).toBe(true);
        });
    });
    describe('Wildcard Pattern Matching', () => {
        it('should match specific scope to wildcard', () => {
            // Internal test of the wildcard matching function
            const matches = scopeValidator.matchesWildcardPattern('mcp:tools:read', 'mcp:tools:*');
            expect(matches).toBe(true);
        });
        it('should not match unrelated scopes to wildcard', () => {
            const matches = scopeValidator.matchesWildcardPattern('mcp:config:read', 'mcp:tools:*');
            expect(matches).toBe(false);
        });
        it('should handle nested wildcard patterns', () => {
            const matches = scopeValidator.matchesWildcardPattern('mcp:tools:admin:disable', 'mcp:tools:*');
            expect(matches).toBe(true);
        });
        it('should not match when token scope is not a wildcard', () => {
            const matches = scopeValidator.matchesWildcardPattern('mcp:tools:read', 'mcp:tools:write');
            expect(matches).toBe(false);
        });
    });
    describe('Singleton Pattern', () => {
        it('should provide the same instance for ScopeRegistry', () => {
            const instance1 = ScopeRegistry.getInstance();
            const instance2 = ScopeRegistry.getInstance();
            expect(instance1).toBe(instance2);
        });
    });
});
