import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Plus, Building2, MapPin, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PropertiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: properties } = await supabase
    .from("properties")
    .select(`
      *,
      units(id, status, rent_amount),
      listings(id, status)
    `)
    .eq("landlord_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Properties</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {properties?.length ?? 0} properties in your portfolio
          </p>
        </div>
        <Link href="/landlord/properties/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add property
          </Button>
        </Link>
      </div>

      {!properties?.length && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold mb-2">No properties yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Add your first property to start listing units and collecting rent.
          </p>
          <Link href="/landlord/properties/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add your first property
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {properties?.map((p: {
          id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          property_type: string;
          photos: string[];
          units: Array<{ id: string; status: string; rent_amount: number }>;
          listings: Array<{ id: string; status: string }>;
        }) => {
          const totalUnits = p.units?.length ?? 0;
          const occupiedUnits = p.units?.filter((u) => u.status === "occupied").length ?? 0;
          const activeListings = p.listings?.filter((l) => l.status === "active").length ?? 0;
          const totalRent = p.units
            ?.filter((u) => u.status === "occupied")
            .reduce((sum, u) => sum + Number(u.rent_amount), 0) ?? 0;

          return (
            <Link href={`/landlord/properties/${p.id}`} key={p.id}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                {p.photos?.[0] ? (
                  <div className="h-40 rounded-t-xl overflow-hidden">
                    <img
                      src={p.photos[0]}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-40 rounded-t-xl bg-secondary flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{p.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {p.city}, {p.state}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {p.property_type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border text-center">
                    <div>
                      <p className="text-lg font-bold">{totalUnits}</p>
                      <p className="text-xs text-muted-foreground">Units</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{occupiedUnits}</p>
                      <p className="text-xs text-muted-foreground">Occupied</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">{activeListings}</p>
                      <p className="text-xs text-muted-foreground">Listed</p>
                    </div>
                  </div>

                  {totalRent > 0 && (
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-1.5 text-sm">
                      <Home className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Monthly income:</span>
                      <span className="font-semibold text-green-400">
                        ${totalRent.toLocaleString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
