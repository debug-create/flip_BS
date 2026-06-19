import type {
  EvidencePackage,
  HealthResponse,
  VideoAnalysisResult,
  ViolationTypeInfo,
  DebugModelsResponse,
} from "./types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail =
      typeof body.detail === "string"
        ? body.detail
        : `Request failed (${response.status})`;
    throw new ApiError(detail, response.status);
  }
  return response.json() as Promise<T>;
}

export function getApiBase(): string {
  return API_BASE;
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`);
  return handleResponse<HealthResponse>(response);
}

export async function getDebugModels(): Promise<DebugModelsResponse> {
  const response = await fetch(`${API_BASE}/debug/models`);
  return handleResponse<DebugModelsResponse>(response);
}

export async function getViolationTypes(): Promise<ViolationTypeInfo[]> {
  const response = await fetch(`${API_BASE}/violations/types`);
  return handleResponse<ViolationTypeInfo[]>(response);
}


export async function analyzeImage(file: File): Promise<EvidencePackage> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/analyze/image`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<EvidencePackage>(response);
}

export async function analyzeVideo(file: File): Promise<VideoAnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/analyze/video`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<VideoAnalysisResult>(response);
}

export function annotatedImageSrc(b64: string): string {
  return `data:image/jpeg;base64,${b64}`;
}

export function formatApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 413) return "File too large. Maximum size is 50 MB.";
    if (error.status === 415) return "Unsupported file format.";
    if (error.status === 500) return "Analysis failed. Try another image.";
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}
