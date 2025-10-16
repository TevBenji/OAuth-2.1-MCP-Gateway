import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

// Helper to get or create user
export const getOrCreate = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, email, name }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      clerkId,
      email,
      name,
      role: "USER",
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

// Get dashboard data for tenant
export const getDashboard = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    // Get or find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return {
        totalApiCalls: 0,
        activeProjects: 0,
        activeOAuthClients: 0,
        teamMembers: 1,
      };
    }

    // Get organization if exists
    const organization = user.organizationId
      ? await ctx.db.get(user.organizationId)
      : null;

    // Get projects
    const projects = organization
      ? await ctx.db
          .query("projects")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", organization._id)
          )
          .collect()
      : [];

    // Get OAuth configs count
    let activeOAuthClients = 0;
    for (const project of projects) {
      const configs = await ctx.db
        .query("oauthConfigs")
        .withIndex("by_project", (q) => q.eq("projectId", project._id))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
      activeOAuthClients += configs.length;
    }

    // Get total API calls
    const usageRecords = await ctx.db
      .query("usageRecords")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("resource"), "api_call"))
      .collect();

    const totalApiCalls = usageRecords.reduce(
      (sum, record) => sum + record.count,
      0
    );

    // Get team members count
    const teamMembers = organization
      ? await ctx.db
          .query("users")
          .withIndex("by_organization", (q) =>
            q.eq("organizationId", organization._id)
          )
          .collect()
      : [user];

    return {
      totalApiCalls,
      activeProjects: projects.length,
      activeOAuthClients,
      teamMembers: teamMembers.length,
    };
  },
});

// Get user subscription
export const getSubscription = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return {
        plan: "FREE",
        apiCallsUsed: 0,
        apiCallLimit: 1000,
      };
    }

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!subscription) {
      return {
        plan: "FREE",
        apiCallsUsed: 0,
        apiCallLimit: 1000,
      };
    }

    return {
      plan: subscription.plan,
      apiCallsUsed: subscription.apiCallsUsed,
      apiCallLimit: subscription.apiCallLimit,
    };
  },
});
