"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toaster";

interface AutopayToggleProps {
  leaseId: string;
  enabled: boolean;
}

export function AutopayToggle({ leaseId, enabled }: AutopayToggleProps) {
  const router = useRouter();
  const [value, setValue] = useState(enabled);
  const [loading, setLoading] = useState(false);

  async function toggle(checked: boolean) {
    setLoading(true);
    setValue(checked);
    const supabase = createClient();
    const { error } = await supabase
      .from("leases")
      .update({ autopay_enabled: checked })
      .eq("id", leaseId);

    if (error) {
      setValue(!checked);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: checked ? "Autopay enabled" : "Autopay disabled",
        description: checked
          ? "Rent will be paid automatically on the due date."
          : "You'll need to pay manually each month.",
        variant: "success",
      });
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Autopay</span>
      <Switch checked={value} onCheckedChange={toggle} disabled={loading} />
    </div>
  );
}
