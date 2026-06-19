import type { EvidencePackage } from "./types";

const CHART_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export function aggregateViolationBreakdown(evidenceLog: EvidencePackage[]) {
  const totals: Record<string, number> = {};

  for (const evidence of evidenceLog) {
    for (const [name, count] of Object.entries(evidence.summary.violation_breakdown)) {
      totals[name] = (totals[name] ?? 0) + count;
    }
  }

  return Object.entries(totals)
    .filter(([, count]) => count > 0)
    .map(([name, value], index) => ({
      name: shortenViolationName(name),
      fullName: name,
      value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);
}

export function shortenViolationName(name: string): string {
  return name
    .replace(" Non-Compliance", "")
    .replace(" Violation", "")
    .replace("Running", "Running");
}

export function getPrimaryViolation(evidence: EvidencePackage): string {
  const hit = evidence.detections.find((d) => d.is_violation && d.violation_type);
  return hit?.violation_type ?? "No Violation";
}

export function getBestPlate(evidence: EvidencePackage): string {
  for (const det of evidence.detections) {
    const text = det.plate?.plate_text;
    if (text && text !== "UNREADABLE" && text !== "UNDETECTED") return text;
  }
  return "UNREADABLE";
}

export function getAnalyticsStats(evidenceLog: EvidencePackage[]) {
  const totalViolations = evidenceLog.reduce(
    (sum, e) => sum + e.summary.total_violations_detected,
    0,
  );
  const totalAnalyses = evidenceLog.length;
  const avgInference =
    totalAnalyses === 0
      ? 0
      : evidenceLog.reduce((sum, e) => sum + e.processing_metadata.inference_time_ms, 0) /
        totalAnalyses;

  const plateReads = evidenceLog.flatMap((e) =>
    e.detections.map((d) => d.plate?.confidence ?? 0).filter((c) => c > 0),
  );
  const avgOcr =
    plateReads.length === 0
      ? 0
      : (plateReads.reduce((a, b) => a + b, 0) / plateReads.length) * 100;

  return {
    totalViolations,
    totalAnalyses,
    avgInferenceMs: Math.round(avgInference),
    avgOcrConfidence: Math.round(avgOcr * 10) / 10,
    violationRate: totalAnalyses > 0 ? totalViolations / totalAnalyses : 0,
  };
}
