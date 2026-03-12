import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Headphones, ExternalLink, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

const PRIORITY_CONFIG: Record<string, { label: string; variant: "default" | "warning" | "destructive" | "secondary" }> = {
  low:    { label: "Low",     variant: "secondary" },
  medium: { label: "Medium",  variant: "warning" },
  high:   { label: "High",    variant: "warning" },
  urgent: { label: "Urgent",  variant: "destructive" },
};

const STATUS_ICON: Record<string, typeof Clock> = {
  open:        Clock,
  in_progress: AlertTriangle,
  resolved:    CheckCircle2,
};

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const { status } = await searchParams;

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select(`
      id, subject, status, priority, category, created_at,
      user:profiles!support_tickets_user_id_fkey(full_name, email, role),
      agent:profiles!support_tickets_assigned_to_fkey(full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  const filtered = (tickets ?? []).filter((t) =>
    !status || status === "all" ? true : t.status === status
  );

  const counts = {
    all:         (tickets ?? []).length,
    open:        (tickets ?? []).filter((t) => t.status === "open").length,
    in_progress: (tickets ?? []).filter((t) => t.status === "in_progress").length,
    resolved:    (tickets ?? []).filter((t) => t.status === "resolved").length,
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {counts.open} open · {counts.in_progress} in progress · {counts.resolved} resolved
          </p>
        </div>
        <Link
          href="/supportportal"
          target="_blank"
          className="flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Headphones className="w-4 h-4" />
          Open support portal
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["all", "open", "in_progress", "resolved"] as const).map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/support" : `/admin/support?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ${
              (status ?? "all") === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {s.replace("_", " ")}
            <span className="opacity-60 text-xs ml-1">({counts[s]})</span>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {!filtered.length && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No tickets match this filter</p>
            </div>
          )}
          <div className="divide-y divide-border">
            {filtered.map((t) => {
              const pc = PRIORITY_CONFIG[t.priority] ?? PRIORITY_CONFIG.low;
              const StatusIcon = STATUS_ICON[t.status] ?? Clock;
              const ticketUser = t.user as { full_name?: string; email?: string; role?: string } | null;
              const agent = t.agent as { full_name?: string } | null;

              return (
                <Link
                  key={t.id}
                  href={`/supportportal/tickets/${t.id}`}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-secondary/50 transition-colors block"
                >
                  <div className="mt-0.5 shrink-0">
                    <Badge variant={pc.variant}>{pc.label}</Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ticketUser?.full_name ?? ticketUser?.email ?? "Unknown"}
                      {ticketUser?.role && <span className="capitalize"> · {ticketUser.role}</span>}
                      {" · "}{t.category}
                    </p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(t.created_at)}</span>
                      {agent?.full_name && <span>→ {agent.full_name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusIcon className={`w-3.5 h-3.5 ${
                      t.status === "resolved" ? "text-green-500"
                      : t.status === "in_progress" ? "text-amber-500"
                      : "text-muted-foreground"
                    }`} />
                    <span className="text-xs text-muted-foreground capitalize">{t.status.replace("_", " ")}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
