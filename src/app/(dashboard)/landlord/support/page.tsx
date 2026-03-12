"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";

const schema = z.object({
  category: z.string().min(1),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  body: z.string().min(20, "Please describe your issue in more detail"),
});

type FormData = z.infer<typeof schema>;

type Ticket = {
  id: string; category: string; subject: string; status: string;
  priority: string; created_at: string; updated_at: string;
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  open:        { label: "Open",        icon: Clock,          className: "text-amber-500" },
  in_progress: { label: "In Progress", icon: AlertCircle,    className: "text-blue-500" },
  resolved:    { label: "Resolved",    icon: CheckCircle2,   className: "text-green-500" },
};

export default function RenterSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    const res = await fetch("/api/support/tickets");
    const { tickets } = await res.json();
    setTickets(tickets ?? []);
    setLoading(false);
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    const res = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      toast({ title: "Failed to submit ticket", description: json.error, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    toast({ title: "Support ticket submitted!", description: "We'll get back to you shortly.", variant: "success" });
    reset();
    setOpen(false);
    setTickets((prev) => [json.ticket, ...prev]);
    setSubmitting(false);
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Support</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Get help from the Lorde team
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit a support request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select onValueChange={(v) => setValue("category", v)}>
                  <SelectTrigger><SelectValue placeholder="What is this about?" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="application">Application</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input placeholder="Brief description of your issue" {...register("subject")} />
                {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Details</Label>
                <Textarea
                  placeholder="Describe your issue in detail. Include any relevant dates, amounts, or listing info."
                  rows={5}
                  {...register("body")}
                />
                {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit ticket
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && !tickets.length && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold mb-2">No support tickets yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            If you need help, open a ticket and our team will respond shortly.
          </p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Open a ticket
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {tickets.map((ticket) => {
          const sc = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
          const StatusIcon = sc.icon;

          return (
            <Card key={ticket.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{ticket.subject}</p>
                      <Badge variant="secondary" className="capitalize text-xs">{ticket.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Opened {formatDate(ticket.created_at)} · Last updated {formatDate(ticket.updated_at)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${sc.className}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {sc.label}
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
