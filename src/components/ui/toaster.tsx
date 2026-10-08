"use client";

import { useState, useEffect } from "react";
import { ToastProps } from "./use-toast";
import { X, Info, AlertTriangle } from "lucide-react";

export function Toaster() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastProps>;
      setToasts((prev) => [...prev, customEvent.detail]);

      const duration = customEvent.detail.duration || 5000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== customEvent.detail.id));
      }, duration);
    };

    window.addEventListener("app-toast-trigger", handleToast);
    return () => window.removeEventListener("app-toast-trigger", handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start justify-between p-4 rounded-lg border shadow-lg backdrop-blur-md transition-all duration-300 pointer-events-auto ${
            t.variant === "destructive"
              ? "bg-red-950/90 border-red-800 text-red-200"
              : "bg-slate-900/90 border-slate-800 text-slate-100"
          }`}
        >
          <div className="flex gap-3">
            {t.variant === "destructive" ? (
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">{t.title}</h4>
              {t.description && (
                <p className="text-xs opacity-90">{t.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
