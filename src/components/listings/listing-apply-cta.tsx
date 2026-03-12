"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationDrawer } from "@/components/renter/application-drawer";
import type { RenterProfile } from "@/types";

interface ListingApplyCtaProps {
  listingId: string;
  listingTitle: string;
  rentAmount: number;
  isLoggedIn: boolean;
  isRenter: boolean;
  alreadyApplied: boolean;
  renterProfile: RenterProfile | null;
}

export function ListingApplyCta({
  listingId,
  listingTitle,
  rentAmount,
  isLoggedIn,
  isRenter,
  alreadyApplied,
  renterProfile,
}: ListingApplyCtaProps) {
  // Already applied — show status badge
  if (isLoggedIn && isRenter && alreadyApplied) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-600">Application submitted</p>
            <p className="text-xs text-muted-foreground">We&apos;ll notify you of any updates.</p>
          </div>
        </div>
        <Link href="/renter/applications">
          <Button variant="outline" className="w-full">View my applications</Button>
        </Link>
      </div>
    );
  }

  // Logged-in renter — show the drawer
  if (isLoggedIn && isRenter) {
    return (
      <ApplicationDrawer
        listingId={listingId}
        listingTitle={listingTitle}
        rentAmount={rentAmount}
        renterProfile={renterProfile}
      />
    );
  }

  // Logged-in landlord — no apply action
  if (isLoggedIn && !isRenter) {
    return (
      <Link href="/landlord">
        <Button variant="outline" className="w-full">Go to dashboard</Button>
      </Link>
    );
  }

  // Not logged in
  return (
    <div className="space-y-3">
      <Link href={`/signup?redirect=/listings/${listingId}`}>
        <Button className="w-full">Apply now</Button>
      </Link>
      <Link href={`/login?redirect=/listings/${listingId}`}>
        <Button variant="outline" className="w-full">Sign in to apply</Button>
      </Link>
    </div>
  );
}
