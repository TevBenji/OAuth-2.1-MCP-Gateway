import { AuditLogOptions } from '../../types/audit';
/**
 * Audit event handlers for authentication events
 */
export declare class AuthenticationAuditHandler {
    /**
     * Log a successful login event
     */
    static logLoginSuccess(tenantId: string, userId: string, clientId: string, options?: Omit<AuditLogOptions, 'userId' | 'clientId'> & {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<string>;
    /**
     * Log a failed login event
     */
    static logLoginFailure(tenantId: string, userId: string, clientId: string, failureReason: string, options?: Omit<AuditLogOptions, 'userId' | 'clientId'> & {
        ipAddress?: string;
        userAgent?: string;
    }): Promise<string>;
    /**
     * Log a logout event
     */
    static logLogout(tenantId: string, userId: string, sessionId: string, options?: Omit<AuditLogOptions, 'userId' | 'sessionId'> & {
        ipAddress?: string;
    }): Promise<string>;
    /**
     * Log a token refresh event
     */
    static logTokenRefresh(tenantId: string, userId: string, clientId: string, success: boolean, options?: Omit<AuditLogOptions, 'userId' | 'clientId'> & {
        ipAddress?: string;
    }): Promise<string>;
}
/**
 * Audit event handlers for authorization events
 */
export declare class AuthorizationAuditHandler {
    /**
     * Log a granted permission event
     */
    static logPermissionGranted(tenantId: string, userId: string, clientId: string, permission: string, options?: Omit<AuditLogOptions, 'userId' | 'clientId'> & {
        ipAddress?: string;
    }): Promise<string>;
    /**
     * Log a denied permission event
     */
    static logPermissionDenied(tenantId: string, userId: string, clientId: string, permission: string, reason: string, options?: Omit<AuditLogOptions, 'userId' | 'clientId'> & {
        ipAddress?: string;
    }): Promise<string>;
    /**
     * Log a granted scope event
     */
    static logScopeGranted(tenantId: string, userId: string, clientId: string, scope: string, options?: Omit<AuditLogOptions, 'userId' | 'clientId'> & {
        ipAddress?: string;
    }): Promise<string>;
    /**
     * Log a denied scope event
     */
    static logScopeDenied(tenantId: string, userId: string, clientId: string, scope: string, reason: string, options?: Omit<AuditLogOptions, 'userId' | 'clientId'> & {
        ipAddress?: string;
    }): Promise<string>;
    /**
     * Log a token issuance event
     */
    static logTokenIssued(tenantId: string, userId: string, clientId: string, tokenType: 'access_token' | 'refresh_token' | 'id_token', success: boolean, options?: Omit<AuditLogOptions, 'userId' | 'clientId'> & {
        ipAddress?: string;
    }): Promise<string>;
    /**
     * Log a token validation event
     */
    static logTokenValidated(tenantId: string, userId: string, clientId: string, tokenType: 'access_token' | 'refresh_token' | 'id_token', success: boolean, options?: Omit<AuditLogOptions, 'userId' | 'clientId'> & {
        ipAddress?: string;
    }): Promise<string>;
    /**
     * Log a token revocation event
     */
    static logTokenRevoked(tenantId: string, userId: string, clientId: string, tokenType: 'access_token' | 'refresh_token' | 'id_token', options?: Omit<AuditLogOptions, 'userId' | 'clientId'> & {
        ipAddress?: string;
    }): Promise<string>;
}
/**
 * Audit event handlers for MCP events
 */
export declare class MCPSecurityAuditHandler {
    /**
     * Log an MCP request event
     */
    static logMCPRequest(tenantId: string, userId?: string, clientId: string | undefined, mcpServerId: string, success: boolean, options?: Omit<AuditLogOptions, 'userId' | 'clientId' | 'resourceId' | 'resourceType'> & {
        ipAddress?: string;
        mcpEndpoint?: string;
        method?: string;
    }): Promise<string>;
    /**
     * Log an MCP tool invocation event
     */
    static logMCPToolInvocation(tenantId: string, userId?: string, clientId: string | undefined, toolName: string, success: boolean, options?: Omit<AuditLogOptions, 'userId' | 'clientId' | 'resourceId' | 'resourceType'> & {
        ipAddress?: string;
        parameters?: Record<string, any>;
    }): Promise<string>;
    /**
     * Log an MCP resource access event
     */
    static logMCPResourceAccess(tenantId: string, userId?: string, clientId: string | undefined, resourceName: string, success: boolean, options?: Omit<AuditLogOptions, 'userId' | 'clientId' | 'resourceId' | 'resourceType'> & {
        ipAddress?: string;
        operation?: 'read' | 'write' | 'delete' | 'execute';
    }): Promise<string>;
}
/**
 * Audit event handlers for security events
 */
export declare class SecurityAuditHandler {
    /**
     * Log a rate limit exceeded event
     */
    static logRateLimitExceeded(tenantId: string, userId?: string, clientId?: string, resource: string, options?: Omit<AuditLogOptions, 'userId' | 'clientId' | 'resourceId' | 'resourceType'> & {
        ipAddress?: string;
        limitType?: string;
    }): Promise<string>;
    /**
     * Log a suspicious activity event
     */
    static logSuspiciousActivity(tenantId: string, userId?: string, clientId?: string, activity: string, severity?: 'low' | 'medium' | 'high' | 'critical', options?: Omit<AuditLogOptions, 'userId' | 'clientId' | 'severity'> & {
        ipAddress?: string;
        details?: Record<string, any>;
    }): Promise<string>;
    /**
     * Log a brute force attempt
     */
    static logBruteForceAttempt(tenantId: string, userId?: string, clientId?: string, options?: Omit<AuditLogOptions, 'userId' | 'clientId'> & {
        ipAddress: string;
        attempts?: number;
    }): Promise<string>;
}
/**
 * Log a general system event
 */
export declare function logSystemEvent(tenantId: string, event: 'system.startup' | 'system.shutdown' | 'system.error', action: string, success: boolean, options?: Omit<AuditLogOptions, 'userId' | 'clientId'> & {
    ipAddress?: string;
    errorDetails?: Record<string, any>;
}): Promise<string>;
