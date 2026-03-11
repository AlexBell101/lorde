import { createClient } from "@/lib/supabase/server";
import { MapSearch } from "@/components/renter/map-search";

export const metadata = {
  title: "Browse Rentals",
  description: "Search verified rentals across Cincinnati. Direct from local landlords.",
};

export default async function PublicSearchPage() {
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select(`
      *,
      properties(id, name, address, city, state, zip_code, latitude, longitude, amenities, photos, property_type),
      units(unit_number, bedrooms, bathrooms, square_feet, features)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  return (
    <div className="h-screen flex flex-col">
      {/* Minimal nav bar */}
      <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
        <a href="/" className="font-serif text-lg font-semibold text-navy">Lorde</a>
        <div className="flex items-center gap-3">
          <a href="/login" className="text-sm text-gray-500 hover:text-navy transition-colors px-3 py-1.5">
            Sign in
          </a>
          <a href="/signup"
            className="text-sm bg-brick text-white hover:bg-[#992F25] transition-colors rounded-lg px-4 py-1.5">
            Sign up
          </a>
        </div>
      </header>

      {/* Map search fills the rest */}
      <div className="flex-1 overflow-hidden">
        <MapSearch initialListings={listings ?? []} />
      </div>
    </div>
  );
}
