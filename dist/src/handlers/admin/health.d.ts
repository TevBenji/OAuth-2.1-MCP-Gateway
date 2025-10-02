import { Context } from 'hono';
import type { SystemAlert, AlertHandler, SystemFailureListener, SecurityEventListener } from '../../types/alerts';
export interface HealthCheckResponse {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime?: number;
    version?: string;
    service: string;
    checks: {
        [key: string]: {
            status: 'healthy' | 'degraded' | 'unhealthy';
            message?: string;
            responseTime?: number;
        };
    };
}
export interface MetricsCollector {
    recordAuthenticationSuccess(): void;
    recordAuthenticationFailure(): void;
    recordTokenValidationLatency(latencyMs: number): void;
    getAuthenticationSuccessRate(): number;
    getTokenValidationAvgLatency(): number;
    getMetrics(): any;
}
declare class InMemoryMetricsCollector implements MetricsCollector {
    private authSuccessCount;
    private authFailureCount;
    private tokenValidationLatencies;
    private readonly maxLatencySamples;
    recordAuthenticationSuccess(): void;
    recordAuthenticationFailure(): void;
    recordTokenValidationLatency(latencyMs: number): void;
    getAuthenticationSuccessRate(): number;
    getTokenValidationAvgLatency(): number;
    getMetrics(): any;
}
export declare const metricsCollector: InMemoryMetricsCollector;
export interface AlertingSystem {
    registerAlertHandler(handler: AlertHandler): void;
    triggerAlert(alert: SystemAlert): void;
    addSystemFailureListener(listener: SystemFailureListener): void;
    addSecurityEventListener(listener: SecurityEventListener): void;
}
declare class SimpleAlertingSystem implements AlertingSystem {
    private alertHandlers;
    private failureListeners;
    private securityListeners;
    registerAlertHandler(handler: AlertHandler): void;
    triggerAlert(alert: SystemAlert): Promise<void>;
    addSystemFailureListener(listener: SystemFailureListener): void;
    addSecurityEventListener(listener: SecurityEventListener): void;
    notifySystemFailure(error: Error, context: string): Promise<void>;
    notifySecurityEvent(event: string, details: Record<string, any>): Promise<void>;
}
export declare const alertingSystem: SimpleAlertingSystem;
/**
 * Health check endpoint for the gateway
 */
export declare const healthCheck: (c: Context) => Promise<Response>;
/**
 * Detailed health check including upstream MCP servers
 */
export declare const detailedHealthCheck: (c: Context) => Promise<Response>;
export {};
