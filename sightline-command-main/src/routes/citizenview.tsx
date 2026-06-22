import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Panel, PageHeader } from "@/components/ui-bits";
import { 
  Share2, AlertTriangle, Radio, Shield, Info, ArrowRight, MapPin, 
  Clock, ShieldCheck, CheckCircle2
} from "lucide-react";

export const Route = createFileRoute("/citizenview")({
  head: () => ({
    meta: [
      { title: "CitizenView — DRISHTI Public Transparency Feed" },
      { name: "description", content: "Live public transparency broadcast of traffic violations in Bengaluru." },
    ],
  }),
  component: CitizenView,
});

interface CardData {
  id: string;
  junction: string;
  timestamp: Date;
  violationType: string;
  plate: string;
  priorViolations: number;
  cameraId: string;
  isRepeatOffender?: boolean;
}

const INITIAL_CARDS: CardData[] = [
  {
    id: "card-1",
    junction: "Silk Board Junction",
    timestamp: new Date(Date.now() - 1 * 60 * 1000),
    violationType: "Helmet Non-Compliance",
    plate: "KA03MJ7823",
    priorViolations: 4,
    cameraId: "CAM-A-047",
    isRepeatOffender: true,
  },
  {
    id: "card-2",
    junction: "Marathahalli Signal",
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
    violationType: "Triple Riding",
    plate: "MH12CD4521",
    priorViolations: 1,
    cameraId: "CAM-B-112",
  },
  {
    id: "card-3",
    junction: "KR Puram ORR",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    violationType: "Helmet Non-Compliance",
    plate: "KA05HG3341",
    priorViolations: 8,
    cameraId: "CAM-C-089",
    isRepeatOffender: true,
  },
  {
    id: "card-4",
    junction: "Whitefield ITPL",
    timestamp: new Date(Date.now() - 7 * 60 * 1000),
    violationType: "Defective/Missing Plate",
    plate: "UNDETECTED",
    priorViolations: 0,
    cameraId: "CAM-D-203",
  },
  {
    id: "card-5",
    junction: "Hebbal Flyover",
    timestamp: new Date(Date.now() - 9 * 60 * 1000),
    violationType: "Helmet Non-Compliance",
    plate: "KA01RJ2234",
    priorViolations: 2,
    cameraId: "CAM-A-156",
  },
  {
    id: "card-6",
    junction: "MG Road Junction",
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    violationType: "Triple Riding",
    plate: "KA04MN8821",
    priorViolations: 0,
    cameraId: "CAM-B-334",
  },
  {
    id: "card-7",
    junction: "Electronic City Toll",
    timestamp: new Date(Date.now() - 14 * 60 * 1000),
    violationType: "Helmet Non-Compliance",
    plate: "TN07AB1234",
    priorViolations: 3,
    cameraId: "CAM-C-445",
    isRepeatOffender: true,
  },
  {
    id: "card-8",
    junction: "Bannerghatta Road",
    timestamp: new Date(Date.now() - 17 * 60 * 1000),
    violationType: "Defective/Missing Plate",
    plate: "UNDETECTED",
    priorViolations: 0,
    cameraId: "CAM-A-267",
  },
  {
    id: "card-9",
    junction: "Koramangala 5th Block",
    timestamp: new Date(Date.now() - 19 * 60 * 1000),
    violationType: "Helmet Non-Compliance",
    plate: "KA02PQ5567",
    priorViolations: 12,
    cameraId: "CAM-D-089",
    isRepeatOffender: true,
  },
  {
    id: "card-10",
    junction: "HSR Layout Signal",
    timestamp: new Date(Date.now() - 22 * 60 * 1000),
    violationType: "Triple Riding",
    plate: "KA09YZ3311",
    priorViolations: 1,
    cameraId: "CAM-B-445",
  },
  {
    id: "card-11",
    junction: "Indiranagar 100ft Road",
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    violationType: "Helmet Non-Compliance",
    plate: "KA03CD8876",
    priorViolations: 0,
    cameraId: "CAM-C-178",
  },
  {
    id: "card-12",
    junction: "Yeshwanthpur Circle",
    timestamp: new Date(Date.now() - 28 * 60 * 1000),
    violationType: "Helmet Non-Compliance",
    plate: "KA07GH4432",
    priorViolations: 5,
    cameraId: "CAM-A-334",
    isRepeatOffender: true,
  },
];

const JUNCTION_POOL = [
  "Silk Board Junction",
  "Marathahalli Signal",
  "KR Puram ORR",
  "Whitefield ITPL",
  "Hebbal Flyover",
  "MG Road Junction",
  "Koramangala 5th Block",
  "HSR Layout Signal",
  "Indiranagar 100ft Road",
  "Electronic City Toll"
];

function formatTimeAgo(timestamp: Date): string {
  const diffMs = Date.now() - timestamp.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 10) return "Just now";
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
}

function CitizenView() {
  const [cards, setCards] = useState<CardData[]>(INITIAL_CARDS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [timeTick, setTimeTick] = useState(0);

  // Periodic tick to refresh time-ago texts
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick((t) => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Prepend a new card every 30 seconds
  useEffect(() => {
    const generateNewCard = () => {
      const junction = JUNCTION_POOL[Math.floor(Math.random() * JUNCTION_POOL.length)];
      
      // Random violation type: 70% Helmet, 20% Triple Riding, 10% Missing Plate
      const randType = Math.random();
      let violationType = "Helmet Non-Compliance";
      if (randType >= 0.7 && randType < 0.9) {
        violationType = "Triple Riding";
      } else if (randType >= 0.9) {
        violationType = "Defective/Missing Plate";
      }

      // Generate random plate (UNDETECTED if defective plate)
      let plate = "UNDETECTED";
      if (violationType !== "Defective/Missing Plate") {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const randLetters = letters[Math.floor(Math.random() * 26)] + letters[Math.floor(Math.random() * 26)];
        const randDist = String(Math.floor(Math.random() * 99)).padStart(2, "0");
        const randNum = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
        plate = `KA${randDist}${randLetters}${randNum}`;
      }

      const priorViolations = Math.floor(Math.random() * 7);
      const isRepeatOffender = priorViolations >= 3;
      const lettersGroup = ["A", "B", "C", "D"];
      const cameraId = `CAM-${lettersGroup[Math.floor(Math.random() * 4)]}-${String(Math.floor(Math.random() * 999)).padStart(3, "0")}`;

      const newCard: CardData = {
        id: `card-${Math.random().toString(36).substring(2, 11)}`,
        junction,
        timestamp: new Date(),
        violationType,
        plate,
        priorViolations,
        cameraId,
        isRepeatOffender,
      };

      setCards((prev) => {
        const updated = [newCard, ...prev];
        if (updated.length > 20) {
          return updated.slice(0, 20);
        }
        return updated;
      });
    };

    const interval = setInterval(generateNewCard, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = async (card: CardData) => {
    const shareText = `⚠ TRAFFIC VIOLATION DETECTED
Junction: ${card.junction}
Violation: ${card.violationType}
Plate: ${card.plate}
Prior violations: ${card.priorViolations} | @BlrCityPolice #DRISHTI`;
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedId(card.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="📡 PUBLIC TRANSPARENCY FEED · SEC. 136A MV ACT 2019"
        title="CitizenView"
        description="Simulated real-time public transparency broadcast of traffic violations in Bengaluru."
        actions={
          <div className="flex items-center gap-2">
            <span className="chip border-destructive/40 text-destructive">
              <span className="status-dot bg-destructive animate-pulse-scale mr-1" />
              LIVE FEED ACTIVE
            </span>
            <span className="chip border-primary/40 text-primary">Public Access</span>
          </div>
        }
      />

      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col gap-3">
        {/* Face blur notice */}
        <div className="text-[11px] text-muted-foreground flex items-start gap-2 border-b border-[#1f2937] pb-3 mb-1">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>
            <strong>Privacy Protected:</strong> All facial data is automatically blurred before publication. Only vehicle registration plates are visible, consistent with RTI Act 2005 and MV Amendment Act 2019.
          </span>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mt-1">
          <div className="flex flex-col p-1">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Violations Today</span>
            <span className="mono text-2xl md:text-3xl font-bold text-[#f59e0b] mt-1">1,247</span>
          </div>
          <div className="flex flex-col p-1 border-l border-[#1f2937] pl-4">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Active Cameras</span>
            <span className="mono text-2xl md:text-3xl font-bold text-[#3b82f6] mt-1">9,000+</span>
          </div>
          <div className="flex flex-col p-1 border-t border-[#1f2937] md:border-t-0 md:border-l border-[#1f2937] pt-3 md:pt-1 md:pl-4">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Junctions Covered</span>
            <span className="mono text-2xl md:text-3xl font-bold text-[#22c55e] mt-1">165 / 500+</span>
          </div>
          <div className="flex flex-col p-1 border-t border-[#1f2937] md:border-t-0 border-l border-[#1f2937] pt-3 md:pt-1 pl-4">
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Repeat Offenders</span>
            <span className="mono text-2xl md:text-3xl font-bold text-[#ef4444] mt-1">23%</span>
          </div>
        </div>

        {/* Thin amber notice banner */}
        <div className="bg-[#f59e0b]/5 border border-[#f59e0b]/20 text-[#f59e0b] text-[11px] rounded-lg px-4 py-2.5 flex items-center gap-2 mt-2">
          <span className="font-semibold uppercase tracking-wider bg-[#f59e0b]/15 px-1.5 py-0.5 rounded text-[9px] shrink-0">Official Broadcast</span>
          <span className="leading-snug">
            ⚡ <strong>LIVE FEED</strong> — Violations are published within 60 seconds of detection. Faces auto-blurred. Plates visible. Public record under Section 136A MV Act 2019.
          </span>
        </div>
      </div>

      {/* Main Grid: 65% / 35% */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Live Violation Feed (65% on lg screens) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border/80 pb-2 px-1">
            <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Live Violation Feed
            </h2>
            <span className="mono text-[10px] text-muted-foreground font-semibold uppercase tracking-wider bg-accent/20 px-2 py-0.5 rounded">
              Updating every 30 seconds
            </span>
          </div>

          <div className="flex flex-col gap-4 max-h-[1200px] overflow-y-auto pr-1">
            {cards.map((card) => {
              const isCrit = card.priorViolations >= 10;
              const hasPlate = card.plate !== "UNDETECTED";
              const isViolHelmet = card.violationType === "Helmet Non-Compliance";
              const badgeBg = card.violationType === "Defective/Missing Plate" 
                ? "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20" 
                : "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20";

              return (
                <div 
                  key={card.id} 
                  className={`panel overflow-hidden transition-all duration-300 animate-slide-down ${
                    isCrit 
                      ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-[#1A0A0A]" 
                      : card.isRepeatOffender 
                        ? "border-red-500/20 bg-[#1A0A0A]" 
                        : "bg-[#111827]"
                  }`}
                >
                  <div className="p-4 flex flex-col gap-3">
                    {/* Top Row Info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground truncate">{card.junction}</span>
                          {isCrit && (
                            <span className="chip border-red-500/40 text-red-500 bg-red-500/10 text-[9px] font-extrabold animate-pulse">
                              CRITICAL
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatTimeAgo(card.timestamp)}</span>
                          <span>·</span>
                          <span className="font-mono text-[10px] bg-accent/20 px-1 py-0.2 rounded">{card.cameraId}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`rounded-full px-2.5 py-0.5 mono text-[9px] font-bold uppercase tracking-wider ${badgeBg}`}>
                          {card.violationType}
                        </span>
                        {card.isRepeatOffender && (
                          <span className="mono text-[9px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 flex items-center gap-1">
                            ⚠ REPEAT OFFENDER
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Canvas simulation of annotated image */}
                    <div className="relative aspect-[4/3] w-full rounded border border-border/40 bg-[#080C14] overflow-hidden flex items-center justify-center">
                      <div className="absolute top-2.5 left-2.5 text-[9px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
                        [ FACE BLURRED ]
                      </div>
                      <div className="absolute top-2.5 right-2.5 text-[9px] font-mono text-muted-foreground/60 uppercase bg-black/45 px-1.5 py-0.5 rounded border border-border/10">
                        {card.cameraId}
                      </div>

                      {/* center-left bounding box */}
                      <div 
                        className={`absolute left-[18%] top-[24%] w-[42%] h-[52%] border-2 flex flex-col justify-between p-1 rounded-sm ${
                          card.violationType === "Defective/Missing Plate" 
                            ? "border-warning bg-warning/5" 
                            : "border-destructive bg-destructive/5"
                        }`}
                      >
                        <span className={`text-[8px] font-mono px-1 py-0.2 rounded-sm self-start ${
                          card.violationType === "Defective/Missing Plate" ? "bg-warning text-black" : "bg-destructive text-white"
                        }`}>
                          {card.violationType === "Defective/Missing Plate" ? "MISSING_PLATE" : isViolHelmet ? "NO_HELMET" : "TRIPLE_RIDING"}
                        </span>
                        
                        <div className="flex-1 flex items-center justify-center text-4xl mb-1">
                          {card.violationType === "Defective/Missing Plate" ? "🚗" : "🏍"}
                        </div>

                        <div className="bg-black/95 border border-border/30 rounded px-1.5 py-0.5 text-center text-[10px] font-mono text-foreground tracking-widest uppercase font-semibold">
                          {card.plate}
                        </div>
                      </div>

                      {/* face blur simulation circle */}
                      <div className="absolute right-[18%] top-[20%] w-[18%] h-[18%] border border-border/30 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center">
                        <span className="text-[7px] text-muted-foreground/80 font-bold uppercase tracking-widest">BLUR</span>
                      </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-1">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Vehicle Plate</span>
                          <span className={`mono text-sm font-semibold tracking-wider ${hasPlate ? "text-foreground" : "text-muted-foreground/80 italic"}`}>
                            {card.plate}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-border/40" />
                        <div className="flex flex-col">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Prior Offences</span>
                          <span className={`mono text-sm font-semibold ${card.priorViolations >= 3 ? "text-red-500" : "text-foreground"}`}>
                            {card.priorViolations}
                          </span>
                        </div>
                      </div>

                      {/* Share mechanism */}
                      <button
                        onClick={() => handleShare(card)}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold tracking-wider transition ${
                          copiedId === card.id
                            ? "bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e]"
                            : "border border-border/60 bg-[#111827] text-muted-foreground hover:text-foreground hover:bg-accent/40"
                        }`}
                      >
                        {copiedId === card.id ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            COPIED
                          </>
                        ) : (
                          <>
                            <Share2 className="h-3.5 w-3.5" />
                            SHARE
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Intelligence Panels (35% on lg screens) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          
          {/* Most Violated Junctions */}
          <Panel title="Most Violated Junctions" subtitle="Ranked by volume today" code="HOT-JCT">
            <div className="flex flex-col gap-3 p-4">
              {[
                { name: "Silk Board Junction", count: 47, color: "bg-[#ef4444]" },
                { name: "Marathahalli ORR", count: 38, color: "bg-orange-500" },
                { name: "KR Puram Signal", count: 31, color: "bg-orange-500" },
                { name: "Whitefield ITPL", count: 24, color: "bg-[#f59e0b]" },
                { name: "Electronic City", count: 19, color: "bg-[#f59e0b]" },
              ].map((j, idx) => (
                <div key={j.name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-medium">
                      <span className="mono text-muted-foreground/60 mr-1.5">#{idx + 1}</span> 
                      {j.name}
                    </span>
                    <span className="mono font-semibold text-foreground">{j.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#1f2937]/50 rounded-full overflow-hidden">
                    <div className={`h-full ${j.color} rounded-full`} style={{ width: `${(j.count / 47) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* By Violation Type */}
          <Panel title="By Violation Type" subtitle="Violation breakdown today" code="TYP-BRK">
            <div className="flex flex-col gap-3.5 p-4">
              {[
                { icon: "🪖", label: "Helmet Non-Compliance", count: 847, pct: 68, barColor: "bg-[#ef4444]" },
                { icon: "🏍", label: "Triple Riding", count: 267, pct: 21, barColor: "bg-[#ef4444]" },
                { icon: "🔲", label: "Missing Plate", count: 133, pct: 11, barColor: "bg-[#f59e0b]" },
              ].map((v) => (
                <div key={v.label} className="flex items-center gap-3">
                  <div className="text-xl w-8 h-8 rounded bg-surface flex items-center justify-center border border-border/40 shrink-0">
                    {v.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-xs font-semibold text-foreground">
                      <span className="truncate">{v.label}</span>
                      <span className="mono text-muted-foreground">{v.count}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-0.5">
                      <div className="h-1 flex-1 bg-border/40 rounded overflow-hidden mr-3">
                        <div className={`h-full ${v.barColor}`} style={{ width: `${v.pct}%` }} />
                      </div>
                      <span className="mono font-bold shrink-0">{v.pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Repeat Offenders */}
          <div className="border border-red-500/20 bg-[#1A0A0A] rounded-xl p-4 flex flex-col gap-3">
            <div className="text-xs text-[#ef4444] font-semibold flex items-center gap-1.5 uppercase">
              <AlertTriangle className="h-4 w-4 animate-pulse-scale" /> Repeat Offender Alert (24h)
            </div>
            <p className="text-[12px] text-muted-foreground leading-normal">
              <strong>23 vehicles</strong> detected with 3+ prior violations in the last 24 hours.
            </p>
            <div className="flex flex-col gap-2 mt-1">
              {[
                { plate: "KA02PQ5567", count: 12, tag: "HIGH RISK", tone: "danger" },
                { plate: "KA05HG3341", count: 8, tag: "HIGH RISK", tone: "danger" },
                { plate: "KA07GH4432", count: 5, tag: "WATCH LIST", tone: "warning" },
              ].map((offender) => (
                <div key={offender.plate} className="flex items-center justify-between bg-[#111827]/80 border border-[#1f2937] rounded px-3 py-1.5">
                  <span className="mono font-bold text-sm text-foreground tracking-wider">{offender.plate}</span>
                  <div className="flex items-center gap-2">
                    <span className="mono text-[11px] text-muted-foreground">{offender.count} viol.</span>
                    <span className={`mono px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      offender.tone === "danger" ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-warning/10 text-warning border border-warning/20"
                    }`}>
                      {offender.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deterrence Impact */}
          <Panel title="Deterrence Impact" subtitle="Social impact metrics" code="DET-IMP">
            <div className="grid grid-cols-2 gap-3 p-4">
              <div className="bg-[#111827]/50 border border-[#1f2937] rounded-xl p-3 flex flex-col justify-between min-h-[90px]">
                <div className="mono text-2xl font-extrabold text-[#22c55e]">67%</div>
                <div className="text-[10px] text-muted-foreground leading-normal mt-1">
                  Repeat violation reduction at camera junctions (BTP 2024)
                </div>
              </div>
              <div className="bg-[#111827]/50 border border-[#1f2937] rounded-xl p-3 flex flex-col justify-between min-h-[90px]">
                <div className="mono text-2xl font-extrabold text-[#3b82f6]">4.2x</div>
                <div className="text-[10px] text-muted-foreground leading-normal mt-1">
                  Higher compliance when violators know feed is public
                </div>
              </div>
              <div className="col-span-2 text-[9px] text-muted-foreground/60 italic mt-1 text-center leading-normal">
                Based on BTP enforcement data and Singapore LTA public disclosure studies.
              </div>
            </div>
          </Panel>

          {/* Submit Your Sighting mini-section */}
          <div className="border border-blue-500/20 bg-blue-500/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="text-xs text-[#3b82f6] font-semibold flex items-center gap-1.5 uppercase">
              <ShieldCheck className="h-4 w-4" /> Witnessed a Violation?
            </div>
            <p className="text-[12px] text-muted-foreground leading-normal">
              Citizens can submit violation photos directly to BTP via DRISHTI.
            </p>
            <Link
              to={"/citizen" as any}
              className="mt-1 flex items-center justify-center gap-2 rounded-md bg-[#3b82f6] text-white hover:bg-[#3b82f6]/95 py-2 text-xs font-semibold tracking-wider transition"
            >
              Open Citizen Reporter
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
