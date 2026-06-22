import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Panel, PageHeader } from "@/components/ui-bits";
import { Download, Eye, Filter, Search, ShieldCheck, X, Clock, Hash, Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { annotatedImageSrc, getViolationTypes } from "@/lib/api";
import { useEvidence } from "@/lib/evidenceStore";
import { getBestPlate, getPrimaryViolation } from "@/lib/analytics";
import type { EvidencePackage } from "@/lib/types";
import { VehicleOwnerCard } from "@/components/VehicleOwnerCard";

export const Route = createFileRoute("/evidence")({
  head: () => ({ meta: [{ title: "Evidence Log — DRISHTI" }] }),
  component: EvidenceLog,
});

function EvidenceLog() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<EvidencePackage | null>(null);
  const { evidenceLog } = useEvidence();

  const { data: violationTypes = [] } = useQuery({
    queryKey: ["violationTypes"],
    queryFn: getViolationTypes,
  });

  const filterOptions = useMemo(
    () => ["All", ...violationTypes.map((v) => v.name.replace(" Non-Compliance", ""))],
    [violationTypes],
  );

  const rows = evidenceLog.filter((v) => {
    const primary = getPrimaryViolation(v);
    const plate = getBestPlate(v);
    return [v.evidence_id, primary, v.source, plate].some((s) =>
      s.toLowerCase().includes(q.toLowerCase()),
    );
  });

  function exportJson(evidence: EvidencePackage) {
    const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${evidence.evidence_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="MODULE · EV-03"
        title="Evidence Log"
        description="Investigation console · session evidence registry from live analysis."
        actions={
          <div className="flex items-center gap-2">
            <button className="chip">
              <Filter className="h-3 w-3" /> Filter
            </button>
            <button
              className="chip border-primary/40 text-primary"
              onClick={() => {
                if (evidenceLog.length === 0) return;
                const blob = new Blob([JSON.stringify(evidenceLog, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "drishti-evidence-log.json";
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-3 w-3" /> Export All JSON
            </button>
          </div>
        }
      />

      <Panel
        title="Investigation Filters"
        subtitle="Violation types loaded from backend"
        code="INV-FLT"
      >
        <div className="grid gap-3 p-4 md:grid-cols-4">
          <FilterGroup label="Violation Type" options={filterOptions.slice(0, 5)} active="All" />
          <FilterGroup label="Source" options={["All", "Upload", "Video"]} active="All" />
          <FilterGroup label="Confidence" options={["≥ 80%", "≥ 90%", "≥ 95%"]} active="≥ 90%" />
          <FilterGroup label="Session" options={["Current"]} active="Current" />
        </div>
      </Panel>

      <Panel
        title="Registry"
        subtitle={`${rows.length} records · live session storage`}
        code="EVD-DB"
        action={
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by ID, plate, source…"
              className="w-72 rounded-md border border-border bg-background/60 py-1.5 pl-7 pr-3 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
        }
      >
        {rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No evidence yet. Run an analysis on the Analyze page to populate this log.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface/95 text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5">Evidence ID</th>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Violation</th>
                  <th className="px-4 py-2.5">Plate</th>
                  <th className="px-4 py-2.5">Source</th>
                  <th className="px-4 py-2.5">Violations</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => {
                  const primary = getPrimaryViolation(v);
                  const plate = getBestPlate(v);
                  return (
                    <tr
                      key={v.evidence_id}
                      className="border-b border-border/50 transition hover:bg-accent/30"
                    >
                      <td className="px-4 py-2.5 mono text-primary">{v.evidence_id}</td>
                      <td className="px-4 py-2.5 mono text-muted-foreground">
                        {new Date(v.timestamp).toLocaleString("en-IN", { hour12: false })}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[11px] font-semibold ${
                            v.summary.total_violations_detected > 0
                              ? "border-destructive/40 bg-destructive/15 text-destructive"
                              : "border-success/40 bg-success/15 text-success"
                          }`}
                        >
                          {primary}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 mono text-foreground">{plate}</td>
                      <td className="px-4 py-2.5 text-foreground truncate max-w-[140px]">
                        {v.source}
                      </td>
                      <td className="px-4 py-2.5 mono text-foreground">
                        {v.summary.total_violations_detected}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setSelected(v)}
                            className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-[11px] hover:border-primary hover:text-primary"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button
                            onClick={() => exportJson(v)}
                            className="inline-flex items-center gap-1 rounded border border-border bg-surface px-2 py-1 text-[11px] hover:border-primary hover:text-primary"
                          >
                            <Download className="h-3 w-3" /> JSON
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selected && <EvidenceModal v={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function FilterGroup({
  label,
  options,
  active,
}: {
  label: string;
  options: string[];
  active: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o}
            className={`chip ${o === active ? "border-primary/50 text-primary bg-primary/10" : "hover:text-foreground"}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function EvidenceModal({ v, onClose }: { v: EvidencePackage; onClose: () => void }) {
  const primary = getPrimaryViolation(v);
  const plate = getBestPlate(v);
  const topDet = v.detections.find((d) => d.is_violation) ?? v.detections[0];

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-6 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div className="panel relative w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-primary">Evidence Brief</div>
            <div className="mono text-lg font-semibold text-foreground">{v.evidence_id}</div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md border border-border hover:text-destructive hover:border-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-md border border-border bg-background/60">
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Annotated Frame</span>
              <span className="mono text-primary">{v.processing_metadata.model_version}</span>
            </div>
            <div className="relative aspect-video">
              <img
                src={annotatedImageSrc(v.annotated_image_b64)}
                alt="Annotated evidence"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Meta icon={Hash} label="Plate (OCR)" value={plate} />
            <Meta icon={Camera} label="Source" value={v.source} />
            <Meta
              icon={Clock}
              label="Timestamp"
              value={new Date(v.timestamp).toLocaleString("en-IN", { hour12: false })}
            />
            <Meta icon={ShieldCheck} label="Violation" value={primary} />

            {v.detections
              .filter((d) => d.vehicle_lookup)
              .map((d) => (
                <VehicleOwnerCard key={d.detection_id} data={d.vehicle_lookup} />
              ))}

            <div className="rounded-md border border-border bg-background/60 p-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Detection Stack
              </div>
              <ul className="mt-2 space-y-1 mono text-[11px]">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">model</span>
                  <span className="text-foreground">{v.processing_metadata.model_version}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">conf</span>
                  <span className="text-success">
                    {topDet ? `${(topDet.confidence * 100).toFixed(1)}%` : "—"}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">latency</span>
                  <span className="text-foreground">{v.processing_metadata.inference_time_ms} ms</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">vehicles</span>
                  <span className="text-foreground">{v.summary.total_vehicles_detected}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4">
          <pre className="max-h-48 overflow-auto rounded-md bg-background/80 p-3 mono text-[10px] text-muted-foreground">
            {JSON.stringify(v, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background/40 p-3">
      <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="mono text-sm text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}
