import Link from "next/link";
import { ArrowRight, Building2, Shield, Zap, MapPin, CreditCard, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg tracking-tight">Lorde</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="#landlords" className="hover:text-foreground transition-colors">Landlords</Link>
            <Link href="#renters" className="hover:text-foreground transition-colors">Renters</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started <ArrowRight className="w-4 h-4 ml-1.5" /></Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-8">
            <Zap className="w-3 h-3" />
            AI-powered rental platform
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-none">
            The rental platform
            <br />
            <span className="gradient-text">built for both sides</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Modern property management for landlords. Map-first apartment search for renters.
            Payments, maintenance, and messaging — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup?role=landlord">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8">
                List your property <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/signup?role=renter">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8">
                Find an apartment
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything you need</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            From listing to lease signing to rent collection — Lorde handles the full rental lifecycle.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: MapPin,
                title: "Map-first search",
                desc: "Explore listings on a custom dark map with commute overlays and neighborhood filters.",
              },
              {
                icon: Zap,
                title: "AI listing copy",
                desc: "Generate compelling listing descriptions from property details in seconds.",
              },
              {
                icon: Shield,
                title: "Tenant screening",
                desc: "One application, multiple properties. Income verification, references, and credit range.",
              },
              {
                icon: CreditCard,
                title: "Online payments",
                desc: "Rent collection with autopay, late fee automation, and full payment history.",
              },
              {
                icon: Wrench,
                title: "Maintenance tracking",
                desc: "Renters submit requests, landlords track status. Priority-based inbox.",
              },
              {
                icon: Building2,
                title: "Listing syndication",
                desc: "Push to Zillow, Apartments.com, Facebook Marketplace, and Craigslist from one dashboard.",
              },
            ].map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to modernize your rental?</h2>
          <p className="text-muted-foreground mb-8">
            Join landlords and renters who use Lorde to make the rental experience better.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup?role=landlord">
              <Button size="lg" className="h-12 px-8">
                I&apos;m a landlord <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/signup?role=renter">
              <Button size="lg" variant="outline" className="h-12 px-8">
                I&apos;m a renter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>Lorde</span>
          </div>
          <p>© {new Date().getFullYear()} Lorde. Built for modern rentals.</p>
        </div>
      </footer>
    </div>
  );
}
