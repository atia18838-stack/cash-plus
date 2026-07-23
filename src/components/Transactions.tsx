import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  ArrowUpDown,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Download,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Transactions() {
  const [filter, setFilter] = useState<string>("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    walletId: "",
    type: "deposit" as "deposit" | "withdrawal",
    amount: 0,
    description: "",
  });

  const transactions = useQuery(api.transactions.list, {
    limit: 100,
    ...(filter !== "all" ? { status: filter as any } : {}),
  }) || [];
  const wallets = useQuery(api.wallets.list) || [];
  const addTransaction = useMutation(api.transactions.add);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.walletId) {
      toast.error("يرجى اختيار المحفظة");
      return;
    }
    try {
      await addTransaction({
        walletId: form.walletId as any,
        type: form.type,
        amount: form.amount,
        description: form.description || undefined,
      });
      toast.success("تم إضافة الحركة بنجاح");
      setShowAdd(false);
      setForm({ walletId: "", type: "deposit", amount: 0, description: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-emerald-100 text-emerald-700",
      pending: "bg-amber-100 text-amber-700",
      failed: "bg-rose-100 text-rose-700",
      cancelled: "bg-gray-100 text-gray-700",
    };
    const icons = {
      completed: CheckCircle2,
      pending: Clock,
      failed: XCircle,
      cancelled: XCircle,
    };
    const labels = {
      completed: "مكتملة",
      pending: "معلقة",
      failed: "فاشلة",
      cancelled: "ملغية",
    };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.pending}`}>
        <Icon className="w-3 h-3" />
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">الحركات المالية</h1>
          <p className="text-gray-500 mt-1">جميع حركات الإيداع والسحب</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-l from-emerald-600 to-teal-600 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          حركة جديدة
        </motion.button>
      </motion.div>

      {/* Add Transaction Form */}
      {showAdd && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إضافة حركة جديدة</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">المحفظة</label>
              <select
                required
                value={form.walletId}
                onChange={(e) => setForm({ ...form, walletId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              >
                <option value="">اختر المحفظة</option>
                {wallets.map((w) => (
                  <option key={w._id} value={w._id}>{w.name} - {w.phoneNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">النوع</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "deposit" })}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                    form.type === "deposit"
                      ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500"
                      : "bg-gray-50 text-gray-600 border-2 border-gray-200"
                  }`}
                >
                  إيداع
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "withdrawal" })}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${
                    form.type === "withdrawal"
                      ? "bg-amber-100 text-amber-700 border-2 border-amber-500"
                      : "bg-gray-50 text-gray-600 border-2 border-gray-200"
                  }`}
                >
                  سحب
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">المبلغ</label>
              <input
                type="number"
                required
                min={1}
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                placeholder="المبلغ بالجنيه"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                placeholder="وصف الحركة (اختياري)"
              />
            </div>
            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-l from-emerald-600 to-teal-600 shadow-lg hover:shadow-xl transition-all"
              >
                إضافة
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-6 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <Filter className="w-4 h-4 text-gray-400" />
        {[
          { id: "all", label: "الكل" },
          { id: "completed", label: "مكتملة" },
          { id: "pending", label: "معلقة" },
          { id: "failed", label: "فاشلة" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.id
                ? "bg-emerald-100 text-emerald-700 shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-b from-gray-50 to-gray-100">
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">النوع</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">المبلغ</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">الرصيد قبل</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">الرصيد بعد</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">الحالة</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">الوصف</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">المصدر</th>
                <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <ArrowUpDown className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">لا توجد حركات</p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx, i) => (
                  <motion.tr
                    key={tx._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        tx.type === "deposit" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {tx.type === "deposit" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
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
                    <td className="px-6 py-4 text-sm text-gray-500">{tx.balanceBefore.toLocaleString("ar-EG")}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{tx.balanceAfter.toLocaleString("ar-EG")}</td>
                    <td className="px-6 py-4">{getStatusBadge(tx.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tx.description || "—"}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-400">
                        {tx.source === "sms" ? "SMS" : tx.source === "manual" ? "يدوي" : "Webhook"}
                      </span>
                    </td>
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
