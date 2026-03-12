import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  MapPin, Bed, Bath, SquareCode, Heart, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SaveListingButton } from "@/components/listings/save-listing-button";
import { formatCurrency, bedroomLabel, bathroomLabel } from "@/lib/utils";

type SavedListing = {
  id: string;
  listing_id: string;
  created_at: string;
  listings: {
    id: string;
    title: string;
    rent_amount: number;
    available_date: string;
    properties: {
      address: string;
      city: string;
      state: string;
      photos: string[];
    };
    units: {
      bedrooms: number;
      bathrooms: number;
      square_feet?: number;
    };
  };
};

export default async function SavedListingsPage() {
  const supabase = await createClient();

  const { data: saved } = await supabase
    .from("saved_listings")
    .select(`
      id,
      listing_id,
      created_at,
      listings(
        id,
        title,
        rent_amount,
        available_date,
        properties(address, city, state, photos),
        units(bedrooms, bathrooms, square_feet)
      )
    `)
    .order("created_at", { ascending: false });

  const items = ((saved ?? []) as unknown as SavedListing[]).filter(
    (s) => s.listings != null
  );

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Saved Listings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length
              ? `${items.length} saved listing${items.length !== 1 ? "s" : ""}`
              : "Listings you heart will appear here"}
          </p>
        </div>
        <Link href="/renter/search">
          <Button variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Browse listings
          </Button>
        </Link>
      </div>

      {!items.length && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Heart className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold mb-2">No saved listings yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Tap the heart icon on any listing to save it here.
          </p>
          <Link href="/renter/search">
            <Button>
              <Search className="w-4 h-4 mr-2" />
              Start searching
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((item) => {
          const l = item.listings;
          const photo = l.properties?.photos?.[0];

          return (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card overflow-hidden flex flex-col group"
            >
              {/* Photo */}
              <div className="relative h-44 bg-muted shrink-0">
                {photo ? (
                  <img
                    src={photo}
                    alt={l.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}

                {/* Unsave button */}
                <div className="absolute top-2 right-2">
                  <SaveListingButton
                    listingId={l.id}
                    initialSaved={true}
                    variant="compact"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                    {l.title}
                  </h3>
                  <span className="font-bold text-sm shrink-0 text-primary">
                    {formatCurrency(l.rent_amount)}/mo
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {l.properties?.address}, {l.properties?.city}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  {l.units && (
                    <>
                      <span className="flex items-center gap-1">
                        <Bed className="w-3 h-3" />
                        {bedroomLabel(l.units.bedrooms)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath className="w-3 h-3" />
                        {bathroomLabel(l.units.bathrooms)}
                      </span>
                      {l.units.square_feet && (
                        <span className="flex items-center gap-1">
                          <SquareCode className="w-3 h-3" />
                          {l.units.square_feet.toLocaleString()} sqft
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-auto">
                  <Link href={`/listings/${l.id}`}>
                    <Button size="sm" className="w-full">
                      View listing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
