"use client";

import { useState, useCallback, useRef } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  type MapRef,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Bed,
  Bath,
  SquareCode,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, bedroomLabel, bathroomLabel } from "@/lib/utils";
import { toast } from "@/components/ui/toaster";

interface MapListing {
  id: string;
  title: string;
  rent_amount: number;
  available_date: string;
  properties: {
    latitude?: number;
    longitude?: number;
    city: string;
    state: string;
    address: string;
    amenities: string[];
    photos: string[];
    property_type: string;
  };
  units: {
    bedrooms: number;
    bathrooms: number;
    square_feet?: number;
    unit_number: string;
  };
}

interface MapSearchProps {
  initialListings: MapListing[];
  savedListingIds?: string[];
  isLoggedIn?: boolean;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

export function MapSearch({ initialListings, savedListingIds = [], isLoggedIn = false }: MapSearchProps) {
  const mapRef = useRef<MapRef>(null);
  const [selectedListing, setSelectedListing] = useState<MapListing | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [listPanelOpen, setListPanelOpen] = useState(true);
  const [filters, setFilters] = useState({
    minRent: "",
    maxRent: "",
    bedrooms: "",
    petFriendly: false,
  });
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(savedListingIds));
  const [savingId, setSavingId] = useState<string | null>(null);

  async function toggleSave(e: React.MouseEvent, listingId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) return;
    if (savingId === listingId) return;

    setSavingId(listingId);
    const wasSaved = savedIds.has(listingId);
    // Optimistic update
    setSavedIds((prev) => {
      const next = new Set(prev);
      wasSaved ? next.delete(listingId) : next.add(listingId);
      return next;
    });

    try {
      const res = await fetch(`/api/listings/${listingId}/save`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        // Revert
        setSavedIds((prev) => {
          const next = new Set(prev);
          wasSaved ? next.add(listingId) : next.delete(listingId);
          return next;
        });
        toast({ title: "Error", description: json.error, variant: "destructive" });
      } else {
        if (json.saved) {
          toast({ title: "Saved!", description: "Find it in your Saved listings.", variant: "success" });
        } else {
          toast({ title: "Removed from saved" });
        }
      }
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        wasSaved ? next.add(listingId) : next.delete(listingId);
        return next;
      });
    } finally {
      setSavingId(null);
    }
  }

  // Guard against null properties/units (e.g. while RLS policies propagate)
  const validListings = initialListings.filter(
    (l) => l.properties != null && l.units != null
  );

  const filtered = validListings.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.title.toLowerCase().includes(q) ||
      l.properties.city.toLowerCase().includes(q) ||
      l.properties.address.toLowerCase().includes(q);

    const matchMin = !filters.minRent || l.rent_amount >= Number(filters.minRent);
    const matchMax = !filters.maxRent || l.rent_amount <= Number(filters.maxRent);
    const matchBeds =
      !filters.bedrooms || l.units.bedrooms >= Number(filters.bedrooms);
    const matchPet =
      !filters.petFriendly ||
      l.properties.amenities?.includes("Pet-friendly");

    return matchSearch && matchMin && matchMax && matchBeds && matchPet;
  });

  const geoListings = filtered.filter(
    (l) => l.properties.latitude && l.properties.longitude
  );

  const handleMarkerClick = useCallback((listing: MapListing) => {
    setSelectedListing(listing);
    if (listing.properties.latitude && listing.properties.longitude) {
      mapRef.current?.flyTo({
        center: [listing.properties.longitude, listing.properties.latitude],
        zoom: 14,
        duration: 800,
      });
    }
  }, []);

  return (
    <div className="flex h-full relative">
      {/* List panel */}
      <div
        className={`relative flex flex-col shrink-0 border-r border-border bg-card transition-all duration-300 ${
          listPanelOpen ? "w-[420px]" : "w-0 overflow-hidden"
        }`}
      >
        {listPanelOpen && (
          <>
            {/* Search bar */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by city, neighborhood, address…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={showFilters ? "border-primary text-primary" : ""}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
                  Filters
                </Button>
                <span className="text-xs text-muted-foreground">
                  {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>

              {showFilters && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Min rent"
                      type="number"
                      value={filters.minRent}
                      onChange={(e) => setFilters((f) => ({ ...f, minRent: e.target.value }))}
                    />
                    <Input
                      placeholder="Max rent"
                      type="number"
                      value={filters.maxRent}
                      onChange={(e) => setFilters((f) => ({ ...f, maxRent: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["0", "1", "2", "3+"].map((bd) => (
                      <button
                        key={bd}
                        onClick={() => setFilters((f) => ({ ...f, bedrooms: bd === "3+" ? "3" : bd }))}
                        className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
                          filters.bedrooms === (bd === "3+" ? "3" : bd)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {bd === "0" ? "Studio" : `${bd} BD`}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.petFriendly}
                      onChange={(e) => setFilters((f) => ({ ...f, petFriendly: e.target.checked }))}
                      className="rounded"
                    />
                    Pet-friendly only
                  </label>
                </div>
              )}
            </div>

            {/* Listing cards */}
            <div className="flex-1 overflow-y-auto">
              {filtered.map((l) => (
                <div
                  key={l.id}
                  onClick={() => handleMarkerClick(l)}
                  className={`p-4 border-b border-border cursor-pointer transition-colors hover:bg-secondary/50 ${
                    selectedListing?.id === l.id ? "bg-secondary/70" : ""
                  }`}
                >
                  {l.properties.photos?.[0] ? (
                    <div className="relative h-36 rounded-lg overflow-hidden mb-3">
                      <img
                        src={l.properties.photos[0]}
                        alt={l.title}
                        className="w-full h-full object-cover"
                      />
                      {isLoggedIn && (
                        <button
                          onClick={(e) => toggleSave(e, l.id)}
                          disabled={savingId === l.id}
                          className={cn(
                            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm",
                            savedIds.has(l.id)
                              ? "bg-white text-rose-500"
                              : "bg-black/40 text-white hover:bg-black/60"
                          )}
                        >
                          <Heart className={cn("w-4 h-4", savedIds.has(l.id) && "fill-rose-500")} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-36 rounded-lg bg-muted mb-3 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-muted-foreground/30" />
                      {isLoggedIn && (
                        <button
                          onClick={(e) => toggleSave(e, l.id)}
                          disabled={savingId === l.id}
                          className={cn(
                            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm",
                            savedIds.has(l.id)
                              ? "bg-white text-rose-500"
                              : "bg-secondary/80 text-muted-foreground hover:text-foreground border border-border"
                          )}
                        >
                          <Heart className={cn("w-4 h-4", savedIds.has(l.id) && "fill-rose-500")} />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm leading-tight">{l.title}</h3>
                    <span className="font-bold text-sm shrink-0">
                      {formatCurrency(l.rent_amount)}/mo
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    {l.properties.address}, {l.properties.city}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Bed className="w-3 h-3" />
                      {bedroomLabel(l.units.bedrooms)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-3 h-3" />
                      {bathroomLabel(l.units.bathrooms)}
                    </span>
                    {l.units.square_feet && (
                      <span className="flex items-center gap-1">
                        <SquareCode className="w-3 h-3" />
                        {l.units.square_feet.toLocaleString()} sqft
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {!filtered.length && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <Search className="w-8 h-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No listings match your search</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setSearch("");
                      setFilters({ minRent: "", maxRent: "", bedrooms: "", petFriendly: false });
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setListPanelOpen(!listPanelOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-12 bg-card border border-border rounded-r-lg flex items-center justify-center hover:bg-secondary transition-colors"
        style={{ left: listPanelOpen ? "420px" : "0px" }}
      >
        {listPanelOpen ? (
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        )}
      </button>

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: -84.5120,
            latitude: 39.1031,
            zoom: 12,
          }}
          mapStyle={MAP_STYLE}
          style={{ width: "100%", height: "100%" }}
        >
          <NavigationControl position="top-right" />
          <GeolocateControl position="top-right" />

          {geoListings.map((l) => (
            <Marker
              key={l.id}
              longitude={l.properties.longitude!}
              latitude={l.properties.latitude!}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(l);
              }}
            >
              <div
                className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                  selectedListing?.id === l.id || hoveredId === l.id
                    ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30"
                    : "bg-card text-foreground border border-border hover:border-primary/50 hover:scale-105"
                }`}
                onMouseEnter={() => setHoveredId(l.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {formatCurrency(l.rent_amount)}
              </div>
            </Marker>
          ))}

          {selectedListing &&
            selectedListing.properties.latitude &&
            selectedListing.properties.longitude && (
              <Popup
                longitude={selectedListing.properties.longitude}
                latitude={selectedListing.properties.latitude}
                anchor="top"
                onClose={() => setSelectedListing(null)}
                closeButton={false}
                offset={15}
              >
                <div className="w-64">
                  {selectedListing.properties.photos?.[0] && (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={selectedListing.properties.photos[0]}
                        alt={selectedListing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm leading-tight text-foreground">
                        {selectedListing.title}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        {isLoggedIn && (
                          <button
                            onClick={(e) => toggleSave(e, selectedListing.id)}
                            disabled={savingId === selectedListing.id}
                            className="text-muted-foreground hover:text-rose-500 transition-colors"
                          >
                            <Heart className={cn("w-3.5 h-3.5", savedIds.has(selectedListing.id) && "fill-rose-500 text-rose-500")} />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedListing(null)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-lg font-bold text-primary mb-2">
                      {formatCurrency(selectedListing.rent_amount)}/mo
                    </p>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span>{bedroomLabel(selectedListing.units.bedrooms)}</span>
                      <span>{bathroomLabel(selectedListing.units.bathrooms)}</span>
                      {selectedListing.units.square_feet && (
                        <span>{selectedListing.units.square_feet.toLocaleString()} sqft</span>
                      )}
                    </div>

                    <Link href={`/listings/${selectedListing.id}`}>
                      <Button size="sm" className="w-full">
                        View listing
                      </Button>
                    </Link>
                  </div>
                </div>
              </Popup>
            )}
        </Map>
      </div>
    </div>
  );
}
