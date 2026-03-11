"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/utils";
import type { Property, Unit } from "@/types";

const schema = z.object({
  property_id: z.string().uuid(),
  unit_id: z.string().uuid(),
  title: z.string().min(10),
  description: z.string().min(50),
  rent_amount: z.coerce.number().min(1),
  available_date: z.string().min(1),
  lease_term_months: z.coerce.number().min(1),
});

type FormData = z.infer<typeof schema>;

const SYNDICATION_TARGETS = [
  { id: "zillow", label: "Zillow" },
  { id: "apartments_com", label: "Apartments.com" },
  { id: "facebook_marketplace", label: "Facebook Marketplace" },
  { id: "craigslist", label: "Craigslist" },
];

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [gettingPrice, setGettingPrice] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [syndicationTargets, setSyndicationTargets] = useState<string[]>([]);
  const [priceRec, setPriceRec] = useState<{
    recommended_price: number;
    min_price: number;
    max_price: number;
    confidence: string;
    reasoning: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const selectedPropertyId = watch("property_id");
  const description = watch("description");

  useEffect(() => {
    async function loadProperties() {
      const supabase = createClient();
      const { data } = await supabase.from("properties").select("*").order("name");
      setProperties(data ?? []);
    }
    loadProperties();
  }, []);

  useEffect(() => {
    if (!selectedPropertyId) return;
    async function loadUnits() {
      const supabase = createClient();
      const { data } = await supabase
        .from("units")
        .select("*")
        .eq("property_id", selectedPropertyId)
        .eq("status", "available");
      setUnits(data ?? []);
      setSelectedProperty(properties.find((p) => p.id === selectedPropertyId) ?? null);
    }
    loadUnits();
  }, [selectedPropertyId, properties]);

  async function generateCopy() {
    if (!selectedProperty || !selectedUnit) {
      toast({ title: "Select a property and unit first", variant: "destructive" });
      return;
    }

    setGeneratingCopy(true);
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyName: selectedProperty.name,
          propertyType: selectedProperty.property_type,
          city: selectedProperty.city,
          state: selectedProperty.state,
          bedrooms: selectedUnit.bedrooms,
          bathrooms: selectedUnit.bathrooms,
          squareFeet: selectedUnit.square_feet,
          rentAmount: selectedUnit.rent_amount,
          amenities: selectedProperty.amenities,
          unitFeatures: selectedUnit.features,
          yearBuilt: selectedProperty.year_built,
          description: selectedProperty.description,
        }),
      });

      const { description, error } = await res.json();
      if (error) throw new Error(error);

      setValue("description", description);
      if (!watch("title")) {
        setValue(
          "title",
          `${selectedUnit.bedrooms === 0 ? "Studio" : `${selectedUnit.bedrooms}BR`} in ${selectedProperty.name} — ${selectedProperty.city}`
        );
      }
      toast({ title: "Listing copy generated!", variant: "success" });
    } catch {
      toast({ title: "Failed to generate copy", variant: "destructive" });
    }
    setGeneratingCopy(false);
  }

  async function getPriceRecommendation() {
    if (!selectedProperty || !selectedUnit) {
      toast({ title: "Select a property and unit first", variant: "destructive" });
      return;
    }

    setGettingPrice(true);
    try {
      const res = await fetch("/api/ai/price-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zipCode: selectedProperty.zip_code,
          bedrooms: selectedUnit.bedrooms,
          bathrooms: selectedUnit.bathrooms,
          squareFeet: selectedUnit.square_feet,
          amenities: selectedProperty.amenities,
        }),
      });

      const data = await res.json();
      setPriceRec(data);
      setValue("rent_amount", data.recommended_price);
    } catch {
      toast({ title: "Failed to get price recommendation", variant: "destructive" });
    }
    setGettingPrice(false);
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.from("listings").insert({
      ...data,
      status: "draft",
      ai_generated: description !== "",
      syndication_targets: syndicationTargets,
      syndication_status: Object.fromEntries(syndicationTargets.map((t) => [t, "pending"])),
    });

    if (error) {
      toast({ title: "Error creating listing", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Listing created as draft!", variant: "success" });
    router.push("/landlord/listings");
  }

  function toggleSyndication(target: string) {
    setSyndicationTargets((prev) =>
      prev.includes(target) ? prev.filter((t) => t !== target) : [...prev, target]
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Create listing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create a new listing for an available unit
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Property & unit selection */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Select property & unit</h2>

          <div className="space-y-1.5">
            <Label>Property</Label>
            <Select onValueChange={(v) => { setValue("property_id", v); setValue("unit_id", ""); setSelectedUnit(null); }}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} — {p.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.property_id && <p className="text-xs text-destructive">{errors.property_id.message}</p>}
          </div>

          {units.length > 0 && (
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select onValueChange={(v) => {
                setValue("unit_id", v);
                const unit = units.find((u) => u.id === v);
                setSelectedUnit(unit ?? null);
                if (unit) setValue("rent_amount", unit.rent_amount);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      Unit {u.unit_number} — {u.bedrooms === 0 ? "Studio" : `${u.bedrooms}BD`}/{u.bathrooms}BA · {formatCurrency(u.rent_amount)}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit_id && <p className="text-xs text-destructive">{errors.unit_id.message}</p>}
            </div>
          )}

          {selectedPropertyId && units.length === 0 && (
            <p className="text-sm text-muted-foreground">No available units for this property.</p>
          )}
        </div>

        {/* Listing details */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Listing details</h2>

          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="e.g. Modern 2BR in the heart of Mission District" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateCopy}
                disabled={generatingCopy || !selectedUnit}
                className="text-primary hover:text-primary"
              >
                {generatingCopy ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                )}
                {generatingCopy ? "Generating…" : "AI write"}
              </Button>
            </div>
            <Textarea
              placeholder="Describe this listing. Use AI to generate compelling copy from your property details."
              rows={6}
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Monthly rent</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={getPriceRecommendation}
                  disabled={gettingPrice || !selectedUnit}
                  className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
                >
                  {gettingPrice ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  )}
                  AI price
                </Button>
              </div>
              <Input type="number" placeholder="3500" {...register("rent_amount")} />
              {errors.rent_amount && <p className="text-xs text-destructive">{errors.rent_amount.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Available date</Label>
              <Input type="date" {...register("available_date")} />
              {errors.available_date && <p className="text-xs text-destructive">{errors.available_date.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Lease term</Label>
              <Select onValueChange={(v) => setValue("lease_term_months", Number(v))} defaultValue="12">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Month-to-month</SelectItem>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price recommendation */}
          {priceRec && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-primary">AI Price Recommendation</span>
                <span className="text-xs text-muted-foreground capitalize">{priceRec.confidence} confidence</span>
              </div>
              <div className="flex items-center gap-4 text-foreground">
                <span><span className="text-muted-foreground">Range:</span> {formatCurrency(priceRec.min_price)} – {formatCurrency(priceRec.max_price)}</span>
                <span><span className="text-muted-foreground">Recommended:</span> <strong>{formatCurrency(priceRec.recommended_price)}</strong></span>
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">{priceRec.reasoning}</p>
            </div>
          )}
        </div>

        {/* Syndication */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Listing syndication</h2>
          <p className="text-sm text-muted-foreground">
            Push your listing to these platforms automatically when published
          </p>
          <div className="grid grid-cols-2 gap-3">
            {SYNDICATION_TARGETS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleSyndication(t.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm transition-colors ${
                  syndicationTargets.includes(t.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${syndicationTargets.includes(t.id) ? "bg-primary" : "bg-muted-foreground"}`} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save as draft
          </Button>
        </div>
      </form>
    </div>
  );
}
