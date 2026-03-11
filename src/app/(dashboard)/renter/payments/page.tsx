import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreditCard, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PayRentButton } from "@/components/renter/pay-rent-button";
import { AutopayToggle } from "@/components/renter/autopay-toggle";

export default async function RenterPaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: activeLease }, { data: payments }] = await Promise.all([
    supabase
      .from("leases")
      .select(`
        *,
        properties(name, city, state),
        units(unit_number)
      `)
      .eq("renter_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("payments")
      .select("*")
      .eq("renter_id", user.id)
      .order("due_date", { ascending: false })
      .limit(20),
  ]);

  const pendingPayment = payments?.find((p: { status: string }) => p.status === "pending");

  const statusIcon: Record<string, { icon: typeof CheckCircle2; color: string }> = {
    completed: { icon: CheckCircle2, color: "text-green-400" },
    pending: { icon: Clock, color: "text-amber-400" },
    failed: { icon: AlertTriangle, color: "text-destructive" },
    processing: { icon: Clock, color: "text-blue-400" },
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-muted-foreground text-sm mt-1">Pay rent and track payment history</p>
      </div>

      {/* Active lease */}
      {activeLease && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold mb-0.5">Current lease</h2>
                <p className="text-sm text-muted-foreground">
                  {(activeLease.properties as { name?: string } | null)?.name} · Unit {(activeLease.units as { unit_number?: string } | null)?.unit_number}
                </p>
                <p className="text-2xl font-bold mt-3">{formatCurrency(activeLease.rent_amount)}/mo</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Due on the {activeLease.payment_due_day}th · {activeLease.late_fee_grace_days}d grace period
                </p>
              </div>

              <AutopayToggle
                leaseId={activeLease.id}
                enabled={activeLease.autopay_enabled}
              />
            </div>

            {pendingPayment && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium">Rent due {formatDate(pendingPayment.due_date)}</p>
                    <p className="font-bold text-lg">{formatCurrency(pendingPayment.amount)}</p>
                  </div>
                  <PayRentButton
                    paymentId={pendingPayment.id}
                    amount={pendingPayment.amount}
                    leaseId={activeLease.id}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!activeLease && (
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            <CreditCard className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No active lease found. Payment history will appear once you have a lease.</p>
          </CardContent>
        </Card>
      )}

      {/* Payment history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!payments?.length && (
            <div className="text-center py-8 text-muted-foreground text-sm">No payment history yet</div>
          )}
          <div className="divide-y divide-border">
            {payments?.map((p: {
              id: string;
              amount: number;
              type: string;
              status: string;
              due_date: string;
              paid_date?: string;
            }) => {
              const si = statusIcon[p.status] ?? statusIcon.pending;
              const Icon = si.icon;
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Icon className={`w-4 h-4 shrink-0 ${si.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">{p.type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {formatDate(p.due_date)}
                      {p.paid_date && ` · Paid ${formatDate(p.paid_date)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(p.amount)}</p>
                    <Badge
                      variant={p.status === "completed" ? "success" : p.status === "failed" ? "destructive" : "warning"}
                      className="text-xs"
                    >
                      {p.status}
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
