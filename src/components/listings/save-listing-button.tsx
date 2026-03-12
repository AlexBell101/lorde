"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

interface SaveListingButtonProps {
  listingId: string;
  initialSaved?: boolean;
  /** compact = small icon-only button (for cards); default = full pill button */
  variant?: "compact" | "default";
  className?: string;
  onUnsave?: () => void; // callback when unsaved (e.g. remove from saved page)
}

export function SaveListingButton({
  listingId,
  initialSaved = false,
  variant = "compact",
  className,
  onUnsave,
}: SaveListingButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    const prev = saved;
    setSaved(!saved); // optimistic

    try {
      const res = await fetch(`/api/listings/${listingId}/save`, {
        method: "POST",
      });
      const json = await res.json();

      if (!res.ok) {
        setSaved(prev); // revert
        toast({ title: "Error", description: json.error, variant: "destructive" });
      } else {
        setSaved(json.saved);
        if (!json.saved) {
          toast({ title: "Removed from saved", variant: "default" });
          onUnsave?.();
        } else {
          toast({ title: "Saved!", description: "Find it in your Saved listings.", variant: "success" });
        }
      }
    } catch {
      setSaved(prev); // revert on network error
    } finally {
      setLoading(false);
    }
  }

  if (variant === "default") {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
          saved
            ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
            : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary",
          className
        )}
      >
        <Heart
          className={cn("w-4 h-4 transition-all", saved && "fill-rose-500 text-rose-500")}
        />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  // compact: icon-only, intended to float over a card image
  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm",
        saved
          ? "bg-white text-rose-500"
          : "bg-black/40 text-white hover:bg-black/60",
        className
      )}
      title={saved ? "Unsave" : "Save"}
    >
      <Heart
        className={cn(
          "w-4 h-4 transition-all",
          saved && "fill-rose-500 text-rose-500"
        )}
      />
    </button>
  );
}
