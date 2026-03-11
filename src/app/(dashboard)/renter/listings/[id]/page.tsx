import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MapPin,
  Bed,
  Bath,
  SquareCode,
  CalendarDays,
  Clock,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, bedroomLabel, bathroomLabel } from "@/lib/utils";
import { ApplicationDrawer } from "@/components/renter/application-drawer";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select(`
      *,
      properties(*),
      units(*)
    `)
    .eq("id", id)
    .single();

  if (!listing) notFound();

  const { data: existingApp } = await supabase
    .from("applications")
    .select("id, status")
    .eq("listing_id", id)
    .eq("renter_id", user.id)
    .maybeSingle();

  const { data: renterProfile } = await supabase
    .from("renter_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const p = listing.properties;
  const u = listing.units;

  return (
    <div className="p-8 max-w-4xl">
      {/* Photos */}
      {p.photos?.length > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl overflow-hidden h-64">
          <div className="col-span-2 row-span-2">
            <img src={p.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
          </div>
          {p.photos.slice(1, 3).map((photo: string, i: number) => (
            <div key={i} className="overflow-hidden">
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-8">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold">{listing.title}</h1>
              {listing.ai_generated && (
                <Badge variant="default" className="text-xs">AI-written</Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {p.address}, {p.city}, {p.state} {p.zip_code}
            </div>
          </div>

          <div className="flex items-center gap-6 py-4 border-y border-border text-sm">
            <div className="flex items-center gap-2">
              <Bed className="w-4 h-4 text-muted-foreground" />
              <span>{bedroomLabel(u.bedrooms)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Bath className="w-4 h-4 text-muted-foreground" />
              <span>{bathroomLabel(u.bathrooms)}</span>
            </div>
            {u.square_feet && (
              <div className="flex items-center gap-2">
                <SquareCode className="w-4 h-4 text-muted-foreground" />
                <span>{u.square_feet.toLocaleString()} sqft</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              <span>Available {formatDate(listing.available_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>{listing.lease_term_months}mo lease</span>
            </div>
          </div>

          <div>
            <h2 className="font-semibold mb-3">About this listing</h2>
            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          {p.amenities?.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {p.amenities.map((a: string) => (
                  <div
                    key={a}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {u.features?.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3">Unit features</h2>
              <div className="flex flex-wrap gap-2">
                {u.features.map((f: string) => (
                  <Badge key={f} variant="outline">{f}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="mb-4">
                <p className="text-3xl font-bold">{formatCurrency(listing.rent_amount)}</p>
                <p className="text-muted-foreground text-sm">per month</p>
              </div>

              <div className="space-y-2 text-sm mb-5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit</span>
                  <span className="font-medium">{formatCurrency(u.deposit_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lease term</span>
                  <span className="font-medium">{listing.lease_term_months} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available</span>
                  <span className="font-medium">{formatDate(listing.available_date)}</span>
                </div>
              </div>

              {existingApp ? (
                <div className="text-center py-2">
                  <Badge variant={existingApp.status === "approved" ? "success" : "default"} className="mb-2">
                    Application {existingApp.status.replace("_", " ")}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    You&apos;ve already applied to this listing
                  </p>
                </div>
              ) : (
                <ApplicationDrawer
                  listingId={listing.id}
                  listingTitle={listing.title}
                  rentAmount={listing.rent_amount}
                  renterProfile={renterProfile}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{p.name}</span>
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {p.property_type} · Built {p.year_built ?? "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
