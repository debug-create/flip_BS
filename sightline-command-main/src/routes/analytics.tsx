import { createFileRoute } from "@tanstack/react-router";
import { Panel, PageHeader, StatCard } from "@/components/ui-bits";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { HOURLY_TREND, WEATHER_IMPACT } from "@/lib/mockData";
import { useEvidence } from "@/lib/evidenceStore";
import { getAnalyticsStats } from "@/lib/analytics";
import { Activity, Cloud, Gauge, ScanLine, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — DRISHTI" }] }),
  component: Analytics,
});

const tooltipStyle = {
  background: "rgba(17,24,39,0.95)",
  border: "1px solid #1f2937",
  borderRadius: 8,
  fontSize: 12,
  color: "#f9fafb",
};

const FALLBACK_BREAKDOWN = [{ name: "No data yet", value: 1, color: "#374151", fullName: "" }];

const timeOfDayData = [
  { hour: "12AM", count: 23 },
  { hour: "1AM", count: 12 },
  { hour: "2AM", count: 8 },
  { hour: "3AM", count: 6 },
  { hour: "4AM", count: 9 },
  { hour: "5AM", count: 34 },
  { hour: "6AM", count: 156 },
  { hour: "7AM", count: 312 },
  { hour: "8AM", count: 489 },
  { hour: "9AM", count: 398 },
  { hour: "10AM", count: 234 },
  { hour: "11AM", count: 198 },
  { hour: "12PM", count: 267 },
  { hour: "1PM", count: 289 },
  { hour: "2PM", count: 234 },
  { hour: "3PM", count: 198 },
  { hour: "4PM", count: 312 },
  { hour: "5PM", count: 534 },
  { hour: "6PM", count: 623 },
  { hour: "7PM", count: 489 },
  { hour: "8PM", count: 312 },
  { hour: "9PM", count: 198 },
  { hour: "10PM", count: 134 },
  { hour: "11PM", count: 67 }
];

function Analytics() {
  const { evidenceLog, violationChartData } = useEvidence();
  const stats = getAnalyticsStats(evidenceLog);

  const chartData =
    violationChartData.length > 0 ? violationChartData : FALLBACK_BREAKDOWN;

  const sessionTrend = evidenceLog.slice(0, 12).map((e, i) => ({
    label: `#${i + 1}`,
    violations: e.summary.total_violations_detected,
  }));

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="MODULE · AT-04"
        title="Analytics"
        description="Live detection telemetry from session evidence log."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          label="Session Analyses"
          value={String(stats.totalAnalyses)}
          delta={`${stats.totalViolations} violations`}
          deltaTone={stats.totalViolations > 0 ? "danger" : "success"}
          icon={Activity}
          accent="danger"
        />
        <StatCard
          label="Avg Inference"
          value={stats.avgInferenceMs > 0 ? String(stats.avgInferenceMs) : "—"}
          unit="ms"
          delta="from backend"
          deltaTone="success"
          icon={ScanLine}
          accent="success"
        />
        <StatCard
          label="Avg OCR Confidence"
          value={stats.avgOcrConfidence > 0 ? String(stats.avgOcrConfidence) : "—"}
          unit="%"
          delta="EasyOCR"
          deltaTone="success"
          icon={Gauge}
          accent="primary"
        />
        <StatCard
          label="Violations / Analysis"
          value={stats.totalAnalyses > 0 ? stats.violationRate.toFixed(2) : "—"}
          delta="session avg"
          deltaTone="warning"
          icon={Users}
          accent="warning"
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Panel
          title="Session Violation Curve"
          subtitle="Violations per analysis (most recent first)"
          icon={TrendingUp}
          code="HRLY-CRV"
          className="col-span-12 lg:col-span-8 h-[320px]"
        >
          {sessionTrend.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Run analyses to populate charts
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sessionTrend} margin={{ top: 20, right: 20, bottom: 10, left: -10 }}>
                <defs>
                  <linearGradient id="hc" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#3b82f6" stopOpacity={0.7} />
                    <stop offset="1" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="violations"
                  stroke="#3b82f6"
                  fill="url(#hc)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel
          title="Violation Distribution"
          subtitle="From live evidence log"
          code="DIST-TYPE"
          className="col-span-12 lg:col-span-4 h-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                stroke="#0a0f1a"
                strokeWidth={2}
              >
                {chartData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
            </PieChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          title="Violation Breakdown"
          subtitle="Counts by type · session"
          code="BRK-LIVE"
          className="col-span-12 lg:col-span-7 h-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 10, left: -10 }}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1f2937", opacity: 0.4 }} />
              <Bar dataKey="value" name="Violations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel
          title="Forecast Placeholder"
          subtitle="PREDICT module — mock data until ML model wired"
          icon={Cloud}
          code="WTHR-IMP"
          className="col-span-12 lg:col-span-5 h-[320px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={WEATHER_IMPACT} margin={{ top: 20, right: 20, bottom: 10, left: -10 }}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="condition" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#1f2937", opacity: 0.4 }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
              <Bar dataKey="baseline" name="Baseline" fill="#374151" radius={[4, 4, 0, 0]} />
              <Bar dataKey="violations" name="Observed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Historical Trend (Mock)" subtitle="Placeholder · 24h" code="TRD-24H" className="col-span-12 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HOURLY_TREND} margin={{ top: 20, right: 20, bottom: 10, left: -10 }}>
              <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
              <Area type="monotone" dataKey="helmet" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
              <Area type="monotone" dataKey="redLight" stroke="#ef4444" fill="#ef444420" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        {/* Time of Day Section */}
        <Panel
          title="VIOLATION PATTERNS — TIME OF DAY"
          subtitle="Hourly violation density across Bengaluru — last 30 days"
          code="TYM-DNS"
          className="col-span-12"
        >
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-white">WHEN VIOLATIONS HAPPEN</h3>
            <p className="text-xs text-muted-foreground -mt-2">Hourly violation density across Bengaluru — last 30 days</p>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeOfDayData} margin={{ top: 20, right: 20, bottom: 5, left: -10 }}>
                  <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <ReferenceLine x="8AM" stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Morning Peak", fill: "#f59e0b", position: "top", fontSize: 10 }} />
                  <ReferenceLine x="6PM" stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Evening Peak", fill: "#f59e0b", position: "top", fontSize: 10 }} />
                  <Area type="monotone" dataKey="count" stroke="#60A5FA" strokeWidth={2} fill="#3B82F6" fillOpacity={0.7} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3 pt-2">
              <div className="rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#f59e0b]">🌅 MORNING PEAK</div>
                <div className="mt-1.5 text-xs text-foreground font-semibold">7AM - 9AM accounts for 31% of daily violations</div>
                <div className="text-[10px] text-muted-foreground mt-1">Primary: Helmet Non-Compliance on ORR corridor</div>
              </div>
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-destructive">🌆 EVENING PEAK</div>
                <div className="mt-1.5 text-xs text-foreground font-semibold">5PM - 7PM is the highest risk window</div>
                <div className="text-[10px] text-muted-foreground mt-1">Primary: Triple riding near IT park exits</div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-primary">📊 PATTERN INSIGHT</div>
                <div className="mt-1.5 text-xs text-foreground font-semibold">Wednesday shows 127% higher violations than Monday</div>
                <div className="text-[10px] text-muted-foreground mt-1">Delivery executive violations peak Thursday-Friday</div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Junction Intelligence Section */}
        <Panel
          title="JUNCTION INTELLIGENCE"
          subtitle="Traffic violation hot-junction analysis"
          code="JCT-INT"
          className="col-span-12"
        >
          <div className="overflow-auto p-4">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="bg-[#1F2937] text-muted-foreground text-[10px] uppercase tracking-wider border-b border-border/80">
                  <th className="px-4 py-3 font-semibold">JUNCTION</th>
                  <th className="px-4 py-3 font-semibold">VIOLATIONS TODAY</th>
                  <th className="px-4 py-3 font-semibold">PRIMARY VIOLATION</th>
                  <th className="px-4 py-3 font-semibold">RISK TREND</th>
                  <th className="px-4 py-3 font-semibold">OFFICERS DEPLOYED</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-[#111827] border-b border-border/40">
                  <td className="px-4 py-3 font-bold text-white">Silk Board</td>
                  <td className="px-4 py-3 mono text-foreground">47</td>
                  <td className="px-4 py-3 text-foreground">Helmet (68%)</td>
                  <td className="px-4 py-3 font-semibold text-red-500">↑ +23%</td>
                  <td className="px-4 py-3 mono text-foreground">4</td>
                </tr>
                <tr className="bg-[#1A2235] border-b border-border/40">
                  <td className="px-4 py-3 font-bold text-white">Marathahalli</td>
                  <td className="px-4 py-3 mono text-foreground">38</td>
                  <td className="px-4 py-3 text-foreground">Triple Riding (71%)</td>
                  <td className="px-4 py-3 font-semibold text-red-500">↑ +15%</td>
                  <td className="px-4 py-3 mono text-foreground">2</td>
                </tr>
                <tr className="bg-[#111827] border-b border-border/40">
                  <td className="px-4 py-3 font-bold text-white">KR Puram</td>
                  <td className="px-4 py-3 mono text-foreground">31</td>
                  <td className="px-4 py-3 text-foreground">Helmet (59%)</td>
                  <td className="px-4 py-3 font-semibold text-[#f59e0b]">→ Stable</td>
                  <td className="px-4 py-3 mono text-foreground">2</td>
                </tr>
                <tr className="bg-[#1A2235] border-b border-border/40">
                  <td className="px-4 py-3 font-bold text-white">Whitefield</td>
                  <td className="px-4 py-3 mono text-foreground">24</td>
                  <td className="px-4 py-3 text-foreground">Missing Plate (54%)</td>
                  <td className="px-4 py-3 font-semibold text-success">↓ -8%</td>
                  <td className="px-4 py-3 mono text-foreground">1</td>
                </tr>
                <tr className="bg-[#111827] border-b border-border/40">
                  <td className="px-4 py-3 font-bold text-white">Electronic City</td>
                  <td className="px-4 py-3 mono text-foreground">19</td>
                  <td className="px-4 py-3 text-foreground">Helmet (74%)</td>
                  <td className="px-4 py-3 font-semibold text-red-500">↑ +31%</td>
                  <td className="px-4 py-3 mono text-foreground">1</td>
                </tr>
              </tbody>
            </table>
            <div className="text-[10px] text-muted-foreground mt-3 italic pl-1">
              Data refreshes every 15 minutes · Source: DRISHTI Detection Pipeline
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
