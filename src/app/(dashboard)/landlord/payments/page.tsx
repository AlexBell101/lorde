import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreditCard, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function LandlordPaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: payments } = await supabase
    .from("payments")
    .select(`
      *,
      profiles!payments_renter_id_fkey(full_name, email),
      leases(rent_amount, properties(name), units(unit_number))
    `)
    .eq("landlord_id", user.id)
    .order("due_date", { ascending: false })
    .limit(50);

  const completed = payments?.filter((p: { status: string }) => p.status === "completed") ?? [];
  const pending = payments?.filter((p: { status: string }) => p.status === "pending") ?? [];
  const failed = payments?.filter((p: { status: string }) => p.status === "failed") ?? [];

  const totalCollected = completed.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);
  const totalPending = pending.reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);

  const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
    completed: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10", label: "Paid" },
    pending: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10", label: "Pending" },
    failed: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", label: "Failed" },
    processing: { icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-400/10", label: "Processing" },
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground text-sm mt-1">Track rent collection and payment history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Total collected</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(totalCollected)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-400">{formatCurrency(totalPending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Failed payments</p>
            <p className="text-2xl font-bold text-destructive">{failed.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!payments?.length && (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No payments yet</p>
            </div>
          )}
          <div className="divide-y divide-border">
            {payments?.map((p: {
              id: string;
              amount: number;
              type: string;
              status: string;
              due_date: string;
              paid_date?: string;
              profiles?: { full_name?: string; email?: string } | null;
              leases?: { rent_amount?: number; properties?: { name?: string } | null; units?: { unit_number?: string } | null } | null;
            }) => {
              const sc = statusConfig[p.status] ?? statusConfig.pending;
              const Icon = sc.icon;
              return (
                <div key={p.id} className="flex items-center gap-4 px-6 py-4">
                  <div className={`w-8 h-8 rounded-lg ${sc.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${sc.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {(p.profiles as { full_name?: string } | null)?.full_name ?? "Tenant"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {p.type} · Due {formatDate(p.due_date)}
                      {p.paid_date && ` · Paid ${formatDate(p.paid_date)}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{formatCurrency(p.amount)}</p>
                    <Badge variant={p.status === "completed" ? "success" : p.status === "failed" ? "destructive" : "warning"}>
                      {sc.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
