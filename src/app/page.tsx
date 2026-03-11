import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, MessageSquare, FileText, ShieldCheck, MapPin, BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

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
  { src: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80", alt: "Modern apartment building" },
  { src: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80", alt: "Bright apartment interior" },
  { src: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80", alt: "Minimal apartment living room" },
];

export default async function HomePage() {
  const listings = await getFeaturedListings();

  return (
    <div className="min-h-screen bg-sand font-sans">

      {/* ── Nav ───────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif text-xl font-semibold text-navy tracking-tight">Lorde</span>
            <span className="hidden sm:inline text-xs text-steel border border-steel/30 rounded px-1.5 py-0.5">Cincinnati</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <Link href="/search" className="hover:text-navy transition-colors">Browse Rentals</Link>
            <Link href="#how-it-works" className="hover:text-navy transition-colors">How It Works</Link>
            <Link href="#trust" className="hover:text-navy transition-colors">Why Lorde</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-navy transition-colors px-3 py-2">
              Sign in
            </Link>
            <Link href="/signup?role=landlord"
              className="text-sm bg-navy text-white hover:bg-navy/90 transition-colors rounded-lg px-4 py-2">
              List Property
            </Link>
          </div>
        </div>
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
                  { label: "Direct messaging" },
                  { label: "Clear pricing" },
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
                <Image src={HERO_PHOTOS[0].src} alt={HERO_PHOTOS[0].alt} fill className="object-cover" unoptimized />
              </div>
              <div className="absolute bottom-0 right-[38%] w-[44%] h-[48%] rounded-2xl overflow-hidden shadow-lg">
                <Image src={HERO_PHOTOS[1].src} alt={HERO_PHOTOS[1].alt} fill className="object-cover" unoptimized />
              </div>
              <div className="absolute bottom-[8%] right-0 w-[36%] h-[42%] rounded-2xl overflow-hidden shadow-lg">
                <Image src={HERO_PHOTOS[2].src} alt={HERO_PHOTOS[2].alt} fill className="object-cover" unoptimized />
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
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl font-medium text-navy mb-3">How Lorde Works</h2>
            <p className="text-gray-500 max-w-md mx-auto">Three steps from search to signed lease. No platform fees.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Search,
                step: "01",
                title: "Browse Listings",
                desc: "Search verified rentals on a map. Filter by price, bedrooms, and neighborhood. Every listing is from a real landlord.",
              },
              {
                icon: MessageSquare,
                step: "02",
                title: "Message Directly",
                desc: "Contact landlords without a middleman. Ask questions, schedule viewings, and negotiate — all in one place.",
              },
              {
                icon: FileText,
                step: "03",
                title: "Apply & Sign",
                desc: "Submit a reusable application. Get approved. Sign your lease. Move in. That's it.",
              },
            ].map((item) => (
              <div key={item.title} className="relative">
                <div className="text-[80px] font-serif font-medium text-gray-100 leading-none select-none absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative pt-6">
                  <div className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center mb-4">
                    <item.icon className="w-4.5 h-4.5 text-steel" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-serif text-lg font-medium text-navy mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
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
                <Link href={`/renter/listings/${l.id}`} key={l.id}
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
            Verified landlords. Transparent listings.<br />No unnecessary layers.
          </h2>
          <p className="text-gray-500 leading-relaxed max-w-xl mx-auto mb-12">
            Every listing on Lorde is connected to a verified local landlord. Pricing is clear. Availability is real. You communicate directly — no bots, no call centers.
          </p>
          <div className="grid sm:grid-cols-3 gap-8 text-left">
            {[
              { title: "Verified Landlords", desc: "Every landlord is identity-verified before listing. You know who you're renting from." },
              { title: "Transparent Pricing", desc: "What you see is what you pay. No surprise fees added at checkout." },
              { title: "Direct Communication", desc: "Message your future landlord directly. No platform routing or automated responses." },
            ].map((item) => (
              <div key={item.title} className="p-6 rounded-xl border border-gray-100 bg-sand/40">
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
            Ready to rent directly?
          </h2>
          <p className="text-gray-400 mb-8">
            Join Cincinnati landlords and renters who skip the middleman.
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
