"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/utils";

interface PayRentButtonProps {
  paymentId: string;
  amount: number;
  leaseId: string;
}

export function PayRentButton({ paymentId, amount, leaseId }: PayRentButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, leaseId, amount }),
      });

      const { url, error } = await res.json();

      if (error) {
        toast({ title: "Payment error", description: error, variant: "destructive" });
        setLoading(false);
        return;
      }

      if (url) {
        window.location.href = url;
      }
    } catch {
      toast({ title: "Payment failed", description: "Please try again.", variant: "destructive" });
      setLoading(false);
    }
  }

  return (
    <Button onClick={handlePay} disabled={loading}>
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      Pay {formatCurrency(amount)}
    </Button>
  );
}
