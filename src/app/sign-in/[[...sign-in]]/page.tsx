import { SignIn } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 relative overflow-hidden font-sans transition-colors duration-200">
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Ambient Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Main Centered Content */}
      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center gap-6 my-auto">
        {/* Branding Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-indigo-600 shadow-xl shadow-teal-950/50 border border-teal-400/20 mb-3">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">DataPulse</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Telecom Reseller Transaction Hub</p>
        </div>

        {/* Auth Form Card */}
        <div className="w-full bg-slate-900/90 border border-slate-800/90 shadow-2xl backdrop-blur-2xl rounded-3xl p-6 sm:p-8">
          <SignIn
            appearance={{
              variables: {
                colorPrimary: "#0d9488",
                colorBackground: "#0f172a",
                colorText: "#f8fafc",
                colorTextSecondary: "#94a3b8",
                colorInputBackground: "#020617",
                colorInputText: "#f8fafc",
              },
              elements: {
                rootBox: "w-full",
                cardBox: "w-full bg-transparent shadow-none border-0",
                card: "w-full bg-transparent border-0 p-0 shadow-none",
                headerTitle: "text-2xl font-black text-white tracking-tight",
                headerSubtitle: "text-slate-400 text-xs mt-1 font-normal",
                socialButtonsBlockButton: "w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-slate-800/80 text-xs font-semibold h-11 transition-all rounded-xl shadow-inner flex items-center justify-center gap-2",
                socialButtonsBlockButtonText: "font-semibold text-slate-200 text-xs",
                dividerLine: "bg-slate-800",
                dividerText: "text-slate-500 text-[11px] uppercase font-bold tracking-wider px-3",
                formFieldRow: "w-full",
                formFieldLabel: "text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1",
                formFieldInput: "w-full bg-slate-950/90 border-slate-800 text-slate-100 placeholder-slate-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-xs h-11 rounded-xl transition-all font-sans px-3.5",
                formButtonPrimary: "w-full bg-gradient-to-r from-teal-500 via-teal-600 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-bold text-xs h-11 rounded-xl shadow-lg shadow-teal-950/50 transition-all border-0 mt-2",
                formFieldAction: "text-teal-400 hover:text-teal-300 text-xs font-semibold transition-colors",
                footer: "bg-transparent border-t border-slate-800/60 pt-4 mt-4 text-xs",
                footerAction: "bg-transparent text-slate-400 text-xs",
                footerActionText: "text-slate-400 text-xs",
                footerActionLink: "text-teal-400 hover:text-teal-300 font-semibold text-xs ml-1",
                footerPages: "bg-transparent text-xs",
                footerPagesLink: "text-teal-400 text-xs font-semibold",
                alternativeMethods: "w-full bg-transparent mt-3 text-xs",
                alternativeMethodsBlockButton: "w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold h-11 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-sm",
                alternativeMethodsBlockButtonText: "text-slate-300 text-xs font-semibold",
                identityPreview: "bg-slate-950 border border-slate-800/90 rounded-xl p-3 text-slate-200 text-xs my-2 flex items-center justify-between",
                identityPreviewText: "text-slate-200 text-xs font-medium",
                identityPreviewEditButton: "text-teal-400 hover:text-teal-300 text-xs font-semibold ml-2",
                formFieldErrorText: "text-red-400 text-xs mt-1 font-medium",
                alert: "bg-red-950/40 border border-red-900/60 text-red-300 text-xs rounded-xl p-3 my-2",
                formResendCodeLink: "text-teal-400 text-xs font-semibold",
              },
            }}
          />
        </div>

        {/* Security Note */}
        <div className="text-center text-[11px] text-slate-500">
          <p className="flex items-center justify-center gap-1.5">
            <span>🔒</span> 256-bit Encrypted Session • Powered by Clerk
          </p>
        </div>
      </div>
    </div>
  );
}
