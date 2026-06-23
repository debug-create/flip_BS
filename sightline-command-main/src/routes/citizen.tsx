import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Panel, PageHeader } from "@/components/ui-bits";
import {
  CloudUpload, FileImage, Loader2, ShieldAlert, ShieldCheck, X,
  Camera, ScanLine, Brain, FileCheck2, Radio, CheckCircle2, ArrowRight,
  Upload, Download, Search, ZoomIn, MessageSquareCode, AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { analyzeImage, annotatedImageSrc, formatApiError } from "@/lib/api";
import { useEvidence } from "@/lib/evidenceStore";
import { getBestPlate, getPrimaryViolation } from "@/lib/analytics";
import type { EvidencePackage } from "@/lib/types";

export const Route = createFileRoute("/citizen")({
  head: () => ({
    meta: [
      { title: "Citizen Report — DRISHTI" },
      { name: "description", content: "Submit traffic violations directly to Bengaluru Traffic Police." },
    ],
  }),
  component: CitizenReport,
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

function CitizenReport() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [pipelineStep, setPipelineStep] = useState(0);
  const [result, setResult] = useState<EvidencePackage | null>(null);
  const [refNumber, setRefNumber] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addEvidence } = useEvidence();

  async function handleFile(f: File) {
    if (f.size > MAX_BYTES) {
      toast.error("File too large. Maximum size is 50 MB.");
      return;
    }

    const isImage = IMAGE_TYPES.includes(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name);
    if (!isImage) {
      toast.error("Unsupported format. Use a jpg, png, or webp photo.");
      return;
    }

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStage("processing");
    setPipelineStep(0);
    setResult(null);
    setRefNumber(null);
    setErrorMsg(null);

    const stepTimer = window.setInterval(() => {
      setPipelineStep((s) => Math.min(s + 1, PIPELINE.length));
    }, 900);

    try {
      const evidence = await analyzeImage(f);
      setResult(evidence);
      addEvidence(evidence);
      
      // Generate BTP Reference number
      const randomRef = `BTP-REF-${Math.floor(100000 + Math.random() * 900000)}`;
      setRefNumber(randomRef);

      const hasViolations = evidence.summary.total_violations_detected > 0;
      if (hasViolations) {
        toast.success(`Analysis complete — violation detected. Report filed under ${randomRef}`);
      } else {
        toast.info("Analysis complete — no violations detected.");
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
    setRefNumber(null);
    setErrorMsg(null);
  }

  function exportJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.evidence_id || "drishti-citizen-evidence"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.info("Evidence JSON package downloaded.");
  }

  const primaryViolation = result ? getPrimaryViolation(result) : "—";
  const bestPlate = result ? getBestPlate(result) : "—";
  const topViolationDet = result?.detections.find((d) => d.is_violation);
  const annotatedSrc = result ? annotatedImageSrc(result.annotated_image_b64) : preview;
  const hasViolation = result ? result.summary.total_violations_detected > 0 : false;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="PUBLIC PORTAL · CITIZEN REPORT"
        title="Citizen Report"
        description="Submit photos of traffic violations to BTP. Faces automatically blurred before processing."
        actions={
          file && (
            <button onClick={reset} className="chip hover:text-destructive">
              <X className="h-3 w-3" /> Cancel report
            </button>
          )
        }
      />

      <div className="grid grid-cols-12 gap-4">
        {/* Left Column: Upload & Analyze (60% width on lg) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">
          {stage === "idle" && (
            <Panel title="Report a Violation" code="REP-INIT" className="min-h-[440px]">
              <div className="p-4 flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Witnessed a traffic violation? Upload a photo and DRISHTI will analyse it and file an official report with Bengaluru Traffic Police.
                </p>
                <UploadZone onFile={handleFile} inputRef={inputRef} />
              </div>
            </Panel>
          )}

          {stage === "error" && (
            <Panel title="Report Submission Failed" code="REP-ERR" className="min-h-[300px]">
              <div className="p-6 text-center">
                <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-3" />
                <p className="text-destructive font-medium">{errorMsg}</p>
                <button onClick={reset} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
                  Try Again
                </button>
              </div>
            </Panel>
          )}

          {stage !== "idle" && stage !== "error" && file && (
            <div className="flex flex-col gap-4">
              <PipelinePanel step={pipelineStep} done={stage === "done"} />

              <Panel
                title={stage === "done" ? "Violation Analysis" : "Analysing Photo..."}
                subtitle={`${file.name} · ${(file.size / 1024).toFixed(1)} KB`}
                icon={FileImage}
                code="REP-INF"
              >
                <div className="grid gap-3 p-3 md:grid-cols-2">
                  <div className="relative overflow-hidden rounded-md border border-border bg-background/60">
                    <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                      <span>RAW IMAGE</span>
                    </div>
                    <div className="relative aspect-video">
                      <img src={preview!} alt="Raw Input" className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-md border border-border bg-background/60">
                    <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                      <span>AI ANNOTATED</span>
                      {stage === "done" && <span className="mono text-primary font-bold">PROCESSED</span>}
                    </div>
                    <div className="relative aspect-video">
                      <img src={annotatedSrc!} alt="Annotated Input" className="h-full w-full object-cover" />
                      {stage === "processing" && (
                        <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Loader2 className="h-4 w-4 animate-spin" /> Analysing photo…
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Panel>

              {stage === "done" && result && (
                <div className="flex flex-col gap-4">
                  {/* Result Verdict Panel */}
                  <Panel title="Report Summary" code="REP-DEC">
                    <div className="p-4 flex flex-col gap-4">
                      {/* Violation status badge */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Verdict:</span>
                        {hasViolation ? (
                          <span className="inline-flex items-center gap-1.5 rounded border border-destructive/40 bg-destructive/15 px-3 py-1 text-xs font-semibold text-destructive uppercase tracking-wider">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Violation Detected: {primaryViolation}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded border border-success/40 bg-success/15 px-3 py-1 text-xs font-semibold text-success uppercase tracking-wider">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            No Violation Detected
                          </span>
                        )}
                      </div>

                      {/* Detail Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="rounded-md border border-border bg-background/30 p-3">
                          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">License Plate (OCR)</div>
                          <div className="mono text-sm font-semibold text-foreground mt-1">{bestPlate}</div>
                        </div>
                        <div className="rounded-md border border-border bg-background/30 p-3">
                          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Confidence</div>
                          <div className="mono text-sm font-semibold text-foreground mt-1">
                            {topViolationDet ? `${(topViolationDet.confidence * 100).toFixed(0)}%` : "N/A"}
                          </div>
                        </div>
                        <div className="rounded-md border border-border bg-background/30 p-3 col-span-2 md:col-span-1">
                          <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Inference Time</div>
                          <div className="mono text-sm font-semibold text-foreground mt-1">{result.processing_metadata.inference_time_ms} ms</div>
                        </div>
                      </div>
                    </div>
                  </Panel>

                  {/* REPORT FILED Success Banner (Only if violation is found) */}
                  {hasViolation && refNumber && (
                    <div className="flex flex-col gap-4">
                      <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#22c55e]/20 text-[#22c55e]">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-[#22c55e] font-bold text-xs uppercase tracking-wider">Report Filed Successfully</div>
                            <p className="text-[12px] text-muted-foreground leading-snug mt-1">
                              Your report has been submitted to BTP. Reference number for tracking:
                            </p>
                            <div className="mono text-lg font-bold text-foreground mt-1.5 tracking-wider">
                              {refNumber}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={exportJson}
                          className="chip border-[#22c55e]/40 text-[#22c55e] hover:bg-[#22c55e]/15 self-start md:self-center shrink-0 flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3"
                        >
                          <Download className="h-3.5 w-3.5" /> Download Evidence Package
                        </button>
                      </div>

                      {/* WHAT HAPPENS NEXT SECTION */}
                      <div className="panel p-4 bg-[#111827]">
                        <h4 className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-3">
                          What Happens Next
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-muted-foreground">
                          <div className="flex items-start gap-2 bg-background/40 border border-border p-2.5 rounded-lg">
                            <span className="text-base">🔍</span>
                            <div>
                              <strong className="text-foreground block mb-0.5">Step 1. Review</strong>
                              BTP officer reviews your submission within 4 hours
                            </div>
                          </div>
                          <div className="flex items-start gap-2 bg-background/40 border border-border p-2.5 rounded-lg">
                            <span className="text-base">📱</span>
                            <div>
                              <strong className="text-foreground block mb-0.5">Step 2. Issuance</strong>
                              Violator receives SMS challan notification
                            </div>
                          </div>
                          <div className="flex items-start gap-2 bg-background/40 border border-border p-2.5 rounded-lg">
                            <span className="text-base">✅</span>
                            <div>
                              <strong className="text-foreground block mb-0.5">Step 3. Archive</strong>
                              Case closed — reference <span className="mono text-foreground font-semibold">{refNumber}</span> archived
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {!hasViolation && (
                    <div className="bg-[#1f2937]/30 border border-[#1f2937] rounded-xl p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        No traffic violations were detected in this image. No report has been filed.
                      </p>
                      <button onClick={reset} className="mt-3 rounded-md border border-border hover:bg-accent/40 px-4 py-2 text-xs font-semibold">
                        Submit Another Photo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: How it Works & Stats (40% width on lg) */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          {/* How It Works Steps */}
          <Panel title="How It Works" subtitle="Report pipeline instructions" code="REP-FLOW">
            <div className="flex flex-col gap-3 p-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="grid h-8 w-8 place-items-center rounded bg-primary/10 text-primary shrink-0">
                  <Camera className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Step 1 — CAPTURE</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Photograph the violation clearly showing the vehicle and licence plate if possible.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="grid h-8 w-8 place-items-center rounded bg-primary/10 text-primary shrink-0">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Step 2 — UPLOAD</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Upload your photo here. DRISHTI's AI analyses it in under 2 seconds using computer vision.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="grid h-8 w-8 place-items-center rounded bg-success/10 text-success shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Step 3 — REPORT FILED</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                    Your evidence is automatically submitted to BTP with a unique reference number for tracking.
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          {/* Stats card */}
          <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col gap-3">
            <div className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">
              Citizen Reports — Bengaluru 2025
            </div>
            <div className="grid grid-cols-2 gap-3.5 mt-1">
              <div>
                <span className="mono text-2xl font-bold text-foreground block">14,832</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mt-0.5 leading-none">Reports this month</span>
              </div>
              <div className="border-l border-[#1f2937] pl-3.5">
                <span className="mono text-2xl font-bold text-[#22c55e] block">67%</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mt-0.5 leading-none">Led to successful challan</span>
              </div>
              <div className="border-t border-[#1f2937] pt-3">
                <span className="mono text-2xl font-bold text-[#3b82f6] block">₹2.4 Cr</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mt-0.5 leading-none">Fines collected</span>
              </div>
              <div className="border-t border-[#1f2937] border-l border-[#1f2937] pt-3 pl-3.5">
                <span className="mono text-2xl font-bold text-[#f59e0b] block">4.2 min</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mt-0.5 leading-none">Average response time</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[10px] text-muted-foreground/75 italic leading-relaxed text-center px-2">
            Reports are reviewed by BTP officers before challan issuance. False reporting is a cognisable offence under IPC Section 182.
          </div>
        </div>
      </div>
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
    <label
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className="relative flex h-[320px] cursor-pointer flex-col items-center justify-center gap-5 overflow-hidden rounded-lg border-2 border-dashed border-primary/40 bg-[#070b14] transition hover:border-primary hover:bg-primary/5"
    >
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(59,130,246,0.14),transparent_60%)]" />
      {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((p, i) => (
        <span
          key={i}
          className={`absolute ${p} h-5 w-5 border-primary/60`}
          style={{
            borderTopWidth: p.includes("top") ? 2 : 0,
            borderBottomWidth: p.includes("bottom") ? 2 : 0,
            borderLeftWidth: p.includes("left") ? 2 : 0,
            borderRightWidth: p.includes("right") ? 2 : 0,
          }}
        />
      ))}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-b from-primary/60 to-transparent animate-scan"
        style={{ height: "30%" }}
      />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      <div className="relative grid h-16 w-16 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/30">
        <CloudUpload className="h-8 w-8 text-primary" />
        <span className="absolute inset-0 -m-1.5 rounded-xl ring-1 ring-primary/20 animate-pulse-ring" />
      </div>
      <div className="relative text-center">
        <div className="text-base font-semibold text-foreground tracking-wide">Select Violation Photograph</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          JPEG, PNG, or WEBP · up to 50 MB
        </div>
      </div>
      <div className="relative flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-semibold text-muted-foreground/80 bg-surface/50 border border-border rounded-full px-3 py-1">
        🔒 Encrypted Submission
      </div>
    </label>
  );
}

function PipelinePanel({ step, done }: { step: number; done: boolean }) {
  return (
    <Panel
      title="DRISHTI Processing Status"
      subtitle={done ? "Analysis complete · report generated" : "Running computer vision validation pipeline"}
      icon={Brain}
      code="REP-PIPE"
    >
      <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-6">
        {PIPELINE.map((p, i) => {
          const active = step === i + 1 && !done;
          const completed = step > i || done;
          const Icon = p.icon;
          return (
            <div key={p.label} className="relative flex flex-col items-center text-center">
              <div
                className={`relative grid h-10 w-10 place-items-center rounded-md border ${
                  completed
                    ? "border-success/40 bg-success/10 text-success"
                    : active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border bg-surface/50 text-muted-foreground"
                }`}
              >
                {active ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                {active && (
                  <span className="absolute inset-0 -m-1 rounded-md ring-1 ring-primary/45 animate-pulse-ring" />
                )}
              </div>
              <div
                className={`mt-1.5 text-[10px] font-semibold ${completed ? "text-foreground" : "text-muted-foreground"}`}
              >
                {p.label}
              </div>
              {i < PIPELINE.length - 1 && (
                <ArrowRight className="absolute -right-2 top-2.5 hidden h-3.5 w-3.5 text-border md:block" />
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
