import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WalletCards, Menu, X } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Wallets from "./components/Wallets";
import Transactions from "./components/Transactions";
import SmsLogs from "./components/SmsLogs";
import Reports from "./components/Reports";
import CloudGateway from "./components/CloudGateway";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // فحص تسجيل الدخول المحلي
  const [isLocalAuth, setIsLocalAuth] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsLocalAuth(localStorage.getItem("isLoggedIn") === "true");
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const loggedInUser = useQuery(api.auth.loggedInUser);

  const handleSignOut = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLocalAuth(false);
    const btn = document.querySelector('[data-signout]') as HTMLButtonElement;
    btn?.click();
    window.location.reload();
  };

  // لو مسجل دخول محلياً (باليوزر والباسورد اللي حددناهم)، افتح اللوحة فوراً
  const isUserLoggedIn = isLocalAuth || loggedInUser !== null;

  if (loggedInUser === undefined && !isLocalAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
            <WalletCards className="w-6 h-6 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100" dir="rtl">
      {isUserLoggedIn ? (
        <>
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden fixed top-4 right-4 z-[60] p-2.5 rounded-xl bg-white shadow-lg border border-gray-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Mobile overlay */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/30 z-40"
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
          <div className={`lg:block ${mobileMenuOpen ? "block" : "hidden"}`}>
            <Sidebar
              activeTab={activeTab}
              onTabChange={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }}
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              onSignOut={handleSignOut}
            />
          </div>

          {/* Main content */}
          <div className={`transition-all duration-300 ${sidebarCollapsed ? "mr-20" : "mr-64"} max-lg:mr-0`}>
            {/* Top bar */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
              <div className="flex items-center justify-between px-6 h-16">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                    <WalletCards className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">كاش بلس</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="p-6 max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "dashboard" && <Dashboard />}
                  {activeTab === "wallets" && <Wallets />}
                  {activeTab === "transactions" && <Transactions />}
                  {activeTab === "cloud" && <CloudGateway />}
                  {activeTab === "sms" && <SmsLogs />}
                  {activeTab === "reports" && <Reports />}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>

          {/* Hidden sign out trigger */}
          <div className="hidden">
            <SignOutButton />
          </div>
        </>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-emerald-400/5 to-teal-500/5 rounded-full blur-3xl" />

          <div className="relative z-10 w-full max-w-md mx-auto px-4">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 mb-4">
                <WalletCards className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-1">كاش بلس</h1>
              <p className="text-emerald-200/80">نظام إدارة محافظ فودافون كاش</p>
            </motion.div>

            {/* Sign In Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <SignInForm />
            </motion.div>
          </div>
        </div>
      )}

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "Tajawal, sans-serif",
            direction: "rtl",
          },
        }}
      />
    </div>
  );
}