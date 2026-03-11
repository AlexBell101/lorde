// Supabase Edge Function: late-fees
// Runs daily to assess late fees for overdue payments
// Schedule: "0 10 * * *" (10am daily)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (_req) => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const today = new Date();

  // Find overdue payments past grace period
  const { data: overduePayments } = await supabase
    .from("payments")
    .select(`
      id, amount, due_date, lease_id, renter_id, landlord_id,
      leases(late_fee_amount, late_fee_grace_days, late_fee_enabled:autopay_enabled)
    `)
    .eq("status", "pending")
    .eq("type", "rent")
    .lt("due_date", today.toISOString().split("T")[0]);

  let feesAssessed = 0;

  for (const payment of overduePayments ?? []) {
    const lease = payment.leases as {
      late_fee_amount?: number;
      late_fee_grace_days?: number;
    } | null;

    if (!lease?.late_fee_amount) continue;

    const dueDate = new Date(payment.due_date);
    const gracePeriodEnd = new Date(dueDate);
    gracePeriodEnd.setDate(dueDate.getDate() + (lease.late_fee_grace_days ?? 5));

    if (today > gracePeriodEnd) {
      // Check if a late fee already exists for this payment
      const { data: existingFee } = await supabase
        .from("payments")
        .select("id")
        .eq("lease_id", payment.lease_id)
        .eq("type", "late_fee")
        .eq("due_date", payment.due_date)
        .maybeSingle();

      if (!existingFee) {
        // Create late fee payment
        await supabase.from("payments").insert({
          lease_id: payment.lease_id,
          renter_id: payment.renter_id,
          landlord_id: payment.landlord_id,
          amount: lease.late_fee_amount,
          type: "late_fee",
          status: "pending",
          due_date: today.toISOString().split("T")[0],
          notes: `Late fee for rent due ${payment.due_date}`,
        });
        feesAssessed++;
      }
    }
  }

  console.log(`Late fees assessed: ${feesAssessed}`);

  return new Response(
    JSON.stringify({ success: true, fees_assessed: feesAssessed }),
    { headers: { "Content-Type": "application/json" } }
  );
});
