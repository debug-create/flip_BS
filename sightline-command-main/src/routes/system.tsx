import { createFileRoute } from "@tanstack/react-router";
import { Panel, PageHeader } from "@/components/ui-bits";
import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api";
import { useEvidence } from "@/lib/evidenceStore";
import { getAnalyticsStats } from "@/lib/analytics";
import { CheckCircle2, AlertTriangle, XCircle, Cpu } from "lucide-react";

export const Route = createFileRoute("/system")({
  head: () => ({ meta: [{ title: "System Status — DRISHTI" }] }),
  component: System,
});

function System() {
  const { data: health, isError, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 15_000,
  });
  const { evidenceLog } = useEvidence();
  const stats = getAnalyticsStats(evidenceLog);

  const backendOk = !isError && health?.status === "ok";

  const statusCards = [
    {
      name: "Backend API",
      status: backendOk ? "healthy" : "unhealthy",
      value: backendOk ? "200 OK" : "OFFLINE",
      detail: health ? `${health.model} · ${health.mode}` : "Cannot reach localhost:8000",
    },
    {
      name: "Model Health",
      status: backendOk ? "healthy" : "unhealthy",
      value: health?.model ?? "—",
      detail: "Roboflow 3-model pipeline",
    },
    {
      name: "OCR Engine",
      status: "healthy",
      value: stats.avgOcrConfidence > 0 ? `${stats.avgOcrConfidence}%` : "Ready",
      detail: "EasyOCR · CPU",
    },
    {
      name: "Inference Latency",
      status: "healthy",
      value: stats.avgInferenceMs > 0 ? `${stats.avgInferenceMs} ms` : "—",
      detail: "session average",
    },
    {
      name: "Evidence Store",
      status: "healthy",
      value: String(evidenceLog.length),
      detail: "sessionStorage · analyses",
    },
    {
      name: "API Status",
      status: isLoading ? "degraded" : backendOk ? "healthy" : "unhealthy",
      value: isLoading ? "CHECKING" : backendOk ? "ONLINE" : "DOWN",
      detail: "GET /health",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="MODULE · SY-07"
        title="System Status"
        description="Infrastructure health, model performance and backend connectivity."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {statusCards.map((s) => {
          const ok = s.status === "healthy";
          const degraded = s.status === "degraded";
          const Icon = ok ? CheckCircle2 : degraded ? AlertTriangle : XCircle;
          const tone = ok ? "success" : degraded ? "warning" : "destructive";
          return (
            <div key={s.name} className="panel relative overflow-hidden p-4">
              <div className={`absolute inset-x-0 top-0 h-px bg-${tone}`} />
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {s.name}
                  </div>
                  <div className="mt-2 mono text-xl font-semibold text-foreground">{s.value}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{s.detail}</div>
                </div>
                <Icon className={`h-5 w-5 text-${tone}`} />
              </div>
              <div className={`mt-3 inline-flex items-center gap-1.5 chip border-${tone}/30 text-${tone}`}>
                <span className={`status-dot bg-${tone} ${ok ? "animate-blink" : ""}`} />
                {s.status.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>

      <Panel title="Inference Pipeline" code="ML-PIPE" className="col-span-12">
        <div className="space-y-3 p-4">
          {[
            { stage: "Vehicle Detection", ms: 800, max: 3000 },
            { stage: "Helmet Check", ms: 600, max: 2500 },
            { stage: "Plate Localisation", ms: 500, max: 2000 },
            { stage: "EasyOCR", ms: 400, max: 2000 },
            { stage: "Evidence JSON", ms: 50, max: 200 },
          ].map((p) => (
            <div key={p.stage}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="h-3 w-3" />
                  {p.stage}
                </span>
                <span className="mono text-foreground">~{p.ms} ms</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-border/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                  style={{ width: `${(p.ms / p.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
          <div className="border-t border-border pt-3 mono text-[11px] flex justify-between">
            <span className="text-muted-foreground">session avg total</span>
            <span className="text-success font-semibold">
              {stats.avgInferenceMs > 0 ? `${stats.avgInferenceMs} ms` : "—"}
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
