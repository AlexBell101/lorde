"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, Pause, Play, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toaster";

interface ListingActionsProps {
  listing: { id: string; status: string };
}

export function ListingActions({ listing }: ListingActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function updateStatus(status: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("listings")
      .update({ status })
      .eq("id", listing.id);

    const toastLabel: Record<string, string> = {
      active: "Listing published",
      paused: "Listing paused",
      archived: "Listing removed",
    };
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: toastLabel[status] ?? `Listing ${status}`, variant: "success" });
      router.refresh();
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
            <button
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary w-full text-left transition-colors"
              onClick={() => { setOpen(false); router.push(`/landlord/listings/${listing.id}`); }}
            >
              <Eye className="w-3.5 h-3.5" />
              View listing
            </button>

            {listing.status === "active" && (
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary w-full text-left transition-colors"
                onClick={() => updateStatus("paused")}
              >
                <Pause className="w-3.5 h-3.5" />
                Pause listing
              </button>
            )}

            {listing.status === "paused" && (
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary w-full text-left transition-colors"
                onClick={() => updateStatus("active")}
              >
                <Play className="w-3.5 h-3.5" />
                Activate listing
              </button>
            )}

            {listing.status === "draft" && (
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary w-full text-left transition-colors"
                onClick={() => updateStatus("active")}
              >
                <Play className="w-3.5 h-3.5" />
                Publish listing
              </button>
            )}

            <div className="border-t border-border" />
            <button
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary w-full text-left transition-colors text-destructive"
              onClick={() => updateStatus("archived")}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove listing
            </button>
          </div>
        </>
      )}
    </div>
  );
}
