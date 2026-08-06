import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users - integrates with Clerk
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("USER"), v.literal("ADMIN"), v.literal("SUPER_ADMIN")),
    organizationId: v.optional(v.id("organizations")),
    lastActiveAt: v.optional(v.number()),
    onboardingCompleted: v.optional(v.boolean()),
    onboardingCompletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_organization", ["organizationId"]),

  // Organizations for team/enterprise accounts
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    ownerId: v.id("users"),
    settings: v.optional(v.any()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_owner", ["ownerId"]),

  // Projects within an organization
  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    organizationId: v.id("organizations"),
    settings: v.optional(v.any()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"]),

  // Subscriptions
  subscriptions: defineTable({
    userId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("organizations")),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripeCurrentPeriodEnd: v.optional(v.number()),
    plan: v.union(
      v.literal("FREE"),
      v.literal("STARTER"),
      v.literal("PROFESSIONAL"),
      v.literal("ENTERPRISE"),
      v.literal("CUSTOM")
    ),
    status: v.union(
      v.literal("ACTIVE"),
      v.literal("CANCELED"),
      v.literal("PAST_DUE"),
      v.literal("UNPAID"),
      v.literal("INCOMPLETE"),
      v.literal("INCOMPLETE_EXPIRED"),
      v.literal("TRIALING"),
      v.literal("PAUSED")
    ),
    apiCallLimit: v.number(),
    apiCallsUsed: v.number(),
    projectLimit: v.number(),
    teamMemberLimit: v.number(),
    billingCycle: v.union(v.literal("MONTHLY"), v.literal("YEARLY")),
    nextBillingDate: v.optional(v.number()),
    cancelAt: v.optional(v.number()),
    canceledAt: v.optional(v.number()),
    trialEnd: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_stripeCustomer", ["stripeCustomerId"])
    .index("by_stripeSubscription", ["stripeSubscriptionId"]),

  // API Keys
  apiKeys: defineTable({
    name: v.string(),
    key: v.string(),
    hashedKey: v.optional(v.string()),
    prefix: v.optional(v.string()),
    userId: v.id("users"),
    projectId: v.optional(v.id("projects")),
    scopes: v.array(v.string()),
    rateLimit: v.number(),
    lastUsedAt: v.optional(v.number()),
    usageCount: v.number(),
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_hashedKey", ["hashedKey"])
    .index("by_user", ["userId"])
    .index("by_project", ["projectId"]),

  // OAuth Configurations
  oauthConfigs: defineTable({
    projectId: v.id("projects"),
    provider: v.string(),
    clientId: v.string(),
    clientSecret: v.string(),
    redirectUri: v.string(),
    scopes: v.array(v.string()),
    mcpServerUrl: v.string(),
    mcpServerName: v.string(),
    isActive: v.boolean(),
    settings: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_provider", ["provider"])
    .index("by_project_provider", ["projectId", "provider"]),

  // Usage tracking
  usageRecords: defineTable({
    userId: v.id("users"),
    resource: v.string(),
    operation: v.optional(v.string()),
    count: v.number(),
    responseTime: v.optional(v.number()),
    dataTransferred: v.optional(v.number()),
    status: v.string(),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user_timestamp", ["userId", "timestamp"])
    .index("by_resource", ["resource"]),

  // Billing Information
  billingInfo: defineTable({
    userId: v.id("users"),
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
    stripePaymentMethodId: v.optional(v.string()),
    cardLast4: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Invoices
  invoices: defineTable({
    userId: v.id("users"),
    invoiceNumber: v.string(),
    stripeInvoiceId: v.optional(v.string()),
    subtotal: v.number(),
    tax: v.number(),
    total: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("DRAFT"),
      v.literal("OPEN"),
      v.literal("PAID"),
      v.literal("VOID"),
      v.literal("UNCOLLECTIBLE")
    ),
    billingPeriodStart: v.number(),
    billingPeriodEnd: v.number(),
    dueDate: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    receiptUrl: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    lineItems: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_invoiceNumber", ["invoiceNumber"])
    .index("by_stripeInvoice", ["stripeInvoiceId"]),

  // Payment records
  payments: defineTable({
    userId: v.id("users"),
    stripePaymentIntentId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("PROCESSING"),
      v.literal("SUCCEEDED"),
      v.literal("FAILED"),
      v.literal("CANCELED"),
      v.literal("REFUNDED"),
      v.literal("PARTIALLY_REFUNDED")
    ),
    paymentMethod: v.optional(v.string()),
    last4: v.optional(v.string()),
    description: v.optional(v.string()),
    metadata: v.optional(v.any()),
    failureReason: v.optional(v.string()),
    failureCode: v.optional(v.string()),
    processedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_stripePaymentIntent", ["stripePaymentIntentId"]),

  // Vouchers/Promo codes
  vouchers: defineTable({
    code: v.string(),
    description: v.optional(v.string()),
    discountType: v.union(v.literal("PERCENTAGE"), v.literal("FIXED_AMOUNT")),
    discountValue: v.number(),
    validFrom: v.number(),
    validUntil: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    currentUses: v.number(),
    planRestrictions: v.array(v.string()),
    minPurchaseAmount: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"]),

  // Export records for compliance
  exportRecords: defineTable({
    userId: v.id("users"),
    type: v.string(),
    status: v.union(
      v.literal("PENDING"),
      v.literal("PROCESSING"),
      v.literal("COMPLETED"),
      v.literal("FAILED"),
      v.literal("EXPIRED")
    ),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),
});
