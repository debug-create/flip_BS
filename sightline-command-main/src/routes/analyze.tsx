import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Panel, PageHeader } from "@/components/ui-bits";
import {
  CloudUpload, FileImage, Loader2, ShieldAlert, ShieldCheck, X,
  Camera, ScanLine, Brain, FileCheck2, Radio, CheckCircle2, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { MAEP_CAMERAS } from "@/lib/mockData";
import { analyzeImage, analyzeVideo, annotatedImageSrc, formatApiError } from "@/lib/api";
import { useEvidence } from "@/lib/evidenceStore";
import { getBestPlate, getPrimaryViolation } from "@/lib/analytics";
import type { EvidencePackage, VideoAnalysisResult } from "@/lib/types";

export const Route = createFileRoute("/analyze")({
  head: () => ({ meta: [{ title: "Analyze — DRISHTI" }] }),
  component: Analyze,
});

const PIPELINE = [
  { label: "Frame Ingest", icon: FileImage },
  { label: "Vehicle Detection", icon: ScanLine },
  { label: "Helmet Check", icon: Brain },
  { label: "Plate OCR", icon: Camera },
  { label: "Evidence Generation", icon: FileCheck2 },
  { label: "Command Intelligence", icon: Radio },
];

const MAX_BYTES = 50 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/avi", "video/x-msvideo"];

function Analyze() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [pipelineStep, setPipelineStep] = useState(0);
  const [result, setResult] = useState<EvidencePackage | null>(null);
  const [videoResult, setVideoResult] = useState<VideoAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addEvidence, addVideoResults } = useEvidence();

  async function handleFile(f: File) {
    if (f.size > MAX_BYTES) {
      toast.error("File too large. Maximum size is 50 MB.");
      return;
    }

    const isVideo = VIDEO_TYPES.includes(f.type) || /\.(mp4|avi)$/i.test(f.name);
    const isImage = IMAGE_TYPES.includes(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name);

    if (!isVideo && !isImage) {
      toast.error("Unsupported format. Use jpg, png, webp, mp4, or avi.");
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStage("processing");
    setPipelineStep(0);
    setResult(null);
    setVideoResult(null);
    setErrorMsg(null);

    const stepTimer = window.setInterval(() => {
      setPipelineStep((s) => Math.min(s + 1, PIPELINE.length));
    }, 900);

    try {
      if (isVideo) {
        const video = await analyzeVideo(f);
        setVideoResult(video);
        addVideoResults(video);
        if (video.violation_timeline.length > 0) {
          setResult(video.violation_timeline[0]);
        }
        toast.success(`Video analyzed — ${video.total_violations_found} violations in ${video.total_frames_analyzed} frames`);
      } else {
        const evidence = await analyzeImage(f);
        setResult(evidence);
        addEvidence(evidence);
        toast.success(`Analysis complete — ${evidence.summary.total_violations_detected} violation(s) detected`);
      }
      setPipelineStep(PIPELINE.length);
      setStage("done");
    } catch (err) {
      setStage("error");
      const msg = formatApiError(err);
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      window.clearInterval(stepTimer);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setStage("idle");
    setPipelineStep(0);
    setResult(null);
    setVideoResult(null);
    setErrorMsg(null);
  }

  const primaryViolation = result ? getPrimaryViolation(result) : "—";
  const bestPlate = result ? getBestPlate(result) : "—";
  const topViolationDet = result?.detections.find((d) => d.is_violation);
  const annotatedSrc = result ? annotatedImageSrc(result.annotated_image_b64) : preview;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="MODULE · AN-02"
        title="Analyze"
        description="Forensic inference pipeline · Roboflow 3-model + EasyOCR."
        actions={
          file && (
            <button onClick={reset} className="chip hover:text-destructive">
              <X className="h-3 w-3" /> Clear evidence
            </button>
          )
        }
      />

      {stage === "idle" && <UploadZone onFile={handleFile} inputRef={inputRef} />}

      {stage === "error" && (
        <Panel title="Analysis Failed" code="ERR-AN">
          <div className="p-6 text-center">
            <p className="text-destructive">{errorMsg}</p>
            <button onClick={reset} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
              Try again
            </button>
          </div>
        </Panel>
      )}

      {stage !== "idle" && stage !== "error" && file && (
        <>
          <PipelinePanel step={pipelineStep} done={stage === "done"} />

          <Panel
            title={stage === "done" ? "Inference Result" : "Inference In Progress"}
            subtitle={`${file.name} · ${(file.size / 1024).toFixed(1)} KB`}
            icon={FileImage}
            code="INF-001"
          >
            <div className="grid gap-3 p-3 md:grid-cols-2">
              <Frame label="Original" url={preview!} processing={false} />
              <Frame
                label={`Annotated · ${result?.processing_metadata.model_version ?? "Roboflow"}`}
                url={annotatedSrc!}
                processing={stage === "processing"}
                annotated={stage === "done"}
              />
            </div>
          </Panel>

          {stage === "done" && result && (
            <>
              <div className="grid grid-cols-12 gap-4">
                <Panel
                  title="AI Violation Summary"
                  subtitle="Primary detection · high-confidence"
                  code="AI-SUM"
                  className="col-span-12 lg:col-span-7"
                >
                  <div className="grid gap-3 p-4 md:grid-cols-3">
                    <SumCard
                      label="Violation"
                      value={primaryViolation}
                      tone={topViolationDet ? "destructive" : "success"}
                      big
                    />
                    <SumCard
                      label="Confidence"
                      value={
                        topViolationDet
                          ? `${(topViolationDet.confidence * 100).toFixed(1)}%`
                          : "—"
                      }
                      tone="success"
                      big
                    />
                    <SumCard label="Plate (OCR)" value={bestPlate} tone="primary" mono big />
                    <SumCard label="Source" value={result.source} />
                    <SumCard
                      label="Vehicles"
                      value={String(result.summary.total_vehicles_detected)}
                    />
                    <SumCard
                      label="Violations"
                      value={String(result.summary.total_violations_detected)}
                      tone={result.summary.total_violations_detected > 0 ? "warning" : "success"}
                    />
                  </div>
                </Panel>

                <Panel
                  title="Processing Metadata"
                  subtitle="Inference telemetry"
                  code="META-INF"
                  className="col-span-12 lg:col-span-5"
                >
                  <ul className="divide-y divide-border/60">
                    {[
                      ["Model Version", result.processing_metadata.model_version],
                      ["Inference Time", `${result.processing_metadata.inference_time_ms} ms`],
                      ["Evidence ID", result.evidence_id],
                      ["Timestamp", new Date(result.timestamp).toLocaleString("en-IN")],
                      [
                        "Dimensions",
                        `${result.processing_metadata.image_dimensions[0]}×${result.processing_metadata.image_dimensions[1]}`,
                      ],
                    ].map(([k, v]) => (
                      <li key={k} className="flex items-center justify-between px-4 py-2.5 text-[12px]">
                        <span className="text-muted-foreground uppercase tracking-wider text-[10px]">{k}</span>
                        <span className="mono text-foreground text-right max-w-[60%] truncate">{v}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </div>

              {videoResult && (
                <Panel title="Video Timeline" subtitle="Per-frame analysis summary" code="VID-TL">
                  <div className="grid gap-2 p-4 md:grid-cols-4">
                    <SumCard label="Frames" value={String(videoResult.total_frames_analyzed)} />
                    <SumCard
                      label="Total Violations"
                      value={String(videoResult.total_violations_found)}
                      tone="warning"
                    />
                  </div>
                </Panel>
              )}

              <MAEPPanel preview={preview!} />

              <Panel
                title="Detection Intelligence"
                subtitle="Per-object classification · OCR · enforcement action"
                code="DET-INT"
              >
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-4 py-2.5">Vehicle</th>
                        <th className="px-4 py-2.5">Violation</th>
                        <th className="px-4 py-2.5">Confidence</th>
                        <th className="px-4 py-2.5">Plate</th>
                        <th className="px-4 py-2.5">Detection ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.detections.map((d) => {
                        const isViolation = d.is_violation;
                        const plateText = d.plate?.plate_text ?? "—";
                        return (
                          <tr
                            key={d.detection_id}
                            className={`border-b border-border/60 transition hover:bg-accent/30 ${isViolation ? "bg-destructive/5" : "bg-success/5"}`}
                          >
                            <td className="px-4 py-3 text-foreground capitalize">{d.class_name}</td>
                            <td className="px-4 py-3">
                              {isViolation ? (
                                <span className="inline-flex items-center gap-1.5 rounded border border-destructive/40 bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                                  <ShieldAlert className="h-3 w-3" />
                                  {d.violation_type}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded border border-success/40 bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
                                  <ShieldCheck className="h-3 w-3" />
                                  Clean
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 mono text-foreground">
                              {(d.confidence * 100).toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 mono text-foreground">{plateText}</td>
                            <td className="px-4 py-3 mono text-primary">{d.detection_id}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Panel>

              <div className="text-[11px] text-muted-foreground">
                Inference completed in{" "}
                <span className="mono text-foreground">
                  {result.processing_metadata.inference_time_ms} ms
                </span>{" "}
                · evidence ID{" "}
                <span className="mono text-primary">{result.evidence_id}</span> saved to log.
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function UploadZone({
  onFile,
  inputRef,
}: {
  onFile: (f: File) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <Panel className="min-h-[440px]" code="DROP-Z">
      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className="relative m-3 flex h-[420px] cursor-pointer flex-col items-center justify-center gap-5 overflow-hidden rounded-lg border-2 border-dashed border-primary/40 bg-[#070b14] transition hover:border-primary hover:bg-primary/5"
      >
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.18),transparent_60%)]" />
        {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((p, i) => (
          <span
            key={i}
            className={`absolute ${p} h-6 w-6 border-primary/70`}
            style={{
              borderTopWidth: p.includes("top") ? 2 : 0,
              borderBottomWidth: p.includes("bottom") ? 2 : 0,
              borderLeftWidth: p.includes("left") ? 2 : 0,
              borderRightWidth: p.includes("right") ? 2 : 0,
            }}
          />
        ))}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-b from-primary/70 to-transparent animate-scan"
          style={{ height: "30%" }}
        />

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/avi"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />

        <div className="relative grid h-20 w-20 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/40">
          <CloudUpload className="h-10 w-10 text-primary" />
          <span className="absolute inset-0 -m-2 rounded-2xl ring-1 ring-primary/30 animate-pulse-ring" />
        </div>
        <div className="relative text-center">
          <div className="text-lg font-semibold text-foreground tracking-wide">Drop Traffic Evidence</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Images · Video (max 30s) · up to 50 MB
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-[10px]">
          <span className="chip border-primary/40 text-primary">Roboflow</span>
          <span className="chip">EasyOCR</span>
          <span className="chip">MAEP</span>
        </div>
        <div className="relative mono text-[10px] text-muted-foreground">
          SECURE · CHAIN-OF-CUSTODY · TAMPER-EVIDENT
        </div>
      </label>
    </Panel>
  );
}

function PipelinePanel({ step, done }: { step: number; done: boolean }) {
  return (
    <Panel
      title="Frame Analysis Pipeline"
      subtitle={done ? "Pipeline complete · evidence ready" : "Processing through inference stack"}
      icon={Brain}
      code="PIPE-EX"
    >
      <div className="grid grid-cols-2 gap-2 p-4 md:grid-cols-6">
        {PIPELINE.map((p, i) => {
          const active = step === i + 1 && !done;
          const completed = step > i || done;
          const Icon = p.icon;
          return (
            <div key={p.label} className="relative flex flex-col items-center text-center">
              <div
                className={`relative grid h-12 w-12 place-items-center rounded-md border ${
                  completed
                    ? "border-success/40 bg-success/10 text-success"
                    : active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-surface/50 text-muted-foreground"
                }`}
              >
                {active ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : completed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
                {active && (
                  <span className="absolute inset-0 -m-1 rounded-md ring-1 ring-primary/40 animate-pulse-ring" />
                )}
              </div>
              <div
                className={`mt-2 text-[11px] font-semibold ${completed ? "text-foreground" : "text-muted-foreground"}`}
              >
                {p.label}
              </div>
              {i < PIPELINE.length - 1 && (
                <ArrowRight className="absolute -right-2 top-3 hidden h-3 w-3 text-border md:block" />
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function MAEPPanel({ preview }: { preview: string }) {
  return (
    <Panel
      title="Multi-Angle Evidence Package (MAEP)"
      subtitle="Synchronized capture · cryptographically signed · legally verifiable"
      icon={Camera}
      code="MAEP-01"
      action={
        <div className="flex items-center gap-2">
          <span className="chip text-success border-success/30">
            <CheckCircle2 className="h-3 w-3" /> Legally Verifiable
          </span>
        </div>
      }
    >
      <div className="grid gap-3 p-3 md:grid-cols-2">
        {MAEP_CAMERAS.map((c, i) => (
          <div key={c.id} className="relative overflow-hidden rounded-md border border-border bg-background/60">
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-2 text-[10px] uppercase tracking-widest">
              <span className="mono text-primary">{c.id}</span>
              <span className="text-muted-foreground">{c.angle}</span>
            </div>
            <div className="relative aspect-video">
              <img
                src={preview}
                alt={c.id}
                className="h-full w-full object-cover opacity-90"
                style={{
                  filter:
                    i === 1
                      ? "hue-rotate(15deg)"
                      : i === 2
                        ? "hue-rotate(-15deg) brightness(0.85)"
                        : i === 3
                          ? "brightness(0.7) contrast(1.1)"
                          : "none",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SumCard({
  label,
  value,
  tone = "primary",
  mono = false,
  big = false,
}: {
  label: string;
  value: string;
  tone?: "primary" | "destructive" | "success" | "warning";
  mono?: boolean;
  big?: boolean;
}) {
  return (
    <div className={`rounded-md border border-${tone}/30 bg-${tone}/5 p-3`}>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div
        className={`mt-1 ${mono ? "mono" : ""} ${big ? "text-base" : "text-sm"} font-semibold text-${tone}`}
      >
        {value}
      </div>
    </div>
  );
}

function Frame({
  label,
  url,
  processing,
  annotated,
}: {
  label: string;
  url: string;
  processing: boolean;
  annotated?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-background/60">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </div>
        <span className="mono text-[10px] text-muted-foreground">{annotated ? "ANNOTATED" : "RAW"}</span>
      </div>
      <div className="relative aspect-video">
        <img src={url} alt={label} className="h-full w-full object-cover" />
        {processing && (
          <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" /> Running inference…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
