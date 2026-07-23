import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cloud,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  Trash2,
  Smartphone,
  Phone,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  Zap,
  Server,
  Database,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const providerColors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
  vodafone: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    gradient: "from-red-500 to-rose-600",
  },
  etisalat: {
    bg: "bg-green-50",
    text: "text-green-600",
    border: "border-green-200",
    gradient: "from-green-500 to-emerald-600",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-200",
    gradient: "from-orange-500 to-amber-600",
  },
};

const providerNames: Record<string, string> = {
  vodafone: "فودافون كاش",
  etisalat: "اتصالات كاش",
  orange: "أورانج كاش",
};

export default function CloudGateway() {
  const accounts = useQuery(api.providerAccounts.list) || [];
  const syncLogs = useQuery(api.providerAccounts.getSyncLogs, { limit: 30 }) || [];
  const providerStats = useQuery(api.providerAccounts.getStats);
  const wallets = useQuery(api.wallets.list) || [];

  const addAccount = useMutation(api.providerAccounts.add);
  const removeAccount = useMutation(api.providerAccounts.remove);
  const updateAccount = useMutation(api.providerAccounts.update);
  const loginToProvider = useAction(api.apiGateway.loginToProvider);
  const runSyncCycle = useAction(api.apiGateway.runSyncCycle);

  const [showAdd, setShowAdd] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    provider: "vodafone" as "vodafone" | "etisalat" | "orange",
    label: "",
    phoneNumber: "",
    apiUsername: "",
    apiPassword: "",
    syncInterval: 30,
  });

  const resetForm = () => {
    setForm({ provider: "vodafone", label: "", phoneNumber: "", apiUsername: "", apiPassword: "", syncInterval: 30 });
    setShowAdd(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAccount({
        provider: form.provider,
        label: form.label || `${providerNames[form.provider]} - ${form.phoneNumber}`,
        phoneNumber: form.phoneNumber,
        apiUsername: form.apiUsername || undefined,
        apiPassword: form.apiPassword || undefined,
        syncInterval: form.syncInterval,
      });
      toast.success(`تم إضافة حساب ${providerNames[form.provider]}`);
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    }
  };

  const handleConnect = async (accountId: string) => {
    try {
      const account = accounts.find((a) => a._id === accountId);
      if (!account) return;

      const result = await loginToProvider({
        provider: account.provider as any,
        phoneNumber: account.phoneNumber,
        password: "simulated_password",
      });

      if (result.success) {
        toast.success(`تم الاتصال بـ ${providerNames[account.provider]}`);
      } else {
        toast.error(result.error || "فشل الاتصال");
      }
    } catch (err) {
      toast.error("فشل الاتصال بمزود الخدمة");
    }
  };

  const handleSync = async (accountId: string) => {
    setSyncingId(accountId);
    try {
      const result = await runSyncCycle({ accountId: accountId as any });
      if (result.success) {
        toast.success(`تمت المزامنة: ${result.walletsSynced} محفظة، ${result.transactionsFound} حركة`);
      } else {
        toast.error(`تمت المزامنة مع ${result.errors.length} أخطاء`);
        result.errors.forEach((err) => toast.error(err));
      }
    } catch (err) {
      toast.error("فشلت المزامنة");
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (accountId: string) => {
    try {
      await removeAccount({ accountId: accountId as any });
      toast.success("تم حذف الحساب");
    } catch (err) {
      toast.error("حدث خطأ");
    }
  };

  const getStatusIcon = (isConnected: boolean) => {
    return isConnected ? (
      <Wifi className="w-4 h-4 text-emerald-500" />
    ) : (
      <WifiOff className="w-4 h-4 text-gray-400" />
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
          <h1 className="text-3xl font-bold text-gray-900">البوابة السحابية</h1>
          <p className="text-gray-500 mt-1">Cloud API Gateway - ربط مباشر بمقدمي الخدمة</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-l from-violet-600 to-indigo-600 shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          إضافة حساب مزود
        </motion.button>
      </motion.div>

      {/* Provider Stats */}
      {providerStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100 p-4">
            <div className="flex items-center gap-2 text-violet-600 text-xs mb-1">
              <Server className="w-3 h-3" />
              إجمالي الحسابات
            </div>
            <p className="text-2xl font-bold text-gray-900">{providerStats.totalAccounts}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-4">
            <div className="flex items-center gap-2 text-emerald-600 text-xs mb-1">
              <Wifi className="w-3 h-3" />
              متصل
            </div>
            <p className="text-2xl font-bold text-gray-900">{providerStats.connectedAccounts}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-4">
            <div className="flex items-center gap-2 text-blue-600 text-xs mb-1">
              <Activity className="w-3 h-3" />
              إجمالي المزامنات
            </div>
            <p className="text-2xl font-bold text-gray-900">{providerStats.totalSyncs}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-4">
            <div className="flex items-center gap-2 text-amber-600 text-xs mb-1">
              <AlertTriangle className="w-3 h-3" />
              فاشلة
            </div>
            <p className="text-2xl font-bold text-gray-900">{providerStats.failedSyncs}</p>
          </div>
        </motion.div>
      )}

      {/* Add Account Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">إضافة حساب مزود خدمة جديد</h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">مزود الخدمة</label>
                <div className="flex gap-2">
                  {(["vodafone", "etisalat", "orange"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, provider: p })}
                      className={`flex-1 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        form.provider === p
                          ? `${providerColors[p].bg} ${providerColors[p].text} border-2 ${providerColors[p].border}`
                          : "bg-gray-50 text-gray-600 border-2 border-gray-200"
                      }`}
                    >
                      {providerNames[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم الحساب</label>
                <input
                  type="text"
                  required
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                  placeholder={`${providerNames[form.provider]} - رئيسي`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الهاتف</label>
                <input
                  type="text"
                  required
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المستخدم API</label>
                <input
                  type="text"
                  value={form.apiUsername}
                  onChange={(e) => setForm({ ...form, apiUsername: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                  placeholder="اختياري"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور API</label>
                <input
                  type="password"
                  value={form.apiPassword}
                  onChange={(e) => setForm({ ...form, apiPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                  placeholder="اختياري"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">فترة المزامنة (ثواني)</label>
                <input
                  type="number"
                  required
                  min={10}
                  value={form.syncInterval}
                  onChange={(e) => setForm({ ...form, syncInterval: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                />
              </div>
              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-l from-violet-600 to-indigo-600 shadow-lg hover:shadow-xl transition-all"
                >
                  إضافة
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
      </AnimatePresence>

      {/* Provider Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">حسابات مقدمي الخدمة</h2>
          {accounts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Cloud className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">لا توجد حسابات</h3>
              <p className="text-gray-500">أضف حساب مزود خدمة للبدء بالمزامنة التلقائية</p>
            </motion.div>
          ) : (
            accounts.map((account, i) => {
              const colors = providerColors[account.provider] || providerColors.vodafone;
              return (
                <motion.div
                  key={account._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className={`h-1.5 w-full bg-gradient-to-l ${colors.gradient}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${colors.bg}`}>
                          <Smartphone className={`w-5 h-5 ${colors.text}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{account.label}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                              {providerNames[account.provider]}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Phone className="w-3 h-3" />
                              {account.phoneNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(account.isConnected)}
                        <button
                          onClick={() => handleDelete(account._id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        account.isConnected
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {account.isConnected ? (
                          <><CheckCircle2 className="w-3 h-3" /> متصل</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> غير متصل</>
                        )}
                      </span>
                      {account.lastSyncAt && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          آخر مزامنة: {new Date(account.lastSyncAt).toLocaleTimeString("ar-EG")}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        كل {account.syncInterval} ثانية
                      </span>
                    </div>

                    {account.lastError && (
                      <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-rose-700">{account.lastError}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConnect(account._id)}
                        disabled={account.isConnected}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          account.isConnected
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-l from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-lg"
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        {account.isConnected ? "متصل" : "اتصال"}
                      </button>
                      <button
                        onClick={() => handleSync(account._id)}
                        disabled={syncingId === account._id || !account.isConnected}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          syncingId === account._id
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : account.isConnected
                            ? "bg-gradient-to-l from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <RefreshCw className={`w-4 h-4 ${syncingId === account._id ? "animate-spin" : ""}`} />
                        {syncingId === account._id ? "جارٍ المزامنة..." : "مزامنة"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Sync Logs */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">سجل المزامنة</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {syncLogs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Database className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">لا توجد سجلات مزامنة بعد</p>
                </div>
              ) : (
                syncLogs.map((log, i) => (
                  <motion.div
                    key={log._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg ${
                        log.status === "success" ? "bg-emerald-100" :
                        log.status === "failed" ? "bg-rose-100" : "bg-amber-100"
                      }`}>
                        {log.status === "success" ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : log.status === "failed" ? (
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            log.type === "login" ? "bg-blue-100 text-blue-700" :
                            log.type === "sync" ? "bg-emerald-100 text-emerald-700" :
                            log.type === "error" ? "bg-rose-100 text-rose-700" :
                            "bg-violet-100 text-violet-700"
                          }`}>
                            {log.type === "login" ? "دخول" :
                             log.type === "sync" ? "مزامنة" :
                             log.type === "error" ? "خطأ" : "حركة"}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(log.createdAt).toLocaleTimeString("ar-EG")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{log.message}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-3 mb-4">
          <Server className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold">حالة النظام السحابي</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">حالة البوابة</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
              <span className="text-sm font-medium">نشطة</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">آخر مزامنة كاملة</p>
            <p className="text-sm font-medium">
              {providerStats?.lastSyncAt
                ? new Date(providerStats.lastSyncAt).toLocaleTimeString("ar-EG")
                : "لم تتم بعد"}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">المحافظ المتصلة</p>
            <p className="text-sm font-medium">
              {wallets.filter((w) => w.lastSyncStatus === "connected").length} / {wallets.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">وضع التشغيل</p>
            <div className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm font-medium">Cloud-Based</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
