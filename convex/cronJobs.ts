"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================================
// SESSION HEALTH CHECK - فحص صحة جميع الجلسات كل 5 دقائق
// ============================================================
export const checkAllSessions = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    const accounts = await ctx.runQuery(internal.providerHelpers.listActiveAccounts);

    for (const account of accounts) {
      try {
        await ctx.runAction(internal.providerGateway.refreshSessionIfNeeded, {
          providerAccountId: account._id,
        });
      } catch (error) {
        await ctx.runMutation(internal.providerHelpers.createAdminAlert, {
          providerAccountId: account._id,
          alertType: "session_check_failed",
          message: `فشل فحص جلسة ${account.label} (${account.phoneNumber}): ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
          severity: "warning",
        });
      }

      // تأخير 500ms بين الحسابات لتجنب الضغط
      await new Promise((r) => setTimeout(r, 500));
    }
  },
});

// ============================================================
// DAILY LIMITS RESET - إعادة تعيين الحدود اليومية عند منتصف الليل
// ============================================================
export const resetDailyLimits = internalAction({
  args: {},
  handler: async (ctx): Promise<void> => {
    await ctx.runMutation(internal.cronHelpers.resetAllWalletsDailyUsed, {});
  },
});
