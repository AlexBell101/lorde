import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  FileText, Calendar, DollarSign, MapPin,
  CheckCircle2, Clock, Home, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function RenterLeasePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "renter") redirect("/landlord");

  const { data: leases } = await supabase
    .from("leases")
    .select(`
      *,
      properties(name, address, city, state, zip_code, photos),
      units(unit_number, bedrooms, bathrooms, square_feet),
      profiles!leases_landlord_id_fkey(full_name, email, phone)
    `)
    .eq("renter_id", user.id)
    .order("start_date", { ascending: false });

  const activeLease = leases?.find((l) => l.status === "active") ?? null;
  const pastLeases = leases?.filter((l) => l.status !== "active") ?? [];

  type LeaseRow = {
    id: string;
    start_date: string;
    end_date: string;
    rent_amount: number;
    deposit_amount: number;
    status: string;
    payment_due_day: number;
    late_fee_amount: number;
    late_fee_grace_days: number;
    autopay_enabled: boolean;
    properties?: {
      name?: string;
      address?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      photos?: string[];
    } | null;
    units?: {
      unit_number?: string;
      bedrooms?: number;
      bathrooms?: number;
      square_feet?: number;
    } | null;
    profiles?: {
      full_name?: string;
      email?: string;
      phone?: string;
    } | null;
  };

  function daysRemaining(endDate: string) {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function LeaseCard({ lease, active }: { lease: LeaseRow; active: boolean }) {
    const prop = lease.properties;
    const unit = lease.units;
    const landlord = lease.profiles;
    const photo = prop?.photos?.[0];
    const days = active ? daysRemaining(lease.end_date) : null;

    return (
      <Card className={active ? "border-primary/30 bg-primary/[0.02]" : ""}>
        <CardContent className="p-0 overflow-hidden">
          {/* Property photo strip */}
          {photo && (
            <div className="w-full h-32 overflow-hidden">
              <img
                src={photo}
                alt={prop?.name ?? "Property"}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-lg">{prop?.name ?? "Property"}</h2>
                  <Badge variant={active ? "success" : "secondary"}>
                    {active ? "Active" : lease.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {prop?.address}, {prop?.city}, {prop?.state} {prop?.zip_code}
                </div>
                {unit && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Unit {unit.unit_number}
                    {unit.bedrooms != null && ` · ${unit.bedrooms === 0 ? "Studio" : `${unit.bedrooms}BD`}/${unit.bathrooms}BA`}
                    {unit.square_feet && ` · ${unit.square_feet.toLocaleString()} sqft`}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold">{formatCurrency(lease.rent_amount)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
            </div>

            {/* Key details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-border mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Lease start</p>
                <p className="text-sm font-medium">{formatDate(lease.start_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Lease end</p>
                <p className="text-sm font-medium">{formatDate(lease.end_date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Deposit</p>
                <p className="text-sm font-medium">{formatCurrency(lease.deposit_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Rent due</p>
                <p className="text-sm font-medium">Day {lease.payment_due_day} of month</p>
              </div>
            </div>

            {/* Active lease extras */}
            {active && (
              <div className="space-y-3 mb-4">
                {/* Days remaining */}
                {days !== null && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    days > 60
                      ? "bg-green-500/10 text-green-700"
                      : days > 30
                      ? "bg-amber-500/10 text-amber-700"
                      : "bg-destructive/10 text-destructive"
                  }`}>
                    <Clock className="w-4 h-4" />
                    {days > 0
                      ? `${days} days remaining on lease`
                      : "Lease has ended — contact your landlord"}
                  </div>
                )}

                {/* Late fee policy */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-sm text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  Late fee: {formatCurrency(lease.late_fee_amount)} after {lease.late_fee_grace_days}-day grace period
                </div>

                {/* Autopay status */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  lease.autopay_enabled
                    ? "bg-green-500/10 text-green-700"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                  Autopay is {lease.autopay_enabled ? "enabled" : "disabled"}
                </div>
              </div>
            )}

            {/* Landlord contact */}
            {landlord && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2">Property manager</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{landlord.full_name}</p>
                    {landlord.email && (
                      <p className="text-xs text-muted-foreground">{landlord.email}</p>
                    )}
                  </div>
                  <Link
                    href="/messages"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Message <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Lease</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your current and past rental agreements
        </p>
      </div>

      {!leases?.length && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Home className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h2 className="font-semibold text-lg mb-2">No lease yet</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">
            Once a landlord approves your application, your lease details will appear here.
          </p>
          <Link
            href="/renter/search"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Browse listings <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {activeLease && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Current lease
          </h2>
          <LeaseCard lease={activeLease as LeaseRow} active />
        </div>
      )}

      {pastLeases.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Past leases
          </h2>
          <div className="space-y-3">
            {pastLeases.map((lease) => (
              <LeaseCard key={lease.id} lease={lease as LeaseRow} active={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
