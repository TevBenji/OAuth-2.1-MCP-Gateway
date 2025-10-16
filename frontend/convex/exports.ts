import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get export records
export const getExportRecords = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return [];
    }

    const exports = await ctx.db
      .query("exportRecords")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return exports;
  },
});

// Create export request
export const createExport = mutation({
  args: {
    clerkId: v.string(),
    type: v.string(),
  },
  handler: async (ctx, { clerkId, type }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days

    const exportId = await ctx.db.insert("exportRecords", {
      userId: user._id,
      type,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
      expiresAt,
    });

    // Note: In a real app, you'd trigger a background job here to generate the export
    // For now, we'll simulate it by marking as processing

    await ctx.db.patch(exportId, {
      status: "PROCESSING",
      updatedAt: Date.now(),
    });

    return exportId;
  },
});

// Delete export
export const deleteExport = mutation({
  args: {
    clerkId: v.string(),
    exportId: v.id("exportRecords"),
  },
  handler: async (ctx, { clerkId, exportId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const exportRecord = await ctx.db.get(exportId);

    if (!exportRecord || exportRecord.userId !== user._id) {
      throw new Error("Export not found or access denied");
    }

    await ctx.db.delete(exportId);

    return exportId;
  },
});
