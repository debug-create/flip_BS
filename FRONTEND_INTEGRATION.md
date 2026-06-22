# DRISHTI — Frontend ↔ Backend Integration Guide

> **For:** Frontend developer (React dashboard)  
> **Backend owner:** Chirag  
> **Last updated:** June 17, 2026

This document is the **single source of truth** for wiring the React frontend to the FastAPI backend. Read this before building API calls so we merge without surprises.

---

## Quick Start

| Item | Value |
|------|-------|
| Backend base URL (local) | `http://localhost:8000` |
| Frontend dev URL (expected) | `http://localhost:5173` |
| CORS | Enabled for all origins (`*`) — no proxy required in dev |
| Auth | None (hackathon demo) |
| Storage | Frontend holds session state — backend returns JSON only |
| API docs (Swagger) | http://localhost:8000/docs |

### Start the backend

```bash
cd drishti-backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/health` → `{"status":"ok","model":"YOLOv8n","mode":"DEMO"}`

---

## Recommended `api.js` Setup

Create `src/utils/api.js` with this base URL constant — **do not hardcode in components**:

```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function analyzeImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/analyze/image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed (${response.status})`);
  }

  return response.json();
}

export async function analyzeVideo(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/analyze/video`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed (${response.status})`);
  }

  return response.json();
}

export async function getHealth() {
  const response = await fetch(`${API_BASE}/health`);
  return response.json();
}

export async function getViolationTypes() {
  const response = await fetch(`${API_BASE}/violations/types`);
  return response.json();
}
```

Optional `.env` for frontend:

```
VITE_API_URL=http://localhost:8000
```

---

## Endpoints

### `GET /health`

**Use for:** Dashboard status indicator ("Backend online · DEMO MODE")

**Response:**
```json
{
  "status": "ok",
  "model": "YOLOv8n",
  "mode": "DEMO"
}
```

---

### `GET /violations/types`

**Use for:** Populating violation legend, filter dropdowns, Analytics chart labels

**Response:** Array of 8 objects:
```json
[
  {
    "name": "Helmet Non-Compliance",
    "description": "Rider without a helmet on a two-wheeler."
  }
]
```

**Violation names (exact strings — use these as chart keys):**
1. Helmet Non-Compliance
2. Seatbelt Non-Compliance
3. Triple Riding
4. Wrong-Side Driving
5. Stop-Line Violation
6. Red-Light Running
7. Illegal Parking
8. Defective/Missing Plate

---

### `POST /analyze/image`

**Use for:** Analyze view — upload image, show annotated result

**Request:**
- Content-Type: `multipart/form-data`
- Field name: **`file`** (required)
- Allowed types: `.jpg`, `.jpeg`, `.png`, `.webp`
- Max size: **50 MB**

**Response:** Full evidence package (store in React state / Evidence Log):

```json
{
  "evidence_id": "DRISHTI-20260617143022-A3F9",
  "timestamp": "2026-06-17T14:30:22.123456+00:00",
  "source": "traffic.jpg",
  "summary": {
    "total_vehicles_detected": 3,
    "total_violations_detected": 2,
    "violation_breakdown": {
      "Helmet Non-Compliance": 1,
      "Triple Riding": 0,
      "Seatbelt Non-Compliance": 0,
      "Wrong-Side Driving": 0,
      "Stop-Line Violation": 1,
      "Red-Light Running": 0,
      "Illegal Parking": 0,
      "Defective/Missing Plate": 0
    }
  },
  "detections": [
    {
      "detection_id": "D001",
      "class_name": "motorcycle",
      "confidence": 0.8731,
      "bbox": [120, 45, 380, 290],
      "is_violation": true,
      "violation_type": "Helmet Non-Compliance",
      "plate": {
        "plate_text": "KA03MJ1234",
        "confidence": 0.82
      },
      "vehicle_lookup": {
        "plate_number": "KA03MJ1234",
        "registration_date": "14-03-2021",
        "owner_name": "Rajesh Kumar",
        "address": "Whitefield, Bengaluru",
        "vehicle_class": "Motorcycle/Scooter",
        "make": "Honda",
        "model": "CB Shine",
        "colour": "Black",
        "fuel_type": "Petrol",
        "engine": "125cc Single Cylinder",
        "insurance_status": "VALID",
        "insurance_expiry": "22-09-2027",
        "puc_status": "EXPIRED",
        "puc_expiry": "10-05-2026",
        "prior_violations": 3,
        "repeat_offender": true,
        "pending_challans": 1,
        "pending_amount_rs": 1200,
        "rto_office": "Bengaluru (East) RTO",
        "data_source": "Vahan 4.0 · MoRTH",
        "lookup_status": "SUCCESS"
      }
    },
    {
      "detection_id": "D002",
      "class_name": "person",
      "confidence": 0.65,
      "bbox": [200, 50, 250, 180],
      "is_violation": false,
      "violation_type": null,
      "plate": null,
      "vehicle_lookup": null
    }
  ],
  "annotated_image_b64": "<base64 JPEG string — no data: prefix>",
  "processing_metadata": {
    "model_version": "YOLOv8n-DEMO",
    "inference_time_ms": 234.5,
    "image_dimensions": [1280, 720]
  }
}
```

#### Displaying the annotated image

```javascript
// annotated_image_b64 does NOT include the data URI prefix
const src = `data:image/jpeg;base64,${response.annotated_image_b64}`;
```

```jsx
<img src={src} alt="Annotated detection result" />
```

#### Detection fields to show in UI

| Field | UI usage |
|-------|----------|
| `is_violation` | Red badge vs green vehicle tag |
| `violation_type` | Show when `is_violation === true` |
| `class_name` | Vehicle type when no violation |
| `confidence` | Display as percentage: `(confidence * 100).toFixed(0)%` |
| `plate.plate_text` | Show `"UNREADABLE"` in muted style if OCR failed |
| `bbox` | Optional: draw overlay client-side (backend already annotates) |

---

### `POST /analyze/video`

**Use for:** Optional video demo — timeline of violations

**Request:**
- Field name: **`file`**
- Allowed: `.mp4`, `.avi`
- Max size: **50 MB**
- Max duration: **30 seconds**
- Sampling: **2 fps** (not every frame)

**Response:**
```json
{
  "total_frames_analyzed": 14,
  "total_violations_found": 7,
  "violation_timeline": [
    { "...full evidence package per frame..." }
  ],
  "aggregate_violation_breakdown": {
    "Helmet Non-Compliance": 4,
    "Triple Riding": 0,
    "Seatbelt Non-Compliance": 0,
    "Wrong-Side Driving": 0,
    "Stop-Line Violation": 3,
    "Red-Light Running": 0,
    "Illegal Parking": 0,
    "Defective/Missing Plate": 0
  }
}
```

Each item in `violation_timeline` has the **same shape** as `/analyze/image` response. Use `aggregate_violation_breakdown` for Analytics charts after video upload.

---

### `GET /vehicle/lookup/{plate_number}`

**Use for:** Retrieve full vehicle registration details from the Vahan database (features a simulated 0.8s network delay).

**Response:**
```json
{
  "plate_number": "KA03MJ1234",
  "registration_date": "14-03-2021",
  "owner_name": "Rajesh Kumar",
  "address": "Whitefield, Bengaluru",
  "vehicle_class": "Motorcycle/Scooter",
  "make": "Honda",
  "model": "CB Shine",
  "colour": "Black",
  "fuel_type": "Petrol",
  "engine": "125cc Single Cylinder",
  "insurance_status": "VALID",
  "insurance_expiry": "22-09-2027",
  "puc_status": "EXPIRED",
  "puc_expiry": "10-05-2026",
  "prior_violations": 3,
  "repeat_offender": true,
  "pending_challans": 1,
  "pending_amount_rs": 1200,
  "rto_office": "Bengaluru (East) RTO",
  "data_source": "Vahan 4.0 · MoRTH",
  "lookup_status": "SUCCESS"
}
```

---

## Error Responses

FastAPI returns errors as:

```json
{ "detail": "Human-readable error message" }
```

| Status | When | Frontend handling |
|--------|------|-------------------|
| `413` | File > 50 MB or video > 30s | Show "File too large" toast |
| `415` | Wrong file type / corrupt file | Show "Unsupported format" |
| `500` | Inference crash | Show "Analysis failed — try another image" |

Example:

```javascript
if (!response.ok) {
  const { detail } = await response.json();
  throw new Error(detail);
}
```

---

## Frontend State Contract (Suggested)

The backend does **not** persist data. The frontend should own:

```javascript
// App-level state (example)
const [evidenceLog, setEvidenceLog] = useState([]);  // array of evidence packages
const [analytics, setAnalytics] = useState(null);     // aggregated breakdown

// After successful /analyze/image:
setEvidenceLog(prev => [evidence, ...prev]);

// Analytics view: sum violation_breakdown across evidenceLog
```

**Evidence Log table columns (suggested):**
- `evidence_id`
- `timestamp` (format with `toLocaleString()`)
- `source`
- `summary.total_violations_detected`
- Actions: View modal (full JSON), Export JSON

---

## Loading / UX Notes

- **First request is slow** (~5–30s on CPU): models load at startup, but inference + OCR still takes time. Show a spinner with "Running DRISHTI analysis..."
- **DEMO MODE**: Violations are partly mocked on top of real YOLO detections until `models/drishti.pt` is added. Badge the UI: `mode: DEMO` from `/health`.
- **No WebSocket** — all endpoints are synchronous POST/GET. Disable upload button while request is in flight.

---

## File Upload Validation (Client-Side)

Mirror backend rules to avoid unnecessary failed requests:

```javascript
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/x-msvideo'];
const MAX_BYTES = 50 * 1024 * 1024;

function validateFile(file, kind = 'image') {
  const allowed = kind === 'image' ? IMAGE_TYPES : VIDEO_TYPES;
  if (!allowed.includes(file.type)) {
    throw new Error('Unsupported file type');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('File must be under 50 MB');
  }
}
```

---

## Design Tokens (from project brief)

Use these for the command-center dashboard:

```
Background:     #0a0f1a
Surface cards:  #111827
Borders:        #1f2937
Primary:        #3b82f6
Danger/red:     #ef4444  ← violations
Success/green:  #22c55e  ← clean vehicles
Warning:        #f59e0b
Text primary:   #f9fafb
Text secondary: #9ca3af
Font:           Inter (Google Fonts)
```

---

## Merge Checklist (Before Demo)

- [ ] Frontend `VITE_API_URL` points to running backend
- [ ] `POST /analyze/image` field is named exactly `file`
- [ ] Annotated image uses `data:image/jpeg;base64,` prefix
- [ ] Evidence Log stores full response object (for modal export)
- [ ] Analytics aggregates `violation_breakdown` from stored evidence
- [ ] Error toasts handle 413 / 415 / 500
- [ ] Health check shows backend status on load

---

## Questions?

- Backend code: `drishti-backend/main.py`
- Full project context: `context.md`
- API playground: http://localhost:8000/docs
