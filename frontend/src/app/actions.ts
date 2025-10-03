"use server";

import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
const TenantSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  plan: z.enum(["free", "starter", "professional", "enterprise"]).default("free"),
});

// Helper function to get or create user
async function getOrCreateUser(clerkId: string, include?: any) {
  let user = await prisma.user.findUnique({
    where: { clerkId },
    include,
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        email: `user-${clerkId}@temp.local`,
        role: 'USER',
      },
      include,
    });
  }

  return user;
}

// Tenant Management
export async function getTenantDashboard(userId: string) {
  try {
    // Get or create user with includes
    const user = await getOrCreateUser(userId, {
      organization: {
        include: {
          projects: {
            include: {
              apiKeys: true,
              oauthConfigs: true,
            },
          },
          members: true,
        },
      },
      subscription: true,
    });

    // Calculate total API calls from usage records
    const usageStats = await prisma.usageRecord.aggregate({
      where: {
        userId: user.id,
        resource: "api_call",
      },
      _sum: {
        count: true,
      },
    });

    const totalApiCalls = usageStats._sum.count || 0;
    const activeProjects = user.organization?.projects.length || 0;
    const activeOAuthClients = user.organization?.projects.reduce(
      (sum, project) => sum + project.oauthConfigs.filter(c => c.isActive).length,
      0
    ) || 0;
    const teamMembers = user.organization?.members.length || 1;

    return {
      success: true,
      data: {
        totalApiCalls,
        activeProjects,
        activeOAuthClients,
        teamMembers,
      },
    };
  } catch (error) {
    console.error("Error fetching tenant dashboard:", error);
    return { success: false, error: "Failed to fetch dashboard data" };
  }
}

export async function getUsageStats(
  userId: string,
  days: number = 7
) {
  try {
    // Get or create user
    const user = await getOrCreateUser(userId);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query usage records grouped by date
    const usageRecords = await prisma.usageRecord.groupBy({
      by: ['timestamp'],
      where: {
        userId: user.id,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        count: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Format data for chart
    const formattedData = usageRecords.map((record) => ({
      date: new Date(record.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      calls: record._sum.count || 0,
      tokens: 0, // We'll track this when we implement token counting
    }));

    return {
      success: true,
      data: formattedData,
    };
  } catch (error) {
    console.error("Error fetching usage stats:", error);
    return { success: false, error: "Failed to fetch usage stats" };
  }
}

export async function getAuditLogs(userId: string, limit = 100) {
  try {
    // Get or create user
    const user = await getOrCreateUser(userId);

    // Query recent usage records as audit logs
    const logs = await prisma.usageRecord.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });

    // Format logs
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.resource,
      details: log.operation
        ? `${log.resource}: ${log.operation}${log.errorMessage ? ` - ${log.errorMessage}` : ''}`
        : log.resource,
      created_at: log.timestamp.toISOString(),
    }));

    return {
      success: true,
      data: formattedLogs,
    };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return { success: false, error: "Failed to fetch audit logs" };
  }
}

// OAuth Configuration Management
export async function getOAuthConfigs(userId: string, projectId?: string) {
  try {
    const user = await getOrCreateUser(userId, {
      organization: {
        include: {
          projects: {
            where: projectId ? { id: projectId } : undefined,
            include: {
              oauthConfigs: true,
            },
          },
        },
      },
    });

    if (!user?.organization) {
      return { success: true, data: [] };
    }

    const configs = user.organization.projects.flatMap(p => p.oauthConfigs);
    return { success: true, data: configs };
  } catch (error) {
    console.error("Error fetching OAuth configs:", error);
    return { success: false, error: "Failed to fetch OAuth configurations" };
  }
}

export async function createOAuthConfig(data: {
  projectId: string;
  provider: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  mcpServerUrl: string;
  mcpServerName: string;
}) {
  try {
    const config = await prisma.oAuthConfig.create({
      data: {
        projectId: data.projectId,
        provider: data.provider,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        redirectUri: data.redirectUri,
        scopes: data.scopes,
        mcpServerUrl: data.mcpServerUrl,
        mcpServerName: data.mcpServerName,
      },
    });

    return { success: true, data: config };
  } catch (error) {
    console.error("Error creating OAuth config:", error);
    return { success: false, error: "Failed to create OAuth configuration" };
  }
}

// API Key Management
export async function getApiKeys(userId: string, projectId?: string) {
  try {
    const user = await getOrCreateUser(userId);

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: user.id,
        ...(projectId && { projectId }),
      },
      include: {
        project: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { success: true, data: apiKeys };
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return { success: false, error: "Failed to fetch API keys" };
  }
}

export async function createApiKey(data: {
  userId: string;
  name: string;
  projectId?: string;
  scopes: string[];
  rateLimit?: number;
  expiresAt?: Date;
}) {
  try {
    const user = await getOrCreateUser(data.userId);

    // Generate API key
    const prefix = 'sk_live_';
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const apiKey = `${prefix}${randomPart}`;

    const newKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name: data.name,
        key: apiKey,
        prefix,
        projectId: data.projectId,
        scopes: data.scopes,
        rateLimit: data.rateLimit || 100,
        expiresAt: data.expiresAt,
      },
    });

    return { success: true, data: newKey };
  } catch (error) {
    console.error("Error creating API key:", error);
    return { success: false, error: "Failed to create API key" };
  }
}

export async function deleteApiKey(keyId: string, userId: string) {
  try {
    const user = await getOrCreateUser(userId);

    await prisma.apiKey.delete({
      where: {
        id: keyId,
        userId: user.id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting API key:", error);
    return { success: false, error: "Failed to delete API key" };
  }
}

// Get user subscription info for sidebar
export async function getUserSubscription(userId: string) {
  try {
    const user = await getOrCreateUser(userId, {
      subscription: true,
    });

    if (!user?.subscription) {
      return {
        success: true,
        data: {
          plan: 'FREE',
          apiCallsUsed: 0,
          apiCallLimit: 1000,
        },
      };
    }

    return {
      success: true,
      data: {
        plan: user.subscription.plan,
        apiCallsUsed: user.subscription.apiCallsUsed,
        apiCallLimit: user.subscription.apiCallLimit,
      },
    };
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    return { success: false, error: "Failed to fetch subscription" };
  }
}

// Organization Management
export async function getOrganization(userId: string) {
  try {
    const user = await getOrCreateUser(userId, {
      organization: {
        include: {
          owner: true,
          members: true,
        },
      },
    });

    if (!user?.organization) {
      return { success: true, data: null };
    }

    return { success: true, data: user.organization };
  } catch (error) {
    console.error("Error fetching organization:", error);
    return { success: false, error: "Failed to fetch organization" };
  }
}

export async function createOrganization(data: {
  userId: string;
  name: string;
  slug: string;
  description?: string;
}) {
  try {
    const user = await getOrCreateUser(data.userId);

    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        ownerId: user.id,
        members: {
          connect: { id: user.id },
        },
      },
    });

    return { success: true, data: organization };
  } catch (error) {
    console.error("Error creating organization:", error);
    return { success: false, error: "Failed to create organization" };
  }
}

export async function updateOrganization(data: {
  userId: string;
  organizationId: string;
  name?: string;
  description?: string;
  logo?: string;
}) {
  try {
    const user = await getOrCreateUser(data.userId);

    const organization = await prisma.organization.update({
      where: { id: data.organizationId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.logo !== undefined && { logo: data.logo }),
      },
    });

    return { success: true, data: organization };
  } catch (error) {
    console.error("Error updating organization:", error);
    return { success: false, error: "Failed to update organization" };
  }
}

// Project Management
export async function getProjects(userId: string) {
  try {
    const user = await getOrCreateUser(userId, {
      organization: {
        include: {
          projects: {
            include: {
              apiKeys: true,
              oauthConfigs: true,
            },
          },
        },
      },
    });

    if (!user?.organization) {
      return { success: true, data: [] };
    }

    return { success: true, data: user.organization.projects };
  } catch (error) {
    console.error("Error fetching projects:", error);
    return { success: false, error: "Failed to fetch projects" };
  }
}

export async function createProject(data: {
  userId: string;
  name: string;
  description?: string;
}) {
  try {
    const user = await getOrCreateUser(data.userId, {
      organization: true,
    });

    if (!user?.organization) {
      return { success: false, error: "Organization not found" };
    }

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId: user.organization.id,
      },
    });

    return { success: true, data: project };
  } catch (error) {
    console.error("Error creating project:", error);
    return { success: false, error: "Failed to create project" };
  }
}

export async function updateProject(data: {
  projectId: string;
  name?: string;
  description?: string;
}) {
  try {
    const project = await prisma.project.update({
      where: { id: data.projectId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    return { success: true, data: project };
  } catch (error) {
    console.error("Error updating project:", error);
    return { success: false, error: "Failed to update project" };
  }
}

export async function deleteProject(projectId: string) {
  try {
    await prisma.project.delete({
      where: { id: projectId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting project:", error);
    return { success: false, error: "Failed to delete project" };
  }
}
