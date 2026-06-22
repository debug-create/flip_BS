import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Panel, PageHeader } from "@/components/ui-bits";
import { BengaluruHeatmap } from "@/components/BengaluruHeatmap";
import { Brain, Flame, ShieldAlert, Users, Clock, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/hotspots")({
  head: () => ({ meta: [{ title: "Hotspot Prediction — DRISHTI" }] }),
  component: Hotspots,
});

interface AlertCard {
  id: string;
  junction: string;
  risk: "CRITICAL" | "HIGH" | "MODERATE";
  spike: string;
  offset: number;
}

const ALERTS: AlertCard[] = [
  {
    id: "silk-board",
    junction: "Silk Board Junction",
    risk: "CRITICAL",
    spike: "+87% predicted violation spike",
    offset: 15,
  },
  {
    id: "marathahalli",
    junction: "Marathahalli Signal",
    risk: "HIGH",
    spike: "+56% predicted violation spike",
    offset: 25,
  },
  {
    id: "kr-puram",
    junction: "KR Puram ORR",
    risk: "HIGH",
    spike: "+42% predicted violation spike",
    offset: 35,
  },
  {
    id: "whitefield",
    junction: "Whitefield ITPL",
    risk: "MODERATE",
    spike: "+28% predicted violation spike",
    offset: 45,
  },
];

function Hotspots() {
  // Timer count down from 30:00 to 00:00
  const [secondsLeft, setSecondsLeft] = useState(1800);
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 1800));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Dispatched state
  const [dispatched, setDispatched] = useState<Record<string, boolean>>({});

  // Stats counter animation (0 -> 12 / 18)
  const [dispatchedCount, setDispatchedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  useEffect(() => {
    const duration = 800; // 0.8s animation
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      // Easing out quadratic
      const ease = progress * (2 - progress);
      setDispatchedCount(Math.floor(ease * 12));
      setTotalCount(Math.floor(ease * 18));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, []);

  // Compute deploy by times in HH:MM format IST
  const getDeployByTime = (offsetMinutes: number) => {
    const target = new Date(Date.now() + offsetMinutes * 60 * 1000);
    return target.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const userDispatchCount = Object.values(dispatched).filter(Boolean).length;
  const currentDispatched = dispatchedCount + userDispatchCount;
  const currentTotal = totalCount + (userDispatchCount > 6 ? userDispatchCount - 6 : 0); // scale total slightly if user dispatches many

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="MODULE · HP-06"
        title="Hotspot Prediction"
        description="30–60 minute predictive enforcement targeting · LSTM + spatio-temporal graph model."
        actions={
          <div className="flex items-center gap-2">
            <span className="chip border-primary/40 text-primary">
              <Brain className="h-3 w-3" /> v3.2.1
            </span>
            <span className="chip text-success border-success/30">
              <span className="status-dot bg-success animate-blink" /> INFERENCE LIVE
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-10 gap-4">
        {/* Left Column (60% width) - Map Panel */}
        <Panel
          title="Predictive Risk Heatmap"
          subtitle="Current + T+30min + T+60min overlay"
          icon={Flame}
          code="HEAT-PRD"
          className="col-span-10 lg:col-span-6 h-[720px]"
        >
          <div className="p-3 h-[calc(100%-48px)]">
            <BengaluruHeatmap className="rounded-xl overflow-hidden border border-[#1f2937] h-full" />
          </div>
        </Panel>

        {/* Right Column (40% width) - Deployment Intelligence Panel */}
        <Panel
          title="Deployment Intelligence"
          subtitle="AI-assisted dispatch command center"
          icon={Users}
          code="DEP-INT"
          className="col-span-10 lg:col-span-4 h-[720px] flex flex-col"
        >
          <div className="p-4 space-y-5 overflow-y-auto h-[calc(100%-48px)]">
            {/* Section 1: Prediction Status (Countdown) */}
            <div className="flex items-center justify-between bg-surface/50 border border-border/60 rounded-lg p-3">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground block font-semibold">
                  AI FORECAST · NEXT 30 MIN
                </span>
                <span className="text-xs text-foreground font-medium">
                  Next update in: <span className="mono font-bold text-primary">{formatTime(secondsLeft)}</span>
                </span>
              </div>
              <Clock className="h-4 w-4 text-primary shrink-0" />
            </div>

            {/* Section 2: Alert Queue */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block">
                ACTIVE DEPLOYMENT ALERTS
              </span>
              <div className="space-y-2.5">
                {ALERTS.map((alert) => {
                  const isDispatched = dispatched[alert.id];
                  const riskColor =
                    alert.risk === "CRITICAL"
                      ? "text-red-500 border-red-500/20 bg-red-500/5"
                      : alert.risk === "HIGH"
                        ? "text-orange-500 border-orange-500/20 bg-orange-500/5"
                        : "text-blue-500 border-blue-500/20 bg-blue-500/5";

                  return (
                    <div
                      key={alert.id}
                      className={`rounded-lg border bg-[#0a0f1d] p-3 transition duration-300 ${
                        isDispatched
                          ? "border-[#22c55e] border-l-4"
                          : alert.risk === "CRITICAL"
                            ? "border-red-500/30"
                            : alert.risk === "HIGH"
                              ? "border-orange-500/30"
                              : "border-blue-500/30"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-white text-xs">{alert.junction}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{alert.spike}</p>
                          <p className="text-[10px] text-[#9ca3af] font-mono mt-1">
                            Deploy by: {getDeployByTime(alert.offset)} IST
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider ${riskColor}`}>
                          {alert.risk}
                        </span>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          disabled={isDispatched}
                          onClick={() => setDispatched((prev) => ({ ...prev, [alert.id]: true }))}
                          className={`w-full rounded py-1 text-center text-[10px] font-semibold tracking-wider transition ${
                            isDispatched
                              ? "bg-success/15 border border-success/30 text-success"
                              : "bg-primary text-white hover:bg-primary/95"
                          }`}
                        >
                          {isDispatched ? "✓ DISPATCHED" : "DISPATCH"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Today's Deployment Stats */}
            <div className="border-t border-border/40 pt-4">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-2">
                TODAY'S DEPLOYMENTS
              </span>
              <div className="bg-[#0a0f1d] border border-border/60 rounded-lg p-3">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-muted-foreground">Alerts Dispatched</span>
                  <span className="mono font-bold text-foreground">
                    {currentDispatched} / {currentTotal}
                  </span>
                </div>
                <div className="h-2 w-full bg-[#111827] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                    style={{ width: `${currentTotal > 0 ? (currentDispatched / currentTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: ORR Corridor Status Checkpoints */}
            <div className="border-t border-border/40 pt-4">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold block mb-3">
                ORR CORRIDOR STATUS CHECKPOINTS
              </span>
              <div className="relative pl-6 space-y-5 border-l border-border/60 ml-3">
                {/* Silk Board Checkpoint */}
                <div className="relative">
                  <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white">Silk Board Junction</span>
                    <span className="mono text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded text-[8px] flex items-center gap-1 border border-red-500/20">
                      <AlertTriangle className="h-2.5 w-2.5" /> CONGESTED
                    </span>
                  </div>
                </div>

                {/* HSR Layout Checkpoint */}
                <div className="relative">
                  <span className="absolute -left-[30px] top-1 h-2.5 w-2.5 rounded-full bg-success"></span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">HSR Layout</span>
                    <span className="mono text-success font-semibold text-[8px] bg-success/10 px-1.5 py-0.5 rounded border border-success/20">
                      CLEAR
                    </span>
                  </div>
                </div>

                {/* Marathahalli Checkpoint */}
                <div className="relative">
                  <span className="absolute -left-[30px] top-1 h-2.5 w-2.5 rounded-full bg-[#f59e0b]"></span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Marathahalli</span>
                    <span className="mono text-[#f59e0b] font-semibold text-[8px] bg-[#f59e0b]/10 px-1.5 py-0.5 rounded border border-[#f59e0b]/20">
                      MODERATE
                    </span>
                  </div>
                </div>

                {/* Bellandur Checkpoint */}
                <div className="relative">
                  <span className="absolute -left-[30px] top-1 h-2.5 w-2.5 rounded-full bg-success"></span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Bellandur</span>
                    <span className="mono text-success font-semibold text-[8px] bg-success/10 px-1.5 py-0.5 rounded border border-success/20">
                      CLEAR
                    </span>
                  </div>
                </div>

                {/* KR Puram Checkpoint */}
                <div className="relative">
                  <span className="absolute -left-[30px] top-1 h-2.5 w-2.5 rounded-full bg-[#f59e0b]"></span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">KR Puram</span>
                    <span className="mono text-[#f59e0b] font-semibold text-[8px] bg-[#f59e0b]/10 px-1.5 py-0.5 rounded border border-[#f59e0b]/20">
                      MODERATE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
