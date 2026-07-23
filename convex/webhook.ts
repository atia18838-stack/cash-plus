import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const parseAndProcessSms = mutation({
  args: {
    sender: v.string(), // اسم الراسل (مثلاً VodafoneCash)
    body: v.string(),   // نص الرسالة بالكامل
    phone: v.string(),  // رقم الخط المستلم في المحل
  },
  handler: async (ctx, args) => {
    const { body, phone } = args;

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
      return { success: false, message: "صيغة الرسالة غير معتمدة" };
    }

    // 3. البحث عن المحفظة المطابقة لـ phone المستلم
    const wallet = await ctx.db
      .query("wallets")
      .filter((q) => q.eq(q.field("phoneNumber"), phone))
      .first();

    if (!wallet) {
      return { success: false, message: "المحفظة غير مسجلة في النظام" };
    }

    // 4. تسجيل الحركة في جدول الحركات
    await ctx.db.insert("transactions", {
      walletId: wallet._id,
      type: type,
      amount: amount,
      balanceBefore: wallet.balance,
      balanceAfter: newBalance,
      status: "completed",
      source: "sms",
      description: `عملية ${type === "deposit" ? "إيداع" : "سحب"} من/إلى رقم ${counterparty}`,
      reference: transactionId,
      createdAt: Date.now(),
    });

    // 5. تحديث رصيد المحفظة فوراً
    await ctx.db.patch(wallet._id, {
      balance: newBalance,
      lastUpdated: Date.now(),
    });

    return { success: true, message: "تم تسجيل الحركة وتحديث الرصيد بنجاح!" };
  },
});