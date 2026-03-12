import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, ExternalLink } from "lucide-react";
import { AdminListingActions } from "@/components/admin/admin-listing-actions";

const STATUS_CONFIG: Record<string, {
  label: string;
  variant: "default" | "secondary" | "success" | "warning" | "outline" | "destructive";
}> = {
  draft:    { label: "Draft",    variant: "secondary" },
  active:   { label: "Active",   variant: "success" },
  paused:   { label: "Paused",   variant: "warning" },
  rented:   { label: "Rented",   variant: "outline" },
  archived: { label: "Archived", variant: "destructive" },
};

type ListingRow = {
  id: string;
  title: string;
  status: string;
  rent_amount: number;
  views: number;
  inquiries: number;
  created_at: string;
  ai_generated: boolean;
  properties?: {
    name?: string; city?: string; state?: string; landlord_id?: string;
    profiles?: { full_name?: string; email?: string } | null;
  } | null;
  units?: { unit_number?: string; bedrooms?: number; bathrooms?: number } | null;
};

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const { status, q } = await searchParams;

  const { data: rawListings } = await supabase
    .from("listings")
    .select(`
      id, title, status, rent_amount, views, inquiries, created_at, ai_generated,
      properties(name, city, state, landlord_id,
        profiles!properties_landlord_id_fkey(full_name, email)
      ),
      units(unit_number, bedrooms, bathrooms)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  const allListings = (rawListings ?? []) as unknown as ListingRow[];

  const filtered = allListings.filter((l) => {
    if (status && status !== "all" && l.status !== status) return false;
    if (q && !l.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all:      allListings.length,
    active:   allListings.filter((l) => l.status === "active").length,
    draft:    allListings.filter((l) => l.status === "draft").length,
    paused:   allListings.filter((l) => l.status === "paused").length,
    archived: allListings.filter((l) => l.status === "archived").length,
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Listings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All listings across the platform
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(["all", "active", "draft", "paused", "archived"] as const).map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/listings" : `/admin/listings?status=${s}`}
            className={`px-3 py-1.5 rounded-lg text-sm capitalize font-medium border transition-colors ${
              (status ?? "all") === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {s} <span className="opacity-60 text-xs">({counts[s]})</span>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {!filtered.length && (
            <p className="px-6 py-10 text-sm text-muted-foreground text-center">No listings found</p>
          )}
          <div className="divide-y divide-border">
            {filtered.map((l) => {
              const sc = STATUS_CONFIG[l.status] ?? STATUS_CONFIG.draft;
              const prop = l.properties;
              const landlord = prop?.profiles as { full_name?: string; email?: string } | null;
              return (
                <div key={l.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">{l.title}</p>
                      <Badge variant={sc.variant} className="shrink-0">{sc.label}</Badge>
                      {l.ai_generated && <Badge variant="default" className="text-xs shrink-0">AI</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {prop?.name} · {prop?.city}, {prop?.state}
                      {" · "}Landlord: {landlord?.full_name ?? landlord?.email ?? "Unknown"}
                    </p>
                    <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{formatCurrency(l.rent_amount)}/mo</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{l.views}</span>
                      <span>{formatDate(l.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/listings/${l.id}`}
                      target="_blank"
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                      title="View public listing"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <AdminListingActions listingId={l.id} currentStatus={l.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
