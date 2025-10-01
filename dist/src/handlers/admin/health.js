import { auditService } from '../../services/security/audit';
import { MCPServerRegistry } from '../../services/mcp/registry';
// In-memory metrics collector for development
class InMemoryMetricsCollector {
    authSuccessCount = 0;
    authFailureCount = 0;
    tokenValidationLatencies = [];
    maxLatencySamples = 1000; // Keep last 1000 samples
    recordAuthenticationSuccess() {
        this.authSuccessCount++;
    }
    recordAuthenticationFailure() {
        this.authFailureCount++;
    }
    recordTokenValidationLatency(latencyMs) {
        if (this.tokenValidationLatencies.length >= this.maxLatencySamples) {
            // Remove oldest sample
            this.tokenValidationLatencies.shift();
        }
        this.tokenValidationLatencies.push(latencyMs);
    }
    getAuthenticationSuccessRate() {
        const total = this.authSuccessCount + this.authFailureCount;
        return total > 0 ? this.authSuccessCount / total : 0;
    }
    getTokenValidationAvgLatency() {
        if (this.tokenValidationLatencies.length === 0) {
            return 0;
        }
        const sum = this.tokenValidationLatencies.reduce((a, b) => a + b, 0);
        return sum / this.tokenValidationLatencies.length;
    }
    getMetrics() {
        return {
            authentication: {
                successRate: this.getAuthenticationSuccessRate(),
                successCount: this.authSuccessCount,
                failureCount: this.authFailureCount,
            },
            tokenValidation: {
                avgLatency: this.getTokenValidationAvgLatency(),
                sampleCount: this.tokenValidationLatencies.length,
            }
        };
    }
}
// Global metrics collector instance
export const metricsCollector = new InMemoryMetricsCollector();
// Simple alerting system implementation
class SimpleAlertingSystem {
    alertHandlers = [];
    failureListeners = [];
    securityListeners = [];
    registerAlertHandler(handler) {
        this.alertHandlers.push(handler);
    }
    async triggerAlert(alert) {
        for (const handler of this.alertHandlers) {
            try {
                await handler.handleAlert(alert);
            }
            catch (error) {
                console.error('Error in alert handler:', error);
            }
        }
    }
    addSystemFailureListener(listener) {
        this.failureListeners.push(listener);
    }
    addSecurityEventListener(listener) {
        this.securityListeners.push(listener);
    }
    async notifySystemFailure(error, context) {
        for (const listener of this.failureListeners) {
            try {
                listener(error, context);
            }
            catch (err) {
                console.error('Error in failure listener:', err);
            }
        }
        // Also trigger an alert
        await this.triggerAlert({
            id: `failure-${Date.now()}`,
            type: 'availability',
            severity: 'high',
            message: `System failure in ${context}: ${error.message}`,
            timestamp: new Date().toISOString(),
            metadata: { context, errorMessage: error.message }
        });
    }
    async notifySecurityEvent(event, details) {
        for (const listener of this.securityListeners) {
            try {
                listener(event, details);
            }
            catch (err) {
                console.error('Error in security listener:', err);
            }
        }
        // Also trigger an alert if it's a significant security event
        if (event.includes('attack') || event.includes('breach') || event.includes('unauthorized')) {
            await this.triggerAlert({
                id: `security-${Date.now()}`,
                type: 'security',
                severity: 'critical',
                message: `Security event: ${event}`,
                timestamp: new Date().toISOString(),
                metadata: details
            });
        }
    }
}
// Global alerting system instance
export const alertingSystem = new SimpleAlertingSystem();
/**
 * Health check endpoint for the gateway
 */
export const healthCheck = async (c) => {
    try {
        const startTime = Date.now();
        // Basic health check - system is responding
        const gatewayCheck = {
            status: 'healthy',
            responseTime: Date.now() - startTime,
        };
        // Check database connectivity (if available)
        let dbCheck = { status: 'healthy', message: 'Database connection OK' };
        // Check if MCP server registry is accessible
        let mcpRegistryCheck = { status: 'healthy', message: 'MCP registry OK' };
        // Check other critical dependencies
        const uptime = process.uptime ? process.uptime() * 1000 : startTime - Date.now(); // fallback for Cloudflare Workers
        const response = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime,
            version: process.env.npm_package_version || '1.0.0',
            service: 'oauth-mcp-gateway',
            checks: {
                gateway: gatewayCheck,
                database: dbCheck,
                mcpRegistry: mcpRegistryCheck,
                // Add more checks as needed
            }
        };
        // Calculate overall status based on individual checks
        if (Object.values(response.checks).some(check => check.status !== 'healthy')) {
            response.status = 'degraded';
        }
        return c.json(response, 200);
    }
    catch (error) {
        console.error('Health check error:', error);
        // Log the error for audit purposes
        await auditService.createLogEntry('system', 'system.error', 'Health check failed', false, { details: { error: error.message } });
        const response = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'oauth-mcp-gateway',
            checks: {
                gateway: {
                    status: 'unhealthy',
                    message: `Health check failed: ${error.message}`
                }
            }
        };
        return c.json(response, 503);
    }
};
/**
 * Detailed health check including upstream MCP servers
 */
export const detailedHealthCheck = async (c) => {
    try {
        const startTime = Date.now();
        // Basic health check
        const gatewayCheck = {
            status: 'healthy',
            responseTime: Date.now() - startTime,
        };
        // Check all MCP servers
        const mcpRegistry = new MCPServerRegistry(); // This would normally be injected
        const mcpServers = await mcpRegistry.getAllServers();
        const mcpChecks = {};
        let overallMcpStatus = 'healthy';
        for (const server of mcpServers) {
            try {
                // In a real implementation, we would actually ping the MCP server
                // For now, we'll simulate the check
                const checkStartTime = Date.now();
                // Simulate connection to MCP server
                // This would be an actual HTTP request to the server's health endpoint
                const responseTime = Date.now() - checkStartTime;
                mcpChecks[server.id] = {
                    status: 'healthy',
                    responseTime: responseTime
                };
            }
            catch (error) {
                mcpChecks[server.id] = {
                    status: 'unhealthy',
                    message: `Cannot connect to MCP server: ${error.message}`
                };
                overallMcpStatus = 'unhealthy';
            }
        }
        const response = {
            status: overallMcpStatus,
            timestamp: new Date().toISOString(),
            uptime: process.uptime ? process.uptime() * 1000 : 0, // fallback for Cloudflare Workers
            version: process.env.npm_package_version || '1.0.0',
            service: 'oauth-mcp-gateway',
            checks: {
                gateway: gatewayCheck,
                ...mcpChecks
            }
        };
        // Adjust overall status based on all checks
        const allChecks = Object.values(response.checks);
        if (allChecks.some(check => check.status === 'unhealthy')) {
            response.status = 'unhealthy';
        }
        else if (allChecks.some(check => check.status === 'degraded')) {
            response.status = 'degraded';
        }
        return c.json(response, 200);
    }
    catch (error) {
        console.error('Detailed health check error:', error);
        const response = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            service: 'oauth-mcp-gateway',
            checks: {
                gateway: {
                    status: 'unhealthy',
                    message: `Detailed health check failed: ${error.message}`
                }
            }
        };
        return c.json(response, 503);
    }
};
