import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List API keys
export const list = query({
  args: {
    clerkId: v.string(),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, { clerkId, projectId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return [];
    }

    let apiKeysQuery = ctx.db
      .query("apiKeys")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    if (projectId) {
      const keys = await apiKeysQuery.collect();
      const filtered = keys.filter((k) => k.projectId === projectId);

      // Get project data for each key
      const keysWithProjects = await Promise.all(
        filtered.map(async (key) => {
          const project = key.projectId ? await ctx.db.get(key.projectId) : null;
          return {
            ...key,
            project: project ? { name: project.name } : null,
          };
        })
      );

      return keysWithProjects;
    }

    const keys = await apiKeysQuery.collect();

    // Get project data for each key
    const keysWithProjects = await Promise.all(
      keys.map(async (key) => {
        const project = key.projectId ? await ctx.db.get(key.projectId) : null;
        return {
          ...key,
          project: project ? { name: project.name } : null,
        };
      })
    );

    return keysWithProjects;
  },
});

// Create API key
export const create = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    projectId: v.optional(v.id("projects")),
    scopes: v.array(v.string()),
    rateLimit: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, ...args }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Generate API key
    const prefix = "sk_live_";
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const randomPart = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const apiKey = `${prefix}${randomPart}`;

    const now = Date.now();

    const keyId = await ctx.db.insert("apiKeys", {
      userId: user._id,
      name: args.name,
      key: apiKey,
      prefix,
      projectId: args.projectId,
      scopes: args.scopes,
      rateLimit: args.rateLimit || 100,
      expiresAt: args.expiresAt,
      usageCount: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return keyId;
  },
});

// Delete API key
export const remove = mutation({
  args: {
    clerkId: v.string(),
    keyId: v.id("apiKeys"),
  },
  handler: async (ctx, { clerkId, keyId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const apiKey = await ctx.db.get(keyId);
    if (!apiKey || apiKey.userId !== user._id) {
      throw new Error("API key not found or access denied");
    }

    await ctx.db.delete(keyId);
  },
});
