"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import Link from "next/link";
import {
  Compass,
  MapPin,
  Clock,
  Sparkles,
  Users2,
  Filter,
  CheckCircle2,
  Layers,
  List,
  Map as MapIcon,
} from "lucide-react";
import { ShiftCard, ShiftWithRelations } from "@/components/shift-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SEED_USERS } from "@/lib/db/seed-data";

// Dynamically load Leaflet map on client-side only (avoid SSR window error)
const DiscoveryMap = dynamic(() => import("@/components/discovery-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] rounded-3xl bg-stone-100 flex items-center justify-center text-stone-400 text-xs animate-pulse">
      Loading interactive map...
    </div>
  ),
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DiscoveryPage() {
  const [filterType, setFilterType] = useState<"all" | "in_person" | "remote" | "short" | "friends">("all");
  const [activeHubId, setActiveHubId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "map">("cards");
  const [currentUserId, setCurrentUserId] = useState<string>("usr_marcus");
  const [currentUserName, setCurrentUserName] = useState<string>("Marcus Vance");

  // Fetch active persona
  useEffect(() => {
    fetch("/api/auth/switch-persona")
      .then((res) => res.json())
      .then((data) => {
        if (data.activeUserId) {
          setCurrentUserId(data.activeUserId);
          const found = SEED_USERS.find((u) => u.id === data.activeUserId);
          if (found) setCurrentUserName(found.displayName);
        }
      })
      .catch(() => {});
  }, []);

  // SWR for live shifts data with 4s polling
  const { data, error, mutate, isValidating } = useSWR("/api/shifts", fetcher, {
    refreshInterval: 4000,
    revalidateOnFocus: true,
  });

  // Listen to BroadcastChannel for instant multi-tab synchronization
  useEffect(() => {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("relay_shifts");
      bc.onmessage = (event) => {
        if (
          event.data.type === "SHIFT_CLAIMED" ||
          event.data.type === "SHIFT_CANCELLED" ||
          event.data.type === "SHIFT_PUBLISHED" ||
          event.data.type === "DB_RESET"
        ) {
          mutate();
        }
      };
      return () => {
        bc.close();
      };
    }
  }, [mutate]);

  const shifts: ShiftWithRelations[] = data?.shifts || [];

  // Filter shifts based on active filter pill
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      if (filterType === "in_person") return s.locationType === "in_person";
      if (filterType === "remote") return s.locationType === "remote";
      if (filterType === "short") return s.durationMins <= 60;
      if (filterType === "friends") return s.participants.length > 0;
      return true;
    });
  }, [shifts, filterType]);

  // Extract unique hubs for map markers
  const mapHubs = useMemo(() => {
    const hubMap = new Map<string, any>();
    shifts.forEach((s) => {
      if (s.locationType === "in_person" && s.hub) {
        if (!hubMap.has(s.hub.id)) {
          hubMap.set(s.hub.id, {
            id: s.hub.id,
            name: s.hub.name,
            address: s.hub.address,
            latitude: (s.hub as any).latitude || 47.6152,
            longitude: (s.hub as any).longitude || -122.3135,
            category: s.hub.category || "pantry",
            shiftTitles: [s.title],
          });
        } else {
          hubMap.get(s.hub.id).shiftTitles.push(s.title);
        }
      }
    });
    return Array.from(hubMap.values());
  }, [shifts]);

  const filterTabs = [
    { id: "all", label: "All Opportunities" },
    { id: "in_person", label: "Nearby In-Person" },
    { id: "remote", label: "Remote & Digital" },
    { id: "short", label: "Under 1 Hour" },
    { id: "friends", label: "Has Volunteers" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col">
      {/* Hero Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Community Micro-Shifts
            </h1>
            <Badge variant="emerald" dot>
              Live Sync
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 max-w-xl">
            Short, actionable opportunities (30–120 mins). Claim a spot and bring a friend along.
          </p>
        </div>

        {/* Quick CTA to AI Intake */}
        <div className="flex items-center gap-2">
          <Link href="/intake">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Organizer AI Intake
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Mobile View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          {filterTabs.map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Mobile View Toggle: Cards vs Map */}
        <div className="flex lg:hidden items-center self-end bg-stone-200/80 p-0.5 rounded-xl text-xs">
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all ${
              viewMode === "cards" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Cards
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold transition-all ${
              viewMode === "map" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            Map
          </button>
        </div>
      </div>

      {/* Airbnb-Style Split View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Left Side: Micro-Shift Cards Feed */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            viewMode === "map" ? "hidden lg:block" : "block"
          }`}
        >
          {!data && !error ? (
            <div className="space-y-4">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-44 w-full rounded-2xl" />
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-stone-300 bg-white">
              <Compass className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-stone-800">No shifts match this filter</h3>
              <p className="text-xs text-stone-500 mt-1 mb-4">
                Try selecting &ldquo;All Opportunities&rdquo; or create a new shift via AI Intake.
              </p>
              <Button size="sm" variant="outline" onClick={() => setFilterType("all")}>
                Reset Filter
              </Button>
            </div>
          ) : (
            filteredShifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                onClaimSuccess={() => mutate()}
                onHover={(hubId) => setActiveHubId(hubId)}
              />
            ))
          )}
        </div>

        {/* Right Side: Sticky Interactive Leaflet Map */}
        <div
          className={`lg:col-span-5 lg:sticky lg:top-24 h-[420px] lg:h-[calc(100vh-140px)] ${
            viewMode === "cards" ? "hidden lg:block" : "block"
          }`}
        >
          <DiscoveryMap
            hubs={mapHubs}
            activeHubId={activeHubId}
            onSelectHub={(hubId) => setActiveHubId(hubId)}
          />
        </div>
      </div>
    </div>
  );
}
