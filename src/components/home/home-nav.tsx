"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

interface HomeNavProps {
  user: {
    name: string;
    role: UserRole;
  } | null;
}

export function HomeNav({ user }: HomeNavProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm text-gray-600 hover:text-navy transition-colors px-3 py-2"
        >
          Sign in
        </Link>
        <Link
          href="/signup?role=landlord"
          className="text-sm bg-navy text-white hover:bg-navy/90 transition-colors rounded-lg px-4 py-2"
        >
          List Property
        </Link>
      </div>
    );
  }

  const dashboardUrl = user.role === "landlord" ? "/landlord" : "/renter/search";
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative flex items-center gap-3">
      <Link
        href={dashboardUrl}
        className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-navy transition-colors px-3 py-2"
      >
        <LayoutDashboard className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      {/* Avatar dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-navy/10 flex items-center justify-center text-xs font-semibold text-navy">
            {initials}
          </div>
          <span className="hidden sm:block text-sm text-gray-700 max-w-[100px] truncate">
            {user.name.split(" ")[0]}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
              <Link
                href={dashboardUrl}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-gray-400" />
                Dashboard
              </Link>
              <button
                onClick={signOut}
                disabled={signingOut}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-gray-400" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
