"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useJobs } from "@/hooks/use-jobs";
import {
  Upload,
  BarChart3,
  ListOrdered,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Settings,
  Shield,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Save,
  RotateCcw,
  History,
  Sparkles,
  Calendar,
  DollarSign,
  Check,
  AlertTriangle,
  FolderCheck,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { optimizeScreenshot } from "@/lib/image-optimizer";

interface DashboardClientProps {
  user: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

interface Transaction {
  id: string;
  uniqueId: string;
  bundleSizeGb: number;
  priceKobo: number;
  phoneNumber: string;
  carrier: "MTN" | "AIRTEL" | "GLO" | "9MOBILE" | "UNKNOWN";
  status: "successful" | "failed" | "pending";
  transactionDate: string;
  rawResponse: string | null;
  imageUrl: string | null;
}

interface SummaryData {
  carrier: string;
  totalTransactions: number;
  totalSuccessful: number;
  totalFailed: number;
  bundles: Array<{
    size: string;
    sizeValue: number;
    successful: number;
    failed: number;
    total: number;
  }>;
}

interface CarrierBreakdownData {
  carrier: string;
  totalSuccessful: number;
  totalFailed: number;
  totalTransactions: number;
  bundles: Array<{
    size: string;
    sizeValue: number;
    successful: number;
    failed: number;
    total: number;
  }>;
}

interface Stats {
  totalTransactions: number;
  successful: number;
  failed: number;
  totalAmountKobo: number;
}

interface SavedSession {
  id: string;
  name: string;
  totalAmountKobo: number;
  totalTransactions: number;
  successfulCount: number;
  failedCount: number;
  carrierBreakdownJson: string;
  statsJson: string;
  createdAt: string | number;
  savedAt: string | number;
}

const CARRIER_COLORS = {
  MTN: "#EAB308", // Yellow
  AIRTEL: "#EF4444", // Red
  GLO: "#22C55E", // Green
  "9MOBILE": "#0D9488", // Teal
  UNKNOWN: "#64748B", // Slate
};

export function DashboardClient({ user }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "upload" | "transactions" | "jobs" | "history">("overview");
  const [stats, setStats] = useState<Stats>({ totalTransactions: 0, successful: 0, failed: 0, totalAmountKobo: 0 });
  const [carrierSummary, setCarrierSummary] = useState<SummaryData[]>([]);
  const [carrierBreakdown, setCarrierBreakdown] = useState<CarrierBreakdownData[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Saved Session History States
  const [savedSessionsList, setSavedSessionsList] = useState<SavedSession[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedSavedSession, setSelectedSavedSession] = useState<SavedSession | null>(null);

  // Session Action Dialog Modals
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [sessionCustomName, setSessionCustomName] = useState("");
  const [savingSession, setSavingSession] = useState(false);
  const [clearingSession, setClearingSession] = useState(false);
  
  // Upload states
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Modal / Detail state
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [clearingJobs, setClearingJobs] = useState(false);
  
  const { toast } = useToast();
  
  // Background Job Monitoring Hook
  const { jobs, loading: loadingJobs, isRefreshing: refreshingJobs, refresh: refreshJobs } = useJobs(3000);

  // Fetch summary and statistics for the active draft session
  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/summary");
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.summary) {
        setCarrierSummary(data.summary);
      }
      if (data.carrierBreakdown) {
        setCarrierBreakdown(data.carrierBreakdown);
      }
    } catch (err) {
      console.error("Failed to fetch analytics summary", err);
    }
  }, []);

  // Fetch transaction list for active draft session
  const fetchTransactions = useCallback(async () => {
    try {
      const url = new URL("/api/transactions", window.location.origin);
      if (carrierFilter !== "ALL") url.searchParams.append("carrier", carrierFilter);
      if (statusFilter !== "ALL") url.searchParams.append("status", statusFilter.toLowerCase());
      
      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    }
  }, [carrierFilter, statusFilter]);

  // Fetch Saved Sessions History
  const fetchSessionHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch("/api/session/history");
      const data = await res.json();
      if (data.sessions) {
        setSavedSessionsList(data.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch session history:", error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoadingData(true);
    await Promise.all([fetchAnalytics(), fetchTransactions(), refreshJobs(), fetchSessionHistory()]);
    setLoadingData(false);
  }, [fetchAnalytics, fetchTransactions, refreshJobs, fetchSessionHistory]);

  useEffect(() => {
    loadAllData();
  }, [carrierFilter, statusFilter, loadAllData]);

  // Handle Save Session (Commit to DB)
  const handleSaveSession = async () => {
    try {
      setSavingSession(true);
      const res = await fetch("/api/session/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sessionCustomName.trim() || undefined,
          carrierBreakdown,
          stats,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: "Session Saved to Database! 🎉",
          description: data.message || "All calculations and breakdowns have been archived permanently.",
        });
        setShowSaveModal(false);
        setSessionCustomName("");
        await loadAllData();
        setActiveTab("history");
      } else {
        toast({
          title: "Save Failed",
          description: data.error || "Could not save session to database.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving.",
        variant: "destructive",
      });
    } finally {
      setSavingSession(false);
    }
  };

  // Handle Clear Session (Reset to 0)
  const handleClearSession = async () => {
    try {
      setClearingSession(true);
      const res = await fetch("/api/session/clear", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Dashboard Cleared",
          description: "All uncommitted calculations removed. Dashboard reset to fresh state.",
        });
        setShowClearModal(false);
        await loadAllData();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to clear session.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to connect to server.",
        variant: "destructive",
      });
    } finally {
      setClearingSession(false);
    }
  };

  // Delete Saved Historical Session
  const handleDeleteSavedSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/session/history?id=${sessionId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Saved Session Deleted",
          description: "Historical record removed.",
        });
        if (selectedSavedSession?.id === sessionId) {
          setSelectedSavedSession(null);
        }
        await fetchSessionHistory();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete saved session",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  const handleClearJobs = async (statusFilter = "failed,pending,processing") => {
    try {
      setClearingJobs(true);
      const res = await fetch(`/api/jobs?status=${statusFilter}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Batch Jobs Cleared",
          description: data.message || "Failed and pending jobs have been cleared.",
        });
        refreshJobs();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to clear jobs",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setClearingJobs(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs?jobId=${jobId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Job Deleted",
          description: `Job ${jobId.substring(0, 8)}... removed.`,
        });
        refreshJobs();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete job",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Check if file is an image (supports mobile Safari, Android HEIC/JPEG/PNG/etc)
  const isImageFile = (file: File) => {
    return (
      file.type.startsWith("image/") ||
      /\.(jpe?g|png|webp|heic|heif|bmp)$/i.test(file.name)
    );
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files).filter(isImageFile);
      if (files.length > 0) {
        setUploadFiles(prev => [...prev, ...files]);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an image screenshot (JPEG, PNG, WebP, HEIC).",
          variant: "destructive"
        });
      }
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const files = Array.from(e.target.files).filter(isImageFile);
      if (files.length > 0) {
        setUploadFiles(prev => [...prev, ...files]);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload image screenshots.",
          variant: "destructive"
        });
      }
    }
  };

  // Remove file from list
  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Trigger Upload
  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    
    setUploading(true);

    try {
      // Optimize and downscale large phone screenshots before upload
      // Prevents Vercel 4.5MB payload limit and mobile upload timeouts
      const optimizedFiles = await Promise.all(
        uploadFiles.map(file => optimizeScreenshot(file))
      );

      const formData = new FormData();
      optimizedFiles.forEach(file => {
        formData.append("images", file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: "Upload Successful",
          description: `${uploadFiles.length} screenshot(s) queued for AI extraction!`,
        });
        setUploadFiles([]);
        setActiveTab("jobs");
        refreshJobs();
      } else {
        toast({
          title: "Upload Failed",
          description: data.error || "Failed to upload screenshots.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred during upload. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Filter transaction list locally by search query
  const filteredTransactions = transactions.filter(tx => {
    const query = searchQuery.toLowerCase();
    return (
      tx.phoneNumber.toLowerCase().includes(query) ||
      tx.uniqueId.toLowerCase().includes(query) ||
      (tx.rawResponse && tx.rawResponse.toLowerCase().includes(query))
    );
  });

  // Calculate stats formatting
  const formattedVolume = `₦${(stats.totalAmountKobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const successRate = stats.totalTransactions > 0 
    ? ((stats.successful / stats.totalTransactions) * 100).toFixed(1) 
    : "0.0";
  const failureRate = stats.totalTransactions > 0 
    ? ((stats.failed / stats.totalTransactions) * 100).toFixed(1) 
    : "0.0";

  // Active jobs filter (ignoring stale jobs older than 15 minutes to avoid banner sticking)
  const activeJobs = jobs.filter(j => {
    if (j.status !== "processing" && j.status !== "pending") return false;
    const jobAgeMs = Date.now() - new Date(j.createdAt).getTime();
    return jobAgeMs < 15 * 60 * 1000;
  });

  // Recharts formatted data
  const carrierPieData = carrierSummary.map(s => ({
    name: s.carrier,
    value: s.totalTransactions,
  }));

  const carrierBarData = carrierSummary.map(s => ({
    name: s.carrier,
    successful: s.totalSuccessful,
    failed: s.totalFailed,
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors">
        <div className="container mx-auto px-4 py-3.5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-indigo-600 shadow-md">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">DataPulse</h1>
              <p className="text-xs text-slate-500">SaaS Transaction Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user.role === "admin" && (
              <Link href="/admin">
                <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                  Admin Panel
                </Button>
              </Link>
            )}
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Interactive Live Session Action Bar */}
      <div className="bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800/80 px-4 py-2.5 backdrop-blur transition-colors">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {stats.totalTransactions > 0 ? (
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Live Session</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 font-medium">
                    ({stats.totalTransactions.toLocaleString()} txns • {formattedVolume} • uncommitted)
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-600"></span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Ready for Session (0 records in live workspace)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const nowTitle = `Session ${new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`;
                setSessionCustomName(nowTitle);
                setShowSaveModal(true);
              }}
              disabled={stats.totalTransactions === 0 || savingSession}
              className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-semibold text-xs h-9 px-4 shadow-md shadow-teal-950/20 dark:shadow-teal-950/40 gap-1.5 transition-all"
            >
              <Save className="h-4 w-4" />
              Save Session to Database
            </Button>

            <Button
              onClick={() => setShowClearModal(true)}
              disabled={stats.totalTransactions === 0 || clearingSession}
              variant="outline"
              className="border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 font-semibold text-xs h-9 px-3 gap-1.5 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-slate-900/30 transition-colors">
        <div className="container mx-auto px-4 flex gap-1 py-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
              activeTab === "overview"
                ? "border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900/50 shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Live Overview
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
              activeTab === "upload"
                ? "border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900/50 shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Upload className="h-4 w-4" />
            Upload Screenshots
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
              activeTab === "transactions"
                ? "border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900/50 shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <ListOrdered className="h-4 w-4" />
            Live Transactions
          </button>
          <button
            onClick={() => setActiveTab("jobs")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
              activeTab === "jobs"
                ? "border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900/50 shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Clock className="h-4 w-4" />
            Processing Batches
            {jobs.some(j => j.status === "processing" || j.status === "pending") && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("history");
              fetchSessionHistory();
            }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
              activeTab === "history"
                ? "border-teal-500 text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-900/50 shadow-sm"
                : "border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <History className="h-4 w-4" />
            Saved History
            {savedSessionsList.length > 0 && (
              <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {savedSessionsList.length}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Global Loading Spinner */}
        {loadingData && activeTab !== "upload" && (
          <div className="flex justify-end mb-4 text-xs text-slate-500 items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin text-teal-500" />
            Updating live session...
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm transition-all">
                <CardContent className="pt-6">
                  <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Sales Volume</div>
                  <div className="text-2xl font-black mt-1.5 text-slate-900 dark:text-white">{formattedVolume}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                    <span className="text-teal-600 dark:text-teal-400 font-bold">₦</span>
                    Processed Transaction total value
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm transition-all">
                <CardContent className="pt-6">
                  <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Transactions</div>
                  <div className="text-2xl font-black mt-1.5 text-slate-900 dark:text-white">{stats.totalTransactions.toLocaleString()}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                    <Smartphone className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                    Successful + Failed entries
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm transition-all">
                <CardContent className="pt-6">
                  <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Success Rate</div>
                  <div className="text-2xl font-black mt-1.5 text-slate-900 dark:text-white">{successRate}%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                    {stats.successful.toLocaleString()} successful transactions
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm transition-all">
                <CardContent className="pt-6">
                  <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">Failure Rate</div>
                  <div className="text-2xl font-black mt-1.5 text-red-600 dark:text-red-400">{failureRate}%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    {stats.failed.toLocaleString()} failed transactions
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Real-time Processing Jobs Banner (if active fresh jobs exist) */}
            {activeJobs.length > 0 && (
              <div className="bg-teal-50 dark:bg-gradient-to-r dark:from-teal-950/40 dark:to-slate-900/80 border border-teal-200 dark:border-teal-900/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                    <Loader2 className="h-5 w-5 text-teal-600 dark:text-teal-400 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">AI screenshot analysis is running</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Extracting transactions from newly uploaded files. Data will populate automatically.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Job: {activeJobs[0]?.processedImages} / {activeJobs[0]?.totalImages} images
                  </span>
                  <Button variant="outline" size="sm" onClick={loadAllData} className="h-8 border-teal-300 dark:border-teal-900 text-teal-600 dark:text-teal-400 bg-transparent hover:bg-teal-50 dark:hover:bg-teal-950/20">
                    Refresh Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleClearJobs("failed,pending,processing")}
                    disabled={clearingJobs} 
                    className="h-8 border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/40 gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear Active Batch
                  </Button>
                </div>
              </div>
            )}

            {/* Carrier Data Plan Breakdown Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">Carrier Data Plan Breakdown</h3>
                  <p className="text-xs text-slate-500">Successful transaction counts for 0.5 GB, 1 GB, 2 GB, 3 GB, and 5 GB data plans per network</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {["MTN", "AIRTEL", "GLO", "9MOBILE"].map((carrierName) => {
                  const carrierData = carrierBreakdown.find(c => c.carrier === carrierName);
                  const targetSizes = [0.5, 1, 2, 3, 5];
                  
                  const badgeStyle = carrierName === "MTN" 
                    ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
                    : carrierName === "AIRTEL"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                    : carrierName === "GLO"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30";

                  const borderAccent = carrierName === "MTN"
                    ? "hover:border-yellow-500/40"
                    : carrierName === "AIRTEL"
                    ? "hover:border-red-500/40"
                    : carrierName === "GLO"
                    ? "hover:border-emerald-500/40"
                    : "hover:border-teal-500/40";

                  return (
                    <Card key={carrierName} className={`bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 ${borderAccent} shadow-sm transition-all`}>
                      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${badgeStyle}`}>
                            {carrierName}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {carrierData ? carrierData.totalSuccessful : 0} Successful
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-1">
                        {targetSizes.map((size) => {
                          const bundle = carrierData?.bundles.find(b => b.sizeValue === size);
                          const count = bundle ? bundle.successful : 0;

                          return (
                            <div key={size} className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 text-xs">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{size} GB</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`font-black ${count > 0 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}`}>
                                  {count.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-slate-500">successful</span>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Charts section */}
            {stats.totalTransactions > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-800 dark:text-slate-200 font-bold">Carrier Share</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Distribution of transactions by telecom operator</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={carrierPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {carrierPieData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CARRIER_COLORS[entry.name as keyof typeof CARRIER_COLORS] || CARRIER_COLORS.UNKNOWN}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f8fafc" }}
                          labelStyle={{ color: "#f8fafc" }}
                          itemStyle={{ color: "#f8fafc" }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-800 dark:text-slate-200 font-bold">Carrier Status Overview</CardTitle>
                    <CardDescription className="text-xs text-slate-500">Successful vs Failed transactions per carrier</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={carrierBarData}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f8fafc" }}
                          labelStyle={{ color: "#f8fafc" }}
                          itemStyle={{ color: "#f8fafc" }}
                        />
                        <Legend />
                        <Bar dataKey="successful" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Successful" />
                        <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/20">
                <Sparkles className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-300">Workspace is Clean and Ready</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Upload screenshot logs to calculate breakdowns. Your calculations stay live in this session until you save or reset.
                </p>
                <Button onClick={() => setActiveTab("upload")} className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-9 px-4 gap-1.5">
                  <Upload className="h-4 w-4" />
                  Upload Screenshot Logs
                </Button>
              </div>
            )}
          </div>
        )}

        {/* UPLOAD SCREENSHOTS TAB */}
        {activeTab === "upload" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-800 dark:text-slate-200">Upload Transaction Screenshots</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Upload one or more screenshots from your Nigerian data reseller portal. AI will extract all rows into this active live session.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dropzone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive
                      ? "border-teal-500 bg-teal-500/5"
                      : "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/70 dark:bg-slate-950/40"
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-3">
                      <Upload className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Click to upload or drag and drop
                    </span>
                    <span className="text-xs text-slate-500 mt-1">
                      Supports all mobile screenshots & photos (JPEG, PNG, WebP, HEIC)
                    </span>
                  </label>
                </div>

                {/* Selected files preview */}
                {uploadFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Selected Files ({uploadFiles.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                      {uploadFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <ImageIcon className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span className="truncate text-slate-800 dark:text-slate-300">{file.name}</span>
                          </div>
                          <button
                            onClick={() => removeFile(index)}
                            className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadFiles([])}
                        disabled={uploading}
                        className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        Clear All
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="bg-teal-600 hover:bg-teal-500 text-white font-medium"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            Processing Upload...
                          </>
                        ) : (
                          `Extract ${uploadFiles.length} Screenshot(s)`
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search number, portal ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 shadow-sm transition-colors"
                />
              </div>

              <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                <select
                  value={carrierFilter}
                  onChange={(e) => setCarrierFilter(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500 shadow-sm transition-colors"
                >
                  <option value="ALL">All Networks</option>
                  <option value="MTN">MTN</option>
                  <option value="AIRTEL">Airtel</option>
                  <option value="GLO">Glo</option>
                  <option value="9MOBILE">9Mobile</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-teal-500 shadow-sm transition-colors"
                >
                  <option value="ALL">All Status</option>
                  <option value="SUCCESSFUL">Successful</option>
                  <option value="FAILED">Failed</option>
                </select>

                <Button variant="outline" size="sm" onClick={loadAllData} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-sm">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
                </Button>
              </div>
            </div>

            {/* Transactions table */}
            <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 shadow-sm">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/80 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Unique ID</th>
                        <th className="p-3">Carrier</th>
                        <th className="p-3">Plan Size</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-center">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                      {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                          <td className="p-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                            {new Date(tx.transactionDate).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="p-3 font-mono font-bold truncate max-w-[150px] text-slate-800 dark:text-slate-200">{tx.uniqueId}</td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className="font-semibold"
                              style={{ color: CARRIER_COLORS[tx.carrier] || CARRIER_COLORS.UNKNOWN }}
                            >
                              {tx.carrier}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">{tx.bundleSizeGb} GB</td>
                          <td className="p-3 whitespace-nowrap font-semibold text-slate-900 dark:text-slate-100">₦{(tx.priceKobo / 100).toFixed(2)}</td>
                          <td className="p-3 whitespace-nowrap font-mono text-slate-600 dark:text-slate-400">{tx.phoneNumber}</td>
                          <td className="p-3 whitespace-nowrap">
                            {tx.status === "successful" ? (
                              <Badge className="bg-teal-500/10 dark:bg-teal-600/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 dark:border-teal-800/50">Successful</Badge>
                            ) : tx.status === "failed" ? (
                              <Badge className="bg-red-500/10 dark:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 dark:border-red-800/50">Failed</Badge>
                            ) : (
                              <Badge className="bg-yellow-500/10 dark:bg-yellow-600/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 dark:border-yellow-800/50">Pending</Badge>
                            )}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={() => setSelectedTx(tx)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}

                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500">
                            No transactions found matching your filters in current live session.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PROCESSING JOBS TAB */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <Card className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-lg text-slate-800 dark:text-slate-200">Processing Batches</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Track real-time background AI processing jobs for uploaded logs.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleClearJobs("failed,pending,processing")} 
                    disabled={clearingJobs || jobs.length === 0} 
                    className="border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-950/40 gap-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Failed & Pending
                  </Button>
                  <Button variant="outline" size="sm" onClick={refreshJobs} disabled={refreshingJobs} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    <RefreshCw className={`h-4 w-4 ${refreshingJobs ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingJobs && jobs.length === 0 ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => {
                      const percent = job.totalImages > 0 
                        ? Math.round(((job.processedImages + job.failedImages) / job.totalImages) * 100)
                        : 0;

                      return (
                        <div key={job.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-slate-500">ID: {job.id.substring(0, 8)}...</span>
                                {job.status === "completed" && (
                                  <Badge className="bg-teal-500/10 dark:bg-teal-600/20 text-teal-600 dark:text-teal-400 border border-teal-500/30 dark:border-teal-800/50">Completed</Badge>
                                )}
                                {job.status === "processing" && (
                                  <Badge className="bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/40 dark:border-teal-700/50 animate-pulse">Processing</Badge>
                                )}
                                {job.status === "pending" && (
                                  <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">Pending</Badge>
                                )}
                                {job.status === "failed" && (
                                  <Badge className="bg-red-500/10 dark:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-500/30 dark:border-red-800/50">Failed</Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Queued: {new Date(job.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-300">
                                  {job.extractedTransactions} records extracted
                                </span>
                                <p className="text-xs text-slate-500">
                                  {job.processedImages} / {job.totalImages} images processed
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteJob(job.id)}
                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                title="Delete job"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {job.status !== "completed" && job.status !== "failed" && (
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-teal-500 h-full transition-all duration-500" 
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          )}

                          {job.errorMessage && (
                            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg p-2.5">
                              Error: {job.errorMessage}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {jobs.length === 0 && (
                      <div className="py-12 text-center text-slate-500">
                        No processing jobs run yet.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* SAVED SESSIONS HISTORY TAB */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-200">Saved Session History</h3>
                <p className="text-xs text-slate-500">
                  Permanent record of calculation sessions saved to the database.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSessionHistory}
                disabled={loadingHistory}
                className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 gap-1.5 shadow-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
                Refresh History
              </Button>
            </div>

            {loadingHistory && savedSessionsList.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
              </div>
            ) : savedSessionsList.length === 0 ? (
              <Card className="bg-white/80 dark:bg-slate-900/30 border-dashed border-slate-300 dark:border-slate-800 p-12 text-center shadow-sm">
                <FolderCheck className="h-10 w-10 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-300">No Saved Sessions Yet</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  When you finish calculations in the live session, click "Save Session to Database" to permanently record the total breakdowns here.
                </p>
                <Button onClick={() => setActiveTab("overview")} className="bg-teal-600 hover:bg-teal-500 text-white text-xs h-9 px-4 gap-1.5">
                  <BarChart3 className="h-4 w-4" />
                  Go to Live Session
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {savedSessionsList.map((session) => {
                  let breakdown: CarrierBreakdownData[] = [];
                  try {
                    breakdown = JSON.parse(session.carrierBreakdownJson);
                  } catch {}

                  const formattedAmt = `₦${(session.totalAmountKobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  const succRate = session.totalTransactions > 0 
                    ? ((session.successfulCount / session.totalTransactions) * 100).toFixed(1)
                    : "0.0";

                  return (
                    <Card key={session.id} className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all overflow-hidden">
                      <CardHeader className="p-4 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3 space-y-0">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 border border-teal-500/20">
                            <FolderCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">{session.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                              Saved on {new Date(session.savedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSavedSession(session)}
                            className="h-8 border-teal-300 dark:border-teal-900/60 text-teal-600 dark:text-teal-400 bg-transparent hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Breakdown Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSavedSession(session.id)}
                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Delete saved session"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 space-y-4">
                        {/* Summary Metrics Row */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800/60">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Sales</span>
                            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{formattedAmt}</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800/60">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Txns</span>
                            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{session.totalTransactions.toLocaleString()}</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800/60">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Successful</span>
                            <div className="text-lg font-black text-teal-600 dark:text-teal-400 mt-0.5">{session.successfulCount.toLocaleString()} ({succRate}%)</div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800/60">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Failed</span>
                            <div className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5">{session.failedCount.toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Mini Carrier Breakdown Chips */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Network Plan Summary</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                            {["MTN", "AIRTEL", "GLO", "9MOBILE"].map((carrierName) => {
                              const cData = breakdown.find(c => c.carrier === carrierName);
                              return (
                                <div key={carrierName} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs">
                                  <span className="font-bold text-slate-700 dark:text-slate-300">{carrierName}</span>
                                  <span className="font-semibold text-teal-600 dark:text-teal-400">
                                    {cData ? cData.totalSuccessful : 0} <span className="text-[10px] text-slate-500">success</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: SAVE SESSION TO DATABASE */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <Save className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Save Session to Database</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Archive current calculations permanently.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => setShowSaveModal(false)}>
                Cancel
              </Button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Session Name / Title
                </label>
                <input
                  type="text"
                  value={sessionCustomName}
                  onChange={(e) => setSessionCustomName(e.target.value)}
                  placeholder="e.g. Reconciliation Aug 15 Morning Batch"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Summary Preview Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Breakdown Preview</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Total Sales:</span>
                    <p className="font-bold text-slate-900 dark:text-slate-200 mt-0.5">{formattedVolume}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Transactions:</span>
                    <p className="font-bold text-slate-900 dark:text-slate-200 mt-0.5">{stats.totalTransactions.toLocaleString()} txns</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Successful Rate:</span>
                    <p className="font-bold text-teal-600 dark:text-teal-400 mt-0.5">{successRate}% ({stats.successful})</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Failed Rate:</span>
                    <p className="font-bold text-red-600 dark:text-red-400 mt-0.5">{failureRate}% ({stats.failed})</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Saving will commit all extracted rows and bundle breakdowns to the database and reset the active live workspace back to clean state.
              </p>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-950/50">
              <Button variant="outline" size="sm" onClick={() => setShowSaveModal(false)} disabled={savingSession} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveSession}
                disabled={savingSession}
                className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-semibold gap-1.5"
              >
                {savingSession ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Confirm & Save to DB
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLEAR DASHBOARD CONFIRMATION */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50">
              <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Clear Live Dashboard?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reset calculation workspace to fresh 0 state.</p>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to clear the active workspace? This will remove all uncommitted transactions and batch logs from the dashboard without saving to the database.
              </p>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300">
                ⚠️ This action cannot be undone. Make sure you have saved your session if you need this calculation report.
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-950/50">
              <Button variant="outline" size="sm" onClick={() => setShowClearModal(false)} disabled={clearingSession} className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleClearSession}
                disabled={clearingSession}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold gap-1.5"
              >
                {clearingSession ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Yes, Clear Dashboard
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SAVED SESSION DETAIL INSPECTION */}
      {selectedSavedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">{selectedSavedSession.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Archived on {new Date(selectedSavedSession.savedAt).toLocaleString()} • ID: {selectedSavedSession.id}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => setSelectedSavedSession(null)}>
                Close
              </Button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Top Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Sales Volume</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    ₦{(selectedSavedSession.totalAmountKobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Transactions</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{selectedSavedSession.totalTransactions.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Successful</span>
                  <div className="text-xl font-black text-teal-600 dark:text-teal-400 mt-1">{selectedSavedSession.successfulCount.toLocaleString()}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Failed</span>
                  <div className="text-xl font-black text-red-600 dark:text-red-400 mt-1">{selectedSavedSession.failedCount.toLocaleString()}</div>
                </div>
              </div>

              {/* Detailed Carrier 0.5G - 5G Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">Carrier Bundle Plan Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(() => {
                    let breakdown: CarrierBreakdownData[] = [];
                    try {
                      breakdown = JSON.parse(selectedSavedSession.carrierBreakdownJson);
                    } catch {}

                    return ["MTN", "AIRTEL", "GLO", "9MOBILE"].map((carrierName) => {
                      const cData = breakdown.find(c => c.carrier === carrierName);
                      const targetSizes = [0.5, 1, 2, 3, 5];
                      
                      const badgeStyle = carrierName === "MTN" 
                        ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
                        : carrierName === "AIRTEL"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                        : carrierName === "GLO"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30";

                      return (
                        <Card key={carrierName} className="bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 shadow-sm">
                          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${badgeStyle}`}>
                              {carrierName}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {cData ? cData.totalSuccessful : 0} Success
                            </span>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-1">
                            {targetSizes.map((size) => {
                              const bundle = cData?.bundles.find(b => b.sizeValue === size);
                              const count = bundle ? bundle.successful : 0;
                              return (
                                <div key={size} className="flex justify-between items-center py-1.5 px-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">{size} GB</span>
                                  <span className={`font-black ${count > 0 ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-600'}`}>
                                    {count.toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          </CardContent>
                        </Card>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/50">
              <Button onClick={() => setSelectedSavedSession(null)} className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION INSPECTION MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Transaction Inspection</h3>
                <p className="text-xs text-slate-500 font-mono">DB Record ID: {selectedTx.id}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => setSelectedTx(null)}>
                Close
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Properties & OCR */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Extracted Details</h4>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950/40 p-4 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <div>
                    <span className="text-slate-500">Portal Trans ID</span>
                    <p className="font-mono text-slate-900 dark:text-slate-200 mt-0.5">{selectedTx.uniqueId}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Status</span>
                    <p className="mt-0.5">
                      {selectedTx.status === "successful" ? (
                        <span className="text-teal-600 dark:text-teal-400 font-semibold">Successful</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-semibold">Failed</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Carrier</span>
                    <p className="font-semibold mt-0.5" style={{ color: CARRIER_COLORS[selectedTx.carrier] }}>
                      {selectedTx.carrier}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Plan Size</span>
                    <p className="text-slate-900 dark:text-slate-200 mt-0.5">{selectedTx.bundleSizeGb} GB</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Amount</span>
                    <p className="text-slate-900 dark:text-slate-200 font-semibold mt-0.5">₦{(selectedTx.priceKobo / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Number</span>
                    <p className="font-mono text-slate-900 dark:text-slate-200 mt-0.5">{selectedTx.phoneNumber}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Raw Portal Response</h4>
                  <pre className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-slate-800 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono max-h-48">
                    {selectedTx.rawResponse || "No raw API response text available."}
                  </pre>
                </div>
              </div>

              {/* Right Column: Screenshot Visual Reference */}
              <div className="space-y-4 flex flex-col">
                <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                  Visual Screenshot Reference
                </h4>
                <div className="flex-1 min-h-[300px] border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/60 dark:bg-slate-950/60 overflow-hidden flex items-center justify-center relative p-2">
                  {selectedTx.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={selectedTx.imageUrl} 
                      alt="Source transaction screenshot" 
                      className="max-w-full max-h-[400px] object-contain rounded border border-slate-200 dark:border-slate-800"
                    />
                  ) : (
                    <div className="text-center text-slate-500 dark:text-slate-600 text-xs">
                      <ImageIcon className="h-8 w-8 mx-auto opacity-40 mb-2" />
                      No screenshot link available for this record.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-950/50">
              <Button onClick={() => setSelectedTx(null)} className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white">
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardClient;
