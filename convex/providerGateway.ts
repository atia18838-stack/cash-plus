"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// ============================================================
// INTERFACES - هياكل البيانات
// ============================================================

interface ProviderSession {
  sessionId: string;
  token: string;
  expiresAt: number;
  phoneNumber: string;
  provider: string;
}

interface BalanceResponse {
  success: boolean;
  balance: number;
  availableBalance: number;
  currency: string;
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  lastTransactions: Array<{
    id: string;
    type: "deposit" | "withdrawal" | "transfer" | "payment";
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    timestamp: number;
    reference: string;
    counterparty?: string;
  }>;
}

interface LoginResponse {
  success: boolean;
  sessionId: string;
  token: string;
  expiresIn: number;
  accountInfo: {
    name: string;
    phoneNumber: string;
    tier: string;
    dailyLimit: number;
    monthlyLimit: number;
  };
}

// ============================================================
// HEADLESS SESSION MANAGER - محاكاة APIs مقدمي الخدمة
// ============================================================

// --- Vodafone Cash API Simulator ---
async function simulateVodafoneLogin(phoneNumber: string, _password: string): Promise<LoginResponse> {
  await new Promise((r) => setTimeout(r, 800 + Math.random() * 400));

  if (!phoneNumber.match(/^010\d{8}$/)) {
    throw new Error("Vodafone Cash: رقم الهاتف يجب أن يبدأ بـ 010 ويتكون من 11 رقم");
  }

  const sessionId = `vf_sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const token = `vf_tkn_${Buffer.from(`${phoneNumber}:${Date.now()}`).toString("base64").substring(0, 24)}`;

  return {
    success: true,
    sessionId,
    token,
    expiresIn: 3600,
    accountInfo: {
      name: `محفظة فودافون كاش - ${phoneNumber}`,
      phoneNumber,
      tier: "premium",
      dailyLimit: 30000,
      monthlyLimit: 100000,
    },
  };
}

async function simulateVodafoneGetBalance(session: ProviderSession): Promise<BalanceResponse> {
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));

  const seed = parseInt(session.phoneNumber.slice(-5));
  const baseBalance = 5000 + (seed % 45000);
  const fluctuation = (Math.random() - 0.5) * 500;
  const balance = Math.max(100, Math.round((baseBalance + fluctuation) * 100) / 100);

  const txCount = Math.floor(Math.random() * 3);
  const transactions = [];
  let runningBalance = balance;

  for (let i = 0; i < txCount; i++) {
    const isDeposit = Math.random() > 0.4;
    const amount = Math.round((Math.random() * 2000 + 50) * 100) / 100;
    const balanceBefore = isDeposit ? runningBalance - amount : runningBalance + amount;
    const counterparties = ["أحمد محمد", "محمد علي", "فاطمة حسن", "عمر خالد", "نور الدين"];

    transactions.push({
      id: `VF_TX_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      type: isDeposit ? ("deposit" as const) : ("withdrawal" as const),
      amount,
      balanceBefore: Math.round(balanceBefore * 100) / 100,
      balanceAfter: Math.round(runningBalance * 100) / 100,
      description: isDeposit ? "تحويل وارد - فودافون كاش" : "تحويل صادر - فودافون كاش",
      timestamp: Date.now() - i * (60000 + Math.random() * 300000),
      reference: `VF${Date.now()}${i}${Math.floor(Math.random() * 9999)}`,
      counterparty: counterparties[Math.floor(Math.random() * counterparties.length)],
    });

    runningBalance = isDeposit ? runningBalance - amount : runningBalance + amount;
  }

  return {
    success: true,
    balance,
    availableBalance: Math.round(balance * 0.95 * 100) / 100,
    currency: "EGP",
    dailyLimit: 30000,
    monthlyLimit: 100000,
    dailyUsed: Math.round(Math.random() * 5000 * 100) / 100,
    monthlyUsed: Math.round(Math.random() * 20000 * 100) / 100,
    lastTransactions: transactions,
  };
}

// --- Etisalat Cash API Simulator ---
async function simulateEtisalatLogin(phoneNumber: string, _password: string): Promise<LoginResponse> {
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 500));

  if (!phoneNumber.match(/^011\d{8}$/)) {
    throw new Error("اتصالات كاش: رقم الهاتف يجب أن يبدأ بـ 011 ويتكون من 11 رقم");
  }

  return {
    success: true,
    sessionId: `et_sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    token: `et_tkn_${Buffer.from(`${phoneNumber}:${Date.now()}`).toString("base64").substring(0, 24)}`,
    expiresIn: 7200,
    accountInfo: {
      name: `محفظة اتصالات كاش - ${phoneNumber}`,
      phoneNumber,
      tier: "gold",
      dailyLimit: 25000,
      monthlyLimit: 75000,
    },
  };
}

async function simulateEtisalatGetBalance(session: ProviderSession): Promise<BalanceResponse> {
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));

  const seed = parseInt(session.phoneNumber.slice(-5));
  const baseBalance = 3000 + (seed % 35000);
  const fluctuation = (Math.random() - 0.5) * 400;
  const balance = Math.max(100, Math.round((baseBalance + fluctuation) * 100) / 100);

  const txCount = Math.floor(Math.random() * 2);
  const transactions = [];
  let runningBalance = balance;

  for (let i = 0; i < txCount; i++) {
    const isDeposit = Math.random() > 0.5;
    const amount = Math.round((Math.random() * 1500 + 100) * 100) / 100;
    const balanceBefore = isDeposit ? runningBalance - amount : runningBalance + amount;

    transactions.push({
      id: `ET_TX_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      type: isDeposit ? ("deposit" as const) : ("withdrawal" as const),
      amount,
      balanceBefore: Math.round(balanceBefore * 100) / 100,
      balanceAfter: Math.round(runningBalance * 100) / 100,
      description: isDeposit ? "إيداع نقدي - اتصالات كاش" : "سحب نقدي - اتصالات كاش",
      timestamp: Date.now() - i * (120000 + Math.random() * 600000),
      reference: `ET${Date.now()}${i}${Math.floor(Math.random() * 9999)}`,
    });

    runningBalance = isDeposit ? runningBalance - amount : runningBalance + amount;
  }

  return {
    success: true,
    balance,
    availableBalance: Math.round(balance * 0.9 * 100) / 100,
    currency: "EGP",
    dailyLimit: 25000,
    monthlyLimit: 75000,
    dailyUsed: Math.round(Math.random() * 4000 * 100) / 100,
    monthlyUsed: Math.round(Math.random() * 15000 * 100) / 100,
    lastTransactions: transactions,
  };
}

// --- Orange Cash API Simulator ---
async function simulateOrangeLogin(phoneNumber: string, _password: string): Promise<LoginResponse> {
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

  if (!phoneNumber.match(/^012\d{8}$/)) {
    throw new Error("أورانج كاش: رقم الهاتف يجب أن يبدأ بـ 012 ويتكون من 11 رقم");
  }

  return {
    success: true,
    sessionId: `or_sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    token: `or_tkn_${Buffer.from(`${phoneNumber}:${Date.now()}`).toString("base64").substring(0, 24)}`,
    expiresIn: 5400,
    accountInfo: {
      name: `محفظة أورانج كاش - ${phoneNumber}`,
      phoneNumber,
      tier: "silver",
      dailyLimit: 20000,
      monthlyLimit: 60000,
    },
  };
}

async function simulateOrangeGetBalance(session: ProviderSession): Promise<BalanceResponse> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 350));

  const seed = parseInt(session.phoneNumber.slice(-5));
  const baseBalance = 2000 + (seed % 30000);
  const fluctuation = (Math.random() - 0.5) * 300;
  const balance = Math.max(100, Math.round((baseBalance + fluctuation) * 100) / 100);

  const txCount = Math.floor(Math.random() * 2);
  const transactions = [];
  let runningBalance = balance;

  for (let i = 0; i < txCount; i++) {
    const isDeposit = Math.random() > 0.45;
    const amount = Math.round((Math.random() * 1000 + 50) * 100) / 100;
    const balanceBefore = isDeposit ? runningBalance - amount : runningBalance + amount;

    transactions.push({
      id: `OR_TX_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      type: isDeposit ? ("deposit" as const) : ("withdrawal" as const),
      amount,
      balanceBefore: Math.round(balanceBefore * 100) / 100,
      balanceAfter: Math.round(runningBalance * 100) / 100,
      description: isDeposit ? "تحويل وارد - أورانج كاش" : "تحويل صادر - أورانج كاش",
      timestamp: Date.now() - i * (90000 + Math.random() * 450000),
      reference: `OR${Date.now()}${i}${Math.floor(Math.random() * 9999)}`,
    });

    runningBalance = isDeposit ? runningBalance - amount : runningBalance + amount;
  }

  return {
    success: true,
    balance,
    availableBalance: Math.round(balance * 0.92 * 100) / 100,
    currency: "EGP",
    dailyLimit: 20000,
    monthlyLimit: 60000,
    dailyUsed: Math.round(Math.random() * 3000 * 100) / 100,
    monthlyUsed: Math.round(Math.random() * 12000 * 100) / 100,
    lastTransactions: transactions,
  };
}

// ============================================================
// PUBLIC ACTION - تسجيل الدخول من الواجهة
// ============================================================

export const loginToProvider = action({
  args: {
    providerAccountId: v.id("providerAccounts"),
  },
  returns: v.object({
    success: v.boolean(),
    sessionId: v.optional(v.string()),
    token: v.optional(v.string()),
    expiresIn: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, { providerAccountId }) => {
    const account = await ctx.runQuery(internal.providerHelpers.getAccount, { accountId: providerAccountId });
    if (!account) return { success: false, error: "الحساب غير موجود" };

    try {
      let loginResult: LoginResponse;

      switch (account.provider) {
        case "vodafone":
          loginResult = await simulateVodafoneLogin(account.phoneNumber, account.apiPassword || "");
          break;
        case "etisalat":
          loginResult = await simulateEtisalatLogin(account.phoneNumber, account.apiPassword || "");
          break;
        case "orange":
          loginResult = await simulateOrangeLogin(account.phoneNumber, account.apiPassword || "");
          break;
        default:
          return { success: false, error: "مزود خدمة غير معروف" };
      }

      await ctx.runMutation(internal.providerHelpers.updateSession, {
        accountId: providerAccountId,
        sessionId: loginResult.sessionId,
        token: loginResult.token,
        expiresAt: Date.now() + loginResult.expiresIn * 1000,
        isConnected: true,
        lastSyncAt: Date.now(),
      });

      await ctx.runMutation(internal.providerHelpers.addSyncLog, {
        providerAccountId,
        type: "login",
        status: "success",
        message: `✅ تم تسجيل الدخول بنجاح - ${account.provider === "vodafone" ? "فودافون كاش" : account.provider === "etisalat" ? "اتصالات كاش" : "أورانج كاش"} (${account.phoneNumber})`,
        details: { expiresIn: loginResult.expiresIn, tier: loginResult.accountInfo.tier },
      });

      return {
        success: true,
        sessionId: loginResult.sessionId,
        token: loginResult.token,
        expiresIn: loginResult.expiresIn,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "خطأ في تسجيل الدخول";

      await ctx.runMutation(internal.providerHelpers.addSyncLog, {
        providerAccountId,
        type: "error",
        status: "failed",
        message: `❌ فشل تسجيل الدخول: ${errorMsg}`,
      });

      await ctx.runMutation(internal.providerHelpers.updateSession, {
        accountId: providerAccountId,
        isConnected: false,
        lastError: errorMsg,
      });

      return { success: false, error: errorMsg };
    }
  },
});

// ============================================================
// AUTO-REFRESH TOKEN - تجديد الجلسة تلقائياً
// ============================================================

export const refreshSessionIfNeeded = internalAction({
  args: {
    providerAccountId: v.id("providerAccounts"),
  },
  handler: async (ctx, { providerAccountId }): Promise<{ refreshed: boolean; error?: string }> => {
    const account = await ctx.runQuery(internal.providerHelpers.getAccount, { accountId: providerAccountId });
    if (!account) return { refreshed: false, error: "الحساب غير موجود" };

    const tenMinutes = 10 * 60 * 1000;
    const needsRefresh =
      !account.sessionId ||
      !account.sessionExpiresAt ||
      account.sessionExpiresAt < Date.now() + tenMinutes;

    if (!needsRefresh) return { refreshed: false };

    const result = await ctx.runAction(api.providerGateway.loginToProvider, { providerAccountId });

    if (result.success) {
      await ctx.runMutation(internal.providerHelpers.addSyncLog, {
        providerAccountId,
        type: "login",
        status: "success",
        message: `🔄 تم تجديد الجلسة تلقائياً - ${account.label}`,
      });
      return { refreshed: true };
    } else {
      await ctx.runMutation(internal.providerHelpers.createAdminAlert, {
        providerAccountId,
        alertType: "session_expired",
        message: `انتهت صلاحية جلسة ${account.label} (${account.phoneNumber}) ولم يتم تجديدها: ${result.error}`,
        severity: "critical",
      });
      return { refreshed: false, error: result.error };
    }
  },
});

// ============================================================
// BACKGROUND TRANSACTION WORKER - مزامنة محفظة واحدة
// ============================================================

export const syncWalletBalance = internalAction({
  args: {
    walletId: v.id("wallets"),
    providerAccountId: v.id("providerAccounts"),
  },
  handler: async (ctx, { walletId, providerAccountId }): Promise<{ synced: boolean; newTransactions: number; newBalance?: number; error?: string }> => {
    const wallet = await ctx.runQuery(api.wallets.get, { walletId });
    if (!wallet) return { synced: false, newTransactions: 0, error: "المحفظة غير موجودة" };

    const account = await ctx.runQuery(internal.providerHelpers.getAccount, { accountId: providerAccountId });
    if (!account || !account.isActive) return { synced: false, newTransactions: 0, error: "الحساب غير نشط" };

    const refreshResult = await ctx.runAction(internal.providerGateway.refreshSessionIfNeeded, { providerAccountId });
    if (refreshResult.error && !account.sessionId) {
      return { synced: false, newTransactions: 0, error: refreshResult.error };
    }

    const freshAccount = await ctx.runQuery(internal.providerHelpers.getAccount, { accountId: providerAccountId });
    if (!freshAccount?.sessionId) return { synced: false, newTransactions: 0, error: "لا توجد جلسة نشطة" };

    const session: ProviderSession = {
      sessionId: freshAccount.sessionId,
      token: freshAccount.apiToken || "",
      expiresAt: freshAccount.sessionExpiresAt || 0,
      phoneNumber: freshAccount.phoneNumber,
      provider: freshAccount.provider,
    };

    try {
      let balanceData: BalanceResponse;

      switch (freshAccount.provider) {
        case "vodafone":
          balanceData = await simulateVodafoneGetBalance(session);
          break;
        case "etisalat":
          balanceData = await simulateEtisalatGetBalance(session);
          break;
        case "orange":
          balanceData = await simulateOrangeGetBalance(session);
          break;
        default:
          return { synced: false, newTransactions: 0, error: "مزود غير معروف" };
      }

      let newTxCount = 0;

      for (const tx of balanceData.lastTransactions) {
        const existingTx = await ctx.runQuery(internal.providerHelpers.findTransactionByReference, {
          reference: tx.reference,
        });

        if (!existingTx) {
          await ctx.runMutation(internal.providerHelpers.createSyncedTransaction, {
            walletId,
            type: tx.type,
            amount: tx.amount,
            balanceBefore: tx.balanceBefore,
            balanceAfter: tx.balanceAfter,
            description: tx.description,
            reference: tx.reference,
            createdAt: tx.timestamp,
          });
          newTxCount++;
        }
      }

      await ctx.runMutation(internal.providerHelpers.updateWalletSyncStatus, {
        walletId,
        status: "connected",
        lastSyncAt: Date.now(),
        balance: balanceData.balance,
        dailyUsed: balanceData.dailyUsed,
        monthlyUsed: balanceData.monthlyUsed,
      });

      if (newTxCount > 0) {
        await ctx.runMutation(internal.providerHelpers.addSyncLog, {
          providerAccountId,
          walletId,
          type: "sync",
          status: "success",
          message: `📊 ${wallet.name}: ${newTxCount} حركة جديدة | الرصيد: ${balanceData.balance.toLocaleString("ar-EG")} ج.م`,
          details: { newTransactions: newTxCount, balance: balanceData.balance },
        });
      }

      return { synced: true, newTransactions: newTxCount, newBalance: balanceData.balance };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "خطأ في المزامنة";

      await ctx.runMutation(internal.providerHelpers.updateWalletSyncStatus, {
        walletId,
        status: "error",
        lastSyncAt: Date.now(),
      });

      await ctx.runMutation(internal.providerHelpers.addSyncLog, {
        providerAccountId,
        walletId,
        type: "error",
        status: "failed",
        message: `⚠️ خطأ في مزامنة ${wallet.name}: ${errorMsg}`,
      });

      return { synced: false, newTransactions: 0, error: errorMsg };
    }
  },
});

// ============================================================
// FULL SYNC ENGINE - المزامنة الشاملة لجميع المحافظ
// ============================================================

export const syncAllWallets = internalAction({
  args: {},
  handler: async (ctx): Promise<{ total: number; synced: number; failed: number; newTransactions: number; errors: string[] }> => {
    const accounts = await ctx.runQuery(internal.providerHelpers.listActiveAccounts);
    const errors: string[] = [];
    let synced = 0;
    let failed = 0;
    let totalNewTx = 0;

    for (const account of accounts) {
      try {
        const wallets = await ctx.runQuery(internal.providerHelpers.getWalletsByProvider, {
          provider: account.provider as "vodafone" | "etisalat" | "orange",
        });

        const activeWallets = wallets.filter((w) => w.isActive);

        for (const wallet of activeWallets) {
          const result = await ctx.runAction(internal.providerGateway.syncWalletBalance, {
            walletId: wallet._id,
            providerAccountId: account._id,
          });

          if (result.synced) {
            synced++;
            totalNewTx += result.newTransactions;
          } else {
            failed++;
            if (result.error) errors.push(`${wallet.name}: ${result.error}`);
          }

          await new Promise((r) => setTimeout(r, 200));
        }

        await ctx.runMutation(internal.providerHelpers.updateSession, {
          accountId: account._id,
          lastSyncAt: Date.now(),
        });
      } catch (error) {
        failed++;
        const msg = `${account.label}: ${error instanceof Error ? error.message : "خطأ غير معروف"}`;
        errors.push(msg);
      }
    }

    await ctx.runMutation(internal.providerHelpers.updateSystemStatus, {
      key: "lastFullSync",
      value: {
        timestamp: Date.now(),
        totalAccounts: accounts.length,
        synced,
        failed,
        newTransactions: totalNewTx,
        errors: errors.slice(0, 5),
      },
    });

    await ctx.runMutation(internal.providerHelpers.updateSystemStatus, {
      key: "workerStatus",
      value: { running: true, lastRun: Date.now(), nextRun: Date.now() + 30000 },
    });

    return { total: accounts.length, synced, failed, newTransactions: totalNewTx, errors };
  },
});

// ============================================================
// PUBLIC ACTION - مزامنة يدوية من الواجهة
// ============================================================

export const manualSyncAccount = action({
  args: {
    providerAccountId: v.id("providerAccounts"),
  },
  returns: v.object({
    success: v.boolean(),
    walletsSynced: v.number(),
    newTransactions: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { providerAccountId }) => {
    const account = await ctx.runQuery(internal.providerHelpers.getAccount, { accountId: providerAccountId });
    if (!account) return { success: false, walletsSynced: 0, newTransactions: 0, errors: ["الحساب غير موجود"] };

    const errors: string[] = [];
    let walletsSynced = 0;
    let totalNewTx = 0;

    const wallets = await ctx.runQuery(internal.providerHelpers.getWalletsByProvider, {
      provider: account.provider as "vodafone" | "etisalat" | "orange",
    });

    const activeWallets = wallets.filter((w) => w.isActive);

    for (const wallet of activeWallets) {
      const result = await ctx.runAction(internal.providerGateway.syncWalletBalance, {
        walletId: wallet._id,
        providerAccountId,
      });

      if (result.synced) {
        walletsSynced++;
        totalNewTx += result.newTransactions;
      } else if (result.error) {
        errors.push(result.error);
      }
    }

    await ctx.runMutation(internal.providerHelpers.addSyncLog, {
      providerAccountId,
      type: "sync",
      status: errors.length === 0 ? "success" : "failed",
      message: `🔄 مزامنة يدوية: ${walletsSynced} محفظة، ${totalNewTx} حركة جديدة`,
      details: { walletsSynced, totalNewTx, errors },
    });

    return {
      success: errors.length === 0,
      walletsSynced,
      newTransactions: totalNewTx,
      errors,
    };
  },
});
