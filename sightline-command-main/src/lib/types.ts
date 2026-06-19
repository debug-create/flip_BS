export interface PlateResult {
  plate_text: string;
  confidence: number;
}

export interface Detection {
  detection_id: string;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
  is_violation: boolean;
  violation_type: string | null;
  plate: PlateResult | null;
}

export interface EvidenceSummary {
  total_vehicles_detected: number;
  total_violations_detected: number;
  violation_breakdown: Record<string, number>;
}

export interface ProcessingMetadata {
  model_version: string;
  inference_time_ms: number;
  image_dimensions: [number, number];
}

export interface EvidencePackage {
  evidence_id: string;
  timestamp: string;
  source: string;
  summary: EvidenceSummary;
  detections: Detection[];
  annotated_image_b64: string;
  processing_metadata: ProcessingMetadata;
}

export interface VideoAnalysisResult {
  total_frames_analyzed: number;
  total_violations_found: number;
  violation_timeline: EvidencePackage[];
  aggregate_violation_breakdown: Record<string, number>;
}

export interface HealthResponse {
  status: string;
  model: string;
  mode: string;
}

export interface ViolationTypeInfo {
  name: string;
  description: string;
}

export interface ModelStatus {
  model_id: string;
  status: string;
  test_predictions?: number;
  error?: string;
}

export interface DebugModelsResponse {
  api_key_preview: string;
  roboflow_url: string;
  models: {
    vehicle: ModelStatus;
    helmet: ModelStatus;
    plate: ModelStatus;
  };
}

