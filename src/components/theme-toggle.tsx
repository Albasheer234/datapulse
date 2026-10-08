"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        aria-label="Toggle theme"
        className={`h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 opacity-60 pointer-events-none ${className}`}
      >
        <span className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size={showLabel ? "sm" : "icon"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
      aria-label={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
      className={`relative h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm backdrop-blur transition-all duration-200 flex items-center justify-center gap-2 ${
        showLabel ? "px-3" : "w-9"
      } ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 rotate-0 scale-100" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-500 transition-transform duration-300 rotate-0 scale-100" />
        )}
      </div>
      {showLabel && (
        <span className="text-xs font-semibold">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </Button>
  );
}
