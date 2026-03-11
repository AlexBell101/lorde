import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  type SessionLike = { metadata?: Record<string, string>; payment_intent?: string };

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as unknown as SessionLike;
    const { payment_id } = s.metadata ?? {};

    if (payment_id) {
      await supabase
        .from("payments")
        .update({
          status: "completed",
          paid_date: new Date().toISOString(),
          stripe_payment_intent_id: s.payment_intent ?? null,
        })
        .eq("id", payment_id);
    }
  }

  if (event.type === "checkout.session.expired") {
    const s = event.data.object as unknown as SessionLike;
    const { payment_id } = s.metadata ?? {};

    if (payment_id) {
      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("id", payment_id);
    }
  }

  return NextResponse.json({ received: true });
}
