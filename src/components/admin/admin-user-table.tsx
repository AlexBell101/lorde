"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";

type User = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  phone: string | null;
  created_at: string;
};

interface AdminUserTableProps {
  users: User[];
  currentQ: string;
  currentRole: string;
  formatDate: (d: string) => string;
}

const ROLE_OPTIONS = ["all", "admin", "support", "landlord", "renter"] as const;

const ROLE_STYLE: Record<string, string> = {
  admin:    "bg-primary/10 text-primary",
  support:  "bg-violet-500/10 text-violet-600",
  landlord: "bg-amber-500/10 text-amber-600",
  renter:   "bg-emerald-500/10 text-emerald-600",
};

export function AdminUserTable({ users, currentQ, currentRole, formatDate }: AdminUserTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentQ);
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function applyFilter(q: string, role: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role && role !== "all") params.set("role", role);
    startTransition(() => router.push(`/admin/users?${params.toString()}`));
  }

  async function changeRole(userId: string, newRole: string) {
    setUpdatingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Role updated", variant: "success" });
        router.refresh();
      }
    } catch {
      toast({ title: "Request failed", variant: "destructive" });
    }
    setUpdatingId(null);
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilter(search, currentRole)}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => applyFilter(search, r)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize font-medium border transition-colors ${
                currentRole === r
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {!users.length && (
            <p className="px-6 py-10 text-sm text-muted-foreground text-center">No users found</p>
          )}
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold shrink-0">
                  {(u.full_name ?? u.email).slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>

                {/* Phone */}
                <p className="text-xs text-muted-foreground hidden lg:block w-28 shrink-0">
                  {u.phone ?? "—"}
                </p>

                {/* Joined */}
                <p className="text-xs text-muted-foreground hidden md:block w-24 shrink-0">
                  {formatDate(u.created_at)}
                </p>

                {/* Role selector */}
                <div className="relative shrink-0">
                  <div className={`flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium cursor-pointer ${ROLE_STYLE[u.role] ?? "bg-secondary text-muted-foreground"} ${updatingId === u.id ? "opacity-50 pointer-events-none" : ""}`}>
                    <span className="capitalize">{u.role}</span>
                    <ChevronDown className="w-3 h-3" />
                    <select
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      aria-label="Change role"
                    >
                      <option value="renter">renter</option>
                      <option value="landlord">landlord</option>
                      <option value="support">support</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
