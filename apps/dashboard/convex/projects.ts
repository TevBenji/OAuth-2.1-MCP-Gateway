import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List projects
export const list = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user?.organizationId) {
      return [];
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", user.organizationId!)
      )
      .collect();

    // Get API keys and OAuth configs for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const apiKeys = await ctx.db
          .query("apiKeys")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        const oauthConfigs = await ctx.db
          .query("oauthConfigs")
          .withIndex("by_project", (q) => q.eq("projectId", project._id))
          .collect();

        return {
          ...project,
          apiKeys,
          oauthConfigs,
        };
      })
    );

    return projectsWithCounts;
  },
});

// Create project
export const create = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, ...args }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user?.organizationId) {
      throw new Error("Organization not found");
    }

    const now = Date.now();

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      organizationId: user.organizationId,
      createdAt: now,
      updatedAt: now,
    });

    return projectId;
  },
});

// Update project
export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, ...updates }) => {
    await ctx.db.patch(projectId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Delete project
export const remove = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    // Delete related API keys
    const apiKeys = await ctx.db
      .query("apiKeys")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    for (const key of apiKeys) {
      await ctx.db.delete(key._id);
    }

    // Delete related OAuth configs
    const oauthConfigs = await ctx.db
      .query("oauthConfigs")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();

    for (const config of oauthConfigs) {
      await ctx.db.delete(config._id);
    }

    // Delete project
    await ctx.db.delete(projectId);
  },
});
