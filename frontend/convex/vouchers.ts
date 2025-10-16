import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get active vouchers
export const getActiveVouchers = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const vouchers = await ctx.db
      .query("vouchers")
      .collect();

    return vouchers.filter(v =>
      v.isActive &&
      v.validFrom <= now &&
      (!v.validUntil || v.validUntil >= now) &&
      (!v.maxUses || v.currentUses < v.maxUses)
    );
  },
});

// Validate voucher code
export const validateVoucher = query({
  args: {
    code: v.string(),
    amount: v.optional(v.number()),
  },
  handler: async (ctx, { code, amount }) => {
    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();

    if (!voucher) {
      return { valid: false, error: "Invalid voucher code" };
    }

    const now = Date.now();

    if (!voucher.isActive) {
      return { valid: false, error: "Voucher is no longer active" };
    }

    if (voucher.validFrom > now) {
      return { valid: false, error: "Voucher is not yet valid" };
    }

    if (voucher.validUntil && voucher.validUntil < now) {
      return { valid: false, error: "Voucher has expired" };
    }

    if (voucher.maxUses && voucher.currentUses >= voucher.maxUses) {
      return { valid: false, error: "Voucher has reached maximum uses" };
    }

    if (amount && voucher.minPurchaseAmount && amount < voucher.minPurchaseAmount) {
      return {
        valid: false,
        error: `Minimum purchase amount is ${voucher.minPurchaseAmount}`,
      };
    }

    let discount = 0;
    if (voucher.discountType === "PERCENTAGE" && amount) {
      discount = (amount * voucher.discountValue) / 100;
    } else if (voucher.discountType === "FIXED_AMOUNT") {
      discount = voucher.discountValue;
    }

    return {
      valid: true,
      voucher: {
        code: voucher.code,
        description: voucher.description,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        discount,
      },
    };
  },
});

// Apply voucher (increment usage)
export const applyVoucher = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, { code }) => {
    const voucher = await ctx.db
      .query("vouchers")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();

    if (!voucher) {
      throw new Error("Invalid voucher code");
    }

    await ctx.db.patch(voucher._id, {
      currentUses: voucher.currentUses + 1,
      updatedAt: Date.now(),
    });

    return voucher._id;
  },
});

// Get user's voucher usage history (could be extended with a voucherUsage table)
export const getVoucherHistory = query({
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

    // This would need a voucherUsage table to track individual user applications
    // For now, return active vouchers they could use
    const now = Date.now();
    const vouchers = await ctx.db
      .query("vouchers")
      .collect();

    return vouchers.filter(v =>
      v.isActive &&
      v.validFrom <= now &&
      (!v.validUntil || v.validUntil >= now)
    );
  },
});
