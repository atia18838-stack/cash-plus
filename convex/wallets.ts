import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// جلب كل المحافظ
export const list = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("wallets"),
    _creationTime: v.number(),
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
  })),
  handler: async (ctx) => {
    return await ctx.db.query("wallets").order("desc").collect();
  },
});

// جلب محفظة واحدة
export const get = query({
  args: { walletId: v.id("wallets") },
  returns: v.union(
    v.object({
      _id: v.id("wallets"),
      _creationTime: v.number(),
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
    }),
    v.null(),
  ),
  handler: async (ctx, { walletId }) => {
    return await ctx.db.get(walletId);
  },
});

// جلب المحافظ حسب مزود الخدمة
export const listByProvider = query({
  args: {
    provider: v.union(v.literal("vodafone"), v.literal("etisalat"), v.literal("orange")),
    phoneNumber: v.optional(v.string()),
  },
  returns: v.array(v.object({
    _id: v.id("wallets"),
    _creationTime: v.number(),
    name: v.string(),
    phoneNumber: v.string(),
    balance: v.number(),
    isActive: v.boolean(),
    provider: v.optional(v.union(v.literal("vodafone"), v.literal("etisalat"), v.literal("orange"))),
    lastSyncStatus: v.optional(v.union(v.literal("connected"), v.literal("disconnected"), v.literal("error"))),
    lastSyncAt: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    let wallets = await ctx.db.query("wallets").withIndex("by_provider", (q) => q.eq("provider", args.provider)).collect();
    if (args.phoneNumber) {
      wallets = wallets.filter((w) => w.phoneNumber === args.phoneNumber);
    }
    return wallets.map((w) => ({
      _id: w._id,
      _creationTime: w._creationTime,
      name: w.name,
      phoneNumber: w.phoneNumber,
      balance: w.balance,
      isActive: w.isActive,
      provider: w.provider,
      lastSyncStatus: w.lastSyncStatus,
      lastSyncAt: w.lastSyncAt,
    }));
  },
});

// إضافة محفظة جديدة
export const add = mutation({
  args: {
    name: v.string(),
    phoneNumber: v.string(),
    balance: v.number(),
    monthlyLimit: v.number(),
    dailyLimit: v.number(),
    provider: v.optional(v.union(v.literal("vodafone"), v.literal("etisalat"), v.literal("orange"))),
    providerAccountId: v.optional(v.string()),
  },
  returns: v.id("wallets"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("wallets", {
      name: args.name,
      phoneNumber: args.phoneNumber,
      balance: args.balance,
      totalDeposits: 0,
      totalWithdrawals: 0,
      monthlyLimit: args.monthlyLimit,
      dailyLimit: args.dailyLimit,
      dailyUsed: 0,
      monthlyUsed: 0,
      isActive: true,
      provider: args.provider ?? "vodafone",
      providerAccountId: args.providerAccountId,
      lastUpdated: now,
    });
  },
});

// تحديث المحفظة
export const update = mutation({
  args: {
    walletId: v.id("wallets"),
    name: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    balance: v.optional(v.number()),
    monthlyLimit: v.optional(v.number()),
    dailyLimit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    lastSyncStatus: v.optional(v.union(v.literal("connected"), v.literal("disconnected"), v.literal("error"))),
    lastSyncAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.phoneNumber !== undefined) patch.phoneNumber = args.phoneNumber;
    if (args.balance !== undefined) patch.balance = args.balance;
    if (args.monthlyLimit !== undefined) patch.monthlyLimit = args.monthlyLimit;
    if (args.dailyLimit !== undefined) patch.dailyLimit = args.dailyLimit;
    if (args.isActive !== undefined) patch.isActive = args.isActive;
    if (args.lastSyncStatus !== undefined) patch.lastSyncStatus = args.lastSyncStatus;
    if (args.lastSyncAt !== undefined) patch.lastSyncAt = args.lastSyncAt;
    patch.lastUpdated = Date.now();

    await ctx.db.patch(args.walletId, patch);
  },
});

// حذف محفظة
export const remove = mutation({
  args: { walletId: v.id("wallets") },
  returns: v.null(),
  handler: async (ctx, { walletId }) => {
    await ctx.db.delete(walletId);
  },
});

// إحصائيات سريعة للمحافظ
export const getStats = query({
  args: {},
  returns: v.object({
    totalBalance: v.number(),
    totalWallets: v.number(),
    activeWallets: v.number(),
    totalDeposits: v.number(),
    totalWithdrawals: v.number(),
  }),
  handler: async (ctx) => {
    const wallets = await ctx.db.query("wallets").collect();
    return {
      totalBalance: wallets.reduce((sum, w) => sum + w.balance, 0),
      totalWallets: wallets.length,
      activeWallets: wallets.filter((w) => w.isActive).length,
      totalDeposits: wallets.reduce((sum, w) => sum + w.totalDeposits, 0),
      totalWithdrawals: wallets.reduce((sum, w) => sum + w.totalWithdrawals, 0),
    };
  },
});
