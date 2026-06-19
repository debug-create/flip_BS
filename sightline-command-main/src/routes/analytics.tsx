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
      </div>
    </div>
  );
}
