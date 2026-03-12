import { createClient } from "@/lib/supabase/server";
import {
  Users, Building2, DollarSign, Headphones,
  TrendingUp, UserCheck, Home, AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: totalUsers },
    { count: landlordCount },
    { count: renterCount },
    { count: supportCount },
    { count: totalListings },
    { count: activeListings },
    { count: totalProperties },
    { count: openTickets },
    { count: totalApplications },
    { data: recentPayments },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "landlord"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "renter"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["support", "admin"]),
    supabase.from("listings").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("properties").select("*", { count: "exact", head: true }),
    supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("payments")
      .select("amount, status, created_at")
      .eq("status", "completed")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const monthlyRevenue = recentPayments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  const kpis = [
    { label: "Total users",       value: totalUsers ?? 0,       icon: Users,       color: "text-blue-500",   bg: "bg-blue-500/10" },
    { label: "Landlords",         value: landlordCount ?? 0,    icon: UserCheck,   color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Renters",           value: renterCount ?? 0,      icon: Home,        color: "text-emerald-500",bg: "bg-emerald-500/10" },
    { label: "Properties",        value: totalProperties ?? 0,  icon: Building2,   color: "text-amber-500",  bg: "bg-amber-500/10" },
    { label: "Active listings",   value: activeListings ?? 0,   icon: TrendingUp,  color: "text-primary",    bg: "bg-primary/10" },
    { label: "Applications",      value: totalApplications ?? 0,icon: Users,       color: "text-cyan-500",   bg: "bg-cyan-500/10" },
    { label: "Revenue (30d)",     value: formatCurrency(monthlyRevenue), icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Open tickets",      value: openTickets ?? 0,      icon: Headphones,  color: openTickets ? "text-destructive" : "text-muted-foreground", bg: openTickets ? "bg-destructive/10" : "bg-secondary" },
  ];

  const ROLE_COLORS: Record<string, string> = {
    admin:   "bg-primary/10 text-primary",
    support: "bg-violet-500/10 text-violet-600",
    landlord:"bg-amber-500/10 text-amber-600",
    renter:  "bg-emerald-500/10 text-emerald-600",
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time stats across all users, listings, and support
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</span>
                <div className={`w-7 h-7 rounded-lg ${k.bg} flex items-center justify-center`}>
                  <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent signups */}
        <Card>
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Recent signups</h2>
          </div>
          <div className="divide-y divide-border">
            {!recentUsers?.length && (
              <p className="px-5 py-6 text-sm text-muted-foreground">No users yet</p>
            )}
            {recentUsers?.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold shrink-0">
                  {(u.full_name ?? u.email ?? "?").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? "bg-secondary text-muted-foreground"}`}>
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Breakdown */}
        <Card>
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">User breakdown</h2>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Landlords",    count: landlordCount ?? 0,  total: totalUsers ?? 1, color: "bg-amber-500" },
              { label: "Renters",      count: renterCount ?? 0,    total: totalUsers ?? 1, color: "bg-emerald-500" },
              { label: "Staff",        count: supportCount ?? 0,   total: totalUsers ?? 1, color: "bg-primary" },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold">{row.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${row.color}`}
                    style={{ width: `${Math.round((row.count / (totalUsers || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-border grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Total listings</p>
                <p className="font-semibold">{totalListings ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Active listings</p>
                <p className="font-semibold text-emerald-500">{activeListings ?? 0}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
