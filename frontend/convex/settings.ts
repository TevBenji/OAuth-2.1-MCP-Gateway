import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get user settings
export const getUserSettings = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return null;
    }

    return {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      lastActiveAt: user.lastActiveAt,
      createdAt: user.createdAt,
    };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, name, avatarUrl }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Update last active timestamp
export const updateLastActive = mutation({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      lastActiveAt: Date.now(),
    });

    return user._id;
  },
});
