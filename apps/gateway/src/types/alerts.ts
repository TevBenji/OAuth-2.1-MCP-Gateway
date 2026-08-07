/**
 * Alert System Type Definitions
 *
 * Shared types for the alerting and monitoring system.
 */

// System alert structure
export interface SystemAlert {
  id: string;
  type: 'security' | 'performance' | 'availability' | 'capacity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Alert handler interface
export interface AlertHandler {
  handleAlert(alert: SystemAlert): Promise<void>;
}

// System failure listener type
export type SystemFailureListener = (error: Error, context: string) => void;

// Security event listener type
export type SecurityEventListener = (event: string, details: Record<string, any>) => void;
