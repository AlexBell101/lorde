import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wrench } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils";
import { MaintenanceStatusUpdate } from "@/components/shared/maintenance-status-update";

export default async function LandlordMaintenancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: requests } = await supabase
    .from("maintenance_requests")
    .select(`
      *,
      properties(name, city, state),
      units(unit_number),
      profiles!maintenance_requests_renter_id_fkey(full_name, email)
    `)
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false });

  const open = requests?.filter((r: { status: string }) => r.status === "open") ?? [];
  const inProgress = requests?.filter((r: { status: string }) => r.status === "in_progress") ?? [];
  const completed = requests?.filter((r: { status: string }) => r.status === "completed") ?? [];

  const priorityConfig: Record<string, { variant: "default" | "warning" | "destructive"; label: string }> = {
    low: { variant: "default", label: "Low" },
    medium: { variant: "warning", label: "Medium" },
    high: { variant: "warning", label: "High" },
    emergency: { variant: "destructive", label: "Emergency" },
  };

  function RequestList({ items }: { items: typeof open }) {
    if (!items.length) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No requests here</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((r: {
          id: string;
          title: string;
          description: string;
          category: string;
          priority: string;
          status: string;
          created_at: string;
          scheduled_date?: string;
          photos: string[];
          profiles?: { full_name?: string; email?: string } | null;
          properties?: { name?: string } | null;
          units?: { unit_number?: string } | null;
        }) => {
          const pc = priorityConfig[r.priority] ?? priorityConfig.medium;
          return (
            <Card key={r.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{r.title}</h3>
                      <Badge variant={pc.variant}>{pc.label}</Badge>
                      <Badge variant="outline" className="capitalize text-xs">{r.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{r.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{(r.properties as { name?: string } | null)?.name} · Unit {(r.units as { unit_number?: string } | null)?.unit_number}</span>
                      <span>by {(r.profiles as { full_name?: string } | null)?.full_name}</span>
                      <span>{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                  <MaintenanceStatusUpdate requestId={r.id} currentStatus={r.status} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Maintenance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {open.length} open · {inProgress.length} in progress
        </p>
      </div>

      <Tabs defaultValue="open">
        <TabsList className="mb-6">
          <TabsTrigger value="open">Open ({open.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="open"><RequestList items={open} /></TabsContent>
        <TabsContent value="in_progress"><RequestList items={inProgress} /></TabsContent>
        <TabsContent value="completed"><RequestList items={completed} /></TabsContent>
      </Tabs>
    </div>
  );
}
