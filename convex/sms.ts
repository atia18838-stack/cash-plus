import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Webhook لاستقبال SMS من Android Gateway
export const receiveSms = mutation({
  args: {
    from: v.string(),
    message: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    parsed: v.boolean(),
    transactionId: v.optional(v.id("transactions")),
  }),
  handler: async (ctx, { from, message }) => {
    const now = Date.now();

    // محاولة تحليل الرسالة
    const parsed = parseSmsMessage(message);

    // حفظ سجل SMS
    await ctx.db.insert("smsLogs", {
      from,
      message,
      parsed: parsed !== null,
      parsedData: parsed ? {
        type: parsed.type,
        amount: parsed.amount,
        balance: parsed.balance,
        reference: parsed.reference,
      } : undefined,
      createdAt: now,
    });

    if (!parsed) {
      return { success: true, parsed: false };
    }

    // البحث عن المحفظة برقم الهاتف
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", from))
      .first();

    if (!wallet) {
      return { success: true, parsed: true };
    }

    // إنشاء الحركة
    const balanceBefore = wallet.balance;
    let balanceAfter = balanceBefore;
    let newDailyUsed = wallet.dailyUsed;
    let newMonthlyUsed = wallet.monthlyUsed;
    let newTotalDeposits = wallet.totalDeposits;
    let newTotalWithdrawals = wallet.totalWithdrawals;

    if (parsed.type === "deposit") {
      balanceAfter = balanceBefore + parsed.amount;
      newTotalDeposits += parsed.amount;
    } else if (parsed.type === "withdrawal") {
      balanceAfter = balanceBefore - parsed.amount;
      newDailyUsed += parsed.amount;
      newMonthlyUsed += parsed.amount;
      newTotalWithdrawals += parsed.amount;
    }

    const txId = await ctx.db.insert("transactions", {
      walletId: wallet._id,
      type: parsed.type as "deposit" | "withdrawal",
      amount: parsed.amount,
      balanceBefore,
      balanceAfter,
      status: "completed",
      description: parsed.description || `حركة من رسالة SMS`,
      reference: parsed.reference,
      source: "sms",
      createdAt: now,
    });

    // تحديث المحفظة
    await ctx.db.patch(wallet._id, {
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
      .withIndex("by_wallet_and_date", (q) => q.eq("walletId", wallet._id).eq("date", today))
      .first();

    if (existingStat) {
      await ctx.db.patch(existingStat._id, {
        totalDeposits: existingStat.totalDeposits + (parsed.type === "deposit" ? parsed.amount : 0),
        totalWithdrawals: existingStat.totalWithdrawals + (parsed.type === "withdrawal" ? parsed.amount : 0),
        depositCount: existingStat.depositCount + (parsed.type === "deposit" ? 1 : 0),
        withdrawalCount: existingStat.withdrawalCount + (parsed.type === "withdrawal" ? 1 : 0),
        netProfit: existingStat.netProfit + (parsed.type === "deposit" ? parsed.amount : -parsed.amount),
      });
    } else {
      await ctx.db.insert("dailyStats", {
        walletId: wallet._id,
        date: today,
        totalDeposits: parsed.type === "deposit" ? parsed.amount : 0,
        totalWithdrawals: parsed.type === "withdrawal" ? parsed.amount : 0,
        depositCount: parsed.type === "deposit" ? 1 : 0,
        withdrawalCount: parsed.type === "withdrawal" ? 1 : 0,
        netProfit: parsed.type === "deposit" ? parsed.amount : -parsed.amount,
        createdAt: now,
      });
    }

    return { success: true, parsed: true, transactionId: txId };
  },
});

// جلب سجلات SMS
export const getSmsLogs = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.object({
    _id: v.id("smsLogs"),
    _creationTime: v.number(),
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
  })),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("smsLogs")
      .withIndex("by_date")
      .order("desc")
      .take(limit);
  },
});

// دالة تحليل رسائل SMS - تدعم صيغ متعددة
function parseSmsMessage(message: string): {
  type: string;
  amount: number;
  balance: number;
  reference?: string;
  description?: string;
} | null {
  // تنظيف النص
  const text = message.trim();

  // صيغة: "تم إيداع مبلغ 100.00 جنيه في محفظتك. الرصيد الحالي: 500.00 جنيه"
  const depositPattern = /إيداع.*?(\d+[\.\d]*)\s*جنيه.*?رصيد[^:]*:\s*(\d+[\.\d]*)/i;
  const depositMatch = text.match(depositPattern);
  if (depositMatch) {
    return {
      type: "deposit",
      amount: parseFloat(depositMatch[1]),
      balance: parseFloat(depositMatch[2]),
      description: "إيداع في المحفظة",
    };
  }

  // صيغة: "تم سحب مبلغ 50.00 جنيه من محفظتك. الرصيد الحالي: 450.00 جنيه"
  const withdrawalPattern = /سحب.*?(\d+[\.\d]*)\s*جنيه.*?رصيد[^:]*:\s*(\d+[\.\d]*)/i;
  const withdrawalMatch = text.match(withdrawalPattern);
  if (withdrawalMatch) {
    return {
      type: "withdrawal",
      amount: parseFloat(withdrawalMatch[1]),
      balance: parseFloat(withdrawalMatch[2]),
      description: "سحب من المحفظة",
    };
  }

  // صيغة: "تحويل مبلغ 200.00 جنيه إلى ... الرصيد: 300.00 جنيه"
  const transferPattern = /تحويل.*?(\d+[\.\d]*)\s*جنيه.*?رصيد[^:]*:\s*(\d+[\.\d]*)/i;
  const transferMatch = text.match(transferPattern);
  if (transferMatch) {
    return {
      type: "withdrawal",
      amount: parseFloat(transferMatch[1]),
      balance: parseFloat(transferMatch[2]),
      description: "تحويل خارجي",
    };
  }

  // صيغة: "تم استلام مبلغ 150.00 جنيه من ... الرصيد: 650.00 جنيه"
  const receivePattern = /استلام.*?(\d+[\.\d]*)\s*جنيه.*?رصيد[^:]*:\s*(\d+[\.\d]*)/i;
  const receiveMatch = text.match(receivePattern);
  if (receiveMatch) {
    return {
      type: "deposit",
      amount: parseFloat(receiveMatch[1]),
      balance: parseFloat(receiveMatch[2]),
      description: "استلام أموال",
    };
  }

  // صيغة عامة: "XX.XX EGP ... Balance: YY.YY EGP"
  const genericPattern = /(\d+[\.\d]*)\s*(?:EGP|جنيه).*?balance[:\s]*(\d+[\.\d]*)/i;
  const genericMatch = text.match(genericPattern);
  if (genericMatch) {
    // نحاول نحدد النوع من الكلمات المفتاحية
    const isDeposit = /credit|deposit|received|إيداع|استلام|وارد/i.test(text);
    return {
      type: isDeposit ? "deposit" : "withdrawal",
      amount: parseFloat(genericMatch[1]),
      balance: parseFloat(genericMatch[2]),
    };
  }

  return null;
}
