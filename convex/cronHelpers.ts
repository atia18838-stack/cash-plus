import { internalMutation } from "./_generated/server";

// ============================================================
// CRON HELPERS - دوال مساعدة للـ Cron Jobs (بدون use node)
// ============================================================

// إعادة تعيين الحدود اليومية لجميع المحافظ
export const resetAllWalletsDailyUsed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const wallets = await ctx.db.query("wallets").collect();

    for (const wallet of wallets) {
      await ctx.db.patch(wallet._id, {
        dailyUsed: 0,
        lastUpdated: Date.now(),
      });
    }

    // تحديث حالة النظام بوقت آخر إعادة تعيين
    const existing = await ctx.db
      .query("systemStatus")
      .withIndex("by_key", (q) => q.eq("key", "lastDailyReset"))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: { timestamp: Date.now(), walletsReset: wallets.length },
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("systemStatus", {
        key: "lastDailyReset",
        value: { timestamp: Date.now(), walletsReset: wallets.length },
        updatedAt: Date.now(),
      });
    }
  },
});
