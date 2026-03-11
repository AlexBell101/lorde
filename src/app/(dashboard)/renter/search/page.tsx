import { createClient } from "@/lib/supabase/server";
import { MapSearch } from "@/components/renter/map-search";

export default async function SearchPage() {
  const supabase = await createClient();

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

  return <MapSearch initialListings={listings ?? []} />;
}
