import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EvidencePackage, VideoAnalysisResult } from "./types";
import { aggregateViolationBreakdown } from "./analytics";

const STORAGE_KEY = "drishti_evidence_log";

interface EvidenceContextValue {
  evidenceLog: EvidencePackage[];
  addEvidence: (pkg: EvidencePackage) => void;
  addVideoResults: (result: VideoAnalysisResult) => void;
  clearEvidence: () => void;
  violationChartData: ReturnType<typeof aggregateViolationBreakdown>;
}

const EvidenceContext = createContext<EvidenceContextValue | null>(null);

function loadStored(): EvidencePackage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EvidencePackage[]) : [];
  } catch {
    return [];
  }
}

export function EvidenceProvider({ children }: { children: ReactNode }) {
  const [evidenceLog, setEvidenceLog] = useState<EvidencePackage[]>(loadStored);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(evidenceLog));
  }, [evidenceLog]);

  const addEvidence = useCallback((pkg: EvidencePackage) => {
    setEvidenceLog((prev) => [pkg, ...prev.filter((e) => e.evidence_id !== pkg.evidence_id)]);
  }, []);

  const addVideoResults = useCallback((result: VideoAnalysisResult) => {
    setEvidenceLog((prev) => {
      const ids = new Set(result.violation_timeline.map((e) => e.evidence_id));
      const filtered = prev.filter((e) => !ids.has(e.evidence_id));
      return [...result.violation_timeline, ...filtered];
    });
  }, []);

  const clearEvidence = useCallback(() => {
    setEvidenceLog([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const violationChartData = useMemo(
    () => aggregateViolationBreakdown(evidenceLog),
    [evidenceLog],
  );

  const value = useMemo(
    () => ({
      evidenceLog,
      addEvidence,
      addVideoResults,
      clearEvidence,
      violationChartData,
    }),
    [evidenceLog, addEvidence, addVideoResults, clearEvidence, violationChartData],
  );

  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>;
}

export function useEvidence() {
  const ctx = useContext(EvidenceContext);
  if (!ctx) throw new Error("useEvidence must be used within EvidenceProvider");
  return ctx;
}
