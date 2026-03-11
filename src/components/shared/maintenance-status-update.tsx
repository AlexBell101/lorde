"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toaster";

interface MaintenanceStatusUpdateProps {
  requestId: string;
  currentStatus: string;
}

export function MaintenanceStatusUpdate({
  requestId,
  currentStatus,
}: MaintenanceStatusUpdateProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const transitions: Record<string, { label: string; next: string }> = {
    open: { label: "Start work", next: "in_progress" },
    in_progress: { label: "Mark complete", next: "completed" },
  };

  const transition = transitions[currentStatus];
  if (!transition) return null;

  async function update() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("maintenance_requests")
      .update({
        status: transition.next,
        ...(transition.next === "completed" ? { completed_date: new Date().toISOString() } : {}),
      })
      .eq("id", requestId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated", variant: "success" });
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <button
      onClick={update}
      disabled={loading}
      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
    >
      {loading ? "Updating…" : transition.label}
    </button>
  );
}
