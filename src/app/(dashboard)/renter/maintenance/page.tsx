import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { NewMaintenanceRequest } from "@/components/renter/new-maintenance-request";

export default async function RenterMaintenancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: lease }, { data: requests }] = await Promise.all([
    supabase
      .from("leases")
      .select("id, property_id, unit_id, landlord_id, properties(name), units(unit_number)")
      .eq("renter_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("maintenance_requests")
      .select("*")
      .eq("renter_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const statusConfig: Record<string, { variant: "default" | "warning" | "success" | "outline"; label: string }> = {
    open: { variant: "warning", label: "Open" },
    in_progress: { variant: "default", label: "In Progress" },
    completed: { variant: "success", label: "Completed" },
    cancelled: { variant: "outline", label: "Cancelled" },
  };

  const priorityConfig: Record<string, { variant: "default" | "warning" | "destructive" | "outline"; label: string }> = {
    low: { variant: "outline", label: "Low" },
    medium: { variant: "warning", label: "Medium" },
    high: { variant: "warning", label: "High" },
    emergency: { variant: "destructive", label: "Emergency" },
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground text-sm mt-1">Submit and track maintenance requests</p>
        </div>
        {lease && (
          <NewMaintenanceRequest
            leaseId={lease.id}
            propertyId={lease.property_id}
            unitId={lease.unit_id}
            landlordId={lease.landlord_id}
          />
        )}
      </div>

      {!lease && (
        <Card className="mb-6">
          <CardContent className="p-6 text-center text-muted-foreground text-sm">
            You need an active lease to submit maintenance requests.
          </CardContent>
        </Card>
      )}

      {!requests?.length && (
        <div className="text-center py-16">
          <Wrench className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No maintenance requests yet</p>
        </div>
      )}

      <div className="space-y-3">
        {requests?.map((r: {
          id: string;
          title: string;
          description: string;
          category: string;
          priority: string;
          status: string;
          created_at: string;
          scheduled_date?: string;
          completed_date?: string;
        }) => {
          const sc = statusConfig[r.status] ?? statusConfig.open;
          const pc = priorityConfig[r.priority] ?? priorityConfig.medium;

          return (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold">{r.title}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={pc.variant} className="text-xs">{pc.label}</Badge>
                    <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{r.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="capitalize">{r.category}</span>
                  <span>Submitted {formatDate(r.created_at)}</span>
                  {r.scheduled_date && <span>Scheduled {formatDate(r.scheduled_date)}</span>}
                  {r.completed_date && <span className="text-green-400">Completed {formatDate(r.completed_date)}</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
