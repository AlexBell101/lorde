import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Headphones, AlertTriangle, Clock, CheckCircle2, Building2 } from "lucide-react";

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low:    { label: "Low",    className: "bg-secondary text-secondary-foreground" },
  medium: { label: "Medium", className: "bg-amber-400/10 text-amber-600" },
  high:   { label: "High",   className: "bg-orange-500/10 text-orange-600" },
  urgent: { label: "Urgent", className: "bg-destructive/10 text-destructive" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock }> = {
  open:        { label: "Open",        icon: Clock },
  in_progress: { label: "In Progress", icon: AlertTriangle },
  resolved:    { label: "Resolved",    icon: CheckCircle2 },
};

export default async function SupportPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("role, full_name").eq("id", user.id).single();

  if (profile?.role !== "support") {
    redirect("/");
  }

  const { status, priority } = await searchParams;

  let query = supabase
    .from("support_tickets")
    .select(`
      *,
      user:profiles!support_tickets_user_id_fkey(full_name, email, role),
      agent:profiles!support_tickets_assigned_to_fkey(full_name)
    `)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  const { data: tickets } = await query;

  const counts = {
    all:         tickets?.length ?? 0,
    open:        tickets?.filter((t) => t.status === "open").length ?? 0,
    in_progress: tickets?.filter((t) => t.status === "in_progress").length ?? 0,
    resolved:    tickets?.filter((t) => t.status === "resolved").length ?? 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <span className="font-semibold">Lorde</span>
          <span className="text-muted-foreground mx-2">/</span>
          <span className="text-sm font-medium">Support Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{profile?.full_name}</span>
          <Badge variant="secondary">Support</Badge>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Headphones className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Ticket Queue</h1>
            <p className="text-sm text-muted-foreground">{counts.open} open · {counts.in_progress} in progress · {counts.resolved} resolved</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { label: "All", value: undefined, count: counts.all },
            { label: "Open", value: "open", count: counts.open },
            { label: "In Progress", value: "in_progress", count: counts.in_progress },
            { label: "Resolved", value: "resolved", count: counts.resolved },
          ].map((f) => (
            <Link
              key={f.label}
              href={f.value ? `/supportportal?status=${f.value}` : "/supportportal"}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                status === f.value || (!status && !f.value)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-xs opacity-70">({f.count})</span>
            </Link>
          ))}

          <span className="mx-2 text-border">|</span>

          {["low", "medium", "high", "urgent"].map((p) => (
            <Link
              key={p}
              href={`/supportportal?priority=${p}${status ? `&status=${status}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors border ${
                priority === p
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>

        {/* Ticket list */}
        {!tickets?.length && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold mb-1">All clear</h3>
            <p className="text-sm text-muted-foreground">No tickets match the current filters.</p>
          </div>
        )}

        <div className="space-y-3">
          {(tickets ?? []).map((ticket) => {
            const pc = PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.low;
            const sc = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
            const StatusIcon = sc.icon;
            const ticketUser = ticket.user as { full_name?: string; email?: string; role?: string } | null;
            const agent = ticket.agent as { full_name?: string } | null;

            return (
              <Link key={ticket.id} href={`/supportportal/tickets/${ticket.id}`}>
                <Card className="hover:border-primary/40 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`mt-0.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${pc.className}`}>
                        {pc.label}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-sm">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {ticketUser?.full_name ?? "Unknown"} · <span className="capitalize">{ticketUser?.role}</span> · {ticket.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <StatusIcon className={`w-3.5 h-3.5 ${ticket.status === "resolved" ? "text-green-500" : ticket.status === "in_progress" ? "text-amber-500" : "text-muted-foreground"}`} />
                            <span className="text-xs text-muted-foreground">{sc.label}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{formatDate(ticket.created_at)}</span>
                          {agent?.full_name && <span>Assigned to {agent.full_name}</span>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
