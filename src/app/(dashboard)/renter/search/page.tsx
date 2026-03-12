import { createClient } from "@/lib/supabase/server";
import { MapSearch } from "@/components/renter/map-search";

export default async function SearchPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch active listings with geo data
  const { data: listings } = await supabase
    .from("listings")
    .select(`
      *,
      properties(id, name, address, city, state, zip_code, latitude, longitude, amenities, photos, property_type),
      units(unit_number, bedrooms, bathrooms, square_feet, features)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Fetch saved listing IDs for the logged-in user
  let savedListingIds: string[] = [];
  if (user) {
    const { data: saved } = await supabase
      .from("saved_listings")
      .select("listing_id");
    savedListingIds = (saved ?? []).map((s) => s.listing_id);
  }

  return (
    <MapSearch
      initialListings={listings ?? []}
      savedListingIds={savedListingIds}
      isLoggedIn={!!user}
    />
  );
}
