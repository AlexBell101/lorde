"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Users,
  CreditCard,
  Wrench,
  MessageSquare,
  LogOut,
  Search,
  FileText,
  User,
  BarChart3,
  Rss,
  Headphones,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { LordeMark } from "@/components/shared/lorde-mark";
import type { UserRole } from "@/types";

interface SidebarProps {
  role: UserRole;
  userName: string;
}

const landlordNav: Array<{ href: string; label: string; icon: React.ElementType; exact?: boolean }> = [
  { href: "/landlord", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/landlord/properties", label: "Properties", icon: Building2 },
  { href: "/landlord/listings", label: "Listings", icon: Rss },
  { href: "/landlord/tenants", label: "Tenants", icon: Users },
  { href: "/landlord/payments", label: "Payments", icon: CreditCard },
  { href: "/landlord/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/landlord/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/landlord/support", label: "Support", icon: Headphones },
];

const renterNav: Array<{ href: string; label: string; icon: React.ElementType; exact?: boolean }> = [
  { href: "/renter/search", label: "Search", icon: Search },
  { href: "/renter/saved", label: "Saved", icon: Heart },
  { href: "/renter/applications", label: "Applications", icon: FileText },
  { href: "/renter/lease", label: "My Lease", icon: Building2 },
  { href: "/renter/payments", label: "Payments", icon: CreditCard },
  { href: "/renter/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/renter/profile", label: "My Profile", icon: User },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/renter/support", label: "Support", icon: Headphones },
];

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = role === "landlord" ? landlordNav : renterNav;

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 h-screen flex flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
        <LordeMark size={26} className="mr-2 shrink-0" />
        <span className="font-semibold tracking-tight">Lorde</span>
        <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 rounded border border-border">
          {role}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-medium truncate flex-1">{userName}</span>
          <button
            onClick={signOut}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
