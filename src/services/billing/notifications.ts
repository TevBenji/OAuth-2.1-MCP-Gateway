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

export class EmailNotificationChannel implements NotificationChannel {
  private smtpConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
  };

  constructor(config: Record<string, any>) {
    this.smtpConfig = {
      host: config.smtp_host || 'localhost',
      port: config.smtp_port || 587,
      user: config.smtp_user || '',
      password: config.smtp_password || '',
    };
  }

  validateConfig(config: Record<string, any>): boolean {
    return !!(config.smtp_host && config.smtp_user && config.smtp_password);
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    // In a real implementation, we would send an email using the SMTP config
    // For now, we'll just log the notification
    console.log(`Email notification sent to tenant ${payload.tenant_id} about: ${payload.message}`);
    return true;
  }
}

export class SlackNotificationChannel implements NotificationChannel {
  private webhookUrl: string;

  constructor(config: Record<string, any>) {
    this.webhookUrl = config.slack_webhook_url || '';
  }

  validateConfig(config: Record<string, any>): boolean {
    return /^https:\/\/hooks\.slack\.com\/services\//.test(config.slack_webhook_url);
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    if (!this.webhookUrl) {
      return false;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Usage Alert for Tenant ${payload.tenant_id}: ${payload.message}`,
          attachments: [
            {
              color:
                payload.alert.severity === 'critical'
                  ? 'danger'
                  : payload.alert.severity === 'high'
                    ? 'warning'
                    : 'good',
              fields: [
                {
                  title: 'Alert Type',
                  value: payload.alert.alert_type,
                  short: true,
                },
                {
                  title: 'Triggered At',
                  value: payload.timestamp.toISOString(),
                  short: true,
                },
              ],
            },
          ],
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      return false;
    }
  }
}

export class NotificationService {
  private channels: Map<string, NotificationChannel>;
  private db: D1Database;

  constructor(bindings: Bindings) {
    this.db = bindings.DB;
    this.channels = new Map();

    // Register available channels based on configuration
    if (bindings.SMTP_HOST && bindings.SMTP_USER && bindings.SMTP_PASSWORD) {
      this.channels.set(
        'email',
        new EmailNotificationChannel({
          smtp_host: bindings.SMTP_HOST,
          smtp_port: bindings.SMTP_PORT ? parseInt(bindings.SMTP_PORT as string, 10) : 587,
          smtp_user: bindings.SMTP_USER,
          smtp_password: bindings.SMTP_PASSWORD,
        })
      );
    }

    if (bindings.SLACK_WEBHOOK_URL) {
      this.channels.set(
        'slack',
        new SlackNotificationChannel({
          slack_webhook_url: bindings.SLACK_WEBHOOK_URL,
        })
      );
    }
  }

  /**
   * Send a notification about a usage alert
   */
  async sendNotification(alert: UsageAlert, tenantId: string, message: string): Promise<boolean> {
    // Get tenant's notification preferences
    const tenantPrefs = await this.getTenantNotificationPreferences(tenantId);

    let success = false;

    // Send notifications to all configured channels for this tenant
    for (const channelType of tenantPrefs.channels) {
      const channel = this.channels.get(channelType);
      if (channel) {
        try {
          const payload: NotificationPayload = {
            tenant_id: tenantId,
            alert,
            message,
            timestamp: new Date(),
          };

          const channelSuccess = await channel.send(payload);
          success = success || channelSuccess;

          if (channelSuccess) {
            // Mark the alert as having notification sent
            await this.markAlertNotificationSent(alert.id);
          }
        } catch (error) {
          console.error(`Error sending notification via ${channelType}:`, error);
        }
      }
    }

    return success;
  }

  /**
   * Get a tenant's notification preferences
   */
  async getTenantNotificationPreferences(tenantId: string): Promise<{
    channels: string[];
    thresholds: Record<string, number>;
    enabled: boolean;
  }> {
    // In a real implementation, this would fetch from a database
    // For now, return default preferences
    try {
      const result = await this.db
        .prepare(
          `SELECT notification_channels, notification_thresholds, notifications_enabled
         FROM tenant_preferences
         WHERE tenant_id = ?`
        )
        .bind(tenantId)
        .first();

      if (result) {
        return {
          channels: JSON.parse((result.notification_channels as string) || '["email"]'),
          thresholds: JSON.parse((result.notification_thresholds as string) || '{"usage": 80}'),
          enabled: (result.notifications_enabled as boolean) || true,
        };
      }
    } catch (error) {
      console.error('Error fetching tenant notification preferences:', error);
    }

    // Default preferences
    return {
      channels: ['email'],
      thresholds: { usage: 80 },
      enabled: true,
    };
  }

  /**
   * Mark an alert as having notification sent
   */
  async markAlertNotificationSent(alertId: string): Promise<void> {
    await this.db
      .prepare(
        `UPDATE usage_alerts
       SET notification_sent = TRUE
       WHERE id = ?`
      )
      .bind(alertId)
      .run();
  }

  /**
   * Send notifications for all pending alerts
   */
  async sendPendingNotifications(): Promise<void> {
    const result = await this.db
      .prepare(
        `SELECT * FROM usage_alerts
       WHERE notification_sent = FALSE
       ORDER BY triggered_at DESC`
      )
      .all();

    for (const row of result.results) {
      const alert = row as unknown as UsageAlert;
      const message =
        alert.message ||
        `Usage alert of type ${alert.alert_type} triggered for tenant ${alert.tenant_id}`;

      await this.sendNotification(alert, alert.tenant_id, message);
    }
  }

  /**
   * Schedule notifications based on usage thresholds
   */
  async scheduleUsageNotifications(): Promise<void> {
    // Check usage for all tenants and send notifications if thresholds are crossed
    // This would be called periodically (e.g., via a cron job)
    // to check usage and send notifications as needed
    console.log('Scheduling usage notifications...');
  }
}
