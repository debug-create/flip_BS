export type Violation = {
  id: string;
  type: "Helmet" | "Red Light" | "Wrong Side" | "Triple Riding" | "No Seatbelt" | "Overspeeding";
  location: string;
  timestamp: string;
  confidence: number;
  vehicle: string;
  plate: string;
  status: "Verified" | "Pending" | "Disputed";
};

const TYPES: Violation["type"][] = [
  "Helmet", "Red Light", "Wrong Side", "Triple Riding", "No Seatbelt", "Overspeeding",
];
const LOCATIONS = [
  "Whitefield Junction", "KR Puram Bridge", "Indiranagar 100ft Rd", "Silk Board",
  "Marathahalli Bridge", "Hebbal Flyover", "Electronic City Phase 1", "Koramangala 80ft",
  "MG Road Signal", "Tin Factory", "Bellandur ORR", "Yeshwanthpur Circle",
];
const VEHICLES = ["Two-Wheeler", "Sedan", "SUV", "Auto Rickshaw", "Delivery Van", "Truck"];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function pad(n: number, w = 2) { return String(n).padStart(w, "0"); }

let seed = 7;
function srand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
function pick<T>(arr: T[]): T { return arr[Math.floor(srand() * arr.length)]; }

const BASE_TIME = new Date("2026-06-17T14:08:22Z").getTime();

export const VIOLATIONS: Violation[] = Array.from({ length: 48 }, (_, i) => {
  const d = new Date(BASE_TIME - i * 1000 * 60 * (3 + srand() * 25));
  return {
    id: `DRSH-${(10248 - i).toString()}`,
    type: pick(TYPES),
    location: pick(LOCATIONS),
    timestamp: d.toISOString(),
    confidence: Math.round((0.82 + srand() * 0.17) * 1000) / 10,
    vehicle: pick(VEHICLES),
    plate: `KA${pad(Math.floor(srand() * 53) + 1)}${String.fromCharCode(65 + Math.floor(srand() * 26))}${String.fromCharCode(65 + Math.floor(srand() * 26))}${pad(Math.floor(srand() * 9999), 4)}`,
    status: pick(["Verified", "Verified", "Verified", "Pending", "Disputed"] as Violation["status"][]),
  };
});

export const LIVE_FEED = VIOLATIONS.slice(0, 8);

export const KPI = {
  violationsToday: 2847,
  activeCameras: 312,
  totalCameras: 340,
  predictionAccuracy: 94.3,
  highRiskJunctions: 17,
};

export const HOURLY_TREND = Array.from({ length: 24 }, (_, h) => ({
  hour: `${pad(h)}:00`,
  helmet: Math.round(20 + 60 * Math.sin((h - 6) / 6) + srand() * 40),
  redLight: Math.round(15 + 40 * Math.sin((h - 8) / 5) + srand() * 25),
  wrongSide: Math.round(8 + 22 * Math.sin((h - 7) / 6) + srand() * 15),
}));

export const VIOLATION_BREAKDOWN = [
  { name: "Helmet", value: 1247, color: "#3b82f6" },
  { name: "Red Light", value: 642, color: "#ef4444" },
  { name: "Wrong Side", value: 388, color: "#f59e0b" },
  { name: "Triple Riding", value: 271, color: "#22c55e" },
  { name: "No Seatbelt", value: 198, color: "#a855f7" },
  { name: "Overspeeding", value: 101, color: "#06b6d4" },
];

export const TOP_JUNCTIONS = LOCATIONS.slice(0, 8).map((l, i) => ({
  junction: l,
  violations: Math.round(420 - i * 38 + srand() * 30),
  risk: ["Critical", "High", "High", "Medium", "Medium", "Medium", "Low", "Low"][i],
}));

export const CAMERAS = Array.from({ length: 24 }, (_, i) => ({
  id: `CAM-${pad(i + 1, 3)}`,
  // SVG % coords on our schematic map
  x: 8 + srand() * 84,
  y: 8 + srand() * 84,
  status: srand() > 0.08 ? "online" : "offline",
  violations: Math.floor(srand() * 80),
}));

export const HOTSPOTS = [
  { name: "Whitefield Junction", x: 72, y: 38, risk: 92, eta: "Now", delta: "+18%" },
  { name: "KR Puram Bridge", x: 64, y: 30, risk: 86, eta: "45 min", delta: "+12%" },
  { name: "Silk Board", x: 50, y: 78, risk: 81, eta: "30 min", delta: "+9%" },
  { name: "Marathahalli", x: 68, y: 50, risk: 74, eta: "60 min", delta: "+6%" },
  { name: "Hebbal Flyover", x: 42, y: 14, risk: 68, eta: "Now", delta: "+4%" },
  { name: "Tin Factory", x: 60, y: 26, risk: 64, eta: "50 min", delta: "+3%" },
];

export const AI_INSIGHTS = [
  { severity: "critical", text: "Whitefield Junction violation probability increased 18% over baseline. Recommend 2 additional units." },
  { severity: "warning", text: "KR Puram: expected helmet violation spike in next 45 minutes based on shift change patterns." },
  { severity: "info", text: "Silk Board congestion forecast indicates 30-min window for enforcement deployment." },
  { severity: "success", text: "MG Road Signal compliance improved 11% week-over-week after camera reactivation." },
];

export const FLEET = {
  safetyScore: 87.4,
  activeRiders: 1248,
  flaggedThisWeek: 36,
  topRoutes: [
    { route: "Whitefield → Marathahalli", incidents: 14, risk: "High" },
    { route: "KR Puram → Indiranagar", incidents: 9, risk: "High" },
    { route: "Koramangala → HSR", incidents: 6, risk: "Medium" },
    { route: "Bellandur → Sarjapur", incidents: 4, risk: "Medium" },
    { route: "Hebbal → Yeshwanthpur", incidents: 2, risk: "Low" },
  ],
};

export const SYSTEM_STATUS = [
  { name: "Backend API",         status: "healthy",  value: "200 OK",     detail: "uptime 14d 06h" },
  { name: "Model Health",        status: "healthy",  value: "v3.2.1",     detail: "drift 0.4% · nominal" },
  { name: "Camera Connectivity", status: "degraded", value: "312/340",    detail: "28 offline" },
  { name: "OCR Engine",          status: "healthy",  value: "98.2%",      detail: "PaddleOCR v2.7" },
  { name: "Inference Latency",   status: "healthy",  value: "42 ms",      detail: "p95 · YOLOv8n" },
  { name: "API Status",          status: "healthy",  value: "99.98%",     detail: "30d availability" },
  { name: "GPU Utilization",     status: "healthy",  value: "38%",        detail: "4× A10 · queue 0" },
  { name: "Storage Health",      status: "healthy",  value: "12.4 TB",    detail: "S3 · 68% capacity" },
];

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export const REPEAT_OFFENDERS = [
  { plate: "KA03MJ1234", score: 92, count: 14, lastSeen: "KR Puram", type: "Helmet" },
  { plate: "KA05AB7890", score: 88, count: 11, lastSeen: "Whitefield", type: "Wrong Side" },
  { plate: "KA01XY6789", score: 84, count: 9, lastSeen: "Silk Board", type: "Signal Jump" },
  { plate: "KA51MZ4421", score: 79, count: 8, lastSeen: "Indiranagar", type: "Triple Riding" },
  { plate: "KA09HN7782", score: 74, count: 6, lastSeen: "Hebbal", type: "Helmet" },
];

export const ACTIVE_ALERTS_SUMMARY = {
  active: 12,
  escalated: 3,
  predicted: 37,
};

export const AI_RECOMMENDATIONS = [
  { title: "Deploy officers to KR Puram Junction", priority: "CRITICAL", confidence: 96, action: "Dispatch 2 units", eta: "8 min", junction: "KR Puram" },
  { title: "Whitefield violation probability +21%", priority: "HIGH", confidence: 91, action: "Pre-position patrol", eta: "12 min", junction: "Whitefield" },
  { title: "ORR corridor risk elevated", priority: "HIGH", confidence: 88, action: "Mobile checkpoint", eta: "20 min", junction: "ORR" },
  { title: "Helmet violation surge expected in 45 min", priority: "MEDIUM", confidence: 84, action: "Enforce at Silk Board", eta: "45 min", junction: "Silk Board" },
];

export const HOURLY_CURVE = [
  { hour: "06AM", violations: 84 },
  { hour: "08AM", violations: 312 },
  { hour: "10AM", violations: 198 },
  { hour: "12PM", violations: 224 },
  { hour: "02PM", violations: 176 },
  { hour: "04PM", violations: 268 },
  { hour: "06PM", violations: 408 },
  { hour: "08PM", violations: 286 },
];

export const DANGEROUS_JUNCTIONS = [
  { name: "Silk Board", count: 482, risk: "Critical", trend: "+14%" },
  { name: "KR Puram", count: 421, risk: "Critical", trend: "+9%" },
  { name: "Whitefield", count: 388, risk: "High", trend: "+6%" },
  { name: "Hebbal", count: 312, risk: "High", trend: "+3%" },
  { name: "Indiranagar", count: 264, risk: "Medium", trend: "-2%" },
];

export const WEATHER_IMPACT = [
  { condition: "Rain", violations: 421, baseline: 280, delta: "+50%" },
  { condition: "Clear", violations: 268, baseline: 280, delta: "-4%" },
  { condition: "Cloudy", violations: 312, baseline: 280, delta: "+11%" },
];

export const DELIVERY_CORRIDORS = [
  { zone: "Whitefield", risk: "High", riders: 412, incidents: 18 },
  { zone: "KR Puram", risk: "Medium", riders: 286, incidents: 9 },
  { zone: "ORR Corridor", risk: "High", riders: 524, incidents: 21 },
  { zone: "Indiranagar", risk: "Low", riders: 218, incidents: 3 },
];

export const SAFETY_RECOMMENDATIONS = [
  "Launch helmet awareness campaign across Whitefield hub",
  "Increase monitoring on ORR corridor during 6–9 PM window",
  "Target helmet compliance audit at KR Puram dispatch",
  "Reroute night shift around Silk Board congestion zone",
];

export const OFFICER_DEPLOYMENT = [
  { junction: "Silk Board", officers: 3, urgency: "Critical" },
  { junction: "KR Puram", officers: 2, urgency: "High" },
  { junction: "Whitefield", officers: 1, urgency: "Medium" },
  { junction: "Hebbal", officers: 1, urgency: "Medium" },
];

export const AI_FORECAST = [
  { label: "Helmet violations", change: "+23%", horizon: "Next 60 min", confidence: 92 },
  { label: "Signal violations", change: "+14%", horizon: "Next 45 min", confidence: 88 },
  { label: "Wrong-side driving", change: "+9%", horizon: "Next 30 min", confidence: 84 },
  { label: "Overspeeding (ORR)", change: "+18%", horizon: "Next 90 min", confidence: 81 },
];

export const MAEP_CAMERAS = [
  { id: "CAM-A · KR Puram N", angle: "North Approach", confidence: 97 },
  { id: "CAM-B · KR Puram E", angle: "East Approach", confidence: 95 },
  { id: "CAM-C · KR Puram S", angle: "South Approach", confidence: 96 },
  { id: "CAM-D · KR Puram Aerial", angle: "Overhead PTZ", confidence: 98 },
];

