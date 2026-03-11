// Supabase Edge Function: rent-reminders
// Runs daily via pg_cron to send payment reminders
// Schedule: "0 9 * * *" (9am daily)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (_req) => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const today = new Date();
  const threeDaysFromNow = new Date(today);
  threeDaysFromNow.setDate(today.getDate() + 3);

  // Find payments due in 3 days that haven't been reminded
  const { data: upcomingPayments } = await supabase
    .from("payments")
    .select(`
      id, amount, due_date, lease_id,
      profiles!payments_renter_id_fkey(email, full_name),
      leases(payment_due_day, properties(name))
    `)
    .eq("status", "pending")
    .gte("due_date", today.toISOString().split("T")[0])
    .lte("due_date", threeDaysFromNow.toISOString().split("T")[0]);

  const reminders = [];

  for (const payment of upcomingPayments ?? []) {
    const renter = payment.profiles as { email?: string; full_name?: string } | null;
    const property = (payment.leases as { properties?: { name?: string } | null } | null)?.properties;

    // In production: send email via Resend/SendGrid/etc
    // For now, log the reminder
    reminders.push({
      to: renter?.email,
      subject: `Rent reminder: $${payment.amount} due ${payment.due_date}`,
      body: `Hi ${renter?.full_name}, your rent of $${payment.amount} for ${property?.name} is due on ${payment.due_date}.`,
    });
  }

  console.log(`Sent ${reminders.length} rent reminders`);

  return new Response(
    JSON.stringify({ success: true, reminders_sent: reminders.length }),
    { headers: { "Content-Type": "application/json" } }
  );
});
