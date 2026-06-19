import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

// Replicated Bengaluru severity zones from screenshot
const SEVERITY_ZONES = [
  {
    id: "zone-0",
    name: "Zone 0",
    lat: 12.9850,
    lng: 77.5550,
    radius: 1600,
    color: "#dc2626", // Red border
    fillColor: "#ef4444", // Red fill
    textColor: "#ffffff",
    risk: "CRITICAL",
  },
  {
    id: "zone-5",
    name: "Zone 5",
    lat: 12.9680,
    lng: 77.5950,
    radius: 2000,
    color: "#dc2626", // Red border
    fillColor: "#ef4444", // Red fill
    textColor: "#ffffff",
    risk: "CRITICAL",
  },
  {
    id: "zone-1",
    name: "Zone 1",
    lat: 12.9600,
    lng: 77.6480,
    radius: 1500,
    color: "#ea580c", // Orange border
    fillColor: "#f97316", // Orange fill
    textColor: "#ffffff",
    risk: "HIGH",
  },
  {
    id: "zone-2",
    name: "Zone 2",
    lat: 12.9140,
    lng: 77.6100,
    radius: 1400,
    color: "#ea580c", // Orange border
    fillColor: "#f97316", // Orange fill
    textColor: "#ffffff",
    risk: "HIGH",
  },
  {
    id: "zone-4",
    name: "Zone 4",
    lat: 13.0620,
    lng: 77.5850,
    radius: 1200,
    color: "#ca8a04", // Yellow border
    fillColor: "#eab308", // Yellow fill
    textColor: "#ffffff",
    risk: "MODERATE",
  },
  {
    id: "zone-3",
    name: "Zone 3",
    lat: 13.1400,
    lng: 77.6100,
    radius: 1800,
    color: "#16a34a", // Green border
    fillColor: "#22c55e", // Green fill
    textColor: "#ffffff",
    risk: "LOW",
  },
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

      // Initialize map centered on Bengaluru to capture all zones
      const map = L.map(mapRef.current!, {
        center: [12.9780, 77.5980],
        zoom: 11,
        zoomControl: true,
        attributionControl: true,
      });

      // Standard OpenStreetMap tiles (light theme matching screenshots)
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }
      ).addTo(map);

      // Save L globally for plugins if needed
      (window as any).L = L;

      // Add circles and labels for severity zones
      SEVERITY_ZONES.forEach((zone) => {
        // Draw severity circle overlay
        L.circle([zone.lat, zone.lng], {
          radius: zone.radius,
          color: zone.color,
          fillColor: zone.fillColor,
          fillOpacity: 0.28,
          weight: 2,
        }).addTo(map);

        // Add custom rounded pill label centered on the zone coordinate
        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              background: ${zone.fillColor};
              color: ${zone.textColor};
              padding: 5px 12px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 700;
              font-family: Inter, sans-serif;
              border: 1px solid ${zone.color};
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              text-align: center;
              white-space: nowrap;
            ">
              ${zone.name}
            </div>
          `,
          iconAnchor: [28, 12],
        });
        L.marker([zone.lat, zone.lng], { icon }).addTo(map);
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
          background: "rgba(17, 24, 39, 0.95)",
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
          SEVERITY ZONES
        </div>
        {[
          { color: "#ef4444", label: "Critical (Zone 0, 5)" },
          { color: "#f97316", label: "High (Zone 1, 2)" },
          { color: "#eab308", label: "Moderate (Zone 4)" },
          { color: "#22c55e", label: "Low (Zone 3)" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ color: "#f9fafb" }}>{label}</span>
          </div>
        ))}
        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #1f2937", color: "#9ca3af", fontSize: "10px" }}>
          BTP composite violation index
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
        ⚠ DRISHTI Traffic Monitoring Zones
      </div>
    </div>
  );
}
