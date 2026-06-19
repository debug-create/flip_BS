import { createFileRoute } from "@tanstack/react-router";
import { Panel, StatCard, RiskBadge, PageHeader } from "@/components/ui-bits";
import { BengaluruHeatmap } from "@/components/BengaluruHeatmap";
import {
  AI_RECOMMENDATIONS, KPI, REPEAT_OFFENDERS, TOP_JUNCTIONS, formatTime,
} from "@/lib/mockData";
import { useEvidence } from "@/lib/evidenceStore";
import { getPrimaryViolation, getBestPlate } from "@/lib/analytics";
import { getHealth } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle, Camera, Crosshair, Brain, ArrowUpRight, MapPin, Clock, UserX, Gauge, Siren,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — DRISHTI" },
      { name: "description", content: "Live traffic violation intelligence for Bengaluru." },
    ],
  }),
  component: CommandCenter,
});

function CommandCenter() {
  const { evidenceLog } = useEvidence();
  const { data: health } = useQuery({ queryKey: ["health"], queryFn: getHealth, refetchInterval: 30_000 });

  const liveFeed = evidenceLog.slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="MODULE · CC-01"
        title="Command Center"
        description="Real-time situational awareness across the Bengaluru camera network."
        actions={
          <div className="flex items-center gap-2">
            <span className={`chip ${health?.status === "ok" ? "text-success border-success/30" : "text-destructive border-destructive/30"}`}>
              <span className={`status-dot animate-blink ${health?.status === "ok" ? "bg-success" : "bg-destructive"}`} />
              {health?.status === "ok" ? "BACKEND ONLINE" : "BACKEND OFFLINE"}
            </span>
            {health?.mode && <span className="chip border-primary/40 text-primary">{health.mode}</span>}
            <span className="chip border-primary/40 text-primary">BTP · Bengaluru</span>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Session Violations" value={String(evidenceLog.reduce((s, e) => s + e.summary.total_violations_detected, 0))} delta={`${evidenceLog.length} analyses`} deltaTone="danger" icon={AlertTriangle} accent="danger" />
        <StatCard label="Active Cameras" value={`${KPI.activeCameras}/${KPI.totalCameras}`} delta={`${KPI.totalCameras - KPI.activeCameras} offline`} deltaTone="warning" icon={Camera} accent="primary" />
        <StatCard label="Prediction Accuracy" value={KPI.predictionAccuracy} unit="%" delta="+1.2 pts MoM" deltaTone="success" icon={Brain} accent="success" />
        <StatCard label="High-Risk Junctions" value={KPI.highRiskJunctions} delta="3 escalated" deltaTone="warning" icon={Crosshair} accent="warning" />
      </div>

      {/* 60% map / 40% intelligence */}
      <div className="grid grid-cols-12 gap-4">
        <Panel
          title="Bengaluru Operational Map"
          subtitle="Camera coverage · violation heatmap · 30-min predictive overlay"
          icon={MapPin} code="MAP-LIVE"
          className="col-span-12 xl:col-span-7 h-[620px]"
          action={
            <div className="flex items-center gap-1.5 text-[10px]">
              <button className="chip border-primary/40 text-primary">Heatmap</button>
              <button className="chip">Predicted</button>
              <button className="chip">Cameras</button>
            </div>
          }
        >
          <div className="p-3 h-full"><BengaluruHeatmap className="rounded-xl overflow-hidden border border-[#1f2937] h-full" /></div>
        </Panel>

        <div className="col-span-12 xl:col-span-5 flex flex-col gap-4 h-[620px]">
          <Panel
            title="Active AI Recommendations"
            subtitle="LSTM forecast · officer deployment intelligence"
            icon={Brain} code="AI-REC"
            className="flex-1 min-h-0"
            action={<span className="chip text-success border-success/30"><span className="status-dot bg-success animate-blink" /> INFER</span>}
          >
            <ul className="h-full overflow-auto divide-y divide-border/60">
              {AI_RECOMMENDATIONS.map((r, i) => {
                const tone = r.priority === "CRITICAL" ? "destructive" : r.priority === "HIGH" ? "warning" : "primary";
                return (
                  <li key={i} className="group px-4 py-3 transition hover:bg-accent/30">
                    <div className="flex items-start gap-3">
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-md bg-${tone}/15 text-${tone} ring-1 ring-${tone}/30`}>
                        <Siren className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`chip border-${tone}/40 text-${tone}`}>{r.priority}</span>
                          <span className="mono text-[10px] text-muted-foreground">conf {r.confidence}%</span>
                        </div>
                        <div className="mt-1.5 text-[13px] font-semibold text-foreground leading-snug">{r.title}</div>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">{r.action} · ETA <span className="mono text-foreground">{r.eta}</span></span>
                          <button className={`inline-flex items-center gap-1 font-semibold text-${tone} hover:underline`}>
                            Dispatch <ArrowUpRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel
            title="Repeat Offender Watchlist"
            subtitle="Top risk plates · last 30 days"
            icon={UserX} code="WTCH-LST"
            className="h-[240px]"
          >
            <ul className="h-full overflow-auto divide-y divide-border/60">
              {REPEAT_OFFENDERS.map((o) => (
                <li key={o.plate} className="flex items-center gap-3 px-4 py-2 transition hover:bg-destructive/5">
                  <div className="mono text-[12px] font-semibold text-foreground tracking-wider">{o.plate}</div>
                  <div className="min-w-0 flex-1 text-[11px] text-muted-foreground truncate">
                    {o.count} infractions · {o.type} · {o.lastSeen}
                  </div>
                  <span className="mono text-[11px] font-semibold text-destructive">{o.score}</span>
                  <RiskBadge level={o.score >= 90 ? "Critical" : o.score >= 80 ? "High" : "Medium"} />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel
          title="Live Violation Feed"
          subtitle="Streamed from edge inference nodes"
          icon={Gauge} code="FEED-RT"
          className="col-span-12 lg:col-span-8 h-[380px]"
          action={<span className="chip text-success border-success/30"><span className="status-dot bg-success animate-blink" /> LIVE</span>}
        >
          <div className="h-full overflow-auto divide-y divide-border/60">
            {liveFeed.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No live detections yet. Upload traffic evidence on the Analyze page.
              </div>
            ) : (
              liveFeed.map((v) => (
                <div key={v.evidence_id} className="group flex items-start gap-3 px-4 py-3 transition hover:bg-accent/30">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-destructive/15 text-destructive ring-1 ring-destructive/30">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {getPrimaryViolation(v)}
                      </div>
                      <div className="mono text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(v.timestamp)}
                      </div>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {v.source}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                      <span className="chip">{v.summary.total_vehicles_detected} vehicles</span>
                      <span className="mono text-muted-foreground">{getBestPlate(v)}</span>
                      <span className="ml-auto mono font-semibold text-success">
                        {v.summary.total_violations_detected} viol.
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel
          title="Top Junctions"
          subtitle="Ranked by violation volume · today"
          icon={Crosshair} code="JCT-RANK"
          className="col-span-12 lg:col-span-4 h-[380px]"
        >
          <ul className="divide-y divide-border/60">
            {TOP_JUNCTIONS.slice(0, 8).map((j, i) => (
              <li key={j.junction} className="flex items-center gap-3 px-4 py-2.5">
                <span className="mono text-[10px] text-muted-foreground w-5">#{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 truncate text-sm text-foreground">{j.junction}</span>
                <span className="mono text-xs text-foreground">{j.violations}</span>
                <RiskBadge level={j.risk} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
