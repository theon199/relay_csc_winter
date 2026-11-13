"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

interface HubMarker {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  shiftTitles: string[];
}

interface DiscoveryMapProps {
  hubs: HubMarker[];
  activeHubId?: string | null;
  onSelectHub?: (hubId: string) => void;
}

export default function DiscoveryMap({
  hubs,
  activeHubId,
  onSelectHub,
}: DiscoveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center to Seattle metro area where hubs are seeded
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([47.6205, -122.3321], 12);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Warm, high-contrast, free OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers whenever hubs change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const categoryIcons: Record<string, string> = {
      pantry: "🥫",
      library: "📚",
      park: "🌱",
      school: "🎒",
      community_center: "🏛️",
    };

    hubs.forEach((hub) => {
      const isSelected = hub.id === activeHubId;
      const emoji = categoryIcons[hub.category] || "📍";

      const icon = L.divIcon({
        className: "custom-hub-marker-container",
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? "44px" : "36px"};
            height: ${isSelected ? "44px" : "36px"};
            background: ${isSelected ? "#047857" : "#ffffff"};
            border: 2.5px solid ${isSelected ? "#ffffff" : "#059669"};
            border-radius: 9999px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-size: ${isSelected ? "18px" : "15px"};
            transition: all 0.2s ease;
            cursor: pointer;
          ">
            ${emoji}
          </div>
        `,
        iconSize: isSelected ? [44, 44] : [36, 36],
        iconAnchor: isSelected ? [22, 22] : [18, 18],
      });

      const marker = L.marker([hub.latitude, hub.longitude], { icon }).addTo(map);

      const shiftListHtml = hub.shiftTitles
        .map(
          (t) =>
            `<li style="font-size: 11px; color: #1c1917; margin-bottom: 2px;">• ${t}</li>`
        )
        .join("");

      marker.bindPopup(`
        <div style="padding: 4px; min-width: 170px;">
          <p style="font-size: 12px; font-weight: bold; color: #047857; margin: 0 0 2px 0;">
            ${hub.name}
          </p>
          <p style="font-size: 10px; color: #78716c; margin: 0 0 6px 0;">
            ${hub.address}
          </p>
          <p style="font-size: 10px; font-weight: 600; text-transform: uppercase; color: #57534e; margin: 0 0 3px 0;">
            Micro-Shifts at this Hub:
          </p>
          <ul style="padding-left: 10px; margin: 0;">
            ${shiftListHtml}
          </ul>
        </div>
      `);

      marker.on("click", () => {
        if (onSelectHub) onSelectHub(hub.id);
      });

      markersRef.current.set(hub.id, marker);
    });
  }, [hubs, activeHubId, onSelectHub]);

  // Center on active hub if selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !activeHubId) return;

    const hub = hubs.find((h) => h.id === activeHubId);
    if (hub) {
      map.flyTo([hub.latitude, hub.longitude], 14, { duration: 0.8 });
      const marker = markersRef.current.get(hub.id);
      if (marker) marker.openPopup();
    }
  }, [activeHubId, hubs]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-200 shadow-xs text-[11px] font-semibold text-stone-700 flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
        Verified Public Hubs
      </div>
    </div>
  );
}
