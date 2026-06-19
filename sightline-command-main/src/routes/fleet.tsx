import { createFileRoute } from "@tanstack/react-router";
import { Panel, PageHeader, StatCard, RiskBadge } from "@/components/ui-bits";
import { CityMap } from "@/components/CityMap";
import { FLEET, DELIVERY_CORRIDORS, SAFETY_RECOMMENDATIONS } from "@/lib/mockData";
import { Award, AlertTriangle, TrendingDown, Truck, MapPin, Lightbulb, ShieldCheck } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export const Route = createFileRoute("/fleet")({
  head: () => ({ meta: [{ title: "Fleet Intelligence — DRISHTI" }] }),
  component: Fleet,
});

const trend = Array.from({ length: 30 }, (_, i) => ({
  day: `D-${30 - i}`,
  helmet: Math.round(48 - i * 1.0 + Math.sin(i / 2) * 5),
}));

function Fleet() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="MODULE · FL-05 · FLIPKART OPS"
        title="Fleet Intelligence"
        description="Last-mile rider safety telemetry across Bengaluru delivery network."
        actions={
          <div className="flex items-center gap-2">
            <span className="chip border-primary/40 text-primary">Tenant: Flipkart</span>
            <span className="chip">Region: BLR-South</span>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Fleet Safety Score" value="89" unit="/100" delta="+2.4 pts WoW" deltaTone="success" icon={Award} accent="success" />
        <StatCard label="Active Riders" value={FLEET.activeRiders.toLocaleString()} delta="312 on-shift" deltaTone="success" icon={Truck} accent="primary" />
        <StatCard label="Flagged · 7d" value={FLEET.flaggedThisWeek} delta="9 critical" deltaTone="danger" icon={AlertTriangle} accent="danger" />
        <StatCard label="Helmet Violations" value="-18" unit="%" delta="Last 30 days" deltaTone="success" icon={TrendingDown} accent="success" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel title="Zone Risk Map" subtitle="Whitefield · KR Puram · ORR · Indiranagar" icon={MapPin} code="ZONE-MAP" className="col-span-12 lg:col-span-7 h-[440px]">
          <div className="p-3 h-full"><CityMap showPredicted={false} /></div>
        </Panel>

        <Panel title="High-Risk Delivery Corridors" subtitle="Ranked by 7-day incident rate" icon={ShieldCheck} code="CORR-RNK" className="col-span-12 lg:col-span-5 h-[440px]">
          <ul className="h-full overflow-auto divide-y divide-border/60">
            {DELIVERY_CORRIDORS.map((c, i) => (
              <li key={c.zone} className="flex items-center gap-3 px-4 py-3">
                <span className="mono text-[10px] text-muted-foreground w-5">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground">{c.zone}</div>
                  <div className="text-[11px] text-muted-foreground"><span className="mono text-foreground">{c.riders}</span> riders · <span className="mono text-destructive">{c.incidents}</span> incidents · 7d</div>
                </div>
                <RiskBadge level={c.risk} />
              </li>
            ))}
            <li className="px-4 py-3 mt-2 text-[11px] text-muted-foreground">Top risk routes: {FLEET.topRoutes.map(r => r.route).slice(0, 3).join(" · ")}</li>
          </ul>
        </Panel>

        <Panel title="Rider Compliance Trend · Helmet Violations" subtitle="30-day rolling · ↓ 18%" code="TRD-30D" className="col-span-12 lg:col-span-8 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 20, right: 20, bottom: 10, left: -10 }}>
              <defs>
                <linearGradient id="rc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#22c55e" stopOpacity={0.5} /><stop offset="1" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "rgba(17,24,39,0.95)", border: "1px solid #1f2937", borderRadius: 8, fontSize: 12, color: "#f9fafb" }} />
              <Area type="monotone" dataKey="helmet" stroke="#22c55e" fill="url(#rc)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Top Safety Recommendations" subtitle="AI-prioritized for operations team" icon={Lightbulb} code="REC-OPS" className="col-span-12 lg:col-span-4 h-[300px]">
          <ul className="h-full overflow-auto divide-y divide-border/60">
            {SAFETY_RECOMMENDATIONS.map((r, i) => (
              <li key={i} className="flex items-start gap-3 px-4 py-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/15 text-primary mono text-[11px] font-semibold">{i + 1}</div>
                <div className="text-[12px] leading-snug text-foreground">{r}</div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
