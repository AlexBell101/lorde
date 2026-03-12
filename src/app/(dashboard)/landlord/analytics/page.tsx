import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  TrendingUp, Building2, Users, CreditCard,
  DollarSign, BarChart3, Clock, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { AnalyticsCharts } from "@/components/landlord/analytics-charts";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "landlord") redirect("/renter/search");

  // Get all property IDs for this landlord
  const { data: propertiesData } = await supabase
    .from("properties").select("id, name").eq("landlord_id", user.id);
  const propertyIds = propertiesData?.map((p) => p.id) ?? [];

  // Parallel data fetching
  const [
    { data: unitsData },
    { data: listingsData },
    { data: applicationsData },
    { data: paymentsData },
    { data: leasesData },
  ] = await Promise.all([
    // Units with status
    supabase.from("units")
      .select("id, status, bedrooms, rent_amount, property_id")
      .in("property_id", propertyIds.length ? propertyIds : [""]),

    // All listings (for vacancy/active duration)
    supabase.from("listings")
      .select("id, title, status, rent_amount, available_date, created_at")
      .in("property_id", propertyIds.length ? propertyIds : [""]),

    // Applications with timestamps
    supabase.from("applications")
      .select("id, status, created_at, updated_at, listing_id")
      .in("listing_id",
        supabase.from("listings").select("id")
          .in("property_id", propertyIds.length ? propertyIds : [""]) as unknown as string[]
      ),

    // Payments last 12 months
    supabase.from("payments")
      .select("id, amount, status, type, due_date, paid_date, created_at")
      .eq("landlord_id", user.id)
      .gte("due_date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order("due_date", { ascending: true }),

    // Active leases
    supabase.from("leases")
      .select("id, rent_amount, start_date, end_date, status")
      .eq("landlord_id", user.id),
  ]);

  // ── Computed metrics ──────────────────────────────────────────────

  const totalUnits = unitsData?.length ?? 0;
  const occupiedUnits = unitsData?.filter((u) => u.status === "occupied").length ?? 0;
  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  const activeListings = listingsData?.filter((l) => l.status === "active").length ?? 0;
  const totalApplications = applicationsData?.length ?? 0;
  const approvedApplications = applicationsData?.filter((a) => a.status === "approved").length ?? 0;
  const pendingApplications = applicationsData?.filter((a) => a.status === "submitted").length ?? 0;

  const monthlyRevenue = leasesData
    ?.filter((l) => l.status === "active")
    .reduce((sum, l) => sum + Number(l.rent_amount), 0) ?? 0;

  const paidOnTime = paymentsData?.filter(
    (p) => p.status === "completed" && p.paid_date && p.due_date && p.paid_date <= p.due_date
  ).length ?? 0;
  const totalCompleted = paymentsData?.filter((p) => p.status === "completed").length ?? 0;
  const onTimeRate = totalCompleted > 0 ? Math.round((paidOnTime / totalCompleted) * 100) : 0;

  // ── Monthly revenue chart data (last 6 months) ───────────────────
  const revenueByMonth: Record<string, number> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    revenueByMonth[key] = 0;
  }
  paymentsData
    ?.filter((p) => p.status === "completed")
    .forEach((p) => {
      const d = new Date(p.due_date);
      const key = d.toLocaleString("en-US", { month: "short", year: "2-digit" });
      if (key in revenueByMonth) revenueByMonth[key] += Number(p.amount);
    });
  const revenueChartData = Object.entries(revenueByMonth).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  // ── Application funnel chart data ─────────────────────────────────
  const funnelData = [
    { stage: "Received", count: totalApplications },
    { stage: "Pending", count: pendingApplications },
    { stage: "Approved", count: approvedApplications },
    { stage: "Rejected", count: applicationsData?.filter((a) => a.status === "rejected").length ?? 0 },
  ];

  // ── Occupancy by property ─────────────────────────────────────────
  const occupancyByProperty = (propertiesData ?? []).map((prop) => {
    const propUnits = unitsData?.filter((u) => u.property_id === prop.id) ?? [];
    const occupied = propUnits.filter((u) => u.status === "occupied").length;
    return {
      property: prop.name.length > 16 ? prop.name.slice(0, 14) + "…" : prop.name,
      occupancy: propUnits.length > 0 ? Math.round((occupied / propUnits.length) * 100) : 0,
      total: propUnits.length,
      occupied,
    };
  });

  const summaryStats = [
    {
      label: "Monthly revenue",
      value: formatCurrency(monthlyRevenue),
      sub: `${totalUnits} total units`,
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Occupancy rate",
      value: `${occupancyRate}%`,
      sub: `${vacantUnits} vacant`,
      icon: Building2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active listings",
      value: activeListings,
      sub: `${pendingApplications} pending apps`,
      icon: TrendingUp,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "On-time payments",
      value: `${onTimeRate}%`,
      sub: `${totalCompleted} collected`,
      icon: CreditCard,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Portfolio performance at a glance
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryStats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {s.label}
                </span>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts — client component */}
      <AnalyticsCharts
        revenueChartData={revenueChartData}
        funnelData={funnelData}
        occupancyByProperty={occupancyByProperty}
      />

      {/* Application pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Application pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {funnelData.map((f) => (
              <div key={f.stage} className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-20 shrink-0">{f.stage}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{
                      width: totalApplications > 0
                        ? `${Math.round((f.count / totalApplications) * 100)}%`
                        : "0%",
                    }}
                  />
                </div>
                <span className="text-sm font-semibold w-6 text-right">{f.count}</span>
              </div>
            ))}
            {totalApplications === 0 && (
              <p className="text-sm text-muted-foreground">No applications yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Unit breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 justify-center py-2">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-500">{occupiedUnits}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Occupied
                </div>
              </div>
              <div className="text-muted-foreground text-2xl font-light">·</div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-500">{vacantUnits}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3 text-amber-500" />
                  Vacant
                </div>
              </div>
            </div>
            {/* Occupancy bar */}
            <div className="mt-4 bg-muted rounded-full h-3">
              <div
                className="h-3 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {occupancyRate}% occupied across {totalUnits} units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4 justify-center py-2">
              <div className="text-center">
                <div className="text-3xl font-bold">{onTimeRate}%</div>
                <p className="text-xs text-muted-foreground mt-1">On-time rate</p>
              </div>
            </div>
            <div className="mt-4 bg-muted rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${onTimeRate}%`,
                  backgroundColor: onTimeRate >= 80 ? "#22c55e" : onTimeRate >= 60 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              {paidOnTime} of {totalCompleted} payments on time
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
