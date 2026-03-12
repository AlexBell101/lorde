"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Loader2, Sparkles, Eye, Users,
  CheckCircle2, XCircle, Clock,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toaster";
import { formatCurrency, formatDate } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(10),
  description: z.string().min(50),
  rent_amount: z.coerce.number().min(1),
  available_date: z.string().min(1),
  lease_term_months: z.coerce.number().min(1),
});

type FormData = z.infer<typeof schema>;

type ApplicationRow = {
  id: string;
  status: string;
  monthly_income: number;
  credit_score_range: string;
  employment_status: string;
  move_in_date: string;
  created_at: string;
  profiles?: { full_name?: string; email?: string } | null;
};

type ListingRow = {
  id: string;
  title: string;
  description: string;
  status: string;
  rent_amount: number;
  available_date: string;
  lease_term_months: number;
  views: number;
  inquiries: number;
  ai_generated: boolean;
  property_id: string;
  unit_id: string;
  properties?: {
    name?: string; address?: string; city?: string; state?: string;
  } | null;
  units?: {
    unit_number?: string; bedrooms?: number; bathrooms?: number;
  } | null;
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  active: { label: "Active", variant: "success" },
  paused: { label: "Paused", variant: "warning" },
  rented: { label: "Rented", variant: "outline" },
  archived: { label: "Archived", variant: "secondary" },
};

const APP_STATUS_ICON: Record<string, React.ReactNode> = {
  submitted: <Clock className="w-3.5 h-3.5 text-amber-400" />,
  under_review: <Clock className="w-3.5 h-3.5 text-blue-400" />,
  approved: <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />,
  rejected: <XCircle className="w-3.5 h-3.5 text-destructive" />,
};

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [listing, setListing] = useState<ListingRow | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingCopy, setGeneratingCopy] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: l }, { data: apps }] = await Promise.all([
        supabase
          .from("listings")
          .select("*, properties(name, address, city, state), units(unit_number, bedrooms, bathrooms)")
          .eq("id", id)
          .single(),
        supabase
          .from("applications")
          .select("id, status, monthly_income, credit_score_range, employment_status, move_in_date, created_at, profiles!applications_renter_id_fkey(full_name, email)")
          .eq("listing_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (!l) { router.push("/landlord/listings"); return; }

      setListing(l as ListingRow);
      setApplications((apps ?? []) as ApplicationRow[]);

      setValue("title", l.title);
      setValue("description", l.description ?? "");
      setValue("rent_amount", l.rent_amount);
      setValue("available_date", l.available_date?.split("T")[0] ?? "");
      setValue("lease_term_months", l.lease_term_months ?? 12);
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSubmit(data: FormData) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("listings")
      .update(data)
      .eq("id", id);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing saved", variant: "success" });
      router.refresh();
    }
    setSaving(false);
  }

  async function updateStatus(status: string) {
    const supabase = createClient();
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setListing((prev) => prev ? { ...prev, status } : prev);
      const labels: Record<string, string> = { active: "Listing published", paused: "Listing paused", draft: "Reverted to draft" };
      toast({ title: labels[status] ?? `Status: ${status}`, variant: "success" });
    }
  }

  async function generateCopy() {
    if (!listing) return;
    setGeneratingCopy(true);
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyName: listing.properties?.name ?? "",
          propertyType: "apartment",
          city: listing.properties?.city ?? "",
          state: listing.properties?.state ?? "",
          bedrooms: listing.units?.bedrooms ?? 1,
          bathrooms: listing.units?.bathrooms ?? 1,
          rentAmount: listing.rent_amount,
          amenities: [],
          unitFeatures: [],
        }),
      });
      const { description, error } = await res.json();
      if (error) throw new Error(error);
      setValue("description", description, { shouldDirty: true });
      toast({ title: "Description regenerated", variant: "success" });
    } catch {
      toast({ title: "Failed to generate copy", variant: "destructive" });
    }
    setGeneratingCopy(false);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!listing) return null;

  const sc = STATUS_CONFIG[listing.status] ?? STATUS_CONFIG.draft;
  const pending = applications.filter((a) => a.status === "submitted");

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link
          href="/landlord/listings"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold flex-1 truncate">{listing.title}</h1>
        <Badge variant={sc.variant}>{sc.label}</Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-8 pl-7">
        {listing.properties?.name} · Unit {listing.units?.unit_number}
        {" · "}{listing.properties?.city}, {listing.properties?.state}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit form — main column */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="glass rounded-xl p-6 space-y-4">
              <h2 className="font-semibold">Listing details</h2>

              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input {...register("title")} />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <Button
                    type="button" variant="ghost" size="sm"
                    onClick={generateCopy} disabled={generatingCopy}
                    className="text-primary hover:text-primary"
                  >
                    {generatingCopy
                      ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                    {generatingCopy ? "Generating…" : "AI rewrite"}
                  </Button>
                </div>
                <Textarea rows={6} {...register("description")} />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Monthly rent</Label>
                  <Input type="number" {...register("rent_amount")} />
                  {errors.rent_amount && <p className="text-xs text-destructive">{errors.rent_amount.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Available date</Label>
                  <Input type="date" {...register("available_date")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Lease term</Label>
                  <Select
                    defaultValue={String(listing.lease_term_months ?? 12)}
                    onValueChange={(v) => setValue("lease_term_months", Number(v), { shouldDirty: true })}
                  >
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
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving || !isDirty}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save changes
              </Button>
              <Link href={`/listings/${id}`} target="_blank">
                <Button type="button" variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />Views
                </span>
                <span className="font-semibold">{listing.views}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />Applications
                </span>
                <span className="font-semibold">{applications.length}</span>
              </div>
              {pending.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />Pending review
                  </span>
                  <span className="font-semibold text-amber-500">{pending.length}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status actions */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Listing status</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {listing.status === "draft" && (
                <Button
                  className="w-full" size="sm"
                  onClick={() => updateStatus("active")}
                >
                  Publish listing
                </Button>
              )}
              {listing.status === "active" && (
                <Button
                  variant="outline" className="w-full" size="sm"
                  onClick={() => updateStatus("paused")}
                >
                  Pause listing
                </Button>
              )}
              {listing.status === "paused" && (
                <Button
                  className="w-full" size="sm"
                  onClick={() => updateStatus("active")}
                >
                  Re-activate
                </Button>
              )}
              {(listing.status === "active" || listing.status === "paused") && (
                <Button
                  variant="ghost" className="w-full text-destructive hover:text-destructive" size="sm"
                  onClick={() => updateStatus("archived")}
                >
                  Remove listing
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Applications panel */}
      {applications.length > 0 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Applications ({applications.length})
          </h2>
          <div className="space-y-3">
            {applications.map((app) => (
              <Card key={app.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-sm">
                          {app.profiles?.full_name ?? "Applicant"}
                        </p>
                        <span className="flex items-center gap-1">
                          {APP_STATUS_ICON[app.status] ?? APP_STATUS_ICON.submitted}
                          <Badge variant="outline" className="text-xs capitalize">
                            {app.status.replace("_", " ")}
                          </Badge>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {app.profiles?.email}
                        {" · "}Income: {formatCurrency(app.monthly_income)}/mo
                        {" · "}Credit: {app.credit_score_range}
                        {" · "}Move-in: {formatDate(app.move_in_date)}
                      </p>
                    </div>

                    {app.status === "submitted" && (
                      <div className="flex gap-2 shrink-0">
                        <form action={`/api/applications/${app.id}`} method="POST">
                          <input type="hidden" name="status" value="under_review" />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                          >
                            Review
                          </button>
                        </form>
                      </div>
                    )}
                    {app.status === "under_review" && (
                      <div className="flex gap-2 shrink-0">
                        <form action={`/api/applications/${app.id}`} method="POST">
                          <input type="hidden" name="status" value="approved" />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20 border border-green-500/30 transition-colors"
                          >
                            Approve
                          </button>
                        </form>
                        <form action={`/api/applications/${app.id}`} method="POST">
                          <input type="hidden" name="status" value="rejected" />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 transition-colors"
                          >
                            Reject
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
