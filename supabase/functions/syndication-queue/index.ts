// Supabase Edge Function: syndication-queue
// Processes pending listing syndication to external platforms
// Schedule: "*/30 * * * *" (every 30 minutes)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface SyndicationResult {
  success: boolean;
  platform: string;
  listing_id: string;
}

// Export format generators for each platform
function toCraigslistFormat(listing: {
  title: string;
  description: string;
  rent_amount: number;
  units: { bedrooms: number; bathrooms: number; square_feet?: number };
  properties: { address: string; city: string; state: string; zip_code: string };
}) {
  return {
    format: "html",
    title: listing.title,
    price: listing.rent_amount,
    bedrooms: listing.units.bedrooms,
    bathrooms: listing.units.bathrooms,
    sqft: listing.units.square_feet,
    location: `${listing.properties.city}, ${listing.properties.state}`,
    body: listing.description,
  };
}

function toZillowFormat(listing: {
  title: string;
  description: string;
  rent_amount: number;
  units: { bedrooms: number; bathrooms: number; square_feet?: number };
  properties: { address: string; city: string; state: string; zip_code: string };
}) {
  return {
    listingType: "FOR_RENT",
    address: {
      streetAddress: listing.properties.address,
      city: listing.properties.city,
      state: listing.properties.state,
      zipcode: listing.properties.zip_code,
    },
    price: listing.rent_amount,
    bedrooms: listing.units.bedrooms,
    bathrooms: listing.units.bathrooms,
    livingArea: listing.units.square_feet,
    description: listing.description,
  };
}

Deno.serve(async (_req) => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const results: SyndicationResult[] = [];

  // Find active listings with pending syndication
  const { data: listings } = await supabase
    .from("listings")
    .select(`
      *,
      properties(address, city, state, zip_code, photos),
      units(bedrooms, bathrooms, square_feet)
    `)
    .eq("status", "active")
    .not("syndication_targets", "eq", "{}");

  for (const listing of listings ?? []) {
    const targets = listing.syndication_targets as string[];
    const status = (listing.syndication_status ?? {}) as Record<string, string>;
    const updatedStatus = { ...status };

    for (const target of targets) {
      if (status[target] === "synced") continue;

      try {
        // In production: call actual platform APIs
        // For now: generate export format and mark as synced
        let exportData: Record<string, unknown> = {};

        if (target === "craigslist") {
          exportData = toCraigslistFormat(listing);
        } else if (target === "zillow") {
          exportData = toZillowFormat(listing);
        } else if (target === "apartments_com") {
          exportData = { ...toZillowFormat(listing), platform: "apartments_com" };
        } else if (target === "facebook_marketplace") {
          exportData = {
            title: listing.title,
            price: listing.rent_amount,
            description: listing.description,
            location: `${listing.properties.city}, ${listing.properties.state}`,
          };
        }

        console.log(`Syndicating ${listing.id} to ${target}:`, JSON.stringify(exportData));

        // Simulate API call success
        updatedStatus[target] = "synced";
        results.push({ success: true, platform: target, listing_id: listing.id });
      } catch (err) {
        console.error(`Failed to syndicate ${listing.id} to ${target}:`, err);
        updatedStatus[target] = "failed";
        results.push({ success: false, platform: target, listing_id: listing.id });
      }
    }

    await supabase
      .from("listings")
      .update({ syndication_status: updatedStatus })
      .eq("id", listing.id);
  }

  return new Response(
    JSON.stringify({ success: true, processed: results }),
    { headers: { "Content-Type": "application/json" } }
  );
});
