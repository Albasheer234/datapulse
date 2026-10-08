"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ShieldCheck,
  ShieldX,
  Search,
  Loader2,
  Building2,
  Crown,
  User,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface AdminUser {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  tenantId: string;
  tenantName: string | null;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (
    userId: string,
    action: "revoke" | "activate" | "changeRole",
    role?: string
  ) => {
    setActionLoading(userId);
    try {
      const body: any = { userId, action };
      if (role) body.role = role;

      const res = await fetch("/api/admin/users/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        fetchUsers();
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

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.tenantName?.toLowerCase().includes(searchQuery.toLowerCase())
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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage user accounts and roles
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-teal-500 focus:outline-none shadow-sm"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <Card
            key={user.id}
            className={`border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 shadow-sm ${
              !user.isActive ? "opacity-60" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {user.role === "admin" ? (
                      <Crown className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                    ) : (
                      <User className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                    )}
                    <span className="font-medium text-slate-900 dark:text-white">
                      {user.email}
                    </span>
                    <Badge
                      variant={user.isActive ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {user.isActive ? "Active" : "Revoked"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        user.role === "admin"
                          ? "border-yellow-500/30 text-yellow-400"
                          : "border-slate-600 text-slate-400"
                      }`}
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Building2 className="h-3 w-3" />
                    {user.tenantName || "Unknown Tenant"}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Role Toggle */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleAction(
                        user.id,
                        "changeRole",
                        user.role === "admin" ? "user" : "admin"
                      )
                    }
                    disabled={actionLoading === user.id}
                    className="h-8 text-xs border-slate-600"
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : user.role === "admin" ? (
                      "Demote to User"
                    ) : (
                      "Promote to Admin"
                    )}
                  </Button>

                  {user.isActive ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(user.id, "revoke")}
                      disabled={actionLoading === user.id}
                      className="h-8 text-xs"
                    >
                      {actionLoading === user.id ? (
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
                      onClick={() => handleAction(user.id, "activate")}
                      disabled={actionLoading === user.id}
                      className="h-8 text-xs bg-teal-600 hover:bg-teal-700"
                    >
                      {actionLoading === user.id ? (
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

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-700" />
            <p className="mt-4 text-sm text-slate-500">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}
