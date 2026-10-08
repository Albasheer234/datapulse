import { requireAdmin } from "@/lib/admin-guard";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  ArrowLeft,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">Admin</span>
              <span className="ml-2 text-xs text-slate-500 font-semibold">DataPulse</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 font-medium transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body with Full-Height Sidebar */}
      <div className="flex flex-1 min-h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 md:flex md:flex-col justify-between shrink-0 transition-colors">
          <nav className="space-y-1 p-4">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/tenants"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Tenants
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Users className="h-4 w-4" />
              Users
            </Link>
          </nav>

          {/* Sidebar Footer Info */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold">Admin Console</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">DataPulse Multi-Tenant</p>
          </div>
        </aside>

        {/* Mobile Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 md:hidden transition-colors">
          <div className="flex justify-around p-2">
            <Link
              href="/admin"
              className="flex flex-col items-center gap-1 p-2 text-xs text-slate-600 dark:text-slate-400"
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/admin/tenants"
              className="flex flex-col items-center gap-1 p-2 text-xs text-slate-600 dark:text-slate-400"
            >
              <Building2 className="h-5 w-5" />
              Tenants
            </Link>
            <Link
              href="/admin/users"
              className="flex flex-col items-center gap-1 p-2 text-xs text-slate-600 dark:text-slate-400"
            >
              <Users className="h-5 w-5" />
              Users
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 pb-20 md:p-8 md:pb-8">{children}</main>
      </div>

      {/* Admin Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-3.5 px-6 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors z-40 mb-14 md:mb-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">DataPulse Admin</span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            System Operational
          </span>
          <span className="text-slate-400">v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
