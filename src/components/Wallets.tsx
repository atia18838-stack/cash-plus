import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  Wallet,
  Plus,
  Phone,
  TrendingUp,
  TrendingDown,
  Activity,
  MoreHorizontal,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Target,
  CalendarDays,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Wallets() {
  const wallets = useQuery(api.wallets.list) || [];
  const addWallet = useMutation(api.wallets.add);
  const updateWallet = useMutation(api.wallets.update);
  const removeWallet = useMutation(api.wallets.remove);

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    balance: 0,
    monthlyLimit: 100000,
    dailyLimit: 30000,
  });

  const resetForm = () => {
    setForm({ name: "", phoneNumber: "", balance: 0, monthlyLimit: 100000, dailyLimit: 30000 });
    setShowAdd(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateWallet({ walletId: editingId as any, ...form });
        toast.success("تم تحديث المحفظة بنجاح");
      } else {
        await addWallet(form);
        toast.success("تم إضافة المحفظة بنجاح");
      }
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  const handleToggle = async (walletId: string, isActive: boolean) => {
    try {
      await updateWallet({ walletId: walletId as any, isActive: !isActive });
      toast.success(isActive ? "تم تعطيل المحفظة" : "تم تفعيل المحفظة");
    } catch (err) {
      toast.error("حدث خطأ");
    }
  };

  const handleDelete = async (walletId: string) => {
    try {
      await removeWallet({ walletId: walletId as any });
      toast.success("تم حذف المحفظة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
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
          <h1 className="text-3xl font-bold text-gray-900">المحافظ</h1>
          <p className="text-gray-500 mt-1">إدارة محافظ فودافون كاش</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-l from-emerald-600 to-teal-600 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          إضافة محفظة
        </motion.button>
      </motion.div>

      {/* Add/Edit Form */}
      {(showAdd || editingId) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? "تعديل المحفظة" : "إضافة محفظة جديدة"}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المحفظة</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                placeholder="مثال: محفظة رئيسية"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الهاتف</label>
              <input
                type="text"
                required
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الرصيد الحالي</label>
              <input
                type="number"
                required
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الحد الشهري</label>
              <input
                type="number"
                required
                value={form.monthlyLimit}
                onChange={(e) => setForm({ ...form, monthlyLimit: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الحد اليومي</label>
              <input
                type="number"
                required
                value={form.dailyLimit}
                onChange={(e) => setForm({ ...form, dailyLimit: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>
            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-l from-emerald-600 to-teal-600 shadow-lg hover:shadow-xl transition-all"
              >
                {editingId ? "تحديث" : "إضافة"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">لا توجد محافظ</h3>
            <p className="text-gray-500">أضف محفظتك الأولى للبدء</p>
          </div>
        ) : (
          wallets.map((wallet, i) => {
            const dailyPercent = wallet.dailyLimit > 0 ? (wallet.dailyUsed / wallet.dailyLimit) * 100 : 0;
            const monthlyPercent = wallet.monthlyLimit > 0 ? (wallet.monthlyUsed / wallet.monthlyLimit) * 100 : 0;

            return (
              <motion.div
                key={wallet._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className={`relative overflow-hidden rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all ${
                  wallet.isActive
                    ? "bg-white border-gray-100"
                    : "bg-gray-50 border-gray-200 opacity-75"
                }`}
              >
                {/* Status indicator */}
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  wallet.isActive ? "bg-emerald-500" : "bg-gray-300"
                }`} />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${
                        wallet.isActive ? "bg-emerald-100" : "bg-gray-100"
                      }`}>
                        <Wallet className={`w-5 h-5 ${
                          wallet.isActive ? "text-emerald-600" : "text-gray-400"
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{wallet.name}</h3>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {wallet.phoneNumber}
                        </div>
                      </div>
                    </div>
                    <div className="relative group">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                      <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => { setEditingId(wallet._id); setForm({
                            name: wallet.name,
                            phoneNumber: wallet.phoneNumber,
                            balance: wallet.balance,
                            monthlyLimit: wallet.monthlyLimit,
                            dailyLimit: wallet.dailyLimit,
                          }); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          تعديل
                        </button>
                        <button
                          onClick={() => handleToggle(wallet._id, wallet.isActive)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {wallet.isActive ? <ToggleLeft className="w-3.5 h-3.5" /> : <ToggleRight className="w-3.5 h-3.5" />}
                          {wallet.isActive ? "تعطيل" : "تفعيل"}
                        </button>
                        <button
                          onClick={() => handleDelete(wallet._id)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">الرصيد الحالي</p>
                    <p className={`text-2xl font-bold ${wallet.isActive ? "text-gray-900" : "text-gray-400"}`}>
                      {wallet.balance.toLocaleString("ar-EG")} <span className="text-sm font-normal text-gray-400">ج.م</span>
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-emerald-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-emerald-600 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        إيداعات
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {wallet.totalDeposits.toLocaleString("ar-EG")} ج.م
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 text-amber-600 text-xs mb-1">
                        <TrendingDown className="w-3 h-3" />
                        سحوبات
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {wallet.totalWithdrawals.toLocaleString("ar-EG")} ج.م
                      </p>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 text-gray-500">
                          <CalendarDays className="w-3 h-3" />
                          الحد اليومي
                        </span>
                        <span className="text-gray-700 font-medium">
                          {wallet.dailyUsed.toLocaleString("ar-EG")} / {wallet.dailyLimit.toLocaleString("ar-EG")}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(dailyPercent, 100)}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                          className={`h-full rounded-full ${
                            dailyPercent > 80 ? "bg-rose-500" : dailyPercent > 50 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1 text-gray-500">
                          <Target className="w-3 h-3" />
                          الحد الشهري
                        </span>
                        <span className="text-gray-700 font-medium">
                          {wallet.monthlyUsed.toLocaleString("ar-EG")} / {wallet.monthlyLimit.toLocaleString("ar-EG")}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(monthlyPercent, 100)}%` }}
                          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                          className={`h-full rounded-full ${
                            monthlyPercent > 80 ? "bg-rose-500" : monthlyPercent > 50 ? "bg-amber-500" : "bg-blue-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
