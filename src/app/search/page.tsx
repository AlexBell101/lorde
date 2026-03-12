import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MapSearch } from "@/components/renter/map-search";
import { HomeNav } from "@/components/home/home-nav";
import type { UserRole } from "@/types";

export const metadata = {
  title: "Browse Rentals",
  description: "Search verified rentals across Cincinnati. Direct from local landlords.",
};

export default async function PublicSearchPage() {
  const supabase = await createClient();

  const [{ data: listings }, { data: { user } }] = await Promise.all([
    supabase
      .from("listings")
      .select(`
        *,
        properties(id, name, address, city, state, zip_code, latitude, longitude, amenities, photos, property_type),
        units(unit_number, bedrooms, bathrooms, square_feet, features)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  // Auth state for nav + saved IDs
  let homeUser: { name: string; role: UserRole } | null = null;
  let savedListingIds: string[] = [];

  if (user) {
    const [{ data: profile }, { data: saved }] = await Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
      supabase.from("saved_listings").select("listing_id"),
    ]);
    if (profile) homeUser = { name: profile.full_name, role: profile.role as UserRole };
    savedListingIds = (saved ?? []).map((s) => s.listing_id);
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Minimal nav bar */}
      <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
        <Link href="/" className="font-serif text-lg font-semibold text-navy">Lorde</Link>
        <HomeNav user={homeUser} />
      </header>

      {/* Map search fills the rest */}
      <div className="flex-1 overflow-hidden">
        <MapSearch
          initialListings={listings ?? []}
          savedListingIds={savedListingIds}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
