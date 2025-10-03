/**
 * Customer Onboarding Handlers
 *
 * Self-service tenant registration and onboarding workflows.
 * Requirements: 6.1, 6.3, 7.2
 */

import { Context } from 'hono';
import { z } from 'zod';
import { TenantService } from '../../services/tenant/isolation';
import { EmailService } from '../../services/onboarding/emails';
import { AuditService } from '../../services/security/audit';

// Tenant registration schema
const TenantRegistrationSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().regex(/^[a-z0-9-]+\.[a-z]{2,}$/),
  admin_email: z.string().email(),
  admin_name: z.string().min(1),
  compliance_tier: z.enum(['standard', 'enterprise', 'hipaa', 'pci-dss']).default('standard'),
  use_case: z.string().optional(),
  company_size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional()
});

/**
 * Self-service tenant registration
 */
export async function registerTenant(c: Context) {
  try {
    const body = await c.req.json();
    const validatedData = TenantRegistrationSchema.parse(body);

    const tenantService = new TenantService(c.env.DB);
    const emailService = new EmailService();
    const auditService = new AuditService(c.env.DB);

    // Generate tenant ID
    const tenant_id = `tenant_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create tenant
    await tenantService.createTenant({
      tenant_id,
      name: validatedData.name,
      domain: validatedData.domain,
      max_users: getMaxUsers(validatedData.compliance_tier),
      max_mcp_servers: getMaxMCPServers(validatedData.compliance_tier),
      compliance_tier: validatedData.compliance_tier,
      audit_retention_days: getAuditRetention(validatedData.compliance_tier)
    });

    // Send welcome email
    await emailService.sendWelcomeEmail({
      to: validatedData.admin_email,
      tenant_id,
      tenant_name: validatedData.name,
      admin_name: validatedData.admin_name
    });

    // Log onboarding event
    await auditService.logEvent({
      tenant_id,
      user_id: 'system',
      event_type: 'tenant.registered',
      resource_type: 'tenant',
      resource_id: tenant_id,
      action: 'create',
      outcome: 'success',
      ip_address: c.req.header('CF-Connecting-IP') || '',
      user_agent: c.req.header('User-Agent') || ''
    });

    return c.json({
      success: true,
      tenant_id,
      message: 'Tenant registered successfully. Check your email for next steps.'
    }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error.errors }, 400);
    }

    return c.json({ error: 'Registration failed', message: error.message }, 500);
  }
}

/**
 * Get onboarding status
 */
export async function getOnboardingStatus(c: Context) {
  const tenant_id = c.req.param('tenant_id');

  // Return onboarding checklist status
  const onboardingStatus = {
    tenant_id,
    steps_completed: [
      { step: 'registration', completed: true },
      { step: 'email_verification', completed: false },
      { step: 'first_client', completed: false },
      { step: 'first_mcp_server', completed: false },
      { step: 'first_token', completed: false }
    ],
    completion_percentage: 20
  };

  return c.json(onboardingStatus);
}

// Helper functions
function getMaxUsers(tier: string): number {
  const limits = {
    standard: 10,
    enterprise: 1000,
    hipaa: 500,
    'pci-dss': 500
  };
  return limits[tier as keyof typeof limits] || 10;
}

function getMaxMCPServers(tier: string): number {
  const limits = {
    standard: 3,
    enterprise: 100,
    hipaa: 50,
    'pci-dss': 50
  };
  return limits[tier as keyof typeof limits] || 3;
}

function getAuditRetention(tier: string): number {
  const retention = {
    standard: 365,
    enterprise: 2555, // 7 years
    hipaa: 2555,
    'pci-dss': 365
  };
  return retention[tier as keyof typeof retention] || 365;
}
