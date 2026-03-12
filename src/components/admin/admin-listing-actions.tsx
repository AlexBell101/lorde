"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Play, Pause, Archive } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toaster";

interface AdminListingActionsProps {
  listingId: string;
  currentStatus: string;
}

export function AdminListingActions({ listingId, currentStatus }: AdminListingActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function setStatus(status: string) {
    const supabase = createClient();
    const { error } = await supabase.from("listings").update({ status }).eq("id", listingId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const labels: Record<string, string> = { active: "Activated", paused: "Paused", archived: "Archived" };
      toast({ title: labels[status] ?? "Updated", variant: "success" });
      router.refresh();
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
            {currentStatus !== "active" && (
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary w-full text-left transition-colors"
                onClick={() => setStatus("active")}
              >
                <Play className="w-3.5 h-3.5 text-emerald-500" />
                Activate
              </button>
            )}
            {currentStatus === "active" && (
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary w-full text-left transition-colors"
                onClick={() => setStatus("paused")}
              >
                <Pause className="w-3.5 h-3.5 text-amber-500" />
                Pause
              </button>
            )}
            {currentStatus !== "archived" && (
              <>
                <div className="border-t border-border" />
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary w-full text-left transition-colors text-destructive"
                  onClick={() => setStatus("archived")}
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
