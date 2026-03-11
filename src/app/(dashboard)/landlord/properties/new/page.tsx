"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, X, Upload } from "lucide-react";
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

const schema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().length(2),
  zip_code: z.string().min(5),
  property_type: z.enum(["apartment", "house", "condo", "townhouse", "commercial"]),
  total_units: z.coerce.number().min(1),
  year_built: z.coerce.number().min(1800).max(2100).optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const AMENITY_OPTIONS = [
  "Parking", "Gym", "Pool", "Laundry", "Pet-friendly", "Rooftop",
  "Concierge", "Storage", "Bike storage", "EV charging", "Doorman",
  "Elevator", "Dishwasher", "AC", "Hardwood floors", "Balcony",
];

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { total_units: 1 } });

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotos((prev) => [...prev, ...files].slice(0, 10));
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      setPhotoPreviews((prev) => [...prev, url].slice(0, 10));
    });
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Upload photos
    const photoUrls: string[] = [];
    for (const photo of photos) {
      const ext = photo.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("property-photos")
        .upload(path, photo);

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from("property-photos")
          .getPublicUrl(path);
        photoUrls.push(publicUrl);
      }
    }

    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        ...data,
        landlord_id: user.id,
        amenities: selectedAmenities,
        photos: photoUrls,
        year_built: data.year_built ?? null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error creating property", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Property created!", variant: "success" });
    router.push(`/landlord/properties/${property.id}`);
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Add property</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Add a new property to your portfolio
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Property details</h2>

          <div className="space-y-1.5">
            <Label>Property name</Label>
            <Input placeholder="e.g. Sunset Apartments" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select onValueChange={(v) => setValue("property_type", v as FormData["property_type"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
              {errors.property_type && <p className="text-xs text-destructive">{errors.property_type.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Total units</Label>
              <Input type="number" min={1} {...register("total_units")} />
              {errors.total_units && <p className="text-xs text-destructive">{errors.total_units.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe the property..."
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Year built</Label>
              <Input type="number" placeholder="2010" {...register("year_built")} />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Address</h2>

          <div className="space-y-1.5">
            <Label>Street address</Label>
            <Input placeholder="123 Main St" {...register("address")} />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>City</Label>
              <Input placeholder="San Francisco" {...register("city")} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>State</Label>
              <Input placeholder="CA" maxLength={2} {...register("state")} />
              {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5 max-w-[200px]">
            <Label>ZIP code</Label>
            <Input placeholder="94102" {...register("zip_code")} />
            {errors.zip_code && <p className="text-xs text-destructive">{errors.zip_code.message}</p>}
          </div>
        </div>

        {/* Amenities */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  selectedAmenities.includes(a)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Photos</h2>

          <div className="grid grid-cols-3 gap-3">
            {photoPreviews.map((url, idx) => (
              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}

            {photoPreviews.length < 10 && (
              <label className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Add photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Plus className="w-4 h-4 mr-2" />
            Create property
          </Button>
        </div>
      </form>
    </div>
  );
}
