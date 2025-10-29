/**
 * Notification Service for Usage Alerts
 *
 * Handles sending notifications when usage thresholds are reached
 */
import { UsageAlert } from '@/types/usage';
import { Bindings } from '@/types/bindings';
export interface NotificationPayload {
    tenant_id: string;
    alert: UsageAlert;
    message: string;
    timestamp: Date;
}
export interface NotificationChannel {
    send(payload: NotificationPayload): Promise<boolean>;
    validateConfig(config: Record<string, any>): boolean;
}
export declare class EmailNotificationChannel implements NotificationChannel {
    private smtpConfig;
    constructor(config: Record<string, any>);
    validateConfig(config: Record<string, any>): boolean;
    send(payload: NotificationPayload): Promise<boolean>;
}
export declare class SlackNotificationChannel implements NotificationChannel {
    private webhookUrl;
    constructor(config: Record<string, any>);
    validateConfig(config: Record<string, any>): boolean;
    send(payload: NotificationPayload): Promise<boolean>;
}
export declare class NotificationService {
    private channels;
    private db;
    constructor(bindings: Bindings);
    /**
     * Send a notification about a usage alert
     */
    sendNotification(alert: UsageAlert, tenantId: string, message: string): Promise<boolean>;
    /**
     * Get a tenant's notification preferences
     */
    getTenantNotificationPreferences(tenantId: string): Promise<{
        channels: string[];
        thresholds: Record<string, number>;
        enabled: boolean;
    }>;
    /**
     * Safely parse JSON with validation to prevent prototype pollution and other vulnerabilities
     * @param jsonString The JSON string to parse
     * @param defaultValue The default value to return if parsing fails
     */
    private safeJsonParse;
    /**
     * Mark an alert as having notification sent
     */
    markAlertNotificationSent(alertId: string): Promise<void>;
    /**
     * Send notifications for all pending alerts
     */
    sendPendingNotifications(): Promise<void>;
    /**
     * Schedule notifications based on usage thresholds
     */
    scheduleUsageNotifications(): Promise<void>;
}
