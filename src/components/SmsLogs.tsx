import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Smartphone,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

export default function SmsLogs() {
  const smsLogs = useQuery(api.sms.getSmsLogs, { limit: 50 }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">رسائل SMS</h1>
        <p className="text-gray-500 mt-1">سجل رسائل SMS الواردة من Android Gateway</p>
      </motion.div>

      {/* Webhook Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-100">
            <Smartphone className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Android Gateway Webhook</h3>
            <p className="text-sm text-gray-600 mb-3">
              قم بتوصيل تطبيق Android Gateway الخاص بك لإرسال رسائل SMS إلى هذا الرابط:
            </p>
            <div className="bg-white rounded-xl border border-emerald-200 p-3 text-sm font-mono text-gray-700 break-all">
              {window.location.origin}/sms/webhook
            </div>
            <p className="text-xs text-gray-400 mt-2">
              أرسل POST request مع {`{ "from": "رقم الهاتف", "message": "نص الرسالة" }`}
            </p>
          </div>
        </div>
      </motion.div>

      {/* SMS Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">سجل الرسائل</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {smsLogs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">لا توجد رسائل</h3>
              <p className="text-gray-500">انتظر وصول رسائل SMS</p>
            </div>
          ) : (
            smsLogs.map((log, i) => (
              <motion.div
                key={log._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    log.parsed ? "bg-emerald-100" : "bg-gray-100"
                  }`}>
                    {log.parsed
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      : <XCircle className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{log.from}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.parsed ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {log.parsed ? "تم التحليل" : "غير محلل"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1 line-clamp-2">{log.message}</p>
                    {log.parsedData && (
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs font-semibold ${
                          log.parsedData.type === "deposit" ? "text-emerald-600" : "text-amber-600"
                        }`}>
                          {log.parsedData.type === "deposit" ? "إيداع" : "سحب"}: {log.parsedData.amount} ج.م
                        </span>
                        <span className="text-xs text-gray-400">
                          الرصيد: {log.parsedData.balance} ج.م
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(log.createdAt).toLocaleDateString("ar-EG", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
