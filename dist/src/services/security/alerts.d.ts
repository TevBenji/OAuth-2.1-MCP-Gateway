import { SystemAlert, AlertHandler } from '../handlers/admin/health';
export declare class AlertingSystem {
    private alertHandlers;
    private alertHistory;
    private readonly maxAlertHistory;
    registerAlertHandler(handler: AlertHandler): void;
    triggerAlert(alert: SystemAlert): Promise<void>;
    getAlertHistory(severity?: SystemAlert['severity']): SystemAlert[];
    clearAlertHistory(): void;
}
export declare class ConsoleAlertHandler implements AlertHandler {
    handleAlert(alert: SystemAlert): Promise<void>;
}
export declare class EmailAlertHandler implements AlertHandler {
    private emailAddresses;
    constructor(emailAddresses: string[]);
    handleAlert(alert: SystemAlert): Promise<void>;
}
export declare class WebhookAlertHandler implements AlertHandler {
    private webhookUrls;
    constructor(webhookUrls: string[]);
    handleAlert(alert: SystemAlert): Promise<void>;
}
export declare class SlackAlertHandler implements AlertHandler {
    private webhookUrl;
    constructor(webhookUrl: string);
    handleAlert(alert: SystemAlert): Promise<void>;
}
export declare const alertingSystem: AlertingSystem;
