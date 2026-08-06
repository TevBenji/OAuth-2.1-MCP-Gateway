import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get organization
export const get = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user?.organizationId) {
      return null;
    }

    const organization = await ctx.db.get(user.organizationId);
    if (!organization) {
      return null;
    }

    const owner = await ctx.db.get(organization.ownerId);
    const members = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organization._id)
      )
      .collect();

    return {
      ...organization,
      owner,
      members,
    };
  },
});

// Create organization
export const create = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, ...args }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      ownerId: user._id,
      createdAt: now,
      updatedAt: now,
    });

    // Update user to be member of organization
    await ctx.db.patch(user._id, {
      organizationId: orgId,
      updatedAt: now,
    });

    return orgId;
  },
});

// Update organization
export const update = mutation({
  args: {
    clerkId: v.string(),
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, organizationId, ...updates }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const organization = await ctx.db.get(organizationId);
    if (!organization || organization.ownerId !== user._id) {
      throw new Error("Organization not found or access denied");
    }

    await ctx.db.patch(organizationId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});
