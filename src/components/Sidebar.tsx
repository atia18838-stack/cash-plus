import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  ArrowUpDown,
  FileText,
  MessageSquare,
  LogOut,
  ChevronLeft,
  WalletCards,
  Cloud,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  onSignOut: () => void;
}

const tabs = [
  { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { id: "wallets", label: "المحافظ", icon: Wallet },
  { id: "transactions", label: "الحركات", icon: ArrowUpDown },
  { id: "cloud", label: "البوابة السحابية", icon: Cloud },
  { id: "sms", label: "رسائل SMS", icon: MessageSquare },
  { id: "reports", label: "التقارير", icon: FileText },
];

export default function Sidebar({ activeTab, onTabChange, collapsed, onToggle, onSignOut }: SidebarProps) {
  return (
    <motion.aside
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed right-0 top-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white z-50 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
          <WalletCards className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h1 className="text-lg font-bold text-white">كاش بلس</h1>
            <p className="text-xs text-emerald-300">إدارة المحافظ</p>
          </motion.div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -left-3 top-20 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors"
      >
        <ChevronLeft className={`w-3 h-3 text-white transition-transform ${collapsed ? "rotate-180" : ""}`} />
      </button>

      {/* Navigation */}
      <nav className="p-3 space-y-1 mt-4">
        {tabs.map((tab, i) => (
          <motion.button
            key={tab.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
              activeTab === tab.id
                ? "bg-gradient-to-l from-emerald-500/20 to-teal-500/10 text-emerald-300 border border-emerald-500/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-emerald-400" : ""}`} />
            {!collapsed && (
              <span className="text-sm font-medium">{tab.label}</span>
            )}
          </motion.button>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="absolute bottom-4 right-3 left-3 space-y-1">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">تسجيل الخروج</span>}
        </button>
      </div>
    </motion.aside>
  );
}
