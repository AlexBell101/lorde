"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, User, Briefcase, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/utils";
import type { RenterProfile, RentalHistoryEntry, Reference } from "@/types";

export default function RenterProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<RenterProfile | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("renter_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setProfile(data ?? {
        id: "",
        user_id: user.id,
        monthly_income: undefined,
        employment_status: "",
        employer_name: "",
        credit_score_range: "",
        rental_history: [],
        personal_references: [],
        income_verification_docs: [],
        has_pets: false,
        pet_details: "",
        move_in_date: undefined,
        created_at: "",
        updated_at: "",
      });
      setLoading(false);
    }
    load();
  }, []);

  async function save() {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("renter_profiles")
      .upsert({ ...profile, user_id: user.id });

    if (error) {
      toast({ title: "Error saving profile", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved!", variant: "success" });
    }
    setSaving(false);
  }

  function addRentalHistory() {
    setProfile((p) => ({
      ...p!,
      rental_history: [
        ...(p?.rental_history ?? []),
        { address: "", landlord_name: "", monthly_rent: 0, start_date: "", end_date: "" },
      ],
    }));
  }

  function updateRentalHistory(idx: number, update: Partial<RentalHistoryEntry>) {
    setProfile((p) => ({
      ...p!,
      rental_history: p!.rental_history.map((r, i) => (i === idx ? { ...r, ...update } : r)),
    }));
  }

  function removeRentalHistory(idx: number) {
    setProfile((p) => ({
      ...p!,
      rental_history: p!.rental_history.filter((_, i) => i !== idx),
    }));
  }

  function addReference() {
    setProfile((p) => ({
      ...p!,
      personal_references: [...(p?.personal_references ?? []), { name: "", relationship: "" }],
    }));
  }

  function updateReference(idx: number, update: Partial<Reference>) {
    setProfile((p) => ({
      ...p!,
      personal_references: p!.personal_references.map((r, i) => (i === idx ? { ...r, ...update } : r)),
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Renter Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your profile is pre-filled when you apply to listings
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save profile
        </Button>
      </div>

      <div className="space-y-6">
        {/* Financial info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Income & employment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Monthly income</Label>
                <Input
                  type="number"
                  value={profile?.monthly_income ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p!, monthly_income: Number(e.target.value) }))}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Credit score range</Label>
                <Select
                  value={profile?.credit_score_range ?? ""}
                  onValueChange={(v) => setProfile((p) => ({ ...p!, credit_score_range: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300-579">300–579 (Poor)</SelectItem>
                    <SelectItem value="580-669">580–669 (Fair)</SelectItem>
                    <SelectItem value="670-739">670–739 (Good)</SelectItem>
                    <SelectItem value="740-799">740–799 (Very Good)</SelectItem>
                    <SelectItem value="800+">800+ (Exceptional)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Employment status</Label>
                <Select
                  value={profile?.employment_status ?? ""}
                  onValueChange={(v) => setProfile((p) => ({ ...p!, employment_status: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employed_full_time">Employed (full-time)</SelectItem>
                    <SelectItem value="employed_part_time">Employed (part-time)</SelectItem>
                    <SelectItem value="self_employed">Self-employed</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="unemployed">Unemployed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Employer</Label>
                <Input
                  value={profile?.employer_name ?? ""}
                  onChange={(e) => setProfile((p) => ({ ...p!, employer_name: e.target.value }))}
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={profile?.has_pets ?? false}
                onCheckedChange={(v) => setProfile((p) => ({ ...p!, has_pets: v }))}
              />
              <Label>I have pets</Label>
            </div>
            {profile?.has_pets && (
              <Input
                value={profile?.pet_details ?? ""}
                onChange={(e) => setProfile((p) => ({ ...p!, pet_details: e.target.value }))}
                placeholder="e.g. 1 medium-sized dog (Labrador)"
              />
            )}
          </CardContent>
        </Card>

        {/* Rental history */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4" />
                Rental history
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={addRentalHistory}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!profile?.rental_history?.length && (
              <p className="text-sm text-muted-foreground">Add your rental history to strengthen your application.</p>
            )}
            {profile?.rental_history?.map((r, i) => (
              <div key={i} className="p-4 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Previous rental {i + 1}</span>
                  <button onClick={() => removeRentalHistory(i)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Address" value={r.address} onChange={(e) => updateRentalHistory(i, { address: e.target.value })} />
                  <Input placeholder="Landlord name" value={r.landlord_name} onChange={(e) => updateRentalHistory(i, { landlord_name: e.target.value })} />
                  <Input type="number" placeholder="Monthly rent" value={r.monthly_rent || ""} onChange={(e) => updateRentalHistory(i, { monthly_rent: Number(e.target.value) })} />
                  <Input placeholder="Reason for leaving" value={r.reason_for_leaving ?? ""} onChange={(e) => updateRentalHistory(i, { reason_for_leaving: e.target.value })} />
                  <Input type="date" placeholder="Start date" value={r.start_date} onChange={(e) => updateRentalHistory(i, { start_date: e.target.value })} />
                  <Input type="date" placeholder="End date" value={r.end_date ?? ""} onChange={(e) => updateRentalHistory(i, { end_date: e.target.value })} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* References */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-4 h-4" />
                References
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={addReference}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!profile?.personal_references?.length && (
              <p className="text-sm text-muted-foreground">Add references who can vouch for you as a tenant.</p>
            )}
            {profile?.personal_references?.map((r, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <Input placeholder="Name" value={r.name} onChange={(e) => updateReference(i, { name: e.target.value })} />
                <Input placeholder="Relationship" value={r.relationship} onChange={(e) => updateReference(i, { relationship: e.target.value })} />
                <Input type="email" placeholder="Email" value={r.email ?? ""} onChange={(e) => updateReference(i, { email: e.target.value })} />
                <Input type="tel" placeholder="Phone" value={r.phone ?? ""} onChange={(e) => updateReference(i, { phone: e.target.value })} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
