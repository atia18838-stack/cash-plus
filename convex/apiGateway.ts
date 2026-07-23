"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// ============================================================
// محرك API Gateway السحابي - محاكاة ذكية لمقدمي الخدمة
// ============================================================

interface ProviderSession {
  sessionId: string;
  token: string;
  expiresAt: number;
  accountId: string;
  phoneNumber: string;
}

interface BalanceResponse {
  success: boolean;
  balance: number;
  availableBalance: number;
  currency: string;
  lastTransactions: Array<{
    id: string;
    type: "deposit" | "withdrawal" | "transfer" | "payment";
    amount: number;
    balanceAfter: number;
    description: string;
    timestamp: number;
  }>;
}

interface LoginResponse {
  success: boolean;
  sessionId: string;
  token: string;
  expiresIn: number;
  accountName: string;
  phoneNumber: string;
}

// ============================================================
// Vodafone Cash API Simulator
// ============================================================
class VodafoneCashAPI {
  private sessions: Map<string, ProviderSession> = new Map();

  async login(phoneNumber: string, _password: string): Promise<LoginResponse> {
    await this.delay(800, 1500);
    if (!phoneNumber.startsWith("010") || phoneNumber.length !== 11) {
      throw new Error("Vodafone Cash: رقم الهاتف غير صحيح");
    }
    const sessionId = `vf_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const token = `vf_token_${Math.random().toString(36).substring(2, 20)}`;
    const expiresAt = Date.now() + 30 * 60 * 1000;
    this.sessions.set(sessionId, { sessionId, token, expiresAt, accountId: `VF_${phoneNumber}`, phoneNumber });
    return { success: true, sessionId, token, expiresIn: 1800, accountName: `محفظة فودافون كاش - ${phoneNumber}`, phoneNumber };
  }

  async getBalance(sessionId: string): Promise<BalanceResponse> {
    const session = this.sessions.get(sessionId);
    if (!session || session.expiresAt < Date.now()) throw new Error("Vodafone Cash: الجلسة منتهية");
    await this.delay(400, 800);
    const baseBalance = 5000 + (parseInt(session.phoneNumber.slice(-4)) % 9000) + Math.random() * 5000;
    const fluctuation = Math.round((Math.random() - 0.5) * 200 * 100) / 100;
    const currentBalance = Math.max(0, Math.round((baseBalance + fluctuation) * 100) / 100);
    const txCount = Math.floor(Math.random() * 3);
    const transactions = [];
    for (let i = 0; i < txCount; i++) {
      const isDeposit = Math.random() > 0.4;
      const amount = Math.round((Math.random() * 500 + 20) * 100) / 100;
      transactions.push({
        id: `VF_TX_${Date.now()}_${i}`,
        type: (isDeposit ? "deposit" : "withdrawal") as "deposit" | "withdrawal",
        amount,
        balanceAfter: isDeposit ? currentBalance + amount : currentBalance - amount,
        description: isDeposit ? "إيداع عبر فودافون كاش" : "سحب عبر فودافون كاش",
        timestamp: Date.now() - Math.floor(Math.random() * 3600000),
      });
    }
    return { success: true, balance: currentBalance, availableBalance: currentBalance, currency: "EGP", lastTransactions: transactions };
  }

  async refreshSession(sessionId: string): Promise<LoginResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Vodafone Cash: جلسة غير موجودة");
    const newSessionId = `vf_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const newToken = `vf_token_${Math.random().toString(36).substring(2, 20)}`;
    const expiresAt = Date.now() + 30 * 60 * 1000;
    this.sessions.delete(sessionId);
    this.sessions.set(newSessionId, { ...session, sessionId: newSessionId, token: newToken, expiresAt });
    return { success: true, sessionId: newSessionId, token: newToken, expiresIn: 1800, accountName: `محفظة فودافون كاش - ${session.phoneNumber}`, phoneNumber: session.phoneNumber };
  }

  private delay(min: number, max: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
  }
}

// ============================================================
// Etisalat Cash API Simulator
// ============================================================
class EtisalatCashAPI {
  private sessions: Map<string, ProviderSession> = new Map();

  async login(phoneNumber: string, _password: string): Promise<LoginResponse> {
    await this.delay(1000, 2000);
    if (!phoneNumber.startsWith("011") || phoneNumber.length !== 11) throw new Error("Etisalat Cash: رقم الهاتف غير صحيح");
    const sessionId = `et_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const token = `et_token_${Math.random().toString(36).substring(2, 20)}`;
    const expiresAt = Date.now() + 25 * 60 * 1000;
    this.sessions.set(sessionId, { sessionId, token, expiresAt, accountId: `ET_${phoneNumber}`, phoneNumber });
    return { success: true, sessionId, token, expiresIn: 1500, accountName: `محفظة اتصالات كاش - ${phoneNumber}`, phoneNumber };
  }

  async getBalance(sessionId: string): Promise<BalanceResponse> {
    const session = this.sessions.get(sessionId);
    if (!session || session.expiresAt < Date.now()) throw new Error("Etisalat Cash: الجلسة منتهية");
    await this.delay(500, 1000);
    const baseBalance = 2000 + (parseInt(session.phoneNumber.slice(-4)) % 8000);
    const fluctuation = Math.round((Math.random() - 0.5) * 150 * 100) / 100;
    const currentBalance = Math.max(0, Math.round((baseBalance + fluctuation) * 100) / 100);
    const txCount = Math.floor(Math.random() * 2);
    const transactions = [];
    for (let i = 0; i < txCount; i++) {
      const isDeposit = Math.random() > 0.5;
      const amount = Math.round((Math.random() * 300 + 10) * 100) / 100;
      transactions.push({
        id: `ET_TX_${Date.now()}_${i}`,
        type: (isDeposit ? "deposit" : "withdrawal") as "deposit" | "withdrawal",
        amount,
        balanceAfter: isDeposit ? currentBalance + amount : currentBalance - amount,
        description: isDeposit ? "إيداع عبر اتصالات كاش" : "سحب عبر اتصالات كاش",
        timestamp: Date.now() - Math.floor(Math.random() * 7200000),
      });
    }
    return { success: true, balance: currentBalance, availableBalance: Math.round(currentBalance * 0.98 * 100) / 100, currency: "EGP", lastTransactions: transactions };
  }

  async refreshSession(sessionId: string): Promise<LoginResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Etisalat Cash: جلسة غير موجودة");
    const newSessionId = `et_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const newToken = `et_token_${Math.random().toString(36).substring(2, 20)}`;
    const expiresAt = Date.now() + 25 * 60 * 1000;
    this.sessions.delete(sessionId);
    this.sessions.set(newSessionId, { ...session, sessionId: newSessionId, token: newToken, expiresAt });
    return { success: true, sessionId: newSessionId, token: newToken, expiresIn: 1500, accountName: `محفظة اتصالات كاش - ${session.phoneNumber}`, phoneNumber: session.phoneNumber };
  }

  private delay(min: number, max: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
  }
}

// ============================================================
// Orange Cash API Simulator
// ============================================================
class OrangeCashAPI {
  private sessions: Map<string, ProviderSession> = new Map();

  async login(phoneNumber: string, _password: string): Promise<LoginResponse> {
    await this.delay(1200, 2200);
    if (!phoneNumber.startsWith("012") || phoneNumber.length !== 11) throw new Error("Orange Cash: رقم الهاتف غير صحيح");
    const sessionId = `or_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const token = `or_token_${Math.random().toString(36).substring(2, 20)}`;
    const expiresAt = Date.now() + 20 * 60 * 1000;
    this.sessions.set(sessionId, { sessionId, token, expiresAt, accountId: `OR_${phoneNumber}`, phoneNumber });
    return { success: true, sessionId, token, expiresIn: 1200, accountName: `محفظة أورانج كاش - ${phoneNumber}`, phoneNumber };
  }

  async getBalance(sessionId: string): Promise<BalanceResponse> {
    const session = this.sessions.get(sessionId);
    if (!session || session.expiresAt < Date.now()) throw new Error("Orange Cash: الجلسة منتهية");
    await this.delay(600, 1200);
    const baseBalance = 1500 + (parseInt(session.phoneNumber.slice(-5)) % 7000);
    const fluctuation = Math.round((Math.random() - 0.5) * 300 * 100) / 100;
    const currentBalance = Math.max(0, Math.round((baseBalance + fluctuation) * 100) / 100);
    const txCount = Math.floor(Math.random() * 4);
    const transactions = [];
    for (let i = 0; i < txCount; i++) {
      const isDeposit = Math.random() > 0.35;
      const amount = Math.round((Math.random() * 1000 + 50) * 100) / 100;
      transactions.push({
        id: `OR_TX_${Date.now()}_${i}`,
        type: (isDeposit ? "deposit" : "withdrawal") as "deposit" | "withdrawal",
        amount,
        balanceAfter: isDeposit ? currentBalance + amount : currentBalance - amount,
        description: isDeposit ? "إيداع عبر أورانج كاش" : "سحب عبر أورانج كاش",
        timestamp: Date.now() - Math.floor(Math.random() * 5400000),
      });
    }
    return { success: true, balance: currentBalance, availableBalance: currentBalance, currency: "EGP", lastTransactions: transactions };
  }

  async refreshSession(sessionId: string): Promise<LoginResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("Orange Cash: جلسة غير موجودة");
    const newSessionId = `or_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const newToken = `or_token_${Math.random().toString(36).substring(2, 20)}`;
    const expiresAt = Date.now() + 20 * 60 * 1000;
    this.sessions.delete(sessionId);
    this.sessions.set(newSessionId, { ...session, sessionId: newSessionId, token: newToken, expiresAt });
    return { success: true, sessionId: newSessionId, token: newToken, expiresIn: 1200, accountName: `محفظة أورانج كاش - ${session.phoneNumber}`, phoneNumber: session.phoneNumber };
  }

  private delay(min: number, max: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));
  }
}

// ============================================================
// المصنّع الرئيسي - بدون تعارض مع اسم api
// ============================================================
const providerInstances: Record<string, VodafoneCashAPI | EtisalatCashAPI | OrangeCashAPI> = {
  vodafone: new VodafoneCashAPI(),
  etisalat: new EtisalatCashAPI(),
  orange: new OrangeCashAPI(),
};

function getProviderInstance(provider: string) {
  const p = providerInstances[provider];
  if (!p) throw new Error(`مزود الخدمة "${provider}" غير مدعوم`);
  return p;
}

// ============================================================
// تسجيل الدخول إلى مزود الخدمة
// ============================================================
export const loginToProvider = action({
  args: {
    provider: v.union(v.literal("vodafone"), v.literal("etisalat"), v.literal("orange")),
    phoneNumber: v.string(),
    password: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    sessionId: v.optional(v.string()),
    token: v.optional(v.string()),
    expiresIn: v.optional(v.number()),
    accountName: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const providerApi = getProviderInstance(args.provider);
      const result = await providerApi.login(args.phoneNumber, args.password);

      const providerAccount = await ctx.runQuery(api.providerAccounts.getByPhone, {
        provider: args.provider,
        phoneNumber: args.phoneNumber,
      });

      if (providerAccount) {
        await ctx.runMutation(api.providerAccounts.updateSession, {
          accountId: providerAccount._id,
          sessionId: result.sessionId,
          token: result.token,
          sessionExpiresAt: Date.now() + result.expiresIn * 1000,
          isConnected: true,
          lastSyncAt: Date.now(),
          lastError: undefined,
        });
      }

      return { success: true, sessionId: result.sessionId, token: result.token, expiresIn: result.expiresIn, accountName: result.accountName };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "فشل الاتصال بمزود الخدمة" };
    }
  },
});

// ============================================================
// جلب الرصيد من مزود الخدمة
// ============================================================
export const fetchBalance = action({
  args: {
    provider: v.union(v.literal("vodafone"), v.literal("etisalat"), v.literal("orange")),
    sessionId: v.string(),
    walletId: v.id("wallets"),
  },
  returns: v.object({
    success: v.boolean(),
    balance: v.optional(v.number()),
    transactions: v.optional(v.array(v.object({
      id: v.string(),
      type: v.string(),
      amount: v.number(),
      balanceAfter: v.number(),
      description: v.string(),
      timestamp: v.number(),
    }))),
    error: v.optional(v.string()),
    needsReLogin: v.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      const providerApi = getProviderInstance(args.provider);
      const result = await providerApi.getBalance(args.sessionId);

      const wallet = await ctx.runQuery(api.wallets.get, { walletId: args.walletId });
      if (wallet) {
        const balanceDiff = Math.round((result.balance - wallet.balance) * 100) / 100;
        if (Math.abs(balanceDiff) > 0.01) {
          const type = balanceDiff > 0 ? "deposit" : "withdrawal";
          const amount = Math.abs(balanceDiff);
          await ctx.runMutation(api.transactions.addAutoSync, {
            walletId: args.walletId,
            type: type as "deposit" | "withdrawal",
            amount,
            description: `تحديث تلقائي - ${args.provider === "vodafone" ? "فودافون" : args.provider === "etisalat" ? "اتصالات" : "أورانج"} كاش`,
            balanceBefore: wallet.balance,
            balanceAfter: result.balance,
          });
        }
        await ctx.runMutation(api.wallets.update, {
          walletId: args.walletId,
          balance: result.balance,
          lastSyncStatus: "connected",
          lastSyncAt: Date.now(),
        });
      }

      return {
        success: true,
        balance: result.balance,
        transactions: result.lastTransactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          balanceAfter: tx.balanceAfter,
          description: tx.description,
          timestamp: tx.timestamp,
        })),
        needsReLogin: false,
      };
    } catch (error) {
      const isSessionExpired = error instanceof Error && (error.message.includes("منتهية") || error.message.includes("غير موجودة"));
      return { success: false, error: error instanceof Error ? error.message : "فشل جلب الرصيد", needsReLogin: isSessionExpired };
    }
  },
});

// ============================================================
// تجديد الجلسة
// ============================================================
export const refreshSession = action({
  args: {
    provider: v.union(v.literal("vodafone"), v.literal("etisalat"), v.literal("orange")),
    sessionId: v.string(),
    accountId: v.id("providerAccounts"),
  },
  returns: v.object({
    success: v.boolean(),
    sessionId: v.optional(v.string()),
    token: v.optional(v.string()),
    expiresIn: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const providerApi = getProviderInstance(args.provider);
      const result = await providerApi.refreshSession(args.sessionId);
      await ctx.runMutation(api.providerAccounts.updateSession, {
        accountId: args.accountId,
        sessionId: result.sessionId,
        token: result.token,
        sessionExpiresAt: Date.now() + result.expiresIn * 1000,
        isConnected: true,
      });
      return { success: true, sessionId: result.sessionId, token: result.token, expiresIn: result.expiresIn };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "فشل تجديد الجلسة" };
    }
  },
});

// ============================================================
// دورة المزامنة الكاملة لحساب مزود خدمة
// ============================================================
export const runSyncCycle = action({
  args: {
    accountId: v.id("providerAccounts"),
  },
  returns: v.object({
    success: v.boolean(),
    walletsSynced: v.number(),
    transactionsFound: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const errors: string[] = [];
    let walletsSynced = 0;
    let transactionsFound = 0;

    try {
      const account = await ctx.runQuery(api.providerAccounts.get, { accountId: args.accountId });
      if (!account) throw new Error("حساب مزود الخدمة غير موجود");
      if (!account.isConnected || !account.sessionId) throw new Error("الحساب غير متصل");

      if (account.sessionExpiresAt && account.sessionExpiresAt < Date.now()) {
        const refreshResult = await ctx.runAction(api.apiGateway.refreshSession, {
          provider: account.provider as "vodafone" | "etisalat" | "orange",
          sessionId: account.sessionId,
          accountId: args.accountId,
        });
        if (!refreshResult.success || !refreshResult.sessionId) {
          throw new Error("فشل تجديد الجلسة: " + (refreshResult.error || ""));
        }
        account.sessionId = refreshResult.sessionId;
      }

      const wallets = await ctx.runQuery(api.wallets.listByProvider, {
        provider: account.provider as "vodafone" | "etisalat" | "orange",
        phoneNumber: account.phoneNumber,
      });

      for (const wallet of wallets) {
        if (!wallet.isActive) continue;
        try {
          const balanceResult = await ctx.runAction(api.apiGateway.fetchBalance, {
            provider: account.provider as "vodafone" | "etisalat" | "orange",
            sessionId: account.sessionId!,
            walletId: wallet._id,
          });
          if (balanceResult.success) {
            walletsSynced++;
            if (balanceResult.transactions) transactionsFound += balanceResult.transactions.length;
          } else if (balanceResult.needsReLogin) {
            errors.push(`المحفظة ${wallet.name}: الجلسة منتهية`);
          } else {
            errors.push(`المحفظة ${wallet.name}: ${balanceResult.error}`);
          }
        } catch (err) {
          errors.push(`المحفظة ${wallet.name}: ${err instanceof Error ? err.message : "خطأ غير معروف"}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      await ctx.runMutation(api.providerAccounts.addSyncLog, {
        providerAccountId: args.accountId,
        type: "sync",
        status: errors.length > 0 ? "failed" : "success",
        message: `تمت مزامنة ${walletsSynced} محفظة، العثور على ${transactionsFound} حركة جديدة`,
        details: { walletsSynced, transactionsFound, errors },
      });

      return { success: errors.length === 0, walletsSynced, transactionsFound, errors };
    } catch (error) {
      const msg = error instanceof Error ? error.message : "خطأ غير معروف";
      errors.push(msg);
      await ctx.runMutation(api.providerAccounts.addSyncLog, {
        providerAccountId: args.accountId,
        type: "error",
        status: "failed",
        message: msg,
      });
      return { success: false, walletsSynced, transactionsFound, errors };
    }
  },
});
