/**
 * Unit tests for Notification Service
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService, EmailNotificationChannel, SlackNotificationChannel } from '@/services/billing/notifications';
describe('EmailNotificationChannel', () => {
    describe('validateConfig', () => {
        it('should validate correct SMTP configuration', () => {
            const config = {
                smtp_host: 'smtp.example.com',
                smtp_user: 'user@example.com',
                smtp_password: 'password'
            };
            const channel = new EmailNotificationChannel(config);
            const isValid = channel.validateConfig(config);
            expect(isValid).toBe(true);
        });
        it('should invalidate incomplete SMTP configuration', () => {
            const config = {
                smtp_host: 'smtp.example.com',
                // Missing smtp_user and smtp_password
            };
            const channel = new EmailNotificationChannel(config);
            const isValid = channel.validateConfig(config);
            expect(isValid).toBe(false);
        });
    });
    describe('send', () => {
        it('should return true when email is sent successfully', async () => {
            const config = {
                smtp_host: 'smtp.example.com',
                smtp_port: 587,
                smtp_user: 'user@example.com',
                smtp_password: 'password'
            };
            const channel = new EmailNotificationChannel(config);
            const payload = {
                tenant_id: 'test-tenant-id',
                alert: {
                    id: 'alert-1',
                    tenant_id: 'test-tenant-id',
                    alert_type: 'usage_threshold',
                    threshold_type: 'percentage',
                    threshold_value: 80,
                    triggered_at: new Date(),
                    resolved_at: null,
                    notification_sent: false,
                    severity: 'high',
                    message: 'Usage threshold reached'
                },
                message: 'Test notification message',
                timestamp: new Date()
            };
            const result = await channel.send(payload);
            expect(result).toBe(true);
        });
    });
});
describe('SlackNotificationChannel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetAllMocks();
    });
    describe('validateConfig', () => {
        it('should validate correct Slack webhook URL', () => {
            const config = {
                slack_webhook_url: 'https://hooks.slack.com/services/TEST/WEBHOOK/URL'
            };
            const channel = new SlackNotificationChannel(config);
            const isValid = channel.validateConfig(config);
            expect(isValid).toBe(true);
        });
        it('should invalidate incorrect Slack webhook URL', () => {
            const config = {
                slack_webhook_url: 'https://example.com/invalid/url'
            };
            const channel = new SlackNotificationChannel(config);
            const isValid = channel.validateConfig(config);
            expect(isValid).toBe(false);
        });
    });
    describe('send', () => {
        it('should send notification to Slack successfully', async () => {
            // Mock the fetch function
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true
            });
            vi.stubGlobal('fetch', mockFetch);
            const config = {
                slack_webhook_url: 'https://hooks.slack.com/services/TEST/WEBHOOK/URL'
            };
            const channel = new SlackNotificationChannel(config);
            const payload = {
                tenant_id: 'test-tenant-id',
                alert: {
                    id: 'alert-1',
                    tenant_id: 'test-tenant-id',
                    alert_type: 'usage_threshold',
                    threshold_type: 'percentage',
                    threshold_value: 80,
                    triggered_at: new Date(),
                    resolved_at: null,
                    notification_sent: false,
                    severity: 'high',
                    message: 'Usage threshold reached'
                },
                message: 'Test notification message',
                timestamp: new Date()
            };
            const result = await channel.send(payload);
            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith('https://hooks.slack.com/services/TEST/WEBHOOK/URL', expect.objectContaining({
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }));
            // Restore fetch
            vi.unstubAllGlobals();
        });
        it('should return false if no webhook URL is provided', async () => {
            const config = {
                slack_webhook_url: '' // Empty URL
            };
            const channel = new SlackNotificationChannel(config);
            const payload = {
                tenant_id: 'test-tenant-id',
                alert: {
                    id: 'alert-1',
                    tenant_id: 'test-tenant-id',
                    alert_type: 'usage_threshold',
                    threshold_type: 'percentage',
                    threshold_value: 80,
                    triggered_at: new Date(),
                    resolved_at: null,
                    notification_sent: false,
                    severity: 'high',
                    message: 'Usage threshold reached'
                },
                message: 'Test notification message',
                timestamp: new Date()
            };
            const result = await channel.send(payload);
            expect(result).toBe(false);
        });
    });
});
describe('NotificationService', () => {
    let mockD1Prepare;
    let mockDB;
    let mockBindings;
    beforeEach(() => {
        vi.clearAllMocks();
        mockD1Prepare = {
            bind: vi.fn().mockReturnThis(),
            run: vi.fn().mockResolvedValue({ success: true }),
            all: vi.fn().mockResolvedValue({ results: [] }),
            first: vi.fn().mockResolvedValue(null),
        };
        mockDB = {
            prepare: vi.fn().mockReturnValue(mockD1Prepare),
        };
        mockBindings = {
            DB: mockDB,
            USAGE_KV: {},
            JWT_ISSUER: 'test-issuer',
            PKCE_REQUIRED: 'true',
            CORS_ORIGINS: 'http://localhost:3000',
        };
    });
    describe('constructor', () => {
        it('should initialize with available notification channels', () => {
            const notificationService = new NotificationService(mockBindings);
            expect(notificationService).toBeDefined();
            // The service will have no channels since mockBindings doesn't include SMTP or Slack config
        });
    });
    describe('getTenantNotificationPreferences', () => {
        it('should return default preferences when no preferences are found', async () => {
            const notificationService = new NotificationService(mockBindings);
            const result = await notificationService.getTenantNotificationPreferences('test-tenant-id');
            expect(result).toEqual({
                channels: ['email'],
                thresholds: { usage: 80 },
                enabled: true
            });
            expect(mockDB.prepare).toHaveBeenCalled();
        });
    });
    describe('markAlertNotificationSent', () => {
        it('should update the notification_sent flag for an alert', async () => {
            const notificationService = new NotificationService(mockBindings);
            await notificationService.markAlertNotificationSent('alert-1');
            expect(mockDB.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE usage_alerts'));
            expect(mockD1Prepare.bind).toHaveBeenCalledWith('alert-1');
            expect(mockD1Prepare.run).toHaveBeenCalled();
        });
    });
});
