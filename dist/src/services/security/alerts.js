// Alerting system for monitoring and notifications
export class AlertingSystem {
    alertHandlers = [];
    alertHistory = [];
    maxAlertHistory = 1000;
    registerAlertHandler(handler) {
        this.alertHandlers.push(handler);
    }
    async triggerAlert(alert) {
        // Add to history
        this.alertHistory.push(alert);
        // Keep only the last N alerts
        if (this.alertHistory.length > this.maxAlertHistory) {
            this.alertHistory = this.alertHistory.slice(-this.maxAlertHistory);
        }
        // Notify all handlers
        for (const handler of this.alertHandlers) {
            try {
                await handler.handleAlert(alert);
            }
            catch (error) {
                console.error('Error in alert handler:', error);
            }
        }
    }
    getAlertHistory(severity) {
        if (severity) {
            return this.alertHistory.filter(alert => alert.severity === severity);
        }
        return [...this.alertHistory];
    }
    clearAlertHistory() {
        this.alertHistory = [];
    }
}
// Console alert handler for development/testing
export class ConsoleAlertHandler {
    async handleAlert(alert) {
        const timestamp = new Date(alert.timestamp).toLocaleString();
        const severityEmoji = {
            low: 'ℹ️',
            medium: '⚠️',
            high: '🚨',
            critical: '🔥',
        }[alert.severity] || '🔔';
        console.log(`${severityEmoji} [${timestamp}] ${alert.type.toUpperCase()} ALERT: ${alert.message}`);
        if (alert.metadata) {
            console.log('Metadata:', JSON.stringify(alert.metadata, null, 2));
        }
    }
}
// Email alert handler stub (would connect to actual email service in production)
export class EmailAlertHandler {
    emailAddresses;
    constructor(emailAddresses) {
        this.emailAddresses = emailAddresses;
    }
    async handleAlert(alert) {
        // In a real implementation, this would send emails
        // For now, we'll just log that we would send an email
        const timestamp = new Date(alert.timestamp).toLocaleString();
        console.log(`📧 Would send email alert to ${this.emailAddresses.join(', ')}`);
        console.log(`Subject: ${alert.severity.toUpperCase()} ${alert.type} Alert - ${alert.message}`);
        console.log(`Body: Alert triggered at ${timestamp}: ${alert.message}`);
        if (alert.metadata) {
            console.log(`Metadata: ${JSON.stringify(alert.metadata)}`);
        }
    }
}
// Webhook alert handler stub (would send to webhook endpoints)
export class WebhookAlertHandler {
    webhookUrls;
    constructor(webhookUrls) {
        this.webhookUrls = webhookUrls;
    }
    async handleAlert(alert) {
        // In a real implementation, this would POST to webhook URLs
        // For now, we'll just log that we would send a webhook
        for (const url of this.webhookUrls) {
            console.log(`🔗 Would send webhook alert to ${url}`);
            console.log(`Payload: ${JSON.stringify(alert)}`);
        }
    }
}
// Slack alert handler stub
export class SlackAlertHandler {
    webhookUrl;
    constructor(webhookUrl) {
        this.webhookUrl = webhookUrl;
    }
    async handleAlert(alert) {
        // In a real implementation, this would send to Slack
        // For now, we'll just log that we would send to Slack
        console.log(`💬 Would send Slack alert to ${this.webhookUrl}`);
        console.log(`Message: ${alert.severity.toUpperCase()} ${alert.type} Alert: ${alert.message}`);
        if (alert.metadata) {
            console.log(`Details: ${JSON.stringify(alert.metadata)}`);
        }
    }
}
// Global alerting system instance
export const alertingSystem = new AlertingSystem();
// Register default console handler
alertingSystem.registerAlertHandler(new ConsoleAlertHandler());
