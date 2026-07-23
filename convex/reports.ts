import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// إنشاء تقرير
export const create = mutation({
  args: {
    title: v.string(),
    type: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly"), v.literal("custom")),
    dateRange: v.object({
      from: v.number(),
      to: v.number(),
    }),
  },
  returns: v.id("reports"),
  handler: async (ctx, args) => {
    // جمع بيانات التقرير
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_date")
      .order("desc")
      .take(5000);

    const filtered = transactions.filter(
      (t) => t.createdAt >= args.dateRange.from && t.createdAt <= args.dateRange.to
    );

    const wallets = await ctx.db.query("wallets").collect();

    const reportData = {
      summary: {
        totalTransactions: filtered.length,
        totalDeposits: filtered.filter((t) => t.type === "deposit" && t.status === "completed")
          .reduce((s, t) => s + t.amount, 0),
        totalWithdrawals: filtered.filter((t) => t.type === "withdrawal" && t.status === "completed")
          .reduce((s, t) => s + t.amount, 0),
        netProfit: filtered.filter((t) => t.status === "completed")
          .reduce((s, t) => s + (t.type === "deposit" ? t.amount : -t.amount), 0),
        pendingCount: filtered.filter((t) => t.status === "pending").length,
        failedCount: filtered.filter((t) => t.status === "failed").length,
      },
      byWallet: wallets.map((w) => {
        const walletTx = filtered.filter((t) => t.walletId === w._id);
        return {
          walletName: w.name,
          phoneNumber: w.phoneNumber,
          balance: w.balance,
          deposits: walletTx.filter((t) => t.type === "deposit").reduce((s, t) => s + t.amount, 0),
          withdrawals: walletTx.filter((t) => t.type === "withdrawal").reduce((s, t) => s + t.amount, 0),
          count: walletTx.length,
        };
      }),
      dailyBreakdown: [] as Array<{ date: string; deposits: number; withdrawals: number; count: number }>,
    };

    // توزيع يومي
    const dailyMap = new Map<string, { deposits: number; withdrawals: number; count: number }>();
    filtered.forEach((t) => {
      const date = new Date(t.createdAt).toISOString().split("T")[0];
      const existing = dailyMap.get(date) || { deposits: 0, withdrawals: 0, count: 0 };
      if (t.type === "deposit" && t.status === "completed") existing.deposits += t.amount;
      if (t.type === "withdrawal" && t.status === "completed") existing.withdrawals += t.amount;
      existing.count++;
      dailyMap.set(date, existing);
    });
    reportData.dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return await ctx.db.insert("reports", {
      title: args.title,
      type: args.type,
      data: reportData,
      dateRange: args.dateRange,
      createdAt: Date.now(),
    });
  },
});

// جلب التقارير
export const list = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("reports"),
    _creationTime: v.number(),
    title: v.string(),
    type: v.string(),
    dateRange: v.object({ from: v.number(), to: v.number() }),
    createdAt: v.number(),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("reports").withIndex("by_date").order("desc").take(50);
  },
});

// جلب تقرير محدد
export const get = query({
  args: { reportId: v.id("reports") },
  returns: v.union(
    v.object({
      _id: v.id("reports"),
      _creationTime: v.number(),
      title: v.string(),
      type: v.string(),
      data: v.any(),
      dateRange: v.object({ from: v.number(), to: v.number() }),
      createdAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, { reportId }) => {
    return await ctx.db.get(reportId);
  },
});

// حذف تقرير
export const remove = mutation({
  args: { reportId: v.id("reports") },
  returns: v.null(),
  handler: async (ctx, { reportId }) => {
    await ctx.db.delete(reportId);
  },
});
