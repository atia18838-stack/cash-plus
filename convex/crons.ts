import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ============================================================
// BACKGROUND WORKER - دورة المزامنة التلقائية كل 30 ثانية
// ============================================================
crons.interval(
  "auto-sync-all-wallets",
  { seconds: 30 },
  internal.providerGateway.syncAllWallets,
  {}
);

// ============================================================
// SESSION HEALTH CHECK - فحص صحة الجلسات كل 5 دقائق
// ============================================================
crons.interval(
  "session-health-check",
  { minutes: 5 },
  internal.cronJobs.checkAllSessions,
  {}
);

// ============================================================
// DAILY RESET - إعادة تعيين الحدود اليومية كل منتصف ليل
// ============================================================
crons.cron(
  "daily-limits-reset",
  "0 0 * * *",
  internal.cronJobs.resetDailyLimits,
  {}
);

export default crons;
