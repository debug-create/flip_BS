import { useEffect, useState, useMemo } from "react";

interface Point3D {
  lat: number;
  lon: number;
  isLand: boolean;
}

// Pre-generate grid points to avoid generating on every render
const GRID_POINTS: Point3D[] = [];
const LAT_STEP = 3.5;
const LON_STEP = 3.5;

function checkIsLand(lat: number, lon: number): boolean {
  // India & South Asia core
  if (lat >= 6 && lat <= 38 && lon >= 66 && lon <= 98) {
    // Exclude Arabian Sea and Bay of Bengal roughly
    if (lat < 10 && (lon < 75 || lon > 85)) return false;
    return true;
  }
  // Indochina & Southeast Asia
  if (lat >= -10 && lat <= 24 && lon >= 98 && lon <= 145) return true;
  // China / East Asia / Siberia
  if (lat >= 20 && lat <= 78 && lon >= 60 && lon <= 150) return true;
  // Middle East
  if (lat >= 10 && lat <= 35 && lon >= 35 && lon <= 65) {
    if (lat < 15 && lon < 45) return false;
    return true;
  }
  // Europe
  if (lat >= 35 && lat <= 75 && lon >= -10 && lon <= 60) return true;
  // Africa
  if (lat >= -35 && lat <= 37 && lon >= -18 && lon <= 51) {
    // Madagascar
    if (lat >= -25 && lat <= -12 && lon >= 43 && lon <= 51) return true;
    return lon < 51;
  }
  // Australia
  if (lat >= -44 && lat <= -10 && lon >= 110 && lon <= 155) return true;
  return false;
}

// Generate the points once
for (let lat = -80; lat <= 80; lat += LAT_STEP) {
  for (let lon = -180; lon <= 180; lon += LON_STEP) {
    GRID_POINTS.push({
      lat,
      lon,
      isLand: checkIsLand(lat, lon),
    });
  }
}

export function DottedGlobe({ size = 180 }: { size?: number }) {
  const [rotation, setRotation] = useState(77.5946); // Centered on Bangalore longitude initially
  const radius = size / 2;
  const centerLat = 15; // Slightly tilted view for premium 3D look

  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = time - lastTime;
      // Rotate slowly: ~6 degrees per second
      setRotation((prev) => (prev + (delta * 0.005)) % 360);
      lastTime = time;
      frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Project points based on current rotation
  const projectedDots = useMemo(() => {
    const dots: { px: number; py: number; size: number; opacity: number; isLand: boolean }[] = [];
    const radCenterLat = (centerLat * Math.PI) / 180;
    const radCenterLon = (rotation * Math.PI) / 180;

    const cosCenterLat = Math.cos(radCenterLat);
    const sinCenterLat = Math.sin(radCenterLat);

    for (let i = 0; i < GRID_POINTS.length; i++) {
      const pt = GRID_POINTS[i];
      const radLat = (pt.lat * Math.PI) / 180;
      const radLon = (pt.lon * Math.PI) / 180;

      const deltaLon = radLon - radCenterLon;
      const cosDeltaLon = Math.cos(deltaLon);
      const sinDeltaLon = Math.sin(deltaLon);
      const cosLat = Math.cos(radLat);
      const sinLat = Math.sin(radLat);

      // Orthographic projection formulas
      const x = cosLat * sinDeltaLon;
      const y = cosCenterLat * sinLat - sinCenterLat * cosLat * cosDeltaLon;
      const z = sinCenterLat * sinLat + cosCenterLat * cosLat * cosDeltaLon;

      // Only show points on the front side (z > 0)
      if (z > 0) {
        // Calculate projected coordinates in SVG viewport
        const px = radius + x * radius;
        const py = radius - y * radius;
        
        // Dot density/fading near the edge
        const edgeFactor = z; // z is 1 at center, 0 at edge
        const dotSize = pt.isLand ? (1.2 + edgeFactor * 0.8) : 0.8;
        const opacity = pt.isLand ? (0.2 + edgeFactor * 0.65) : (edgeFactor * 0.12);

        dots.push({
          px,
          py,
          size: dotSize,
          opacity,
          isLand: pt.isLand,
        });
      }
    }
    return dots;
  }, [rotation, radius]);

  // Project Bangalore coordinate
  const bangaloreMarker = useMemo(() => {
    const bLat = 12.9716;
    const bLon = 77.5946;

    const radLat = (bLat * Math.PI) / 180;
    const radLon = (bLon * Math.PI) / 180;
    const radCenterLat = (centerLat * Math.PI) / 180;
    const radCenterLon = (rotation * Math.PI) / 180;

    const deltaLon = radLon - radCenterLon;
    const cosDeltaLon = Math.cos(deltaLon);
    const sinDeltaLon = Math.sin(deltaLon);
    const cosLat = Math.cos(radLat);
    const sinLat = Math.sin(radLat);

    const x = cosLat * sinDeltaLon;
    const y = Math.cos(radCenterLat) * sinLat - Math.sin(radCenterLat) * cosLat * cosDeltaLon;
    const z = Math.sin(radCenterLat) * sinLat + Math.cos(radCenterLat) * cosLat * cosDeltaLon;

    if (z > 0.15) {
      return {
        px: radius + x * radius,
        py: radius - y * radius,
        visible: true,
      };
    }
    return { px: 0, py: 0, visible: false };
  }, [rotation, radius]);

  return (
    <div className="relative flex flex-col items-center justify-center p-3 select-none">
      {/* Glow Backdrop */}
      <div 
        className="absolute rounded-full bg-blue-500/10 blur-xl pointer-events-none"
        style={{ width: size, height: size }}
      />
      
      {/* Globe Container */}
      <div 
        className="relative rounded-full border border-[#1e293b]/40 bg-[#070b14]/40 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="overflow-visible">
          {/* Sphere reflection highlight */}
          <defs>
            <radialGradient id="sphereGrad" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="70%" stopColor="#070b14" stopOpacity="0" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.08" />
            </radialGradient>
          </defs>
          <circle cx={radius} cy={radius} r={radius} fill="url(#sphereGrad)" />

          {/* Dotted Grid and Landmass */}
          {projectedDots.map((dot, idx) => (
            <circle
              key={idx}
              cx={dot.px}
              cy={dot.py}
              r={dot.size}
              fill={dot.isLand ? "#60a5fa" : "#334155"}
              opacity={dot.opacity}
            />
          ))}

          {/* Bangalore pulsing marker */}
          {bangaloreMarker.visible && (
            <g>
              {/* Outer pulsing ring */}
              <circle
                cx={bangaloreMarker.px}
                cy={bangaloreMarker.py}
                r="7"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.5"
                className="animate-ping origin-center"
                style={{ transformOrigin: `${bangaloreMarker.px}px ${bangaloreMarker.py}px` }}
              />
              {/* Mid ring */}
              <circle
                cx={bangaloreMarker.px}
                cy={bangaloreMarker.py}
                r="4.5"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1"
                opacity="0.8"
              />
              {/* Core dot */}
              <circle
                cx={bangaloreMarker.px}
                cy={bangaloreMarker.py}
                r="2.5"
                fill="#22d3ee"
              />
            </g>
          )}
        </svg>

        {/* Floating Locator Info Box (Tokyo/NYC style in screenshot) */}
        {bangaloreMarker.visible && (
          <div
            className="absolute z-10 flex flex-col rounded-md border border-[#1e293b] bg-[#0A0F1A]/95 p-2 shadow-lg backdrop-blur-sm pointer-events-none transition-all duration-75"
            style={{
              left: `${bangaloreMarker.px + 10}px`,
              top: `${bangaloreMarker.py - 24}px`,
              width: "115px",
            }}
          >
            <div className="flex h-1 w-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-sm -mt-2 -mx-2 mb-1.5" />
            <span className="text-[7px] font-bold uppercase tracking-wider text-muted-foreground block">
              BTP CONTROL NODE
            </span>
            <span className="text-[10px] font-bold text-white tracking-wide block">
              BENGALURU
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[8px] font-mono text-cyan-400 font-medium">
                12.9716° N
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
