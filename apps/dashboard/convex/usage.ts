import { v } from 'convex/values';
import { query } from './_generated/server';

// Get usage statistics
export const getStats = query({
  args: {
    clerkId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, days = 7 }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
      .first();

    if (!user) {
      return [];
    }

    const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

    const usageRecords = await ctx.db
      .query('usageRecords')
      .withIndex('by_user_timestamp', q => q.eq('userId', user._id))
      .filter(q => q.gte(q.field('timestamp'), startDate))
      .collect();

    const groupedByDate: Record<
      string,
      {
        calls: number;
        successCount: number;
        errorCount: number;
        totalResponseTime: number;
        responseSamples: number;
        tokens: number;
      }
    > = {};

    for (const record of usageRecords) {
      const dateKey = new Date(record.timestamp).toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          calls: 0,
          successCount: 0,
          errorCount: 0,
          totalResponseTime: 0,
          responseSamples: 0,
          tokens: 0,
        };
      }

      const bucket = groupedByDate[dateKey];
      bucket.calls += record.count;

      if (typeof record.responseTime === 'number') {
        bucket.totalResponseTime += record.responseTime;
        bucket.responseSamples += 1;
      }

      if (record.status?.toLowerCase() === 'success') {
        bucket.successCount += record.count;
      } else if (record.status) {
        bucket.errorCount += record.count;
      }

      const metadataTokens =
        typeof record.metadata === 'object' && record.metadata !== null
          ? Number((record.metadata as Record<string, unknown>).tokens) || 0
          : 0;
      bucket.tokens += metadataTokens;
    }

    return Object.entries(groupedByDate).map(([date, bucket]) => ({
      date,
      calls: bucket.calls,
      tokens: bucket.tokens,
      successCount: bucket.successCount,
      errorCount: bucket.errorCount,
      averageResponseTime:
        bucket.responseSamples > 0
          ? Math.round(bucket.totalResponseTime / bucket.responseSamples)
          : null,
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
      .query('users')
      .withIndex('by_clerkId', q => q.eq('clerkId', clerkId))
      .first();

    if (!user) {
      return [];
    }

    const logs = await ctx.db
      .query('usageRecords')
      .withIndex('by_user_timestamp', q => q.eq('userId', user._id))
      .order('desc')
      .take(limit);

    return logs.map(log => ({
      id: log._id,
      action: log.resource,
      operation: log.operation,
      status: log.status,
      count: log.count,
      responseTime: log.responseTime ?? null,
      errorMessage: log.errorMessage ?? null,
      details: log.operation
        ? `${log.resource}: ${log.operation}${log.errorMessage ? ` - ${log.errorMessage}` : ''}`
        : log.resource,
      createdAt: new Date(log.timestamp).toISOString(),
      created_at: new Date(log.timestamp).toISOString(),
    }));
  },
});
