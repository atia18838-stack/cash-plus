import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const parseAndProcessSms = mutation({
  args: {
    sender: v.string(), // اسم الراسل (مثلاً VodafoneCash)
    body: v.string(),   // نص الرسالة بالكامل
    phone: v.string(),  // رقم الخط المستلم في المحل
  },
  handler: async (ctx, args) => {
    const { body, phone, sender } = args;
    const now = Date.now();

    // 1. Regex للبحث عن تفاصيل الإيداع في رسالة فودافون كاش
    const depositRegex = /تم استلام مبلغ (\d+(?:\.\d+)?) ج\.م من رقم (\d+)\. رصيدك الحالي هو (\d+(?:\.\d+)?) ج\.م\. رقم العملية (\d+)/;
    
    // 2. Regex للبحث عن تفاصيل السحب/التحويل
    const withdrawRegex = /تم تحويل مبلغ (\d+(?:\.\d+)?) ج\.م لرقم (\d+)\. رصيدك الحالي هو (\d+(?:\.\d+)?) ج\.م\. رقم العملية (\d+)/;

    let type: "deposit" | "withdrawal" = "deposit";
    let amount = 0;
    let counterparty = "";
    let newBalance = 0;
    let transactionId = "";

    if (depositRegex.test(body)) {
      const match = body.match(depositRegex)!;
      type = "deposit";
      amount = parseFloat(match[1]);
      counterparty = match[2];
      newBalance = parseFloat(match[3]);
      transactionId = match[4];
    } else if (withdrawRegex.test(body)) {
      const match = body.match(withdrawRegex)!;
      type = "withdrawal";
      amount = parseFloat(match[1]);
      counterparty = match[2];
      newBalance = parseFloat(match[3]);
      transactionId = match[4];
    } else {
      // حفظ الرسالة غير المعالجة في smsLogs للأمان والربط لاحقاً
      await ctx.db.insert("smsLogs", {
        from: sender,
        message: body,
        parsed: false,
        createdAt: now,
      });
      return { success: false, message: "صيغة الرسالة غير معتمدة" };
    }

    // 3. البحث السريع عن المحفظة باستخدام الـ Index المخصص (by_phone)
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_phone", (q) => q.eq("phoneNumber", phone))
      .first();

    if (!wallet) {
      await ctx.db.insert("smsLogs", {
        from: sender,
        message: body,
        parsed: false,
        createdAt: now,
      });
      return { success: false, message: "المحفظة غير مسجلة في النظام" };
    }

    const isDeposit = type === "deposit";

    // 4. تسجيل الحركة في جدول الحركات
    const txId = await ctx.db.insert("transactions", {
      walletId: wallet._id,
      type: type,
      amount: amount,
      balanceBefore: wallet.balance,
      balanceAfter: newBalance,
      status: "completed",
      source: "sms",
      description: `عملية ${isDeposit ? "إيداع" : "سحب"} من/إلى رقم ${counterparty}`,
      reference: transactionId,
      createdAt: now,
    });

    // 5. تحديث رصيد المحفظة والاستهلاك اليومي/الشهري والإجماليات
    await ctx.db.patch(wallet._id, {
      balance: newBalance,
      dailyUsed: wallet.dailyUsed + amount,
      monthlyUsed: wallet.monthlyUsed + amount,
      totalDeposits: isDeposit ? wallet.totalDeposits + amount : wallet.totalDeposits,
      totalWithdrawals: !isDeposit ? wallet.totalWithdrawals + amount : wallet.totalWithdrawals,
      lastSyncAt: now,
      lastSyncStatus: "connected",
      lastUpdated: now,
    });

    // 6. تسجيل العملية في smsLogs للتوثيق
    await ctx.db.insert("smsLogs", {
      from: sender,
      message: body,
      parsed: true,
      walletId: wallet._id,
      parsedData: {
        type: type,
        amount: amount,
        balance: newBalance,
        reference: transactionId,
      },
      createdAt: now,
    });

    // 7. تحديث إحصائيات اليوم (dailyStats)
    const todayStr = new Date(now).toISOString().split("T")[0]; // YYYY-MM-DD
    const existingStat = await ctx.db
      .query("dailyStats")
      .withIndex("by_wallet_and_date", (q) => q.eq("walletId", wallet._id).eq("date", todayStr))
      .first();

    if (existingStat) {
      await ctx.db.patch(existingStat._id, {
        totalDeposits: isDeposit ? existingStat.totalDeposits + amount : existingStat.totalDeposits,
        totalWithdrawals: !isDeposit ? existingStat.totalWithdrawals + amount : existingStat.totalWithdrawals,
        depositCount: isDeposit ? existingStat.depositCount + 1 : existingStat.depositCount,
        withdrawalCount: !isDeposit ? existingStat.withdrawalCount + 1 : existingStat.withdrawalCount,
      });
    } else {
      await ctx.db.insert("dailyStats", {
        walletId: wallet._id,
        date: todayStr,
        totalDeposits: isDeposit ? amount : 0,
        totalWithdrawals: !isDeposit ? amount : 0,
        depositCount: isDeposit ? 1 : 0,
        withdrawalCount: !isDeposit ? 1 : 0,
        netProfit: 0,
        createdAt: now,
      });
    }

    return { 
      success: true, 
      message: "تم تسجيل الحركة وتحديث الرصيد والحدود بنجاح!", 
      transactionId: txId 
    };
  },
});