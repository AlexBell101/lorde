"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/types";
import { toast } from "@/components/ui/toaster";

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }
    load();
  }, [router]);

  async function complete() {
    if (!profile) return;
    setSaving(true);
    const supabase = createClient();

    await supabase
      .from("profiles")
      .update({ phone })
      .eq("id", profile.id);

    toast({ title: "Welcome to Lorde!", variant: "success" });

    const dest = profile.role === "landlord" ? "/landlord" : "/renter/search";
    router.push(dest);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isLandlord = profile?.role === "landlord";

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <Building2 className="w-6 h-6 text-primary" />
          <span className="font-semibold text-lg">Lorde</span>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Account created</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {isLandlord ? "Set up your landlord account" : "Complete your renter profile"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLandlord
              ? "You're almost ready to list your first property."
              : "A complete profile helps landlords approve your applications faster."}
          </p>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-xl p-6 space-y-4">
            <div className="space-y-1.5">
              <Label>Phone number</Label>
              <Input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {isLandlord ? (
            <div className="glass rounded-xl p-6">
              <h3 className="font-medium mb-3">What you can do as a landlord</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Add properties and units",
                  "Create and publish listings",
                  "Review and approve applications",
                  "Collect rent and track payments",
                  "Manage maintenance requests",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="glass rounded-xl p-6">
              <h3 className="font-medium mb-3">What you can do as a renter</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  "Search listings on a live map",
                  "Submit one application to many properties",
                  "Pay rent online with autopay",
                  "Submit maintenance requests",
                  "Message landlords directly",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={complete} className="w-full" disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLandlord ? "Go to my dashboard" : "Start searching"}
          </Button>
        </div>
      </div>
    </div>
  );
}
