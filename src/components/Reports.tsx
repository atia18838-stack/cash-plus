import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Reports() {
  const reports = useQuery(api.reports.list) || [];
  const createReport = useMutation(api.reports.create);
  const removeReport = useMutation(api.reports.remove);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const reportDetail = useQuery(
    api.reports.get,
    selectedReport ? { reportId: selectedReport as any } : "skip"
  );

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "daily" as "daily" | "weekly" | "monthly" | "custom",
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReport({
        title: form.title,
        type: form.type,
        dateRange: {
          from: new Date(form.from).getTime(),
          to: new Date(form.to).getTime(),
        },
      });
      toast.success("تم إنشاء التقرير بنجاح");
      setShowCreate(false);
      setForm({ title: "", type: "daily", from: "", to: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  const handleDelete = async (reportId: string) => {
    try {
      await removeReport({ reportId: reportId as any });
      toast.success("تم حذف التقرير");
      if (selectedReport === reportId) setSelectedReport(null);
    } catch (err) {
      toast.error("حدث خطأ");
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: "يومي",
      weekly: "أسبوعي",
      monthly: "شهري",
      custom: "مخصص",
    };
    return labels[type] || type;
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
          <h1 className="text-3xl font-bold text-gray-900">التقارير</h1>
          <p className="text-gray-500 mt-1">تقارير وإحصائيات متقدمة</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-l from-emerald-600 to-teal-600 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          تقرير جديد
        </motion.button>
      </motion.div>

      {/* Create Report Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إنشاء تقرير جديد</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">عنوان التقرير</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                placeholder="مثال: تقرير شهر مارس"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">النوع</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              >
                <option value="daily">يومي</option>
                <option value="weekly">أسبوعي</option>
                <option value="monthly">شهري</option>
                <option value="custom">مخصص</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">من تاريخ</label>
              <input
                type="date"
                required
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">إلى تاريخ</label>
              <input
                type="date"
                required
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
              />
            </div>
            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-l from-emerald-600 to-teal-600 shadow-lg hover:shadow-xl transition-all"
              >
                إنشاء
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-6 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">التقارير السابقة</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {reports.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  لا توجد تقارير بعد
                </div>
              ) : (
                reports.map((report, i) => (
                  <motion.button
                    key={report._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedReport(report._id)}
                    className={`w-full text-right p-4 hover:bg-gray-50 transition-colors ${
                      selectedReport === report._id ? "bg-emerald-50 border-r-2 border-emerald-500" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-900">{report.title}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(report._id); }}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {getTypeLabel(report.type)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(report.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Report Detail */}
        <div className="lg:col-span-2">
          {reportDetail ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-2">{reportDetail.title}</h2>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                  {getTypeLabel(reportDetail.type)}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(reportDetail.dateRange.from).toLocaleDateString("ar-EG")} - {new Date(reportDetail.dateRange.to).toLocaleDateString("ar-EG")}
                </span>
              </div>

              {reportDetail.data && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-emerald-600 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        إجمالي الإيداعات
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {reportDetail.data.summary?.totalDeposits?.toLocaleString("ar-EG") || 0} ج.م
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-amber-600 text-xs mb-1">
                        <TrendingDown className="w-3 h-3" />
                        إجمالي السحوبات
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {reportDetail.data.summary?.totalWithdrawals?.toLocaleString("ar-EG") || 0} ج.م
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-blue-600 text-xs mb-1">
                        <DollarSign className="w-3 h-3" />
                        صافي الربح
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {reportDetail.data.summary?.netProfit?.toLocaleString("ar-EG") || 0} ج.م
                      </p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-violet-600 text-xs mb-1">
                        <Activity className="w-3 h-3" />
                        عدد الحركات
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {reportDetail.data.summary?.totalTransactions || 0}
                      </p>
                    </div>
                  </div>

                  {/* By Wallet */}
                  {reportDetail.data.byWallet?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">حسب المحفظة</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">المحفظة</th>
                              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">الرصيد</th>
                              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">الإيداعات</th>
                              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">السحوبات</th>
                              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">الحركات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportDetail.data.byWallet.map((w: any, i: number) => (
                              <tr key={i} className="border-t border-gray-50">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{w.walletName}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{w.balance?.toLocaleString("ar-EG")} ج.م</td>
                                <td className="px-4 py-3 text-sm text-emerald-600">{w.deposits?.toLocaleString("ar-EG")} ج.م</td>
                                <td className="px-4 py-3 text-sm text-amber-600">{w.withdrawals?.toLocaleString("ar-EG")} ج.م</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{w.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Daily Breakdown */}
                  {reportDetail.data.dailyBreakdown?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">التوزيع اليومي</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">التاريخ</th>
                              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">الإيداعات</th>
                              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">السحوبات</th>
                              <th className="text-right px-4 py-2 text-xs font-semibold text-gray-600">الحركات</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportDetail.data.dailyBreakdown.map((d: any, i: number) => (
                              <tr key={i} className="border-t border-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">{d.date}</td>
                                <td className="px-4 py-3 text-sm text-emerald-600">{d.deposits?.toLocaleString("ar-EG")} ج.م</td>
                                <td className="px-4 py-3 text-sm text-amber-600">{d.withdrawals?.toLocaleString("ar-EG")} ج.م</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{d.count}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">اختر تقريراً</h3>
              <p className="text-gray-500">اختر تقريراً من القائمة لعرض التفاصيل</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
