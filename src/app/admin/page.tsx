"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  ShieldCheck,
  ShieldX,
} from "lucide-react";

interface Stats {
  totalTenants: number;
  activeTenants: number;
  revokedTenants: number;
  totalUsers: number;
  activeUsers: number;
  revokedUsers: number;
  totalTransactions: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [tenantsRes, usersRes] = await Promise.all([
        fetch("/api/admin/tenants"),
        fetch("/api/admin/users"),
      ]);

      const tenantsData = await tenantsRes.json();
      const usersData = await usersRes.json();

      const tenants = tenantsData.tenants || [];
      const users = usersData.users || [];

      const totalTransactions = tenants.reduce(
        (sum: number, t: any) => sum + (t.transactionCount || 0),
        0
      );

      setStats({
        totalTenants: tenants.length,
        activeTenants: tenants.filter((t: any) => t.isActive).length,
        revokedTenants: tenants.filter((t: any) => !t.isActive).length,
        totalUsers: users.length,
        activeUsers: users.filter((u: any) => u.isActive).length,
        revokedUsers: users.filter((u: any) => !u.isActive).length,
        totalTransactions,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Tenants",
      value: stats.totalTenants,
      icon: Building2,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Active Tenants",
      value: stats.activeTenants,
      icon: ShieldCheck,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
    },
    {
      title: "Revoked Tenants",
      value: stats.revokedTenants,
      icon: ShieldX,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      title: "Active Users",
      value: stats.activeUsers,
      icon: Activity,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
    },
    {
      title: "Total Transactions",
      value: stats.totalTransactions.toLocaleString(),
      icon: TrendingUp,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">System overview and analytics</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.title} className="border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{card.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
