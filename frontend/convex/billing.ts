import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get billing information
export const getBillingInfo = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return null;
    }

    const billingInfo = await ctx.db
      .query("billingInfo")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return billingInfo;
  },
});

// Update billing information
export const updateBillingInfo = mutation({
  args: {
    clerkId: v.string(),
    fullName: v.optional(v.string()),
    companyName: v.optional(v.string()),
    addressLine1: v.optional(v.string()),
    addressLine2: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    country: v.optional(v.string()),
    taxId: v.optional(v.string()),
    vatNumber: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, ...data }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const existing = await ctx.db
      .query("billingInfo")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...data,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("billingInfo", {
        userId: user._id,
        ...data,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Get payment history
export const getPaymentHistory = query({
  args: {
    clerkId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { clerkId, limit = 50 }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return [];
    }

    const payments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return payments;
  },
});

// Get invoices
export const getInvoices = query({
  args: {
    clerkId: v.string(),
    status: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, status }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return [];
    }

    let query = ctx.db
      .query("invoices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc");

    const invoices = await query.collect();

    if (status) {
      return invoices.filter(inv => inv.status === status);
    }

    return invoices;
  },
});

// Create payment (recharge)
export const createPayment = mutation({
  args: {
    clerkId: v.string(),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { clerkId, amount, currency, paymentMethod, description }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    const paymentId = await ctx.db.insert("payments", {
      userId: user._id,
      amount,
      currency,
      status: "PENDING",
      paymentMethod,
      description,
      createdAt: now,
      updatedAt: now,
    });

    return paymentId;
  },
});

// Get billing overview
export const getBillingOverview = query({
  args: { clerkId: v.string() },
  handler: async (ctx, { clerkId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      return null;
    }

    // Get subscription
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    // Get billing info
    const billingInfo = await ctx.db
      .query("billingInfo")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    // Get recent payments
    const recentPayments = await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(5);

    // Get unpaid invoices
    const unpaidInvoices = await ctx.db
      .query("invoices")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const unpaid = unpaidInvoices.filter(inv => inv.status === "OPEN");

    return {
      subscription,
      billingInfo,
      recentPayments,
      unpaidInvoices: unpaid,
      nextBillingDate: subscription?.nextBillingDate,
      paymentMethod: billingInfo?.cardBrand && billingInfo?.cardLast4
        ? `${billingInfo.cardBrand} •••• ${billingInfo.cardLast4}`
        : null,
    };
  },
});
