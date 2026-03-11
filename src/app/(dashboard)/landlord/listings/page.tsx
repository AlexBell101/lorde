import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Plus, Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ListingActions } from "@/components/landlord/listing-actions";

export default async function ListingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listings } = await supabase
    .from("listings")
    .select(`
      *,
      properties(name, city, state),
      units(unit_number, bedrooms, bathrooms)
    `)
    .in("property_id",
      supabase.from("properties").select("id").eq("landlord_id", user.id) as unknown as string[]
    )
    .order("created_at", { ascending: false });

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "outline" }> = {
    draft: { label: "Draft", variant: "secondary" },
    active: { label: "Active", variant: "success" },
    paused: { label: "Paused", variant: "warning" },
    rented: { label: "Rented", variant: "outline" },
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Listings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your active and draft listings
          </p>
        </div>
        <Link href="/landlord/listings/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New listing
          </Button>
        </Link>
      </div>

      {!listings?.length && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-muted-foreground mb-4">No listings yet. Create a listing to start receiving applications.</p>
          <Link href="/landlord/listings/new">
            <Button><Plus className="w-4 h-4 mr-2" />Create listing</Button>
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {listings?.map((l: {
          id: string;
          title: string;
          status: string;
          rent_amount: number;
          available_date: string;
          views: number;
          inquiries: number;
          ai_generated: boolean;
          syndication_targets: string[];
          syndication_status: Record<string, string>;
          properties?: { name?: string; city?: string; state?: string } | null;
          units?: { unit_number?: string; bedrooms?: number; bathrooms?: number } | null;
        }) => {
          const sc = statusConfig[l.status] ?? statusConfig.draft;
          return (
            <Card key={l.id} className="hover:border-border/80 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{l.title}</h3>
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                      {l.ai_generated && (
                        <Badge variant="default" className="text-xs">AI</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(l.properties as { name?: string; city?: string; state?: string } | null)?.name} · Unit {(l.units as { unit_number?: string } | null)?.unit_number}
                      {" · "}{(l.properties as { city?: string; state?: string } | null)?.city}, {(l.properties as { state?: string } | null)?.state}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{formatCurrency(l.rent_amount)}/mo</span>
                      <span>Available {formatDate(l.available_date)}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{l.views}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{l.inquiries}</span>
                    </div>

                    {l.syndication_targets?.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Synced to:</span>
                        {l.syndication_targets.map((t: string) => (
                          <span key={t} className={`text-xs px-1.5 py-0.5 rounded border ${
                            l.syndication_status?.[t] === "synced"
                              ? "border-green-500/30 text-green-400"
                              : l.syndication_status?.[t] === "failed"
                              ? "border-destructive/30 text-destructive"
                              : "border-border text-muted-foreground"
                          }`}>
                            {t.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <ListingActions listing={l as { id: string; status: string }} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
