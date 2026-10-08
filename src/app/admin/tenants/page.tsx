"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  TrendingUp,
  ShieldCheck,
  ShieldX,
  Search,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Tenant {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  userCount: number;
  transactionCount: number;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/admin/tenants");
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
      toast({
        title: "Error",
        description: "Failed to load tenants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (tenantId: string, action: "revoke" | "activate") => {
    setActionLoading(tenantId);
    try {
      const res = await fetch("/api/admin/tenants/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, action }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchTenants();
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tenants</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage organizations and their access
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* Tenants List */}
      <div className="space-y-3">
        {filteredTenants.map((tenant) => (
          <Card
            key={tenant.id}
            className={`border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 shadow-sm ${
              !tenant.isActive ? "opacity-60" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    <span className="font-medium text-slate-900 dark:text-white">
                      {tenant.name}
                    </span>
                    <Badge
                      variant={tenant.isActive ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {tenant.isActive ? "Active" : "Revoked"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">ID: {tenant.id}</p>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {tenant.userCount} users
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {tenant.transactionCount} transactions
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {tenant.isActive ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(tenant.id, "revoke")}
                      disabled={actionLoading === tenant.id}
                      className="h-8 text-xs"
                    >
                      {actionLoading === tenant.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ShieldX className="h-3 w-3 mr-1" />
                      )}
                      Revoke
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleAction(tenant.id, "activate")}
                      disabled={actionLoading === tenant.id}
                      className="h-8 text-xs bg-teal-600 hover:bg-teal-700"
                    >
                      {actionLoading === tenant.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-3 w-3 mr-1" />
                      )}
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTenants.length === 0 && (
          <div className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-700" />
            <p className="mt-4 text-sm text-slate-500">No tenants found</p>
          </div>
        )}
      </div>
    </div>
  );
}
