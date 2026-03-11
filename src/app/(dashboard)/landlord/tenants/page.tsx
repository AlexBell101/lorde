import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function TenantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const landlordProps = supabase.from("properties").select("id").eq("landlord_id", user.id);

  const [{ data: applications }, { data: leases }] = await Promise.all([
    supabase
      .from("applications")
      .select(`
        *,
        listings(title, rent_amount, properties(name, city, state)),
        profiles!applications_renter_id_fkey(full_name, email, phone)
      `)
      .in("listing_id",
        supabase.from("listings").select("id").in("property_id", landlordProps as unknown as string[]) as unknown as string[]
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("leases")
      .select(`
        *,
        properties(name, city, state),
        units(unit_number),
        profiles!leases_renter_id_fkey(full_name, email, phone)
      `)
      .eq("landlord_id", user.id)
      .eq("status", "active")
      .order("start_date", { ascending: false }),
  ]);

  const pending = applications?.filter((a: { status: string }) => a.status === "submitted") ?? [];
  const underReview = applications?.filter((a: { status: string }) => a.status === "under_review") ?? [];

  const statusIcon: Record<string, React.ReactNode> = {
    submitted: <Clock className="w-3.5 h-3.5 text-amber-400" />,
    under_review: <Clock className="w-3.5 h-3.5 text-blue-400" />,
    approved: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
    rejected: <XCircle className="w-3.5 h-3.5 text-destructive" />,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Applications, screening, and active leases
        </p>
      </div>

      <Tabs defaultValue="applications">
        <TabsList className="mb-6">
          <TabsTrigger value="applications">
            Applications{pending.length > 0 && <span className="ml-1.5 bg-primary text-primary-foreground rounded-full text-[10px] px-1.5 py-0.5">{pending.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="leases">Active leases</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-3">
          {!applications?.length && (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No applications yet</p>
            </div>
          )}
          {applications?.map((app: {
            id: string;
            status: string;
            monthly_income: number;
            credit_score_range: string;
            move_in_date: string;
            created_at: string;
            employment_status: string;
            screening_status: string;
            listings?: { title?: string; rent_amount?: number; properties?: { name?: string; city?: string; state?: string } | null } | null;
            profiles?: { full_name?: string; email?: string; phone?: string } | null;
          }) => (
            <Card key={app.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{(app.profiles as { full_name?: string } | null)?.full_name ?? "Applicant"}</h3>
                      <span className="flex items-center gap-1">
                        {statusIcon[app.status] ?? statusIcon.submitted}
                        <Badge variant="outline" className="text-xs capitalize">{app.status.replace("_", " ")}</Badge>
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(app.profiles as { email?: string } | null)?.email}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      For: {(app.listings as { title?: string } | null)?.title}
                    </p>

                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Monthly income</p>
                        <p className="font-medium">{formatCurrency(app.monthly_income)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Credit range</p>
                        <p className="font-medium">{app.credit_score_range}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Move-in date</p>
                        <p className="font-medium">{formatDate(app.move_in_date)}</p>
                      </div>
                    </div>
                  </div>

                  {app.status === "submitted" && (
                    <div className="flex gap-2 shrink-0">
                      <ApplicationAction appId={app.id} action="under_review" label="Review" />
                    </div>
                  )}
                  {app.status === "under_review" && (
                    <div className="flex gap-2 shrink-0">
                      <ApplicationAction appId={app.id} action="approved" label="Approve" variant="success" />
                      <ApplicationAction appId={app.id} action="rejected" label="Reject" variant="destructive" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="leases" className="space-y-3">
          {!leases?.length && (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No active leases</p>
            </div>
          )}
          {leases?.map((lease: {
            id: string;
            start_date: string;
            end_date: string;
            rent_amount: number;
            autopay_enabled: boolean;
            properties?: { name?: string; city?: string; state?: string } | null;
            units?: { unit_number?: string } | null;
            profiles?: { full_name?: string; email?: string } | null;
          }) => (
            <Card key={lease.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{(lease.profiles as { full_name?: string } | null)?.full_name ?? "Tenant"}</h3>
                    <p className="text-sm text-muted-foreground">{(lease.profiles as { email?: string } | null)?.email}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {(lease.properties as { name?: string } | null)?.name} · Unit {(lease.units as { unit_number?: string } | null)?.unit_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(lease.rent_amount)}/mo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(lease.start_date)} – {formatDate(lease.end_date)}
                    </p>
                    {lease.autopay_enabled && (
                      <Badge variant="success" className="mt-1">Autopay on</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Server-side action component (simple form)
function ApplicationAction({
  appId,
  action,
  label,
  variant = "default",
}: {
  appId: string;
  action: string;
  label: string;
  variant?: "default" | "success" | "destructive";
}) {
  const colorMap: Record<string, string> = {
    default: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    success: "bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30",
    destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30",
  };

  return (
    <form action={`/api/applications/${appId}`} method="POST">
      <input type="hidden" name="status" value={action} />
      <button
        type="submit"
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${colorMap[variant]}`}
      >
        {label}
      </button>
    </form>
  );
}
