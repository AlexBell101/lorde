import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Bed, Bath, SquareCode, Calendar, Building2,
  Wifi, Car, PawPrint, Dumbbell, WashingMachine, ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, bedroomLabel, bathroomLabel } from "@/lib/utils";
import { ListingApplyCta } from "@/components/listings/listing-apply-cta";
import { SaveListingButton } from "@/components/listings/save-listing-button";
import type { RenterProfile } from "@/types";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "Gym":            <Dumbbell className="w-4 h-4" />,
  "Parking":        <Car className="w-4 h-4" />,
  "Pet-friendly":   <PawPrint className="w-4 h-4" />,
  "In-unit laundry":<WashingMachine className="w-4 h-4" />,
  "Wifi":           <Wifi className="w-4 h-4" />,
};

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select(`
      *,
      properties(id, name, address, city, state, zip_code, latitude, longitude, amenities, photos, property_type, description),
      units(unit_number, bedrooms, bathrooms, square_feet, features, rent_amount, deposit_amount)
    `)
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (!listing || !listing.properties || !listing.units) {
    notFound();
  }

  // Resolve auth state for apply CTA + save button
  const { data: { user } } = await supabase.auth.getUser();
  let isRenter = false;
  let alreadyApplied = false;
  let renterProfile: RenterProfile | null = null;
  let isSaved = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles").select("role").eq("id", user.id).single();
    isRenter = profile?.role === "renter";

    if (isRenter) {
      const [{ data: existingApp }, { data: rp }, { data: savedRow }] = await Promise.all([
        supabase.from("applications").select("id")
          .eq("listing_id", id).eq("renter_id", user.id).maybeSingle(),
        supabase.from("renter_profiles").select("*")
          .eq("user_id", user.id).maybeSingle(),
        supabase.from("saved_listings").select("id")
          .eq("user_id", user.id).eq("listing_id", id).maybeSingle(),
      ]);
      alreadyApplied = !!existingApp;
      renterProfile = rp as RenterProfile | null;
      isSaved = !!savedRow;
    } else {
      // Non-renter (landlord) can still save
      const { data: savedRow } = await supabase
        .from("saved_listings").select("id")
        .eq("user_id", user.id).eq("listing_id", id).maybeSingle();
      isSaved = !!savedRow;
    }
  }

  const p = listing.properties as {
    name: string; address: string; city: string; state: string; zip_code: string;
    amenities: string[]; photos: string[]; property_type: string; description: string;
  };
  const u = listing.units as {
    unit_number: string; bedrooms: number; bathrooms: number;
    square_feet?: number; features: string[]; rent_amount: number; deposit_amount: number;
  };

  const photos: string[] = p.photos ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="h-14 border-b bg-white flex items-center justify-between px-6 sticky top-0 z-10">
        <Link href="/search" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </Link>
        <Link href="/" className="font-serif text-lg font-semibold text-navy">Lorde</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href={isRenter ? "/renter/search" : "/landlord"} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
              <Link href="/signup" className="text-sm bg-brick text-white hover:bg-[#992F25] transition-colors rounded-lg px-4 py-1.5">Sign up</Link>
            </>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Photo grid */}
        {photos.length === 0 ? (
          <div className="w-full h-72 rounded-2xl bg-muted flex items-center justify-center mb-8">
            <Building2 className="w-12 h-12 text-muted-foreground/30" />
          </div>
        ) : photos.length === 1 ? (
          <div className="w-full h-72 rounded-2xl overflow-hidden mb-8">
            <img src={photos[0]} alt={p.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 h-72 rounded-2xl overflow-hidden mb-8">
            <img src={photos[0]} alt={p.name} className="w-full h-full object-cover" />
            <div className={`grid gap-2 ${photos.length > 2 ? "grid-rows-2" : "grid-rows-1"}`}>
              {photos.slice(1, 3).map((photo, i) => (
                <img key={i} src={photo} alt={`${p.name} ${i + 2}`} className="w-full h-full object-cover" />
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="font-serif text-2xl font-bold text-foreground leading-tight">
                  {listing.title}
                </h1>
                <Badge variant="secondary" className="shrink-0 capitalize">
                  {p.property_type}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4" />
                {p.address}, {p.city}, {p.state} {p.zip_code}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 py-4 border-y border-border">
              <div className="flex items-center gap-2 text-sm">
                <Bed className="w-4 h-4 text-muted-foreground" />
                <span>{bedroomLabel(u.bedrooms)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bath className="w-4 h-4 text-muted-foreground" />
                <span>{bathroomLabel(u.bathrooms)}</span>
              </div>
              {u.square_feet && (
                <div className="flex items-center gap-2 text-sm">
                  <SquareCode className="w-4 h-4 text-muted-foreground" />
                  <span>{u.square_feet.toLocaleString()} sqft</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Available {new Date(listing.available_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-semibold text-base mb-2">About this property</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {listing.description || p.description}
              </p>
            </div>

            {/* Amenities */}
            {p.amenities?.length > 0 && (
              <div>
                <h2 className="font-semibold text-base mb-3">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {p.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm">
                      {AMENITY_ICONS[a] ?? null}
                      {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unit features */}
            {u.features?.length > 0 && (
              <div>
                <h2 className="font-semibold text-base mb-3">Unit features</h2>
                <div className="flex flex-wrap gap-2">
                  {u.features.map((f) => (
                    <Badge key={f} variant="outline">{f}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6 sticky top-20">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(listing.rent_amount)}
                  <span className="text-base font-normal text-muted-foreground">/mo</span>
                </p>
                {user && (
                  <SaveListingButton
                    listingId={id}
                    initialSaved={isSaved}
                    variant="default"
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Deposit: {formatCurrency(u.deposit_amount)}
              </p>

              <ListingApplyCta
                listingId={id}
                listingTitle={listing.title}
                rentAmount={listing.rent_amount}
                isLoggedIn={!!user}
                isRenter={isRenter}
                alreadyApplied={alreadyApplied}
                renterProfile={renterProfile}
              />

              <p className="text-xs text-center text-muted-foreground mt-4">
                No application fee. Direct from landlord.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
