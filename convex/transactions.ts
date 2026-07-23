import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// جلب الحركات مع فلترة
export const list = query({
  args: {
    walletId: v.optional(v.id("wallets")),
    status: v.optional(v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("cancelled"))),
    type: v.optional(v.union(v.literal("deposit"), v.literal("withdrawal"), v.literal("transfer"), v.literal("payment"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("transactions"),
    _creationTime: v.number(),
    walletId: v.id("wallets"),
    type: v.string(),
    amount: v.number(),
    balanceBefore: v.number(),
    balanceAfter: v.number(),
    status: v.string(),
    description: v.optional(v.string()),
    reference: v.optional(v.string()),
    source: v.string(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let transactions;
    if (args.walletId) {
      transactions = await ctx.db
        .query("transactions")
        .withIndex("by_wallet_and_date", (q) => q.eq("walletId", args.walletId!))
        .order("desc")
        .take(limit);
    } else {
      transactions = await ctx.db
        .query("transactions")
        .withIndex("by_date")
        .order("desc")
        .take(limit);
    }

    // فلترة حسب الحالة والنوع
    let filtered = transactions;
    if (args.status) {
      filtered = filtered.filter((t) => t.status === args.status);
    }
    if (args.type) {
      filtered = filtered.filter((t) => t.type === args.type);
    }

    return filtered;
  },
});

// إضافة حركة من المزامنة التلقائية (بدون تحقق من المستخدم)
export const addAutoSync = mutation({
  args: {
    walletId: v.id("wallets"),
    type: v.union(v.literal("deposit"), v.literal("withdrawal"), v.literal("transfer"), v.literal("payment")),
    amount: v.number(),
    description: v.optional(v.string()),
    balanceBefore: v.number(),
    balanceAfter: v.number(),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    const now = Date.now();
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
      source: "auto_sync",
      createdAt: now,
    });

    // تحديث المحفظة
    let newDailyUsed = wallet.dailyUsed;
    let newMonthlyUsed = wallet.monthlyUsed;
    let newTotalDeposits = wallet.totalDeposits;
    let newTotalWithdrawals = wallet.totalWithdrawals;

    if (args.type === "deposit") {
      newTotalDeposits += args.amount;
    } else if (args.type === "withdrawal") {
      newDailyUsed += args.amount;
      newMonthlyUsed += args.amount;
      newTotalWithdrawals += args.amount;
    }

    await ctx.db.patch(args.walletId, {
      balance: args.balanceAfter,
      dailyUsed: newDailyUsed,
      monthlyUsed: newMonthlyUsed,
      totalDeposits: newTotalDeposits,
      totalWithdrawals: newTotalWithdrawals,
      lastUpdated: now,
    });

    // تحديث إحصائيات اليوم
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
        createdAt: now,
      });
    }

    return txId;
  },
});

// إضافة حركة يدوية
export const add = mutation({
  args: {
    walletId: v.id("wallets"),
    type: v.union(v.literal("deposit"), v.literal("withdrawal"), v.literal("transfer"), v.literal("payment")),
    amount: v.number(),
    description: v.optional(v.string()),
    reference: v.optional(v.string()),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    const wallet = await ctx.db.get(args.walletId);
    if (!wallet) throw new Error("المحفظة غير موجودة");

    const now = Date.now();
    const balanceBefore = wallet.balance;
    let balanceAfter = balanceBefore;
    let newDailyUsed = wallet.dailyUsed;
    let newMonthlyUsed = wallet.monthlyUsed;
    let newTotalDeposits = wallet.totalDeposits;
    let newTotalWithdrawals = wallet.totalWithdrawals;

    if (args.type === "deposit") {
      balanceAfter = balanceBefore + args.amount;
      newTotalDeposits += args.amount;
    } else if (args.type === "withdrawal") {
      if (balanceBefore < args.amount) {
        throw new Error("الرصيد غير كافي");
      }
      balanceAfter = balanceBefore - args.amount;
      newDailyUsed += args.amount;
      newMonthlyUsed += args.amount;
      newTotalWithdrawals += args.amount;
    }

    // إنشاء الحركة
    const txId = await ctx.db.insert("transactions", {
      walletId: args.walletId,
      type: args.type,
      amount: args.amount,
      balanceBefore,
      balanceAfter,
      status: "completed",
      description: args.description,
      reference: args.reference,
      source: "manual",
      createdAt: now,
    });

    // تحديث المحفظة
    await ctx.db.patch(args.walletId, {
      balance: balanceAfter,
      dailyUsed: newDailyUsed,
      monthlyUsed: newMonthlyUsed,
      totalDeposits: newTotalDeposits,
      totalWithdrawals: newTotalWithdrawals,
      lastUpdated: now,
    });

    // تحديث إحصائيات اليوم
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
        createdAt: now,
      });
    }

    return txId;
  },
});

// إحصائيات الحركات
export const getStats = query({
  args: {
    days: v.optional(v.number()),
  },
  returns: v.object({
    totalTransactions: v.number(),
    totalDeposits: v.number(),
    totalWithdrawals: v.number(),
    pendingCount: v.number(),
    completedCount: v.number(),
    failedCount: v.number(),
    todayDeposits: v.number(),
    todayWithdrawals: v.number(),
    todayProfit: v.number(),
  }),
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_date")
      .order("desc")
      .take(1000);

    const recent = transactions.filter((t) => t.createdAt >= since);
    const today = transactions.filter((t) => t.createdAt >= todayStart.getTime());

    return {
      totalTransactions: recent.length,
      totalDeposits: recent.filter((t) => t.type === "deposit" && t.status === "completed")
        .reduce((s, t) => s + t.amount, 0),
      totalWithdrawals: recent.filter((t) => t.type === "withdrawal" && t.status === "completed")
        .reduce((s, t) => s + t.amount, 0),
      pendingCount: transactions.filter((t) => t.status === "pending").length,
      completedCount: transactions.filter((t) => t.status === "completed").length,
      failedCount: transactions.filter((t) => t.status === "failed").length,
      todayDeposits: today.filter((t) => t.type === "deposit" && t.status === "completed")
        .reduce((s, t) => s + t.amount, 0),
      todayWithdrawals: today.filter((t) => t.type === "withdrawal" && t.status === "completed")
        .reduce((s, t) => s + t.amount, 0),
      todayProfit: today.filter((t) => t.status === "completed")
        .reduce((s, t) => s + (t.type === "deposit" ? t.amount : -t.amount), 0),
    };
  },
});

// تحديث حالة حركة
export const updateStatus = mutation({
  args: {
    transactionId: v.id("transactions"),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed"), v.literal("cancelled")),
  },
  returns: v.null(),
  handler: async (ctx, { transactionId, status }) => {
    await ctx.db.patch(transactionId, { status });
  },
});
