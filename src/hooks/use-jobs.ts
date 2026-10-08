"use client";

import { useState, useEffect, useCallback } from "react";

interface ProcessingJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalImages: number;
  processedImages: number;
  failedImages: number;
  extractedTransactions: number;
  errorMessage: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

export function useJobs(pollInterval: number = 3000) {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchJobs = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/jobs?_t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (data.jobs) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
      if (manual) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => fetchJobs(false), pollInterval);
    return () => clearInterval(interval);
  }, [fetchJobs, pollInterval]);

  const refresh = useCallback(() => fetchJobs(true), [fetchJobs]);

  return { jobs, loading, isRefreshing, refresh };
}

export function useJobStatus(jobId: string | null, pollInterval: number = 2000) {
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [loading, setLoading] = useState(!!jobId);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/jobs?jobId=${jobId}`);
      const data = await res.json();
      if (data.job) {
        setJob(data.job);
        // Stop polling if completed or failed
        if (data.job.status === "completed" || data.job.status === "failed") {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Failed to fetch job:", error);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchJob();
    const interval = setInterval(fetchJob, pollInterval);
    return () => clearInterval(interval);
  }, [jobId, fetchJob, pollInterval]);

  return { job, loading };
}
