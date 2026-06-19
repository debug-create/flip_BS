import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

// Bengaluru violation hotspot data
// Format: [lat, lng, intensity]
// Based on BTP's 64 accident black spots + ORR corridor data
const VIOLATION_HOTSPOTS: [number, number, number][] = [
  // ORR Corridor — highest density (Silk Board to KR Puram)
  [12.9170, 77.6101, 1.0],   // Silk Board Junction — most congested
  [12.9352, 77.6245, 0.95],  // HSR Layout junction
  [12.9539, 77.6374, 0.90],  // Marathahalli
  [12.9698, 77.6499, 0.85],  // KR Puram
  [12.9784, 77.6408, 0.80],  // Whitefield Road

  // East Bengaluru — Flipkart delivery zone
  [12.9716, 77.7480, 0.85],  // Whitefield
  [12.9856, 77.7094, 0.80],  // ITPL
  [12.9698, 77.7152, 0.75],  // Kundalahalli

  // City core
  [12.9767, 77.5713, 0.85],  // MG Road
  [12.9719, 77.5937, 0.80],  // Indiranagar
  [12.9850, 77.5533, 0.75],  // Hebbal
  [12.9141, 77.6101, 0.70],  // Electronic City

  // North corridor
  [13.0358, 77.5970, 0.65],  // Yelahanka
  [13.0075, 77.5946, 0.70],  // Hebbal flyover

  // West
  [12.9516, 77.5387, 0.60],  // Yeshwanthpur
  [12.9279, 77.5537, 0.65],  // Rajajinagar

  // South
  [12.8956, 77.5849, 0.70],  // Bannerghatta Road
  [12.8742, 77.6101, 0.60],  // Electronic City Phase 2
];

// Named zones for overlay labels
const ZONE_MARKERS = [
  { lat: 12.9170, lng: 77.6101, label: "Silk Board", risk: "CRITICAL", color: "#ef4444" },
  { lat: 12.9539, lng: 77.6374, label: "Marathahalli", risk: "HIGH", color: "#f97316" },
  { lat: 12.9716, lng: 77.7480, label: "Whitefield", risk: "HIGH", color: "#f97316" },
  { lat: 12.9767, lng: 77.5713, label: "MG Road", risk: "HIGH", color: "#f97316" },
  { lat: 12.9698, lng: 77.6499, label: "KR Puram", risk: "HIGH", color: "#f97316" },
  { lat: 13.0075, lng: 77.5946, label: "Hebbal", risk: "MODERATE", color: "#eab308" },
  { lat: 12.9141, lng: 77.6101, label: "Electronic City", risk: "MODERATE", color: "#eab308" },
];

interface Props {
  className?: string;
}

export function BengaluruHeatmap({ className = "" }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet so it only loads in the browser
    import("leaflet").then((LModule) => {
      const L = LModule.default;

      // Fix Leaflet default icon paths broken by Vite
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      // Initialize map centered on Bengaluru
      const map = L.map(mapRef.current!, {
        center: [12.9716, 77.5946],
        zoom: 11,
        zoomControl: true,
        attributionControl: true,
      });

      // CartoDB dark matter tiles — free, no API key, matches BTP command center aesthetic
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Save a reference to window.L to satisfy Leaflet plugins
      (window as any).L = L;

      // Add heatmap layer using leaflet.heat
      // Dynamic import since leaflet.heat extends L at runtime
      import("leaflet.heat").then(() => {
        const heat = (L as any).heatLayer(VIOLATION_HOTSPOTS, {
          radius: 35,
          blur: 25,
          maxZoom: 13,
          max: 1.0,
          gradient: {
            0.0: "#22c55e",   // green — low risk
            0.4: "#eab308",   // yellow — moderate
            0.6: "#f97316",   // orange — high
            0.8: "#ef4444",   // red — critical
            1.0: "#dc2626",   // dark red — extreme
          },
        });
        heat.addTo(map);
      });

      // Add zone marker labels
      ZONE_MARKERS.forEach(({ lat, lng, label, risk, color }) => {
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              background: ${color};
              color: white;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 700;
              font-family: Inter, sans-serif;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.6);
              border: 1px solid rgba(255,255,255,0.2);
              letter-spacing: 0.03em;
            ">
              ${label}
              <span style="opacity:0.8; font-size:9px; margin-left:4px;">${risk}</span>
            </div>
          `,
          iconAnchor: [0, 0],
        });
        L.marker([lat, lng], { icon }).addTo(map);
      });

      // ORR corridor highlight line
      const orrCoords: [number, number][] = [
        [12.9170, 77.6101], // Silk Board
        [12.9352, 77.6245], // HSR Layout
        [12.9539, 77.6374], // Marathahalli
        [12.9698, 77.6499], // KR Puram
      ];
      L.polyline(orrCoords, {
        color: "#ef4444",
        weight: 3,
        opacity: 0.8,
        dashArray: "8, 4",
      })
        .addTo(map)
        .bindTooltip("ORR Corridor — Highest Violation Density", {
          permanent: false,
          className: "leaflet-tooltip-dark",
        });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div
        className={`relative bg-[#111827] animate-pulse rounded-xl border border-[#1f2937] flex items-center justify-center ${className}`}
        style={{ minHeight: "480px" }}
      >
        <span className="text-[#9ca3af] font-semibold text-sm">Loading map components...</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: "480px" }} />

      {/* Legend overlay */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          right: "12px",
          background: "rgba(17, 24, 39, 0.92)",
          border: "1px solid #1f2937",
          borderRadius: "8px",
          padding: "12px 16px",
          zIndex: 1000,
          fontFamily: "Inter, sans-serif",
          fontSize: "11px",
          color: "#9ca3af",
          backdropFilter: "blur(4px)",
        }}
      >
        <div style={{ fontWeight: 700, color: "#f9fafb", marginBottom: "8px", fontSize: "12px" }}>
          VIOLATION DENSITY
        </div>
        {[
          { color: "#dc2626", label: "Critical" },
          { color: "#ef4444", label: "High" },
          { color: "#f97316", label: "Moderate" },
          { color: "#eab308", label: "Low" },
          { color: "#22c55e", label: "Minimal" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span>{label}</span>
          </div>
        ))}
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #1f2937", color: "#6b7280", fontSize: "10px" }}>
          Based on BTP violation data 2023–25
        </div>
      </div>

      {/* ORR label */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid #ef4444",
          borderRadius: "6px",
          padding: "6px 12px",
          zIndex: 1000,
          fontFamily: "Inter, sans-serif",
          fontSize: "11px",
          color: "#fca5a5",
          fontWeight: 600,
        }}
      >
        ⚠ ORR CORRIDOR — 8–10 lakh daily users
      </div>
    </div>
  );
}

