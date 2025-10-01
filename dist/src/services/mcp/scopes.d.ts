/**
 * Scope-based authorization system for OAuth 2.1 MCP Gateway
 * Implements scope definition registry, validation logic, and access control
 */
export interface ScopeDefinition {
    name: string;
    description: string;
    parentScopes?: string[];
    requiredPermissions: string[];
    mcpPermissions?: string[];
    tenantId?: string;
    createdAt: string;
    updatedAt: string;
}
export interface MCPTollInvocationRequest {
    toolName: string;
    parameters: Record<string, any>;
    scopes: string[];
    userId?: string;
    clientId: string;
    tenantId: string;
}
export interface ScopeValidationResult {
    isValid: boolean;
    missingScopes?: string[];
    grantedPermissions: string[];
    mcpPermissions?: string[];
    error?: string;
}
/**
 * ScopeRegistry manages all registered scopes in the system
 */
export declare class ScopeRegistry {
    private static instance;
    private scopes;
    private tenantScopes;
    private constructor();
    static getInstance(): ScopeRegistry;
    /**
     * Initialize default scopes for the system
     */
    private initializeDefaultScopes;
    /**
     * Register a new scope (for admin use or tenant custom scopes)
     */
    registerScope(scope: ScopeDefinition, tenantId?: string): void;
    /**
     * Get a scope definition by name
     */
    getScope(scopeName: string, tenantId?: string): ScopeDefinition | null;
    /**
     * Get all available scopes (system + tenant-specific)
     */
    getAllScopes(tenantId?: string): ScopeDefinition[];
    /**
     * Check if a scope is valid
     */
    isValidScope(scopeName: string, tenantId?: string): boolean;
}
/**
 * ScopeValidator handles validation of scopes against token permissions
 */
export declare class ScopeValidator {
    private registry;
    constructor(registry?: ScopeRegistry);
    /**
     * Validates if requested scopes are available in the token scopes
     */
    validateScopes(requestedScopes: string[], tokenScopes: string[]): ScopeValidationResult;
    /**
     * Check if a specific scope is satisfied by the available token scopes
     * Implements hierarchical scope inheritance (e.g., mcp:tools:* includes mcp:tools:read)
     */
    private isScopeSatisfied;
    /**
     * Check if a requested scope matches a wildcard pattern in the token scope
     * For example: 'mcp:tools:read' matches 'mcp:tools:*'
     */
    private matchesWildcardPattern;
    /**
     * Gets all permissions for a given set of scopes
     */
    private getPermissionsForScopes;
    /**
     * Gets MCP-specific permissions for a given set of scopes
     */
    private getMcpPermissionsForScopes;
    /**
     * Validates an MCP tool invocation request against the required scopes
     */
    validateMCPToolInvocation(request: MCPTollInvocationRequest, tokenScopes: string[]): ScopeValidationResult;
    /**
     * Gets required scopes for a specific tool
     * This would typically be retrieved from a tool registry in a real implementation
     */
    private getRequiredScopesForTool;
}
export declare const scopeValidator: ScopeValidator;
