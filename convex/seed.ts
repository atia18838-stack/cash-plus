import { mutation } from "./_generated/server";
import { v } from "convex/values";

// بيانات تجريبية للمحافظ
export const seedWallets = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    // التحقق من وجود بيانات مسبقة
    const existing = await ctx.db.query("wallets").take(1);
    if (existing.length > 0) return;

    const now = Date.now();

    // إنشاء محافظ تجريبية
    const wallets = [
      {
        name: "محفظة فودافون الرئيسية",
        provider: "vodafone" as const,
        phoneNumber: "01000000001",
        balance: 15230.50,
        totalDeposits: 85000,
        totalWithdrawals: 69769.50,
        monthlyLimit: 100000,
        dailyLimit: 30000,
        dailyUsed: 4500,
        monthlyUsed: 45230,
        isActive: true,
        lastUpdated: now,
      },
      {
        name: "محفظة الأعمال",
        provider: "etisalat" as const,
        phoneNumber: "01100000002",
        balance: 8750.00,
        totalDeposits: 45000,
        totalWithdrawals: 36250,
        monthlyLimit: 60000,
        dailyLimit: 20000,
        dailyUsed: 3200,
        monthlyUsed: 28750,
        isActive: true,
        lastUpdated: now,
      },
      {
        name: "محفظة التوفير",
        provider: "orange" as const,
        phoneNumber: "01200000003",
        balance: 25000.00,
        totalDeposits: 50000,
        totalWithdrawals: 25000,
        monthlyLimit: 50000,
        dailyLimit: 15000,
        dailyUsed: 0,
        monthlyUsed: 5000,
        isActive: true,
        lastUpdated: now,
      },
      {
        name: "محفظة المصروفات",
        provider: "vodafone" as const,
        phoneNumber: "01000000004",
        balance: 3200.75,
        totalDeposits: 25000,
        totalWithdrawals: 21799.25,
        monthlyLimit: 30000,
        dailyLimit: 10000,
        dailyUsed: 1200,
        monthlyUsed: 18000,
        isActive: true,
        lastUpdated: now,
      },
      {
        name: "محفظة احتياطية",
        provider: "etisalat" as const,
        phoneNumber: "01100000005",
        balance: 500.00,
        totalDeposits: 10000,
        totalWithdrawals: 9500,
        monthlyLimit: 20000,
        dailyLimit: 5000,
        dailyUsed: 0,
        monthlyUsed: 0,
        isActive: false,
        lastUpdated: now,
      },
    ];

    for (const wallet of wallets) {
      await ctx.db.insert("wallets", wallet);
    }

    // إنشاء حركات تجريبية للأيام السابقة
    const allWallets = await ctx.db.query("wallets").collect();
    const types = ["deposit", "withdrawal"] as const;
    const statuses = ["completed", "completed", "completed", "completed", "pending", "failed"] as const;

    for (let day = 0; day < 30; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);

      for (const wallet of allWallets.slice(0, 3)) {
        if (!wallet.isActive) continue;

        const numTx = Math.floor(Math.random() * 4) + 1;
        let currentBalance = wallet.balance;

        for (let i = 0; i < numTx; i++) {
          const type = types[Math.floor(Math.random() * types.length)];
          const amount = Math.round((Math.random() * 500 + 50) * 100) / 100;
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const balanceBefore = currentBalance;
          const balanceAfter = type === "deposit" ? currentBalance + amount : currentBalance - amount;
          currentBalance = balanceAfter;

          const txTime = new Date(date);
          txTime.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));

          await ctx.db.insert("transactions", {
            walletId: wallet._id,
            type,
            amount,
            balanceBefore,
            balanceAfter,
            status,
            description: type === "deposit" ? "إيداع" : "سحب",
            source: "manual",
            createdAt: txTime.getTime(),
          });
        }
      }
    }

    // إنشاء إحصائيات يومية
    for (let day = 0; day < 7; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      const dateStr = date.toISOString().split("T")[0];

      for (const wallet of allWallets.slice(0, 3)) {
        if (!wallet.isActive) continue;

        const dayDeposits = Math.round(Math.random() * 3000 + 500);
        const dayWithdrawals = Math.round(Math.random() * 2000 + 300);

        await ctx.db.insert("dailyStats", {
          walletId: wallet._id,
          date: dateStr,
          totalDeposits: dayDeposits,
          totalWithdrawals: dayWithdrawals,
          depositCount: Math.floor(Math.random() * 5) + 1,
          withdrawalCount: Math.floor(Math.random() * 4) + 1,
          netProfit: dayDeposits - dayWithdrawals,
          createdAt: date.getTime(),
        });
      }
    }
  },
});
