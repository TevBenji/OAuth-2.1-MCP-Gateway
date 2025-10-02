/**
 * Alert System Type Definitions
 *
 * Shared types for the alerting and monitoring system.
 */
export interface SystemAlert {
    id: string;
    type: 'security' | 'performance' | 'availability' | 'capacity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
export interface AlertHandler {
    handleAlert(alert: SystemAlert): Promise<void>;
}
export type SystemFailureListener = (error: Error, context: string) => void;
export type SecurityEventListener = (event: string, details: Record<string, any>) => void;
