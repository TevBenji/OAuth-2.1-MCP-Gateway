/**
 * Email Service for Onboarding
 *
 * Automated email sequences for customer onboarding.
 * Requirements: 6.1, 6.3, 7.2
 */
export class EmailService {
    /**
     * Send welcome email to new tenant
     */
    async sendWelcomeEmail(data) {
        // In production, integrate with email service (SendGrid, SES, etc.)
        console.log(`Sending welcome email to ${data.to}`);
        const emailContent = this.generateWelcomeEmail(data);
        // Simulate email sending
        console.log('Email sent:', emailContent.subject);
    }
    /**
     * Generate welcome email content
     */
    generateWelcomeEmail(data) {
        return {
            to: data.to,
            subject: `Welcome to OAuth 2.1 MCP Gateway - ${data.tenant_name}`,
            html: `
        <h1>Welcome to OAuth 2.1 MCP Gateway!</h1>
        <p>Hi ${data.admin_name},</p>
        <p>Your tenant <strong>${data.tenant_name}</strong> has been successfully created.</p>
        <p><strong>Tenant ID:</strong> ${data.tenant_id}</p>
        <h2>Next Steps:</h2>
        <ol>
          <li>Register your first OAuth client</li>
          <li>Configure your first MCP server</li>
          <li>Test OAuth 2.1 authentication flow</li>
        </ol>
        <p>Visit your dashboard to get started.</p>
      `
        };
    }
}
