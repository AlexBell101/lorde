import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const status = formData.get("status") as string;

  const allowedStatuses = ["under_review", "approved", "rejected", "withdrawn"];
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Verify the landlord owns this application's listing
  const { data: application } = await supabase
    .from("applications")
    .select("listing_id, listings(property_id, properties(landlord_id))")
    .eq("id", id)
    .single();

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  type ListingData = { properties: { landlord_id?: string } | null };
  const listing = application.listings as unknown as ListingData | null;
  const landlordId = listing?.properties?.landlord_id;

  if (landlordId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await supabase
    .from("applications")
    .update({ status })
    .eq("id", id);

  // Redirect back
  const referer = req.headers.get("referer") ?? "/landlord/tenants";
  return NextResponse.redirect(referer, { status: 303 });
}
