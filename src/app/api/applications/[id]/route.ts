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

  // Fetch full application + listing + unit details needed to create a lease
  const { data: application } = await supabase
    .from("applications")
    .select(`
      id,
      renter_id,
      move_in_date,
      listing_id,
      listings(
        id,
        property_id,
        lease_term_months,
        available_date,
        unit_id,
        units(rent_amount, deposit_amount),
        properties(landlord_id)
      )
    `)
    .eq("id", id)
    .single();

  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });

  type FullListingData = {
    id: string;
    property_id: string;
    lease_term_months: number;
    available_date: string;
    unit_id: string;
    units: { rent_amount: number; deposit_amount: number } | null;
    properties: { landlord_id?: string } | null;
  };

  const listing = application.listings as unknown as FullListingData | null;
  const landlordId = listing?.properties?.landlord_id;

  if (landlordId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update application status
  await supabase.from("applications").update({ status }).eq("id", id);

  // On approval: create lease + mark unit occupied + mark listing rented
  if (status === "approved" && listing) {
    const moveIn = application.move_in_date ?? listing.available_date;
    const startDate = new Date(moveIn);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (listing.lease_term_months ?? 12));

    await Promise.all([
      // Create the lease
      supabase.from("leases").insert({
        property_id: listing.property_id,
        unit_id: listing.unit_id,
        landlord_id: landlordId,
        renter_id: application.renter_id,
        application_id: id,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        rent_amount: listing.units?.rent_amount ?? 0,
        deposit_amount: listing.units?.deposit_amount ?? 0,
        status: "active",
        payment_due_day: 1,
      }),
      // Mark unit as occupied
      supabase.from("units").update({ status: "occupied" }).eq("id", listing.unit_id),
      // Mark listing as rented
      supabase.from("listings").update({ status: "rented" }).eq("id", listing.id),
    ]);
  }

  const referer = req.headers.get("referer") ?? "/landlord/tenants";
  return NextResponse.redirect(referer, { status: 303 });
}
