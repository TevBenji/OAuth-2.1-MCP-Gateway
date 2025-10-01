import { Context } from 'hono';
export interface MetricsData {
    timestamp: string;
    service: string;
    version: string;
    uptime: number;
    httpRequest: {
        total: number;
        success: number;
        errors: number;
        latency: {
            avg: number;
            p50: number;
            p95: number;
            p99: number;
        };
    };
    authentication: {
        total: number;
        success: number;
        failure: number;
        successRate: number;
        failureRate: number;
        byMethod: {
            [method: string]: {
                total: number;
                success: number;
                failure: number;
            };
        };
    };
    authorization: {
        total: number;
        success: number;
        failure: number;
        successRate: number;
        failureRate: number;
        deniedRequests: number;
    };
    tokens: {
        issued: number;
        validated: number;
        refreshed: number;
        revoked: number;
        validationLatency: {
            avg: number;
            p50: number;
            p95: number;
            p99: number;
        };
    };
    mcp: {
        requests: number;
        success: number;
        errors: number;
        latency: {
            avg: number;
            p50: number;
            p95: number;
            p99: number;
        };
    };
    tenants: {
        total: number;
        active: number;
        inactive: number;
    };
    system: {
        cpu: number;
        memory: number;
        disk: number;
    };
}
export declare class MetricsCollector {
    private metrics;
    private httpRequestLatencies;
    private tokenValidationLatencies;
    private mcpRequestLatencies;
    private httpRequestCount;
    private httpRequestSuccess;
    private httpRequestErrors;
    private authTotal;
    private authSuccess;
    private authFailure;
    private authByMethod;
    private authzTotal;
    private authzSuccess;
    private authzFailure;
    private authzDenied;
    private tokensIssued;
    private tokensValidated;
    private tokensRefreshed;
    private tokensRevoked;
    private mcpRequests;
    private mcpSuccess;
    private mcpErrors;
    private startTime;
    constructor();
    private getDefaultMetrics;
    recordHttpRequest(statusCode: number, latencyMs: number): void;
    recordAuthentication(method: string, success: boolean): void;
    recordAuthorization(success: boolean, denied?: boolean): void;
    recordTokenOperation(operation: 'issue' | 'validate' | 'refresh' | 'revoke', latencyMs?: number): void;
    recordMCPRequest(success: boolean, latencyMs: number): void;
    updateTenantMetrics(total: number, active: number, inactive: number): void;
    updateSystemMetrics(cpu: number, memory: number, disk: number): void;
    private calculatePercentile;
    getMetrics(): MetricsData;
    reset(): void;
}
export declare const metricsCollector: MetricsCollector;
/**
 * Metrics endpoint handler
 */
export declare const metricsEndpoint: (c: Context) => Promise<Response>;
/**
 * Authentication success/failure rate endpoint
 */
export declare const authMetricsEndpoint: (c: Context) => Promise<Response>;
/**
 * Token validation latency endpoint
 */
export declare const tokenLatencyEndpoint: (c: Context) => Promise<Response>;
