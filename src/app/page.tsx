import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, Search, MessageSquare, FileText, ShieldCheck,
  MapPin, BadgeCheck, Heart, Sparkles, BarChart3, CreditCard,
  Wrench, Home, CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { HomeNav } from "@/components/home/home-nav";
import { LordeMark } from "@/components/shared/lorde-mark";
import { NavbarRoofline } from "@/components/shared/navbar-roofline";
import type { UserRole } from "@/types";

async function getFeaturedListings() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("listings")
      .select(`id, title, rent_amount, properties(address, city, state, property_type, photos), units(bedrooms, bathrooms, square_feet)`)
      .eq("status", "active")
      .limit(3);
    return data ?? [];
  } catch {
    return [];
  }
}

const HERO_PHOTOS = [
  { src: "/images/image1.png", alt: "Cincinnati skyline at golden hour — Roebling Bridge and Ohio River" },
  { src: "/images/image2.png", alt: "Bright Cincinnati apartment with exposed brick and hardwood floors" },
  { src: "/images/image3.png", alt: "Cincinnati rental interior" },
];

export default async function HomePage() {
  const listings = await getFeaturedListings();

  // Auth state for nav
  let homeUser: { name: string; role: UserRole } | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();
      if (profile) {
        homeUser = { name: profile.full_name, role: profile.role as UserRole };
      }
    }
  } catch {
    // Non-critical — nav falls back to signed-out state
  }

  return (
    <div className="min-h-screen bg-sand font-sans">

      {/* ── Nav ───────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-sm relative">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <LordeMark size={28} />
            <span className="font-serif text-xl font-semibold text-navy tracking-tight">Lorde</span>
            <span className="hidden sm:inline text-xs text-steel border border-steel/30 rounded px-1.5 py-0.5">Cincinnati</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <Link href="/search" className="hover:text-navy transition-colors">Browse Rentals</Link>
            <Link href="#how-it-works" className="hover:text-navy transition-colors">How It Works</Link>
            <Link href="#trust" className="hover:text-navy transition-colors">Why Lorde</Link>
          </nav>
          <HomeNav user={homeUser} />
        </div>
        {/* OTR roofline — self-positioned at navbar bottom, decorative only */}
        <NavbarRoofline />
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="pt-24 pb-0 bg-sand">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-0">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 text-steel text-xs font-medium border border-steel/30 rounded-full px-3 py-1 mb-8">
                <MapPin className="w-3 h-3" />
                Cincinnati, OH — Local Rental Exchange
              </div>
              <h1 className="font-serif text-5xl md:text-6xl font-medium text-navy leading-[1.1] mb-6">
                Find a Rental<br />Without the<br />Middleman.
              </h1>
              <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-md">
                Lorde connects renters and landlords directly through verified listings and simple communication. No listing farms. No hidden fees. Real neighborhoods.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/search"
                  className="inline-flex items-center justify-center gap-2 bg-brick text-white hover:bg-[#992F25] transition-colors rounded-lg px-7 py-3.5 text-sm font-medium">
                  Browse Rentals
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/signup?role=landlord"
                  className="inline-flex items-center justify-center gap-2 border border-navy text-navy hover:bg-navy hover:text-white transition-colors rounded-lg px-7 py-3.5 text-sm font-medium">
                  List Your Property
                </Link>
              </div>

              {/* Trust micro-signals */}
              <div className="flex items-center gap-6 mt-10 pt-10 border-t border-gray-200">
                {[
                  { label: "Verified landlords" },
                  { label: "AI leasing agent" },
                  { label: "No platform fees" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <BadgeCheck className="w-3.5 h-3.5 text-steel" />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: photo mosaic */}
            <div className="relative hidden lg:block h-[540px]">
              <div className="absolute top-0 right-0 w-[58%] h-[55%] rounded-2xl overflow-hidden shadow-lg">
                <Image src={HERO_PHOTOS[0].src} alt={HERO_PHOTOS[0].alt} fill className="object-cover" />
              </div>
              <div className="absolute bottom-0 right-[38%] w-[44%] h-[48%] rounded-2xl overflow-hidden shadow-lg">
                <Image src={HERO_PHOTOS[1].src} alt={HERO_PHOTOS[1].alt} fill className="object-cover" />
              </div>
              <div className="absolute bottom-[8%] right-0 w-[36%] h-[42%] rounded-2xl overflow-hidden shadow-lg">
                <Image src={HERO_PHOTOS[2].src} alt={HERO_PHOTOS[2].alt} fill className="object-cover" />
              </div>
              {/* Floating price pill */}
              <div className="absolute top-[52%] left-[2%] bg-white rounded-xl shadow-lg px-4 py-3 border border-gray-100">
                <p className="text-xs text-gray-400 mb-0.5">Available now</p>
                <p className="text-navy font-semibold text-sm">$1,850 / mo</p>
                <p className="text-xs text-gray-400">2 BD · Over-the-Rhine</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sand-to-white fade strip */}
        <div className="h-16 bg-gradient-to-b from-sand to-white mt-12" />
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">

          {/* For Renters */}
          <div className="text-center mb-14">
            <p className="text-xs font-medium uppercase tracking-widest text-steel mb-3">For Renters</p>
            <h2 className="font-serif text-3xl font-medium text-navy mb-3">Find Your Next Home in Three Steps</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              From first search to move-in day — every tool you need is built in. No third-party fees, no call centers, no waiting.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 mb-24">
            {[
              {
                icon: Search,
                step: "01",
                title: "Browse with Confidence",
                desc: "Search verified Cincinnati rentals on an interactive map. Filter by price, bedrooms, neighborhood, and pet policy. Every listing is tied to a real, local landlord — no management companies, no bait-and-switch.",
                bullets: ["Map-based search across all neighborhoods", "Save listings you love with one tap", "Chat with an AI leasing agent on any listing"],
              },
              {
                icon: MessageSquare,
                step: "02",
                title: "Connect & Apply",
                desc: "Message landlords directly — no routing through a call center. When you're ready, submit a clean one-page application with your income, employment, and references. Reuse it across every listing you apply to.",
                bullets: ["Direct in-app messaging with landlords", "One application, reused across all listings", "Real-time status updates as landlords review"],
              },
              {
                icon: FileText,
                step: "03",
                title: "Move In & Stay Organised",
                desc: "Once approved, everything lives in your dashboard. View your lease details, pay rent online with autopay, submit maintenance requests from your phone, and track your lease end date — all in one place.",
                bullets: ["Online lease viewer with key dates & terms", "Autopay rent through Stripe — no checks", "Submit and track maintenance requests"],
              },
            ].map((item) => (
              <div key={item.title} className="relative">
                <div className="text-[80px] font-serif font-medium text-gray-100 leading-none select-none absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative pt-6">
                  <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center mb-4">
                    <item.icon className="w-4 h-4 text-steel" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-navy mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.desc}</p>
                  <ul className="space-y-1.5">
                    {item.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-xs text-gray-500">
                        <CheckCircle2 className="w-3.5 h-3.5 text-steel shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 mb-20" />

          {/* For Landlords */}
          <div className="text-center mb-14">
            <p className="text-xs font-medium uppercase tracking-widest text-steel mb-3">For Landlords</p>
            <h2 className="font-serif text-3xl font-medium text-navy mb-3">Your Whole Portfolio. One Dashboard.</h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              List properties, review applicants, collect rent, and track everything — without paying a percentage to a listing platform.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Sparkles,
                title: "AI-Powered Listings",
                desc: "Write a great listing in seconds. Our AI generates compelling descriptions and suggests competitive pricing based on your unit details and Cincinnati market data.",
              },
              {
                icon: Home,
                title: "Applications & Leases",
                desc: "Review income, employment, and credit range side-by-side. Approve with one click — the lease is created automatically with the right start date and term.",
              },
              {
                icon: CreditCard,
                title: "Rent Collection",
                desc: "Stripe-powered payments with autopay support. Track every payment — on-time, late, or failed — with a full history per tenant.",
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                desc: "See occupancy rate, monthly revenue, application pipeline, and payment health across your entire portfolio in real time.",
              },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-xl border border-gray-100 bg-sand/40 hover:border-gray-200 transition-colors">
                <div className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center mb-4">
                  <item.icon className="w-4 h-4 text-steel" strokeWidth={1.5} />
                </div>
                <h4 className="font-serif text-sm font-medium text-navy mb-2">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Featured Listings ─────────────────────────────────── */}
      <section className="py-24 bg-sand">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl font-medium text-navy mb-2">Available Now</h2>
              <p className="text-gray-500">Verified rentals from local landlords.</p>
            </div>
            <Link href="/search"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm text-brick hover:text-brick/80 transition-colors font-medium">
              View all listings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {listings.length > 0 ? listings.map((l: any, i: number) => {
              const prop = l.properties as any;
              const unit = l.units as any;
              const photo = HERO_PHOTOS[i % HERO_PHOTOS.length];
              return (
                <Link href={`/listings/${l.id}`} key={l.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="relative h-52 overflow-hidden">
                    <Image src={photo.src} alt={l.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                    <div className="absolute top-3 left-3">
                      <span className="badge-trust">
                        <BadgeCheck className="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-navy text-sm leading-snug">{l.title}</h3>
                      <span className="text-navy font-semibold text-sm shrink-0">
                        ${Number(l.rent_amount).toLocaleString()}/mo
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {prop?.address}, {prop?.city}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {unit?.bedrooms === 0 ? <span>Studio</span> : <span>{unit?.bedrooms} BD</span>}
                      <span>·</span>
                      <span>{unit?.bathrooms} BA</span>
                      {unit?.square_feet && <><span>·</span><span>{unit.square_feet.toLocaleString()} sqft</span></>}
                    </div>
                  </div>
                </Link>
              );
            }) : (
              // Fallback placeholder cards when no DB data
              [
                { title: "2BD Near Findlay Market", addr: "1420 Vine St, Over-the-Rhine", price: 1850, beds: 2, baths: 1 },
                { title: "Studio in Walnut Hills", addr: "802 Madison Rd, Walnut Hills", price: 975, beds: 0, baths: 1 },
                { title: "3BD House in Hyde Park", addr: "3310 Erie Ave, Hyde Park", price: 2400, beds: 3, baths: 2 },
              ].map((l, i) => (
                <Link href="/search" key={l.title}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="relative h-52 overflow-hidden">
                    <Image src={HERO_PHOTOS[i].src} alt={l.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                    <div className="absolute top-3 left-3">
                      <span className="badge-trust"><BadgeCheck className="w-3 h-3" />Verified</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-navy text-sm leading-snug">{l.title}</h3>
                      <span className="text-navy font-semibold text-sm shrink-0">${l.price.toLocaleString()}/mo</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{l.addr}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {l.beds === 0 ? <span>Studio</span> : <span>{l.beds} BD</span>}
                      <span>·</span><span>{l.baths} BA</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="text-center mt-10">
            <Link href="/search"
              className="inline-flex items-center gap-2 bg-brick text-white hover:bg-[#992F25] transition-colors rounded-lg px-8 py-3.5 text-sm font-medium">
              Browse All Rentals <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Section ─────────────────────────────────────── */}
      <section id="trust" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ShieldCheck className="w-8 h-8 text-steel mx-auto mb-6" strokeWidth={1.5} />
          <h2 className="font-serif text-3xl font-medium text-navy mb-4">
            Built for how Cincinnati actually rents.
          </h2>
          <p className="text-gray-500 leading-relaxed max-w-2xl mx-auto mb-14">
            Lorde isn&apos;t a national listing farm that happens to include Cincinnati. It&apos;s a platform built specifically for this city — the neighbourhoods, the landlords, and the renters who live here. Every feature exists because a local person needed it.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-left mb-10">
            {[
              {
                icon: ShieldCheck,
                title: "Verified Landlords Only",
                desc: "Every landlord account is verified before their first listing goes live. You know the name, you see the property — no anonymous management companies hiding behind a portal.",
              },
              {
                icon: MessageSquare,
                title: "Real Direct Communication",
                desc: "Message your future landlord directly in the app. No call centre routing, no automated holding patterns. When you ask a question, a real person answers.",
              },
              {
                icon: Sparkles,
                title: "AI That Actually Helps",
                desc: "Our AI leasing agent answers questions about any listing — instantly, any time of day. Landlords use AI to write listings and get pricing suggestions. It's assistance, not a replacement for real people.",
              },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-xl border border-gray-100 bg-sand/40">
                <item.icon className="w-4 h-4 text-steel mb-3" strokeWidth={1.5} />
                <h4 className="font-medium text-navy text-sm mb-2">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            {[
              {
                icon: Heart,
                title: "Save & Come Back",
                desc: "Tap the heart on any listing to save it. Build a shortlist, compare your options, and apply when you're ready — no pressure, no expiry timers.",
              },
              {
                icon: Wrench,
                title: "Maintenance, Handled",
                desc: "Renters submit maintenance requests from their dashboard. Landlords triage and track them in one place. No more text chains or missed emails.",
              },
              {
                icon: BadgeCheck,
                title: "Transparent Pricing",
                desc: "What the listing says is what you pay. No platform surcharges at checkout, no application fees. The price shown is the monthly rent.",
              },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-xl border border-gray-100 bg-sand/40">
                <item.icon className="w-4 h-4 text-steel mb-3" strokeWidth={1.5} />
                <h4 className="font-medium text-navy text-sm mb-2">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Band ──────────────────────────────────────────── */}
      <section className="py-20 bg-navy">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl font-medium text-white mb-4">
            Cincinnati&apos;s rental market, simplified.
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Whether you&apos;re searching for your next home or managing a portfolio of properties — Lorde gives you every tool you need, with no middlemen taking a cut.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/search"
              className="inline-flex items-center gap-2 bg-brick text-white hover:bg-[#992F25] transition-colors rounded-lg px-8 py-3.5 text-sm font-medium">
              Browse Rentals <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/signup?role=landlord"
              className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/10 transition-colors rounded-lg px-8 py-3.5 text-sm font-medium">
              List Your Property
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-navy border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <span className="font-serif text-lg font-semibold text-white">Lorde</span>
              <p className="text-gray-500 text-xs mt-1">Local Rental Exchange · Cincinnati, OH</p>
            </div>
            <nav className="flex flex-wrap gap-6 text-sm text-gray-400">
              <Link href="/search"       className="hover:text-white transition-colors">Browse</Link>
              <Link href="/signup?role=landlord" className="hover:text-white transition-colors">List Property</Link>
              <Link href="/login"        className="hover:text-white transition-colors">Sign In</Link>
              <Link href="/signup"       className="hover:text-white transition-colors">Sign Up</Link>
            </nav>
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 text-xs text-gray-600">
            © {new Date().getFullYear()} Lorde. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
