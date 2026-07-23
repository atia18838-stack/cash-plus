import { internalMutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";

// ============================================================
// INTERNAL QUERIES - استعلامات داخلية
// ============================================================

export const getAccount = internalQuery({
  args: { accountId: v.id("providerAccounts") },
  handler: async (ctx, { accountId }) => {
    return await ctx.db.get(accountId);
  },
});

export const listActiveAccounts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("providerAccounts").collect();
    return accounts.filter((a) => a.isActive);
  },
});

export const getWalletsByProvider = internalQuery({
  args: {
    provider: v.union(v.literal("vodafone"), v.literal("etisalat"), v.literal("orange")),
  },
  handler: async (ctx, { provider }) => {
    return await ctx.db
      .query("wallets")
      .withIndex("by_provider", (q) => q.eq("provider", provider))
      .collect();
  },
});

export const findTransactionByReference = internalQuery({
  args: { reference: v.string() },
  handler: async (ctx, { reference }) => {
    return await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("reference"), reference))
      .first();
  },
});

// ============================================================
// INTERNAL MUTATIONS - تعديلات داخلية
// ============================================================

export const updateSession = internalMutation({
  args: {
    accountId: v.id("providerAccounts"),
    sessionId: v.optional(v.string()),
    token: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    isConnected: v.optional(v.boolean()),
    lastError: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {};
    if (args.sessionId !== undefined) patch.sessionId = args.sessionId;
    if (args.token !== undefined) patch.apiToken = args.token;
    if (args.expiresAt !== undefined) patch.sessionExpiresAt = args.expiresAt;
    if (args.isConnected !== undefined) patch.isConnected = args.isConnected;
    if (args.lastError !== undefined) patch.lastError = args.lastError;
    if (args.lastSyncAt !== undefined) patch.lastSyncAt = args.lastSyncAt;
    await ctx.db.patch(args.accountId, patch);
  },
});

export const updateWalletSyncStatus = internalMutation({
  args: {
    walletId: v.id("wallets"),
    status: v.union(v.literal("connected"), v.literal("disconnected"), v.literal("error")),
    lastSyncAt: v.number(),
    balance: v.optional(v.number()),
    dailyUsed: v.optional(v.number()),
    monthlyUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      lastSyncStatus: args.status,
      lastSyncAt: args.lastSyncAt,
      lastUpdated: Date.now(),
    };
    if (args.balance !== undefined) patch.balance = args.balance;
    if (args.dailyUsed !== undefined) patch.dailyUsed = args.dailyUsed;
    if (args.monthlyUsed !== undefined) patch.monthlyUsed = args.monthlyUsed;
    await ctx.db.patch(args.walletId, patch);
  },
});

export const createSyncedTransaction = internalMutation({
  args: {
    walletId: v.id("wallets"),
    type: v.union(v.literal("deposit"), v.literal("withdrawal"), v.literal("transfer"), v.literal("payment")),
    amount: v.number(),
    balanceBefore: v.number(),
    balanceAfter: v.number(),
    description: v.optional(v.string()),
    reference: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db.get(args.walletId);
    if (!wallet) throw new Error("المحفظة غير موجودة");

    const txId = await ctx.db.insert("transactions", {
      walletId: args.walletId,
      type: args.type,
      amount: args.amount,
      balanceBefore: args.balanceBefore,
      balanceAfter: args.balanceAfter,
      status: "completed",
      description: args.description,
      reference: args.reference,
      source: "auto_sync",
      createdAt: args.createdAt,
    });

    const newTotalDeposits = wallet.totalDeposits + (args.type === "deposit" ? args.amount : 0);
    const newTotalWithdrawals = wallet.totalWithdrawals + (args.type === "withdrawal" ? args.amount : 0);
    const newDailyUsed = wallet.dailyUsed + (args.type === "withdrawal" ? args.amount : 0);
    const newMonthlyUsed = wallet.monthlyUsed + (args.type === "withdrawal" ? args.amount : 0);

    await ctx.db.patch(args.walletId, {
      balance: args.balanceAfter,
      totalDeposits: newTotalDeposits,
      totalWithdrawals: newTotalWithdrawals,
      dailyUsed: newDailyUsed,
      monthlyUsed: newMonthlyUsed,
      lastUpdated: Date.now(),
    });

    const today = new Date().toISOString().split("T")[0];
    const existingStat = await ctx.db
      .query("dailyStats")
      .withIndex("by_wallet_and_date", (q) => q.eq("walletId", args.walletId).eq("date", today))
      .first();

    if (existingStat) {
      await ctx.db.patch(existingStat._id, {
        totalDeposits: existingStat.totalDeposits + (args.type === "deposit" ? args.amount : 0),
        totalWithdrawals: existingStat.totalWithdrawals + (args.type === "withdrawal" ? args.amount : 0),
        depositCount: existingStat.depositCount + (args.type === "deposit" ? 1 : 0),
        withdrawalCount: existingStat.withdrawalCount + (args.type === "withdrawal" ? 1 : 0),
        netProfit: existingStat.netProfit + (args.type === "deposit" ? args.amount : -args.amount),
      });
    } else {
      await ctx.db.insert("dailyStats", {
        walletId: args.walletId,
        date: today,
        totalDeposits: args.type === "deposit" ? args.amount : 0,
        totalWithdrawals: args.type === "withdrawal" ? args.amount : 0,
        depositCount: args.type === "deposit" ? 1 : 0,
        withdrawalCount: args.type === "withdrawal" ? 1 : 0,
        netProfit: args.type === "deposit" ? args.amount : -args.amount,
        createdAt: Date.now(),
      });
    }

    return txId;
  },
});

export const addSyncLog = internalMutation({
  args: {
    providerAccountId: v.id("providerAccounts"),
    walletId: v.optional(v.id("wallets")),
    type: v.union(v.literal("login"), v.literal("sync"), v.literal("error"), v.literal("transaction")),
    status: v.union(v.literal("success"), v.literal("failed"), v.literal("pending")),
    message: v.string(),
    details: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("syncLogs", {
      providerAccountId: args.providerAccountId,
      walletId: args.walletId,
      type: args.type,
      status: args.status,
      message: args.message,
      details: args.details,
      createdAt: Date.now(),
    });
  },
});

export const createAdminAlert = internalMutation({
  args: {
    providerAccountId: v.id("providerAccounts"),
    alertType: v.string(),
    message: v.string(),
    severity: v.union(v.literal("info"), v.literal("warning"), v.literal("critical")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("syncLogs", {
      providerAccountId: args.providerAccountId,
      type: "error",
      status: "failed",
      message: `🚨 تنبيه ${args.severity === "critical" ? "حرج" : args.severity === "warning" ? "تحذير" : "معلومة"}: ${args.message}`,
      details: { alertType: args.alertType, severity: args.severity, timestamp: Date.now() },
      createdAt: Date.now(),
    });
  },
});

export const updateSystemStatus = internalMutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("systemStatus")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("systemStatus", { key: args.key, value: args.value, updatedAt: Date.now() });
    }
  },
});

// ============================================================
// PUBLIC QUERIES - استعلامات عامة للواجهة
// ============================================================

export const getSystemStatus = query({
  args: {},
  handler: async (ctx) => {
    const statuses = await ctx.db.query("systemStatus").collect();
    const result: Record<string, unknown> = {};
    for (const s of statuses) {
      result[s.key] = s.value;
    }
    return result;
  },
});

export const getLiveStats = query({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query("providerAccounts").collect();
    const wallets = await ctx.db.query("wallets").collect();
    const recentLogs = await ctx.db
      .query("syncLogs")
      .withIndex("by_date")
      .order("desc")
      .take(20);

    const connectedAccounts = accounts.filter((a) => a.isConnected && a.isActive);
    const connectedWallets = wallets.filter((w) => w.lastSyncStatus === "connected");
    const errorWallets = wallets.filter((w) => w.lastSyncStatus === "error");

    const lastSyncTimes = accounts
      .filter((a) => a.lastSyncAt)
      .map((a) => a.lastSyncAt as number);

    return {
      totalAccounts: accounts.length,
      connectedAccounts: connectedAccounts.length,
      totalWallets: wallets.length,
      connectedWallets: connectedWallets.length,
      errorWallets: errorWallets.length,
      lastSyncAt: lastSyncTimes.length > 0 ? Math.max(...lastSyncTimes) : null,
      recentLogs,
      systemHealth: connectedAccounts.length > 0 ? "online" : "offline",
    };
  },
});
