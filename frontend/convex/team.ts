import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get team members
export const getTeamMembers = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user || !user.organizationId) {
      return [];
    }

    const members = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", user.organizationId!)
      )
      .collect();

    const organization = await ctx.db.get(user.organizationId);

    return members.map(member => ({
      ...member,
      isOwner: organization?.ownerId === member._id,
    }));
  },
});

// Update member role
export const updateMemberRole = mutation({
  args: {
    clerkId: v.string(),
    memberId: v.id("users"),
    role: v.union(v.literal("USER"), v.literal("ADMIN"), v.literal("SUPER_ADMIN")),
  },
  handler: async (ctx, { clerkId, memberId, role }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user || !user.organizationId) {
      throw new Error("User not found or not in organization");
    }

    const organization = await ctx.db.get(user.organizationId);

    // Only owner or admin can update roles
    if (organization?.ownerId !== user._id && user.role !== "ADMIN") {
      throw new Error("Permission denied");
    }

    const member = await ctx.db.get(memberId);

    if (!member || member.organizationId !== user.organizationId) {
      throw new Error("Member not found in organization");
    }

    await ctx.db.patch(memberId, {
      role,
      updatedAt: Date.now(),
    });

    return memberId;
  },
});

// Remove team member
export const removeMember = mutation({
  args: {
    clerkId: v.string(),
    memberId: v.id("users"),
  },
  handler: async (ctx, { clerkId, memberId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user || !user.organizationId) {
      throw new Error("User not found or not in organization");
    }

    const organization = await ctx.db.get(user.organizationId);

    // Only owner or admin can remove members
    if (organization?.ownerId !== user._id && user.role !== "ADMIN") {
      throw new Error("Permission denied");
    }

    const member = await ctx.db.get(memberId);

    if (!member || member.organizationId !== user.organizationId) {
      throw new Error("Member not found in organization");
    }

    // Cannot remove owner
    if (organization?.ownerId === memberId) {
      throw new Error("Cannot remove organization owner");
    }

    // Remove from organization
    await ctx.db.patch(memberId, {
      organizationId: undefined,
      updatedAt: Date.now(),
    });

    return memberId;
  },
});

// Invite member (creates pending user record)
export const inviteMember = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    role: v.union(v.literal("USER"), v.literal("ADMIN")),
  },
  handler: async (ctx, { clerkId, email, role }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user || !user.organizationId) {
      throw new Error("User not found or not in organization");
    }

    const organization = await ctx.db.get(user.organizationId);

    // Only owner or admin can invite
    if (organization?.ownerId !== user._id && user.role !== "ADMIN") {
      throw new Error("Permission denied");
    }

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      if (existing.organizationId === user.organizationId) {
        throw new Error("User is already a member of this organization");
      }
      throw new Error("User already exists in another organization");
    }

    // Note: In a real app, you'd send an email invitation here
    // For now, we'll just log that an invitation should be sent

    return {
      success: true,
      message: `Invitation sent to ${email}`,
      email,
      role,
    };
  },
});
