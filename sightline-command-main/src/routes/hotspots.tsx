import { createFileRoute } from "@tanstack/react-router";
import { Panel, PageHeader, RiskBadge } from "@/components/ui-bits";
import { CityMap } from "@/components/CityMap";
import { HOTSPOTS, AI_RECOMMENDATIONS, OFFICER_DEPLOYMENT, AI_FORECAST } from "@/lib/mockData";
import { Brain, Flame, ShieldAlert, Users, ArrowUpRight, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/hotspots")({
  head: () => ({ meta: [{ title: "Hotspot Prediction — DRISHTI" }] }),
  component: Hotspots,
});

const RISK_LEGEND = [
  { label: "LOW",      tone: "success",     range: "0–49" },
  { label: "MEDIUM",   tone: "warning",     range: "50–69" },
  { label: "HIGH",     tone: "destructive", range: "70–84" },
  { label: "CRITICAL", tone: "destructive", range: "85–100" },
] as const;

function Hotspots() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="MODULE · HP-06"
        title="Hotspot Prediction"
        description="30–60 minute predictive enforcement targeting · LSTM + spatio-temporal graph model."
        actions={
          <div className="flex items-center gap-2">
            <span className="chip border-primary/40 text-primary"><Brain className="h-3 w-3" /> v3.2.1</span>
            <span className="chip text-success border-success/30"><span className="status-dot bg-success animate-blink" /> INFERENCE LIVE</span>
          </div>
        }
      />

      {/* Risk classification legend */}
      <Panel title="Risk Classification" subtitle="Composite score = volume × severity × predicted velocity" code="LGND-RSK">
        <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
          {RISK_LEGEND.map((r) => (
            <div key={r.label} className={`flex items-center gap-3 rounded-md border border-${r.tone}/30 bg-${r.tone}/5 px-3 py-2`}>
              <span className={`h-3 w-3 rotate-45 bg-${r.tone} shadow-[0_0_10px_currentColor] text-${r.tone}`} />
              <div>
                <div className={`mono text-[11px] font-semibold tracking-widest text-${r.tone}`}>{r.label}</div>
                <div className="text-[10px] text-muted-foreground">score {r.range}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Predictive Risk Heatmap" subtitle="Current + T+30min + T+60min overlay" icon={Flame} code="HEAT-PRD" className="col-span-12 xl:col-span-8 h-[560px]">
          <div className="p-3 h-full"><CityMap /></div>
        </Panel>

        <Panel title="Predicted Hotspots" subtitle="Sorted by composite risk score" icon={ShieldAlert} code="HTSP-RNK" className="col-span-12 xl:col-span-4 h-[560px]">
          <ul className="h-full overflow-auto divide-y divide-border/60">
            {HOTSPOTS.map((h) => (
              <li key={h.name} className="flex items-center gap-3 px-4 py-3">
                <div className={`relative grid h-10 w-10 place-items-center rounded-md ${h.risk >= 80 ? "bg-destructive/20 text-destructive" : h.risk >= 70 ? "bg-warning/20 text-warning" : "bg-primary/20 text-primary"}`}>
                  <Flame className="h-4 w-4" />
                  <span className="absolute -bottom-1 -right-1 mono text-[9px] font-bold bg-background rounded px-1 border border-border">{h.risk}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{h.name}</div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>ETA <span className="mono text-foreground">{h.eta}</span></span>
                    <span>·</span>
                    <span className="text-destructive">{h.delta}</span>
                  </div>
                </div>
                <RiskBadge level={h.risk >= 85 ? "Critical" : h.risk >= 70 ? "High" : h.risk >= 50 ? "Medium" : "Low"} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Officer Deployment Recommendations" subtitle="Suggested allocation · next 60 min" icon={Users} code="DEP-REC" className="col-span-12 lg:col-span-5">
          <ul className="divide-y divide-border/60">
            {OFFICER_DEPLOYMENT.map((d) => {
              const tone = d.urgency === "Critical" ? "destructive" : d.urgency === "High" ? "warning" : "primary";
              return (
                <li key={d.junction} className="flex items-center gap-3 px-4 py-3">
                  <div className={`grid h-9 w-9 place-items-center rounded-md bg-${tone}/15 text-${tone} ring-1 ring-${tone}/30`}>
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-foreground">{d.junction}</div>
                    <div className="text-[11px] text-muted-foreground">{d.urgency} priority</div>
                  </div>
                  <div className="text-right">
                    <div className="mono text-lg font-semibold text-foreground">{d.officers}</div>
                    <div className="text-[9px] uppercase tracking-widest text-muted-foreground">officers</div>
                  </div>
                  <button className={`chip border-${tone}/40 text-${tone} hover:bg-${tone}/15`}>Dispatch <ArrowUpRight className="h-3 w-3" /></button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="AI Forecast" subtitle="Confidence-weighted projections" icon={TrendingUp} code="FCST-AI" className="col-span-12 lg:col-span-7">
          <div className="grid gap-3 p-3 md:grid-cols-2">
            {AI_FORECAST.map((f, i) => (
              <div key={i} className="rounded-md border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold text-foreground">{f.label}</div>
                  <span className="mono text-base font-bold text-destructive">{f.change}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{f.horizon}</span>
                  <span>conf <span className="mono text-success">{f.confidence}%</span></span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-border/40 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-primary to-destructive" style={{ width: `${f.confidence}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="AI Recommendations" subtitle="Officer deployment suggestions" icon={Users} code="OPS-REC" className="col-span-12">
          <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-4">
            {AI_RECOMMENDATIONS.map((r, idx) => {
              const tone = r.priority === "CRITICAL" ? "destructive" : r.priority === "HIGH" ? "warning" : "primary";
              return (
                <div key={idx} className={`relative overflow-hidden rounded-md border border-${tone}/30 bg-${tone}/5 p-4`}>
                  <div className="flex items-center justify-between">
                    <span className={`chip border-${tone}/40 text-${tone}`}><span className={`status-dot bg-${tone} animate-blink`} /> {r.priority}</span>
                    <span className="mono text-[10px] text-muted-foreground">REC-{(idx + 41).toString().padStart(3, "0")}</span>
                  </div>
                  <p className="mt-3 text-[13px] font-semibold leading-snug text-foreground">{r.title}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="mono text-[10px] text-muted-foreground">conf {r.confidence}% · ETA {r.eta}</span>
                    <button className={`inline-flex items-center gap-1 text-[11px] font-semibold text-${tone} hover:underline`}>
                      Dispatch <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
