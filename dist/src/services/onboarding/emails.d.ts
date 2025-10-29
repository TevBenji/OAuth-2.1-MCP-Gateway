/**
 * Email Service for Onboarding
 *
 * Automated email sequences for customer onboarding.
 * Requirements: 6.1, 6.3, 7.2
 */
export interface WelcomeEmailData {
    to: string;
    tenant_id: string;
    tenant_name: string;
    admin_name: string;
}
export declare class EmailService {
    /**
     * Send welcome email to new tenant
     */
    sendWelcomeEmail(data: WelcomeEmailData): Promise<void>;
    /**
     * Generate welcome email content
     */
    private generateWelcomeEmail;
}
