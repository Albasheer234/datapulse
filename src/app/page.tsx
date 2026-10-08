import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function HomePage() {
  const { userId } = await auth();

  // Auto-redirect logged in resellers straight to their dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white transition-colors duration-200">
      {/* ─── HEADER / NAVIGATION BAR ─── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-indigo-600 shadow-md shadow-teal-950/40 border border-teal-400/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-black bg-gradient-to-r from-slate-900 via-slate-800 to-teal-700 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">DataPulse</span>
              <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 block -mt-1 tracking-wider uppercase">Analytics Hub</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 dark:hover:text-white transition-colors">How It Works</a>
            <a href="#networks" className="hover:text-slate-900 dark:hover:text-white transition-colors">Supported Networks</a>
          </nav>

          {/* Auth CTA Buttons + Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/sign-in"
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-3 sm:px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 rounded-xl shadow-lg shadow-teal-950/20 dark:shadow-teal-950/50 transition-all"
            >
              Get Started Free ➔
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Ambient Glowing Background Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-teal-500/10 blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[400px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center max-w-4xl space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-semibold shadow-inner">
            <span className="h-2 w-2 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse" />
            <span>AI Vision Engine 2.0 • 100% Extraction Accuracy</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            Automate Your Telecom <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-teal-500 via-emerald-500 to-indigo-600 dark:from-teal-400 dark:via-emerald-300 dark:to-indigo-400 bg-clip-text text-transparent">
              Data Reseller Accounting
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            Drop your portal screenshots and get instant data plan breakdowns (0.5GB–5GB), transaction volume totals, and carrier reconciliation across MTN, Airtel, Glo & 9Mobile.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 rounded-2xl shadow-xl shadow-teal-950/20 dark:shadow-teal-950/60 transition-all flex items-center justify-center gap-2"
            >
              Start Free Trial Now ➔
            </Link>
            <Link
              href="/sign-in"
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              Sign In to Account
            </Link>
          </div>

          {/* Interactive Workspace Preview Graphic */}
          <div className="pt-8">
            <div className="relative mx-auto max-w-4xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 p-4 sm:p-6 shadow-2xl backdrop-blur-xl text-left">
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <span className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs text-slate-500 font-mono">datapulse-live-dashboard.app</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[10px] font-bold uppercase">
                  Active Live Session
                </span>
              </div>

              {/* Mockup Dashboard Content */}
              <div className="pt-6 space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Sales Volume</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">₦485,250.00</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Transactions</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">1,420</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Success Rate</span>
                    <p className="text-lg font-black text-teal-600 dark:text-teal-400 mt-0.5">98.4%</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Failed</span>
                    <p className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5">23</p>
                  </div>
                </div>

                {/* Carrier Network Breakdown Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-bold text-yellow-600 dark:text-yellow-400">MTN</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">542 txns</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-bold text-red-600 dark:text-red-400">AIRTEL</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">410 txns</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">GLO</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">288 txns</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-600 dark:text-teal-400">9MOBILE</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">180 txns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID SECTION ─── */}
      <section id="features" className="py-20 bg-slate-100/70 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 relative transition-colors">
        <div className="container mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Built for Nigerian Data Vendors</h2>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Everything You Need to Reconcile Sales</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Eliminate manual ledger calculations with purpose-built AI extraction tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-teal-500/40 shadow-sm transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 text-lg font-bold">
                📸
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">AI Vision Screenshot OCR</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Drag and drop transaction screenshots from your reseller portal. Gemini AI extracts every single row deterministically.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 shadow-sm transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg font-bold">
                📊
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">0.5G–5G Data Plan Matrix</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Automatic grouping for 0.5 GB, 1 GB, 2 GB, 3 GB, and 5 GB bundle sales per telecom network.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 shadow-sm transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-lg font-bold">
                💼
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Live Session Workspace</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Work live across multiple screenshots in draft session mode, then save complete report breakdowns to your database.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 shadow-sm transition-all space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 text-lg font-bold">
                🔒
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Enterprise Multi-Tenant</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Complete data isolation for every reseller tenant account with 256-bit Clerk authentication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS SECTION ─── */}
      <section id="how-it-works" className="py-20 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-900 relative transition-colors">
        <div className="container mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">3-Step Process</h2>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">How DataPulse Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-3 relative shadow-sm">
              <div className="h-10 w-10 rounded-full bg-teal-500 text-white dark:text-slate-950 font-black text-base flex items-center justify-center mx-auto shadow-md">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Upload Screenshots</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Take screenshots of your portal transaction history and drag them into your live workspace.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-3 relative shadow-sm">
              <div className="h-10 w-10 rounded-full bg-teal-500 text-white dark:text-slate-950 font-black text-base flex items-center justify-center mx-auto shadow-md">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">AI Extracts Data</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Our AI Vision pipeline extracts portal IDs, phone numbers, data plan sizes, amounts, and statuses automatically.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-3 relative shadow-sm">
              <div className="h-10 w-10 rounded-full bg-teal-500 text-white dark:text-slate-950 font-black text-base flex items-center justify-center mx-auto shadow-md">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Save & Reconcile</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Review your live totals, click "Save Session", and store permanent reconciliation reports in your history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SUPPORTED NETWORKS BANNER ─── */}
      <section id="networks" className="py-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 transition-colors">
        <div className="container mx-auto px-4 text-center space-y-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Supported Nigerian Telecom Operators</p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            <span className="px-5 py-2.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-bold text-sm">
              MTN Nigeria
            </span>
            <span className="px-5 py-2.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-bold text-sm">
              Airtel Nigeria
            </span>
            <span className="px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              Glo Nigeria
            </span>
            <span className="px-5 py-2.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 font-bold text-sm">
              9Mobile Nigeria
            </span>
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA BANNER ─── */}
      <section className="py-20 bg-gradient-to-b from-slate-100 to-slate-200/80 dark:from-slate-950 dark:to-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Ready to Simplify Your Data Reseller Accounting?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Create your account in less than 2 minutes and start analyzing your portal logs with AI.
          </p>
          <div className="pt-2">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold text-white bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 rounded-2xl shadow-xl shadow-teal-950/20 dark:shadow-teal-950/60 transition-all"
            >
              Create Your Free Account Now ➔
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-8 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 text-xs text-slate-500 transition-colors">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-300">DataPulse</span>
            <span>© {new Date().getFullYear()} All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/sign-in" className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors">Sign In</Link>
            <Link href="/sign-up" className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
