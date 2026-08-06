import { v } from "convex/values";
import { query } from "./_generated/server";

// Get usage statistics and limits
export const getUsageLimits = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return null;
    }

    // Get subscription to get limits
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!subscription) {
      return {
        apiCallLimit: 1000,
        apiCallsUsed: 0,
        projectLimit: 3,
        teamMemberLimit: 1,
        currentProjects: 0,
        currentTeamMembers: 1,
      };
    }

    // Count projects
    let projectCount = 0;
    if (user.organizationId) {
      const projects = await ctx.db
        .query("projects")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", user.organizationId!)
        )
        .collect();
      projectCount = projects.length;
    }

    // Count team members
    let teamMemberCount = 1;
    if (user.organizationId) {
      const members = await ctx.db
        .query("users")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", user.organizationId!)
        )
        .collect();
      teamMemberCount = members.length;
    }

    return {
      apiCallLimit: subscription.apiCallLimit,
      apiCallsUsed: subscription.apiCallsUsed,
      projectLimit: subscription.projectLimit,
      teamMemberLimit: subscription.teamMemberLimit,
      currentProjects: projectCount,
      currentTeamMembers: teamMemberCount,
      plan: subscription.plan,
      status: subscription.status,
    };
  },
});

// Get usage breakdown by resource
export const getUsageBreakdown = query({
  args: {
    clerkId: v.string(),
    days: v.number(),
  },
  handler: async (ctx, { clerkId, days }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return [];
    }

    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    const records = await ctx.db
      .query("usageRecords")
      .withIndex("by_user_timestamp", (q) =>
        q.eq("userId", user._id).gte("timestamp", startTime)
      )
      .collect();

    // Group by resource
    const breakdown = records.reduce((acc, record) => {
      const existing = acc.find(item => item.resource === record.resource);
      if (existing) {
        existing.count += record.count;
        existing.successCount += record.status === 'SUCCESS' ? record.count : 0;
        existing.errorCount += record.status === 'ERROR' ? record.count : 0;
      } else {
        acc.push({
          resource: record.resource,
          count: record.count,
          successCount: record.status === 'SUCCESS' ? record.count : 0,
          errorCount: record.status === 'ERROR' ? record.count : 0,
        });
      }
      return acc;
    }, [] as Array<{
      resource: string;
      count: number;
      successCount: number;
      errorCount: number;
    }>);

    return breakdown;
  },
});

// Get usage over time for charts
export const getUsageOverTime = query({
  args: {
    clerkId: v.string(),
    days: v.number(),
  },
  handler: async (ctx, { clerkId, days }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return [];
    }

    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    const records = await ctx.db
      .query("usageRecords")
      .withIndex("by_user_timestamp", (q) =>
        q.eq("userId", user._id).gte("timestamp", startTime)
      )
      .collect();

    // Group by day
    const dailyUsage = new Map<string, number>();

    records.forEach(record => {
      const date = new Date(record.timestamp).toLocaleDateString();
      const current = dailyUsage.get(date) || 0;
      dailyUsage.set(date, current + record.count);
    });

    return Array.from(dailyUsage.entries()).map(([date, count]) => ({
      date,
      count,
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },
});
