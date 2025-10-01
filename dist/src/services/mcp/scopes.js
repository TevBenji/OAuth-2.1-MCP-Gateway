/**
 * Scope-based authorization system for OAuth 2.1 MCP Gateway
 * Implements scope definition registry, validation logic, and access control
 */
/**
 * ScopeRegistry manages all registered scopes in the system
 */
export class ScopeRegistry {
    static instance;
    scopes;
    tenantScopes; // tenantId -> scopes
    constructor() {
        this.scopes = new Map();
        this.tenantScopes = new Map();
        this.initializeDefaultScopes();
    }
    // Get singleton instance
    static getInstance() {
        if (!ScopeRegistry.instance) {
            ScopeRegistry.instance = new ScopeRegistry();
        }
        return ScopeRegistry.instance;
    }
    /**
     * Initialize default scopes for the system
     */
    initializeDefaultScopes() {
        const now = new Date().toISOString();
        // Define default MCP scopes
        const defaultScopes = [
            {
                name: 'mcp:tools:read',
                description: 'Read access to MCP tools',
                parentScopes: ['mcp:tools:*'],
                requiredPermissions: ['read'],
                mcpPermissions: ['read_tools'],
                createdAt: now,
                updatedAt: now
            },
            {
                name: 'mcp:tools:write',
                description: 'Write access to MCP tools',
                parentScopes: ['mcp:tools:*'],
                requiredPermissions: ['write'],
                mcpPermissions: ['write_tools'],
                createdAt: now,
                updatedAt: now
            },
            {
                name: 'mcp:tools:execute',
                description: 'Execute permission for MCP tools',
                parentScopes: ['mcp:tools:*'],
                requiredPermissions: ['execute'],
                mcpPermissions: ['execute'],
                createdAt: now,
                updatedAt: now
            },
            {
                name: 'mcp:tools:*',
                description: 'Wildcard access to all MCP tools',
                requiredPermissions: ['read', 'write', 'execute'],
                mcpPermissions: ['read_tools', 'write_tools', 'execute'],
                createdAt: now,
                updatedAt: now
            },
            {
                name: 'mcp:resources:read',
                description: 'Read access to MCP resources',
                parentScopes: ['mcp:resources:*'],
                requiredPermissions: ['read'],
                mcpPermissions: ['read_resources'],
                createdAt: now,
                updatedAt: now
            },
            {
                name: 'mcp:resources:write',
                description: 'Write access to MCP resources',
                parentScopes: ['mcp:resources:*'],
                requiredPermissions: ['write'],
                mcpPermissions: ['write_resources'],
                createdAt: now,
                updatedAt: now
            },
            {
                name: 'mcp:resources:*',
                description: 'Wildcard access to all MCP resources',
                requiredPermissions: ['read', 'write'],
                mcpPermissions: ['read_resources', 'write_resources'],
                createdAt: now,
                updatedAt: now
            },
            {
                name: 'mcp:config:read',
                description: 'Read access to MCP configuration',
                parentScopes: ['mcp:config:*'],
                requiredPermissions: ['read'],
                mcpPermissions: ['read_config'],
                createdAt: now,
                updatedAt: now
            },
            {
                name: 'mcp:config:write',
                description: 'Write access to MCP configuration',
                parentScopes: ['mcp:config:*'],
                requiredPermissions: ['write'],
                mcpPermissions: ['write_config'],
                createdAt: now,
                updatedAt: now
            },
            {
                name: 'mcp:config:*',
                description: 'Wildcard access to MCP configuration',
                requiredPermissions: ['read', 'write'],
                mcpPermissions: ['read_config', 'write_config'],
                createdAt: now,
                updatedAt: now
            }
        ];
        // Register default scopes
        for (const scope of defaultScopes) {
            this.scopes.set(scope.name, scope);
        }
    }
    /**
     * Register a new scope (for admin use or tenant custom scopes)
     */
    registerScope(scope, tenantId) {
        if (tenantId) {
            // Register for specific tenant
            if (!this.tenantScopes.has(tenantId)) {
                this.tenantScopes.set(tenantId, new Map());
            }
            const tenantScopeMap = this.tenantScopes.get(tenantId);
            tenantScopeMap.set(scope.name, scope);
        }
        else {
            // Register system-wide scope
            this.scopes.set(scope.name, scope);
        }
    }
    /**
     * Get a scope definition by name
     */
    getScope(scopeName, tenantId) {
        // Check tenant-specific scopes first
        if (tenantId && this.tenantScopes.has(tenantId)) {
            const tenantScopeMap = this.tenantScopes.get(tenantId);
            const tenantScope = tenantScopeMap.get(scopeName);
            if (tenantScope)
                return tenantScope;
        }
        // Check system scopes
        const systemScope = this.scopes.get(scopeName);
        return systemScope || null;
    }
    /**
     * Get all available scopes (system + tenant-specific)
     */
    getAllScopes(tenantId) {
        let allScopes = Array.from(this.scopes.values());
        if (tenantId && this.tenantScopes.has(tenantId)) {
            const tenantScopeMap = this.tenantScopes.get(tenantId);
            allScopes = allScopes.concat(Array.from(tenantScopeMap.values()));
        }
        return allScopes;
    }
    /**
     * Check if a scope is valid
     */
    isValidScope(scopeName, tenantId) {
        return this.getScope(scopeName, tenantId) !== null;
    }
}
/**
 * ScopeValidator handles validation of scopes against token permissions
 */
export class ScopeValidator {
    registry;
    constructor(registry) {
        this.registry = registry || ScopeRegistry.getInstance();
    }
    /**
     * Validates if requested scopes are available in the token scopes
     */
    validateScopes(requestedScopes, tokenScopes) {
        // Convert token scopes to a set for faster lookup
        const tokenScopeSet = new Set(tokenScopes);
        // Check each requested scope
        const missingScopes = [];
        for (const requestedScope of requestedScopes) {
            if (!this.isScopeSatisfied(requestedScope, tokenScopeSet)) {
                missingScopes.push(requestedScope);
            }
        }
        if (missingScopes.length > 0) {
            return {
                isValid: false,
                missingScopes,
                grantedPermissions: [],
                error: `Missing required scopes: ${missingScopes.join(', ')}`
            };
        }
        // All scopes are satisfied, return the granted permissions
        const grantedPermissions = this.getPermissionsForScopes(requestedScopes);
        const mcpPermissions = this.getMcpPermissionsForScopes(requestedScopes);
        return {
            isValid: true,
            grantedPermissions,
            mcpPermissions
        };
    }
    /**
     * Check if a specific scope is satisfied by the available token scopes
     * Implements hierarchical scope inheritance (e.g., mcp:tools:* includes mcp:tools:read)
     */
    isScopeSatisfied(requestedScope, tokenScopeSet) {
        // Direct match
        if (tokenScopeSet.has(requestedScope)) {
            return true;
        }
        // Check for wildcard patterns in the token scopes
        // For example, if token has 'mcp:tools:*' and requested scope is 'mcp:tools:read'
        for (const tokenScope of tokenScopeSet) {
            if (this.matchesWildcardPattern(requestedScope, tokenScope)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check if a requested scope matches a wildcard pattern in the token scope
     * For example: 'mcp:tools:read' matches 'mcp:tools:*'
     */
    matchesWildcardPattern(requestedScope, tokenScope) {
        // If token scope doesn't end with '*', it's not a wildcard
        if (!tokenScope.endsWith(':*')) {
            return false;
        }
        // Remove the '*'
        const basePattern = tokenScope.slice(0, -2);
        // Check if requested scope starts with the pattern
        return requestedScope.startsWith(basePattern + ':');
    }
    /**
     * Gets all permissions for a given set of scopes
     */
    getPermissionsForScopes(scopes) {
        const permissions = new Set();
        for (const scopeName of scopes) {
            const scopeDef = this.registry.getScope(scopeName);
            if (scopeDef) {
                scopeDef.requiredPermissions.forEach(perm => permissions.add(perm));
            }
        }
        return Array.from(permissions);
    }
    /**
     * Gets MCP-specific permissions for a given set of scopes
     */
    getMcpPermissionsForScopes(scopes) {
        const permissions = new Set();
        for (const scopeName of scopes) {
            const scopeDef = this.registry.getScope(scopeName);
            if (scopeDef && scopeDef.mcpPermissions) {
                scopeDef.mcpPermissions.forEach(perm => permissions.add(perm));
            }
        }
        return Array.from(permissions);
    }
    /**
     * Validates an MCP tool invocation request against the required scopes
     */
    validateMCPToolInvocation(request, tokenScopes) {
        // Determine required scopes for the tool
        // In a real implementation, this would check a registry of tools and their required scopes
        const requiredScopes = this.getRequiredScopesForTool(request.toolName);
        // Check if any of the required scopes are satisfied by the token
        if (requiredScopes.length > 0) {
            // Validate that at least one of the required scopes is available
            let hasRequiredScope = false;
            for (const requiredScope of requiredScopes) {
                if (this.isScopeSatisfied(requiredScope, new Set(tokenScopes))) {
                    hasRequiredScope = true;
                    break;
                }
            }
            if (!hasRequiredScope) {
                return {
                    isValid: false,
                    missingScopes: requiredScopes,
                    grantedPermissions: [],
                    error: `Insufficient permissions for tool: ${request.toolName}`
                };
            }
        }
        // Validate that the token scopes include the requested scopes
        const requestedScopes = request.scopes;
        if (requestedScopes.length > 0) {
            return this.validateScopes(requestedScopes, tokenScopes);
        }
        // If no specific scopes requested, return basic validation
        const grantedPermissions = this.getPermissionsForScopes(requiredScopes);
        const mcpPermissions = this.getMcpPermissionsForScopes(requiredScopes);
        return {
            isValid: true,
            grantedPermissions,
            mcpPermissions
        };
    }
    /**
     * Gets required scopes for a specific tool
     * This would typically be retrieved from a tool registry in a real implementation
     */
    getRequiredScopesForTool(toolName) {
        // This is a simplified implementation
        // In reality, this would check a registry of tools and their required permissions
        // Example mappings:
        if (toolName.startsWith('read_')) {
            return ['mcp:tools:read'];
        }
        else if (toolName.startsWith('write_')) {
            return ['mcp:tools:write'];
        }
        else if (toolName.startsWith('execute_') || toolName.startsWith('run_')) {
            return ['mcp:tools:execute'];
        }
        // Default to requiring read permission for most tools
        return ['mcp:tools:read'];
    }
}
// Export a singleton validator instance
export const scopeValidator = new ScopeValidator();
