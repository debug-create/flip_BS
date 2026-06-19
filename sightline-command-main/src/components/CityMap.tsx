import { CAMERAS, HOTSPOTS } from "@/lib/mockData";

type Props = {
  showCameras?: boolean;
  showHotspots?: boolean;
  showPredicted?: boolean;
  showHeatmap?: boolean;
  height?: string;
};

export function CityMap({
  showCameras = true, showHotspots = true, showPredicted = true,
  showHeatmap = true, height = "100%",
}: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-md border border-border bg-[#070b14]" style={{ height }}>
      {/* grid */}
      <div className="absolute inset-0 grid-bg opacity-60" />
      {/* radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,rgba(59,130,246,0.10),transparent_60%)]" />
      {/* river / roads (schematic) */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="road" x1="0" x2="1">
            <stop offset="0" stopColor="#1f2937" stopOpacity="0.9" />
            <stop offset="1" stopColor="#374151" stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id="heat" r="0.5">
            <stop offset="0" stopColor="#ef4444" stopOpacity="0.55" />
            <stop offset="0.6" stopColor="#f59e0b" stopOpacity="0.2" />
            <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="predict" r="0.5">
            <stop offset="0" stopColor="#3b82f6" stopOpacity="0.45" />
            <stop offset="1" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* arterial roads */}
        <path d="M -5 30 Q 30 35 55 25 T 110 22" stroke="url(#road)" strokeWidth="0.6" fill="none" />
        <path d="M -5 70 Q 25 60 55 70 T 110 65" stroke="url(#road)" strokeWidth="0.6" fill="none" />
        <path d="M 20 -5 Q 25 30 35 55 T 45 110" stroke="url(#road)" strokeWidth="0.5" fill="none" />
        <path d="M 70 -5 Q 65 30 75 55 T 80 110" stroke="url(#road)" strokeWidth="0.5" fill="none" />
        <path d="M -5 50 Q 50 48 110 52" stroke="url(#road)" strokeWidth="0.4" fill="none" opacity="0.6" />
        <path d="M 50 -5 L 50 110" stroke="url(#road)" strokeWidth="0.3" fill="none" opacity="0.4" />

        {/* heatmap */}
        {showHeatmap && HOTSPOTS.map((h, i) => (
          <circle key={`heat-${i}`} cx={h.x} cy={h.y} r={h.risk / 6} fill="url(#heat)" />
        ))}
        {/* predicted */}
        {showPredicted && HOTSPOTS.slice(0, 4).map((h, i) => (
          <circle key={`pred-${i}`} cx={h.x + 3} cy={h.y - 2} r={h.risk / 8} fill="url(#predict)" />
        ))}
      </svg>

      {/* cameras */}
      {showCameras && CAMERAS.map((c) => (
        <div
          key={c.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
        >
          <div
            className={`relative h-1.5 w-1.5 rounded-full ${
              c.status === "online" ? "bg-primary" : "bg-muted-foreground/50"
            }`}
          >
            {c.status === "online" && (
              <span className="absolute inset-0 -m-1 rounded-full ring-1 ring-primary/40 animate-pulse-ring" />
            )}
          </div>
        </div>
      ))}

      {/* hotspot markers */}
      {showHotspots && HOTSPOTS.map((h, i) => (
        <div
          key={i}
          className="group absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${h.x}%`, top: `${h.y}%` }}
        >
          <div className="relative">
            <div className={`h-2.5 w-2.5 rotate-45 ${h.risk >= 80 ? "bg-destructive" : h.risk >= 70 ? "bg-warning" : "bg-primary"} shadow-[0_0_12px_currentColor]`} />
          </div>
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap rounded border border-border bg-background/90 px-1.5 py-0.5 text-[10px] text-foreground opacity-0 backdrop-blur transition group-hover:opacity-100">
            <span className="mono">{h.name}</span> · <span className="text-destructive">{h.risk}</span>
          </div>
        </div>
      ))}

      {/* compass + scale */}
      <div className="pointer-events-none absolute left-3 top-3 chip">
        <span className="status-dot bg-success animate-blink" /> LIVE · BENGALURU
      </div>
      <div className="pointer-events-none absolute right-3 top-3 chip">
        12.97°N 77.59°E
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 mono text-[10px] text-muted-foreground">
        0 ──── 5 km
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> Camera</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rotate-45 bg-destructive" /> Hotspot</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rotate-45 bg-primary" /> Predicted</span>
      </div>

      {/* scanline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-b from-primary/60 to-transparent animate-scan" style={{ height: "40%" }} />
    </div>
  );
}
