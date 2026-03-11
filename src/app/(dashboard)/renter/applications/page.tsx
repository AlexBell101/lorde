import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function RenterApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: applications } = await supabase
    .from("applications")
    .select(`
      *,
      listings(
        id, title, rent_amount, available_date,
        properties(name, city, state, photos),
        units(bedrooms, bathrooms, unit_number)
      )
    `)
    .eq("renter_id", user.id)
    .order("created_at", { ascending: false });

  const statusConfig: Record<string, {
    icon: typeof Clock;
    color: string;
    bg: string;
    variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
    label: string;
  }> = {
    draft: { icon: Clock, color: "text-muted-foreground", bg: "bg-secondary", variant: "secondary", label: "Draft" },
    submitted: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", variant: "warning", label: "Submitted" },
    under_review: { icon: Clock, color: "text-blue-400", bg: "bg-blue-400/10", variant: "default", label: "Under Review" },
    approved: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10", variant: "success", label: "Approved!" },
    rejected: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", variant: "destructive", label: "Rejected" },
    withdrawn: { icon: XCircle, color: "text-muted-foreground", bg: "bg-secondary", variant: "outline", label: "Withdrawn" },
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">My Applications</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {applications?.length ?? 0} application{applications?.length !== 1 ? "s" : ""} submitted
        </p>
      </div>

      {!applications?.length && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold mb-2">No applications yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Start searching for apartments and apply to listings you&apos;re interested in.
          </p>
          <Link href="/renter/search">
            <Badge variant="default" className="cursor-pointer px-4 py-2 text-sm">Search listings</Badge>
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {applications?.map((app: {
          id: string;
          status: string;
          created_at: string;
          monthly_income: number;
          move_in_date: string;
          listings?: {
            id: string;
            title: string;
            rent_amount: number;
            available_date: string;
            properties?: { name?: string; city?: string; state?: string; photos?: string[] } | null;
            units?: { bedrooms?: number; bathrooms?: number; unit_number?: string } | null;
          } | null;
        }) => {
          const sc = statusConfig[app.status] ?? statusConfig.submitted;
          const Icon = sc.icon;
          const listing = app.listings;

          return (
            <Card key={app.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {(listing?.properties as { photos?: string[] } | null)?.photos?.[0] ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={(listing?.properties as { photos?: string[] } | null)?.photos?.[0] ?? ""}
                        alt={listing?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-secondary shrink-0 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div>
                        <h3 className="font-semibold">{listing?.title ?? "Unknown listing"}</h3>
                        <p className="text-sm text-muted-foreground">
                          {(listing?.properties as { name?: string } | null)?.name} · {(listing?.properties as { city?: string; state?: string } | null)?.city}, {(listing?.properties as { state?: string } | null)?.state}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg}`}
                      >
                        <Icon className={`w-3 h-3 ${sc.color}`} />
                        <span className={sc.color}>{sc.label}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly rent</p>
                        <p className="font-medium">{formatCurrency(listing?.rent_amount ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Move-in date</p>
                        <p className="font-medium">{formatDate(app.move_in_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Applied</p>
                        <p className="font-medium">{formatDate(app.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
