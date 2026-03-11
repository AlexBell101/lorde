import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Building2,
  Users,
  CreditCard,
  Wrench,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function LandlordDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "landlord") redirect("/renter/search");

  // Fetch summary stats in parallel
  const [
    { count: propertyCount },
    { count: unitCount },
    { count: activeListings },
    { count: openApplications },
    { data: recentPayments },
    { data: openMaintenance },
    { data: activeLeasesData },
  ] = await Promise.all([
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("landlord_id", user.id),
    supabase.from("units").select("units.id", { count: "exact", head: true })
      .eq("properties.landlord_id", user.id),
    supabase.from("listings").select("id", { count: "exact", head: true })
      .eq("status", "active")
      .in("property_id", supabase.from("properties").select("id").eq("landlord_id", user.id) as unknown as string[]),
    supabase.from("applications").select("id", { count: "exact", head: true })
      .eq("status", "submitted")
      .in("listing_id", supabase.from("listings")
        .select("id")
        .in("property_id", supabase.from("properties").select("id").eq("landlord_id", user.id) as unknown as string[]) as unknown as string[]),
    supabase.from("payments")
      .select("id, amount, type, status, due_date, paid_date, renter_id, profiles!payments_renter_id_fkey(full_name)")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("maintenance_requests")
      .select("id, title, priority, status, created_at, properties(name)")
      .eq("landlord_id", user.id)
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("leases")
      .select("rent_amount")
      .eq("landlord_id", user.id)
      .eq("status", "active"),
  ]);

  const monthlyIncome = activeLeasesData?.reduce(
    (sum, l) => sum + Number(l.rent_amount),
    0
  ) ?? 0;

  const stats = [
    {
      label: "Properties",
      value: propertyCount ?? 0,
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Active listings",
      value: activeListings ?? 0,
      icon: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Open applications",
      value: openApplications ?? 0,
      icon: Users,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "Monthly income",
      value: formatCurrency(monthlyIncome),
      icon: CreditCard,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  const priorityConfig: Record<string, { label: string; variant: "default" | "warning" | "destructive" }> = {
    low: { label: "Low", variant: "default" },
    medium: { label: "Medium", variant: "warning" },
    high: { label: "High", variant: "warning" },
    emergency: { label: "Emergency", variant: "destructive" },
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your rental portfolio
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent payments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Recent payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!recentPayments?.length && (
              <p className="text-sm text-muted-foreground">No payments yet</p>
            )}
            {(recentPayments as unknown as Array<{
              id: string;
              amount: number;
              type: string;
              status: string;
              due_date: string;
              paid_date?: string;
              renter_id: string;
              profiles?: { full_name?: string } | null;
            }>)?.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      p.status === "completed"
                        ? "bg-green-400/10"
                        : p.status === "failed"
                        ? "bg-destructive/10"
                        : "bg-amber-400/10"
                    }`}
                  >
                    {p.status === "completed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    ) : p.status === "failed" ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {(p.profiles as { full_name?: string } | null)?.full_name ?? "Tenant"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{p.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.due_date)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Maintenance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Open maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!openMaintenance?.length && (
              <p className="text-sm text-muted-foreground">No open requests</p>
            )}
            {(openMaintenance as unknown as Array<{
              id: string;
              title: string;
              priority: string;
              status: string;
              created_at: string;
              properties?: { name?: string } | null;
            }>)?.map((m) => {
              const pc = priorityConfig[m.priority] ?? priorityConfig.medium;
              return (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {(m.properties as { name?: string } | null)?.name} · {formatDate(m.created_at)}
                    </p>
                  </div>
                  <Badge variant={pc.variant} className="ml-3 shrink-0">
                    {pc.label}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
