import { auditService } from './audit';
/**
 * Audit event handlers for authentication events
 */
export class AuthenticationAuditHandler {
    /**
     * Log a successful login event
     */
    static async logLoginSuccess(tenantId, userId, clientId, options) {
        return await auditService.createLogEntry(tenantId, 'auth.login', 'User login successful', true, {
            ...options,
            userId,
            clientId,
            details: {
                ...options?.details,
                eventType: 'auth.login'
            }
        });
    }
    /**
     * Log a failed login event
     */
    static async logLoginFailure(tenantId, userId, clientId, failureReason, options) {
        return await auditService.createLogEntry(tenantId, 'auth.login.failed', `User login failed: ${failureReason}`, false, {
            ...options,
            userId,
            clientId,
            details: {
                ...options?.details,
                eventType: 'auth.login.failed',
                failureReason
            }
        });
    }
    /**
     * Log a logout event
     */
    static async logLogout(tenantId, userId, sessionId, options) {
        return await auditService.createLogEntry(tenantId, 'auth.logout', 'User logout', true, {
            ...options,
            userId,
            sessionId,
            details: {
                ...options?.details,
                eventType: 'auth.logout'
            }
        });
    }
    /**
     * Log a token refresh event
     */
    static async logTokenRefresh(tenantId, userId, clientId, success, options) {
        const event = success ? 'auth.refresh' : 'auth.refresh.failed';
        const action = success ? 'Token refresh successful' : 'Token refresh failed';
        return await auditService.createLogEntry(tenantId, event, action, success, {
            ...options,
            userId,
            clientId,
            details: {
                ...options?.details,
                eventType: success ? 'auth.refresh' : 'auth.refresh.failed'
            }
        });
    }
}
/**
 * Audit event handlers for authorization events
 */
export class AuthorizationAuditHandler {
    /**
     * Log a granted permission event
     */
    static async logPermissionGranted(tenantId, userId, clientId, permission, options) {
        return await auditService.createLogEntry(tenantId, 'authz.permission.granted', `Permission granted: ${permission}`, true, {
            ...options,
            userId,
            clientId,
            details: {
                ...options?.details,
                eventType: 'authz.permission.granted',
                permission
            }
        });
    }
    /**
     * Log a denied permission event
     */
    static async logPermissionDenied(tenantId, userId, clientId, permission, reason, options) {
        return await auditService.createLogEntry(tenantId, 'authz.permission.denied', `Permission denied: ${permission}. Reason: ${reason}`, false, {
            ...options,
            userId,
            clientId,
            details: {
                ...options?.details,
                eventType: 'authz.permission.denied',
                permission,
                reason
            }
        });
    }
    /**
     * Log a granted scope event
     */
    static async logScopeGranted(tenantId, userId, clientId, scope, options) {
        return await auditService.createLogEntry(tenantId, 'authz.scope.granted', `Scope granted: ${scope}`, true, {
            ...options,
            userId,
            clientId,
            details: {
                ...options?.details,
                eventType: 'authz.scope.granted',
                scope
            }
        });
    }
    /**
     * Log a denied scope event
     */
    static async logScopeDenied(tenantId, userId, clientId, scope, reason, options) {
        return await auditService.createLogEntry(tenantId, 'authz.scope.denied', `Scope denied: ${scope}. Reason: ${reason}`, false, {
            ...options,
            userId,
            clientId,
            details: {
                ...options?.details,
                eventType: 'authz.scope.denied',
                scope,
                reason
            }
        });
    }
    /**
     * Log a token issuance event
     */
    static async logTokenIssued(tenantId, userId, clientId, tokenType, success, options) {
        const event = success ? 'authz.token.issued' : 'authz.token.issued.failed';
        const action = success ? `Token issued: ${tokenType}` : `Token issuance failed: ${tokenType}`;
        return await auditService.createLogEntry(tenantId, event, action, success, {
            ...options,
            userId,
            clientId,
            details: {
                ...options?.details,
                eventType: success ? 'authz.token.issued' : 'authz.token.issued.failed',
                tokenType
            }
        });
    }
    /**
     * Log a token validation event
     */
    static async logTokenValidated(tenantId, userId, clientId, tokenType, success, options) {
        const event = success ? 'authz.token.validated' : 'authz.token.validated.failed';
        const action = success ? `Token validated: ${tokenType}` : `Token validation failed: ${tokenType}`;
        return await auditService.createLogEntry(tenantId, event, action, success, {
            ...options,
            userId,
            clientId,
            details: {
                ...options?.details,
                eventType: success ? 'authz.token.validated' : 'authz.token.validated.failed',
                tokenType
            }
        });
    }
    /**
     * Log a token revocation event
     */
    static async logTokenRevoked(tenantId, userId, clientId, tokenType, options) {
        return await auditService.createLogEntry(tenantId, 'authz.token.revoked', `Token revoked: ${tokenType}`, true, {
            ...options,
            userId,
            clientId,
            details: {
                ...options?.details,
                eventType: 'authz.token.revoked',
                tokenType
            }
        });
    }
}
/**
 * Audit event handlers for MCP events
 */
export class MCPSecurityAuditHandler {
    /**
     * Log an MCP request event
     */
    static async logMCPRequest(tenantId, userId, clientId = 'system', mcpServerId, success, options) {
        const event = success ? 'mcp.request' : 'mcp.request.failed';
        const action = success ? `MCP request to ${mcpServerId} successful` : `MCP request to ${mcpServerId} failed`;
        return await auditService.createLogEntry(tenantId, event, action, success, {
            ...options,
            userId,
            clientId,
            resourceId: mcpServerId,
            resourceType: 'mcp-server',
            details: {
                ...options?.details,
                eventType: success ? 'mcp.request' : 'mcp.request.failed',
                mcpServerId,
                mcpEndpoint: options?.details?.mcpEndpoint || options?.mcpEndpoint,
                method: options?.details?.method || options?.method
            }
        });
    }
    /**
     * Log an MCP tool invocation event
     */
    static async logMCPToolInvocation(tenantId, userId, clientId = 'system', toolName, success, options) {
        const event = success ? 'mcp.tool.invoked' : 'mcp.tool.invoked.failed';
        const action = success ? `MCP tool invoked: ${toolName}` : `MCP tool invocation failed: ${toolName}`;
        return await auditService.createLogEntry(tenantId, event, action, success, {
            ...options,
            userId,
            clientId,
            resourceId: toolName,
            resourceType: 'mcp-tool',
            details: {
                ...options?.details,
                eventType: success ? 'mcp.tool.invoked' : 'mcp.tool.invoked.failed',
                toolName,
                parameters: options?.parameters
            }
        });
    }
    /**
     * Log an MCP resource access event
     */
    static async logMCPResourceAccess(tenantId, userId, clientId = 'system', resourceName, success, options) {
        const event = success ? 'mcp.resource.accessed' : 'mcp.resource.accessed.failed';
        const action = success ? `MCP resource accessed: ${resourceName}` : `MCP resource access failed: ${resourceName}`;
        return await auditService.createLogEntry(tenantId, event, action, success, {
            ...options,
            userId,
            clientId,
            resourceId: resourceName,
            resourceType: 'mcp-resource',
            details: {
                ...options?.details,
                eventType: success ? 'mcp.resource.accessed' : 'mcp.resource.accessed.failed',
                resourceName,
                operation: options?.operation
            }
        });
    }
}
/**
 * Audit event handlers for security events
 */
export class SecurityAuditHandler {
    /**
     * Log a rate limit exceeded event
     */
    static async logRateLimitExceeded(tenantId, userId, clientId, resource, options) {
        return await auditService.createLogEntry(tenantId, 'security.rate.limit.exceeded', `Rate limit exceeded for ${resource}`, false, {
            ...options,
            userId,
            clientId,
            resourceId: resource,
            resourceType: 'rate-limit',
            details: {
                ...options?.details,
                eventType: 'security.rate.limit.exceeded',
                resource,
                limitType: options?.limitType
            }
        });
    }
    /**
     * Log a suspicious activity event
     */
    static async logSuspiciousActivity(tenantId, userId, clientId, activity, severity = 'medium', options) {
        return await auditService.createLogEntry(tenantId, 'security.suspicious.activity', `Suspicious activity detected: ${activity}`, false, {
            ...options,
            userId,
            clientId,
            severity,
            details: {
                ...options?.details,
                eventType: 'security.suspicious.activity',
                activity,
                detectedAt: new Date().toISOString()
            }
        });
    }
    /**
     * Log a brute force attempt
     */
    static async logBruteForceAttempt(tenantId, userId, clientId, options) {
        return await auditService.createLogEntry(tenantId, 'security.brute.force.detected', 'Brute force attack detected', false, {
            ...options,
            userId,
            clientId,
            details: {
                ...options?.details,
                eventType: 'security.brute.force.detected',
                attempts: options?.attempts,
                detectionTime: new Date().toISOString()
            }
        });
    }
}
// Convenience functions for common audit events
/**
 * Log a general system event
 */
export async function logSystemEvent(tenantId, event, action, success, options) {
    return await auditService.createLogEntry(tenantId, event, action, success, {
        ...options,
        source: 'system',
        details: {
            ...options?.details,
            eventType: event,
            errorDetails: options?.errorDetails
        }
    });
}
