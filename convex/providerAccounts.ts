import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// جلب كل حسابات مقدمي الخدمة
export const list = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("providerAccounts"),
    _creationTime: v.number(),
    provider: v.string(),
    label: v.string(),
    phoneNumber: v.string(),
    apiUsername: v.optional(v.string()),
    isConnected: v.boolean(),
    lastSyncAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
    syncInterval: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("providerAccounts").order("desc").collect();
  },
});

// جلب حساب واحد
export const get = query({
  args: { accountId: v.id("providerAccounts") },
  returns: v.union(
    v.object({
      _id: v.id("providerAccounts"),
      _creationTime: v.number(),
      provider: v.string(),
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
      syncInterval: v.number(),
      isActive: v.boolean(),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, { accountId }) => {
    return await ctx.db.get(accountId);
  },
});

// جلب حساب برقم الهاتف
export const getByPhone = query({
  args: {
    provider: v.union(v.literal("vodafone"), v.literal("etisalat"), v.literal("orange")),
    phoneNumber: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("providerAccounts"),
      provider: v.string(),
      phoneNumber: v.string(),
      sessionId: v.optional(v.string()),
      apiToken: v.optional(v.string()),
      sessionExpiresAt: v.optional(v.number()),
      isConnected: v.boolean(),
      lastSyncAt: v.optional(v.number()),
      lastError: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const accounts = await ctx.db.query("providerAccounts")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .collect();
    return accounts.find((a) => a.phoneNumber === args.phoneNumber) || null;
  },
});

// جلب الحسابات النشطة
export const listActive = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("providerAccounts"),
    provider: v.string(),
    label: v.string(),
    phoneNumber: v.string(),
    isConnected: v.boolean(),
    lastSyncAt: v.optional(v.number()),
    syncInterval: v.number(),
    isActive: v.boolean(),
  })),
  handler: async (ctx) => {
    const accounts = await ctx.db.query("providerAccounts").collect();
    return accounts.filter((a) => a.isActive).map((a) => ({
      _id: a._id,
      provider: a.provider,
      label: a.label,
      phoneNumber: a.phoneNumber,
      isConnected: a.isConnected,
      lastSyncAt: a.lastSyncAt,
      syncInterval: a.syncInterval,
      isActive: a.isActive,
    }));
  },
});

// إضافة حساب مزود خدمة جديد
export const add = mutation({
  args: {
    provider: v.union(v.literal("vodafone"), v.literal("etisalat"), v.literal("orange")),
    label: v.string(),
    phoneNumber: v.string(),
    apiUsername: v.optional(v.string()),
    apiPassword: v.optional(v.string()),
    syncInterval: v.optional(v.number()),
  },
  returns: v.id("providerAccounts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("providerAccounts", {
      provider: args.provider,
      label: args.label,
      phoneNumber: args.phoneNumber,
      apiUsername: args.apiUsername,
      apiPassword: args.apiPassword,
      isConnected: false,
      syncInterval: args.syncInterval ?? 30,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// تحديث الجلسة
export const updateSession = mutation({
  args: {
    accountId: v.id("providerAccounts"),
    sessionId: v.optional(v.string()),
    token: v.optional(v.string()),
    sessionExpiresAt: v.optional(v.number()),
    isConnected: v.optional(v.boolean()),
    lastSyncAt: v.optional(v.number()),
    lastError: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {};
    if (args.sessionId !== undefined) patch.sessionId = args.sessionId;
    if (args.token !== undefined) patch.apiToken = args.token;
    if (args.sessionExpiresAt !== undefined) patch.sessionExpiresAt = args.sessionExpiresAt;
    if (args.isConnected !== undefined) patch.isConnected = args.isConnected;
    if (args.lastSyncAt !== undefined) patch.lastSyncAt = args.lastSyncAt;
    if (args.lastError !== undefined) patch.lastError = args.lastError;

    await ctx.db.patch(args.accountId, patch);
  },
});

// تحديث حساب
export const update = mutation({
  args: {
    accountId: v.id("providerAccounts"),
    label: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    apiUsername: v.optional(v.string()),
    apiPassword: v.optional(v.string()),
    syncInterval: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {};
    if (args.label !== undefined) patch.label = args.label;
    if (args.phoneNumber !== undefined) patch.phoneNumber = args.phoneNumber;
    if (args.apiUsername !== undefined) patch.apiUsername = args.apiUsername;
    if (args.apiPassword !== undefined) patch.apiPassword = args.apiPassword;
    if (args.syncInterval !== undefined) patch.syncInterval = args.syncInterval;
    if (args.isActive !== undefined) patch.isActive = args.isActive;

    await ctx.db.patch(args.accountId, patch);
  },
});

// حذف حساب
export const remove = mutation({
  args: { accountId: v.id("providerAccounts") },
  returns: v.null(),
  handler: async (ctx, { accountId }) => {
    await ctx.db.delete(accountId);
  },
});

// إضافة سجل مزامنة
export const addSyncLog = mutation({
  args: {
    providerAccountId: v.id("providerAccounts"),
    type: v.union(v.literal("login"), v.literal("sync"), v.literal("error"), v.literal("transaction")),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    message: v.string(),
    details: v.optional(v.any()),
  },
  returns: v.id("syncLogs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("syncLogs", {
      providerAccountId: args.providerAccountId,
      type: args.type,
      status: args.status,
      message: args.message,
      details: args.details,
      createdAt: Date.now(),
    });
  },
});

// جلب سجلات المزامنة
export const getSyncLogs = query({
  args: {
    accountId: v.optional(v.id("providerAccounts")),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("syncLogs"),
    _creationTime: v.number(),
    providerAccountId: v.id("providerAccounts"),
    walletId: v.optional(v.id("wallets")),
    type: v.string(),
    status: v.string(),
    message: v.string(),
    details: v.optional(v.any()),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    if (args.accountId) {
      return await ctx.db
        .query("syncLogs")
        .withIndex("by_account", (q) => q.eq("providerAccountId", args.accountId!))
        .order("desc")
        .take(limit);
    }
    return await ctx.db
      .query("syncLogs")
      .withIndex("by_date")
      .order("desc")
      .take(limit);
  },
});

// إحصائيات مقدمي الخدمة
export const getStats = query({
  args: {},
  returns: v.object({
    totalAccounts: v.number(),
    connectedAccounts: v.number(),
    vodafoneCount: v.number(),
    etisalatCount: v.number(),
    orangeCount: v.number(),
    lastSyncAt: v.optional(v.number()),
    totalSyncs: v.number(),
    failedSyncs: v.number(),
  }),
  handler: async (ctx) => {
    const accounts = await ctx.db.query("providerAccounts").collect();
    const syncLogs = await ctx.db.query("syncLogs").withIndex("by_date").order("desc").take(100);

    return {
      totalAccounts: accounts.length,
      connectedAccounts: accounts.filter((a) => a.isConnected).length,
      vodafoneCount: accounts.filter((a) => a.provider === "vodafone").length,
      etisalatCount: accounts.filter((a) => a.provider === "etisalat").length,
      orangeCount: accounts.filter((a) => a.provider === "orange").length,
      lastSyncAt: accounts.length > 0 ? Math.max(...accounts.map((a) => a.lastSyncAt || 0)) : undefined,
      totalSyncs: syncLogs.filter((l) => l.type === "sync").length,
      failedSyncs: syncLogs.filter((l) => l.status === "failed").length,
    };
  },
});
