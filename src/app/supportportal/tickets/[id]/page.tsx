"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { formatDate, formatRelativeTime, getInitials } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

type Ticket = {
  id: string; subject: string; body: string; status: string; priority: string;
  category: string; created_at: string; updated_at: string;
  user: { id: string; full_name: string; email: string; role: string } | null;
  agent: { full_name: string } | null;
};
type Message = {
  id: string; body: string; created_at: string;
  sender: { full_name: string; role: string } | null;
  sender_id: string;
};

const STATUS_OPTIONS = ["open", "in_progress", "resolved"] as const;
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"] as const;

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setCurrentUserId(user.id);

      const { data: t } = await supabase
        .from("support_tickets")
        .select(`*, user:profiles!support_tickets_user_id_fkey(id, full_name, email, role), agent:profiles!support_tickets_assigned_to_fkey(full_name)`)
        .eq("id", id)
        .single();

      setTicket(t as Ticket | null);

      const { data: msgs } = await supabase
        .from("support_messages")
        .select(`*, sender:profiles!support_messages_sender_id_fkey(full_name, role)`)
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });

      setMessages((msgs ?? []) as Message[]);
    }

    load();

    // Real-time message subscription
    const channel = supabase
      .channel(`ticket-messages:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${id}` },
        async (payload) => {
          const { data } = await supabase
            .from("support_messages")
            .select(`*, sender:profiles!support_messages_sender_id_fkey(full_name, role)`)
            .eq("id", payload.new.id).single();
          if (data) setMessages((prev) => [...prev, data as Message]);
        }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, router]);

  async function sendReply() {
    if (!reply.trim() || !currentUserId) return;
    setSending(true);
    const supabase = createClient();

    await supabase.from("support_messages").insert({
      ticket_id: id, sender_id: currentUserId, body: reply.trim(),
    });

    setReply("");
    setSending(false);
  }

  async function updateTicket(field: "status" | "priority", value: string) {
    const supabase = createClient();
    const { error } = await supabase.from("support_tickets")
      .update({ [field]: value }).eq("id", id);
    if (!error) {
      setTicket((prev) => prev ? { ...prev, [field]: value } : prev);
      toast({ title: `${field === "status" ? "Status" : "Priority"} updated`, variant: "success" });
    }
  }

  async function assignToMe() {
    if (!currentUserId) return;
    const supabase = createClient();
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", currentUserId).single();
    await supabase.from("support_tickets").update({ assigned_to: currentUserId }).eq("id", id);
    setTicket((prev) => prev ? { ...prev, agent: { full_name: (profile as { full_name?: string } | null)?.full_name ?? "You" } } : prev);
    toast({ title: "Ticket assigned to you", variant: "success" });
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ticketUser = ticket.user;

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b bg-card flex items-center gap-4 px-6 sticky top-0 z-10">
        <Link href="/supportportal" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Ticket queue
        </Link>
        <span className="text-border">|</span>
        <span className="text-sm font-medium truncate">{ticket.subject}</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Thread */}
        <div className="lg:col-span-2 space-y-6">
          {/* Original message */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                  {getInitials(ticketUser?.full_name ?? "U")}
                </div>
                <div>
                  <p className="text-sm font-medium">{ticketUser?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(ticket.created_at)}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{ticket.body}</p>
            </CardContent>
          </Card>

          {/* Messages */}
          {messages.map((msg) => {
            const isAgent = msg.sender?.role === "support";
            return (
              <div key={msg.id} className={`flex ${isAgent ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isAgent ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-secondary text-foreground rounded-tl-sm"}`}>
                  <p className="text-xs font-medium mb-1 opacity-70">{msg.sender?.full_name}</p>
                  <p className="text-sm">{msg.body}</p>
                  <p className={`text-[10px] mt-1.5 ${isAgent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {formatRelativeTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Reply input */}
          <div className="flex gap-3 pt-2">
            <Input
              placeholder="Reply to ticket…"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendReply()}
            />
            <Button onClick={sendReply} disabled={sending || !reply.trim()} size="icon">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm">Ticket actions</h3>

              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Status</p>
                <Select value={ticket.status} onValueChange={(v) => updateTicket("status", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Priority</p>
                <Select value={ticket.priority} onValueChange={(v) => updateTicket("priority", v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Assigned to</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm flex-1">{ticket.agent?.full_name ?? "Unassigned"}</p>
                  {!ticket.agent && (
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={assignToMe}>
                      Assign to me
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requester */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm">Requester</h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                  {getInitials(ticketUser?.full_name ?? "U")}
                </div>
                <div>
                  <p className="text-sm font-medium">{ticketUser?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{ticketUser?.email}</p>
                </div>
              </div>
              <Badge variant="secondary" className="capitalize">{ticketUser?.role}</Badge>
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize">{ticket.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(ticket.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{formatDate(ticket.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
