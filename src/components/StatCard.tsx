import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: "emerald" | "blue" | "amber" | "rose" | "violet";
  trend?: { value: number; positive: boolean };
  delay?: number;
}

const colorMap = {
  emerald: {
    bg: "from-emerald-500/10 to-emerald-500/5",
    icon: "bg-emerald-500/20 text-emerald-600",
    border: "border-emerald-500/20",
    gradient: "from-emerald-600 to-teal-500",
  },
  blue: {
    bg: "from-blue-500/10 to-blue-500/5",
    icon: "bg-blue-500/20 text-blue-600",
    border: "border-blue-500/20",
    gradient: "from-blue-600 to-indigo-500",
  },
  amber: {
    bg: "from-amber-500/10 to-amber-500/5",
    icon: "bg-amber-500/20 text-amber-600",
    border: "border-amber-500/20",
    gradient: "from-amber-600 to-orange-500",
  },
  rose: {
    bg: "from-rose-500/10 to-rose-500/5",
    icon: "bg-rose-500/20 text-rose-600",
    border: "border-rose-500/20",
    gradient: "from-rose-600 to-pink-500",
  },
  violet: {
    bg: "from-violet-500/10 to-violet-500/5",
    icon: "bg-violet-500/20 text-violet-600",
    border: "border-violet-500/20",
    gradient: "from-violet-600 to-purple-500",
  },
};

export default function StatCard({ title, value, subtitle, icon: Icon, color, trend, delay = 0 }: StatCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1`}
    >
      {/* Decorative gradient blob */}
      <div className={`absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br ${c.gradient} opacity-5 blur-2xl`} />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${c.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={`text-xs font-semibold ${trend.positive ? "text-emerald-600" : "text-rose-600"}`}>
            {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-400">مقارنة بالشهر الماضي</span>
        </div>
      )}
    </motion.div>
  );
}
