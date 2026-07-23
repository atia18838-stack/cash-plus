import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  // محافظ فودافون كاش
  wallets: defineTable({
    name: v.string(),
    phoneNumber: v.string(),
    balance: v.number(),
    totalDeposits: v.number(),
    totalWithdrawals: v.number(),
    monthlyLimit: v.number(),
    dailyLimit: v.number(),
    dailyUsed: v.number(),
    monthlyUsed: v.number(),
    isActive: v.boolean(),
    provider: v.optional(v.union(v.literal("vodafone"), v.literal("etisalat"), v.literal("orange"))),
    providerAccountId: v.optional(v.string()),
    lastSyncStatus: v.optional(v.union(v.literal("connected"), v.literal("disconnected"), v.literal("error"))),
    lastSyncAt: v.optional(v.number()),
    lastUpdated: v.number(),
  })
    .index("by_phone", ["phoneNumber"])
    .index("by_provider", ["provider"]),

  // الحركات المالية
  transactions: defineTable({
    walletId: v.id("wallets"),
    type: v.union(v.literal("deposit"), v.literal("withdrawal"), v.literal("transfer"), v.literal("payment")),
    amount: v.number(),
    balanceBefore: v.number(),
    balanceAfter: v.number(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("cancelled")),
    description: v.optional(v.string()),
    reference: v.optional(v.string()),
    source: v.union(v.literal("sms"), v.literal("manual"), v.literal("webhook"), v.literal("auto_sync")),
    createdAt: v.number(),
  })
    .index("by_wallet", ["walletId"])
    .index("by_status", ["status"])
    .index("by_wallet_and_date", ["walletId", "createdAt"])
    .index("by_date", ["createdAt"]),

  // الإيداعات والسحوبات اليومية
  dailyStats: defineTable({
    walletId: v.id("wallets"),
    date: v.string(),
    totalDeposits: v.number(),
    totalWithdrawals: v.number(),
    depositCount: v.number(),
    withdrawalCount: v.number(),
    netProfit: v.number(),
    createdAt: v.number(),
  })
    .index("by_wallet_and_date", ["walletId", "date"])
    .index("by_date", ["date"]),

  // سجلات SMS الواردة
  smsLogs: defineTable({
    from: v.string(),
    message: v.string(),
    parsed: v.optional(v.boolean()),
    parsedData: v.optional(v.object({
      type: v.string(),
      amount: v.number(),
      balance: v.number(),
      reference: v.optional(v.string()),
    })),
    walletId: v.optional(v.id("wallets")),
    createdAt: v.number(),
  })
    .index("by_date", ["createdAt"])
    .index("by_wallet", ["walletId"]),

  // التقارير
  reports: defineTable({
    title: v.string(),
    type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("custom")),
    data: v.any(),
    dateRange: v.object({
      from: v.number(),
      to: v.number(),
    }),
    createdAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_date", ["createdAt"]),

  // حسابات مقدمي الخدمة (API Credentials)
  providerAccounts: defineTable({
    provider: v.union(v.literal("vodafone"), v.literal("etisalat"), v.literal("orange")),
    label: v.string(),
    phoneNumber: v.string(),
    apiUsername: v.optional(v.string()),
    apiPassword: v.optional(v.string()),
    apiToken: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    sessionExpiresAt: v.optional(v.number()),
    isConnected: v.boolean(),
    lastSyncAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    syncInterval: v.number(), // بالثواني
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_provider", ["provider"]),

  // سجل المزامنة التلقائية
  syncLogs: defineTable({
    providerAccountId: v.id("providerAccounts"),
    walletId: v.optional(v.id("wallets")),
    type: v.union(v.literal("login"), v.literal("sync"), v.literal("error"), v.literal("transaction")),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    message: v.string(),
    details: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_account", ["providerAccountId"])
    .index("by_date", ["createdAt"]),

  // حالة النظام العامة
  systemStatus: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),
};

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    isAdmin: v.optional(v.boolean()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),
  ...applicationTables,
});
