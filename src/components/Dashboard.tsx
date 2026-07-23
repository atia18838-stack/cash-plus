import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import StatCard from "./StatCard";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

export default function Dashboard() {
  const walletsStats = useQuery(api.wallets.getStats);
  const txStats = useQuery(api.transactions.getStats, { days: 30 });
  const wallets = useQuery(api.wallets.list) || [];
  const transactions = useQuery(api.transactions.list, { limit: 10 }) || [];

  if (!walletsStats || !txStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  // بيانات الرسم البياني (آخر 7 أيام)
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split("T")[0];
    const dayTx = transactions.filter((t) => {
      const txDate = new Date(t.createdAt).toISOString().split("T")[0];
      return txDate === dateStr;
    });
    return {
      name: date.toLocaleDateString("ar-EG", { weekday: "short" }),
      إيداع: dayTx.filter((t) => t.type === "deposit").reduce((s, t) => s + t.amount, 0),
      سحب: dayTx.filter((t) => t.type === "withdrawal").reduce((s, t) => s + t.amount, 0),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">نظرة عامة على جميع المحافظ والحركات</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الأرصدة"
          value={`${walletsStats.totalBalance.toLocaleString("ar-EG")} ج.م`}
          subtitle={`${walletsStats.activeWallets} محفظة نشطة`}
          icon={Wallet}
          color="emerald"
          delay={0}
        />
        <StatCard
          title="إجمالي الإيداعات"
          value={`${txStats.totalDeposits.toLocaleString("ar-EG")} ج.م`}
          subtitle={`آخر 30 يوم`}
          icon={TrendingUp}
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="إجمالي السحوبات"
          value={`${txStats.totalWithdrawals.toLocaleString("ar-EG")} ج.م`}
          subtitle={`آخر 30 يوم`}
          icon={TrendingDown}
          color="amber"
          delay={0.2}
        />
        <StatCard
          title="صافي الأرباح"
          value={`${txStats.todayProfit.toLocaleString("ar-EG")} ج.م`}
          subtitle="اليوم"
          icon={DollarSign}
          color="violet"
          delay={0.3}
        />
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="إيداعات اليوم"
          value={`${txStats.todayDeposits.toLocaleString("ar-EG")} ج.م`}
          icon={ArrowUpRight}
          color="emerald"
          delay={0.15}
        />
        <StatCard
          title="سحوبات اليوم"
          value={`${txStats.todayWithdrawals.toLocaleString("ar-EG")} ج.م`}
          icon={ArrowDownRight}
          color="rose"
          delay={0.25}
        />
        <StatCard
          title="حالة الحركات"
          value={`${txStats.completedCount} مكتملة`}
          subtitle={`${txStats.pendingCount} معلقة · ${txStats.failedCount} فاشلة`}
          icon={Activity}
          color="blue"
          delay={0.35}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">الحركات اليومية</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                />
                <Bar dataKey="إيداع" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="سحب" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">توزيع المحافظ</h3>
          <div className="space-y-4">
            {wallets.slice(0, 5).map((wallet, i) => {
              const maxBalance = Math.max(...wallets.map((w) => w.balance));
              const percentage = maxBalance > 0 ? (wallet.balance / maxBalance) * 100 : 0;
              return (
                <motion.div
                  key={wallet._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="space-y-1"
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{wallet.name}</span>
                    <span className="text-gray-500">{wallet.balance.toLocaleString("ar-EG")} ج.م</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.2 + 0.1 * i, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-500"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">آخر الحركات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-b from-gray-50 to-gray-100">
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">النوع</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">المبلغ</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">الحالة</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">الوصف</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    لا توجد حركات حتى الآن
                  </td>
                </tr>
              ) : (
                transactions.map((tx, i) => (
                  <motion.tr
                    key={tx._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        tx.type === "deposit"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {tx.type === "deposit" ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        {tx.type === "deposit" ? "إيداع" : "سحب"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${
                        tx.type === "deposit" ? "text-emerald-600" : "text-amber-600"
                      }`}>
                        {tx.amount.toLocaleString("ar-EG")} ج.م
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        tx.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                        tx.status === "pending" ? "bg-amber-100 text-amber-700" :
                        tx.status === "failed" ? "bg-rose-100 text-rose-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {tx.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                        {tx.status === "pending" && <Clock className="w-3 h-3" />}
                        {tx.status === "failed" && <XCircle className="w-3 h-3" />}
                        {tx.status === "completed" ? "مكتملة" :
                         tx.status === "pending" ? "معلقة" :
                         tx.status === "failed" ? "فاشلة" : "ملغية"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tx.description || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString("ar-EG", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
