import { v } from "convex/values";
import { query } from "./_generated/server";

// Get usage statistics
export const getStats = query({
  args: {
    clerkId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, days = 7 }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return [];
    }

    const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

    const usageRecords = await ctx.db
      .query("usageRecords")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", user._id))
      .filter((q) => q.gte(q.field("timestamp"), startDate))
      .collect();

    // Group by date
    const groupedByDate: Record<string, number> = {};

    for (const record of usageRecords) {
      const date = new Date(record.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      groupedByDate[date] = (groupedByDate[date] || 0) + record.count;
    }

    return Object.entries(groupedByDate).map(([date, calls]) => ({
      date,
      calls,
      tokens: 0,
    }));
  },
});

// Get audit logs
export const getAuditLogs = query({
  args: {
    clerkId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, limit = 100 }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return [];
    }

    const logs = await ctx.db
      .query("usageRecords")
      .withIndex("by_user_timestamp", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return logs.map((log) => ({
      id: log._id,
      action: log.resource,
      details: log.operation
        ? `${log.resource}: ${log.operation}${log.errorMessage ? ` - ${log.errorMessage}` : ""}`
        : log.resource,
      created_at: new Date(log.timestamp).toISOString(),
    }));
  },
});
