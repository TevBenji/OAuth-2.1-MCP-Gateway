import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get OAuth configurations
export const getConfigs = query({
  args: {
    clerkId: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, { clerkId, projectId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user?.organizationId) {
      return [];
    }

    const organization = await ctx.db.get(user.organizationId);
    if (!organization) {
      return [];
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organization._id)
      )
      .collect();

    const filteredProjects = projectId
      ? projects.filter((p) => p._id === projectId)
      : projects;

    const configs = [];
    for (const project of filteredProjects) {
      const projectConfigs = await ctx.db
        .query("oauthConfigs")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .collect();
      configs.push(...projectConfigs);
    }

    return configs;
  },
});

// Create OAuth configuration
export const createConfig = mutation({
  args: {
    projectId: v.id("projects"),
    provider: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    redirectUri: v.string(),
    scopes: v.array(v.string()),
    mcpServerUrl: v.string(),
    mcpServerName: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const configId = await ctx.db.insert("oauthConfigs", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return configId;
  },
});
