# DRISHTI — Project Context File
> Keep this file updated after every work session. 
> Paste this into any new AI coding session (Cursor / AG) to restore full context.

---

## What is DRISHTI?

Traffic violation detection system built for **Flipkart Gridlock Hackathon 2.0 — Phase 2, Theme 3**.
Submission deadline: **June 21, 2026**.
Finale: July 3, 2026 at Flipkart HQ, Bengaluru (top 10 teams pitch live).

Full name: **Deep Real-time Intelligence for Smart Traffic Holistic Intelligence**

Judges: Flipkart engineering + Bengaluru Traffic Police (BTP) leadership.
Key pitch angle: DRISHTI sits ON TOP of BTP's existing 9,000+ camera infrastructure.
No new hardware required. Augments ASTraM + BATCS, doesn't replace them.

---

## Team
- Chirantan
- Jasmon  
- Chirag (that's me)

---

## Core Features (4 Modules)

### MODULE 1: DETECT
- Roboflow hosted 3-model pipeline (vehicle + helmet + plate)
- 8 violation types: Helmet Non-Compliance, Seatbelt Non-Compliance, 
  Triple Riding, Wrong-Side Driving, Stop-Line Violation, 
  Red-Light Running, Illegal Parking, Defective/Missing Plate
- Helmet + triple-riding from helmet model on two-wheeler crops

### MODULE 2: IDENTIFY  
- EasyOCR for license plate text extraction
- Indian plate regex: `[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}`
- Multi-Angle Evidence Package (MAEP) — 4-camera frame stitching (Phase 2 vision)
- DEMO MODE: single image, extract best readable plate

### MODULE 3: PREDICT
- LightGBM hotspot prediction (extends Phase 1 model)
- Input: geohash × time × weather × event type
- Output: violation probability heatmap, 30-60 min ahead
- NOT in prototype scope — show as UI placeholder with mock data

### MODULE 4: COMMAND (Dashboard)
- React frontend — dark command center aesthetic
- 3 views: Analyze / Evidence Log / Analytics
- Recharts for violation breakdown charts

---

## Tech Stack

### Backend
- Python 3.10+ (tested on 3.14)
- FastAPI + Uvicorn
- Roboflow serverless API (vehicle / helmet / plate models)
- EasyOCR for plate text reading
- OpenCV (cv2)
- Pillow, numpy
- NO database (return JSON, frontend holds session state)
- NO auth (hackathon demo)

### Frontend
- React 19 + Vite + TanStack Router (in `sightline-command-main/`)
- Tailwind CSS v4 (dark theme)
- Recharts
- TypeScript
- Session evidence state via `EvidenceProvider` + sessionStorage

### Model Training (separate, not in main repo)
- **Colab notebook:** `training/DRISHTI_YOLOv8_Training.ipynb` (Roboflow → merge → train → export)
- Kaggle Notebooks (free T4 GPU, 30hr/week) OR Roboflow free cloud training
- YOLOv8n as base → fine-tune on Indian traffic datasets
- Target datasets: Roboflow helmet detection, IDD vehicle detection

---

## Project Structure

```
drishti/
├── drishti-backend/
│   ├── main.py
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── preprocess.py
│   │   ├── detect.py
│   │   ├── ocr.py
│   │   ├── annotate.py
│   │   └── evidence.py
│   ├── models/
│   │   └── README.md        # Place drishti.pt here after training
│   ├── sample_images/
│   ├── requirements.txt
│   └── README.md
│
├── sightline-command-main/   # Frontend dashboard (TanStack Start)
│   ├── src/
│   │   ├── lib/api.ts        # Backend API client
│   │   ├── lib/evidenceStore.tsx
│   │   ├── routes/analyze.tsx
│   │   ├── routes/evidence.tsx
│   │   ├── routes/analytics.tsx
│   │   └── ...
│   └── .env.example
│
└── context.md               # Project context (read first each session)
```

**Also at repo root:**
- `FRONTEND_INTEGRATION.md` — API contract for frontend developer

**Training (Colab):**
- `training/DRISHTI_YOLOv8_Training.ipynb` — YOLOv8 fine-tuning notebook
- `training/README.md` — how to run training and deploy weights

---

## API Contract (Backend → Frontend)

### POST /analyze/image
Input: multipart/form-data, field "file" (jpg/png/webp)
Output:
```json
{
  "evidence_id": "DRISHTI-{timestamp}-{4chars}",
  "timestamp": "ISO 8601",
  "source": "filename",
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
      }
    }
  ],
  "annotated_image_b64": "<base64 JPEG string>",
  "processing_metadata": {
    "model_version": "YOLOv8n-DEMO",
    "inference_time_ms": 234.5,
    "image_dimensions": [1280, 720]
  }
}
```

### POST /analyze/video
Input: multipart/form-data, field "file" (mp4/avi, max 30s)
Output:
```json
{
  "total_frames_analyzed": 14,
  "total_violations_found": 7,
  "violation_timeline": [ ...per-frame evidence JSONs... ],
  "aggregate_violation_breakdown": { ...same structure as summary.violation_breakdown... }
}
```

### GET /health
Output: `{"status": "ok", "model": "roboflow-3model", "mode": "PRODUCTION"}`

### GET /violations/types
Output: list of 8 violation type objects with name + description

---

## Design System (Frontend)

```
Background:     #0a0f1a  (very dark navy)
Surface cards:  #111827  (dark blue-grey)
Borders:        #1f2937
Primary:        #3b82f6  (blue)
Danger/red:     #ef4444
Success/green:  #22c55e
Warning:        #f59e0b
Text primary:   #f9fafb
Text secondary: #9ca3af
Font:           Inter (Google Fonts)
```

---

## Key Business Context (for pitch framing)

- BTP has 9,000+ CCTV cameras but analysis is manual
- ASTraM monitors congestion every 15 min — no prediction layer
- BATCS adaptive signals cover only 165/500 junctions
- 1.46 lakh delivery executive violations in Bengaluru 2023-2025 (rising steeply)
- 64 accident black spots formally identified by BTP
- East Bengaluru (Whitefield, KR Puram, Indiranagar) = Flipkart's primary zone = highest violation density
- Flipkart judges: frame fleet intelligence angle directly
- BTP judges: frame as augmenting their existing work, not replacing it
- Legal angle: MAEP (multi-angle evidence) is stronger under Section 136A, MV Amendment Act 2019

---

## Current State
> UPDATE THIS SECTION after every work session

### Completed
- [x] Backend: main.py + FastAPI routes
- [x] Backend: pipeline/preprocess.py
- [x] Backend: pipeline/detect.py (Roboflow 3-model hosted inference)
- [x] Backend: pipeline/ocr.py
- [x] Backend: pipeline/annotate.py
- [x] Backend: pipeline/evidence.py
- [x] Frontend: project scaffold (`sightline-command-main/`)
- [x] Frontend: Header + Sidebar (TopBar + AppSidebar)
- [x] Frontend: Analyze page wired to `POST /analyze/image` + video
- [x] Frontend: Evidence Log wired to session evidence store
- [x] Frontend: Analytics wired to live violation breakdown
- [x] Frontend: api.ts + evidenceStore + types
- [ ] Model: fine-tuned weights trained (drishti.pt) — using Roboflow hosted instead
- [x] Model: Colab training notebook created (`training/DRISHTI_YOLOv8_Training.ipynb`)
- [x] Integration: frontend talking to backend (Analyze, Evidence, Analytics, Health)
- [ ] Demo: tested end-to-end with real Bengaluru traffic images

### Known Issues / TODOs
> Add any bugs, incomplete features, or pending decisions here
- Backend uses Roboflow 3-model hosted inference + EasyOCR (Python 3.14 compatible)
- Roboflow API key in `drishti-backend/.env` (copy from `.env.example`) — never commit `.env`
- Teammates cloning the repo must run `copy .env.example .env` and add their own Roboflow key
- Frontend in `sightline-command-main/` — copy `.env.example` to `.env` with `VITE_API_URL=http://localhost:8000`
- Run frontend: `cd sightline-command-main && npm install && npm run dev`
- Fleet / Hotspots pages still use mock data (out of scope for wiring doc)

### File Locations of Note
> Add any non-obvious file paths, env vars, or config values here
- Model weights go in: `drishti-backend/models/drishti.pt`
- After training on Kaggle/Roboflow, download best.pt and rename to drishti.pt
- Backend runs on: http://localhost:8000
- Frontend runs on: http://localhost:5173 (sightline-command-main)
- **Wiring spec:** `DRISHTI wiring endpoints.docx` (root)
- **Frontend ↔ Backend contract:** `FRONTEND_INTEGRATION.md` (root)
- Backend README: `drishti-backend/README.md`
- **Secrets:** `drishti-backend/.env` (gitignored) — see `.env.example`
- **Training notebook:** `training/DRISHTI_YOLOv8_Training.ipynb`
- **GitHub:** https://github.com/debug-create/flip_BS

---

## What NOT to Build (Scope Cuts)

- ❌ Real-time RTSP stream processing (demo uses image/video upload)
- ❌ Actual Parivahan/Vahan API integration (mock owner lookup)
- ❌ Seatbelt detection (requires interior camera angle — not in demo)
- ❌ Authentication / user management
- ❌ Database / persistent storage (session state only)
- ❌ Celery / background task queue
- ❌ Docker / deployment config
- ❌ Mobile responsive design (desktop command dashboard only)
- ❌ The PREDICT module as working ML (show as UI placeholder with mock heatmap data)

---

## Demo Flow for Judges

1. Open dashboard → shows "DRISHTI दृष्टि | BTP Command Interface"
2. Upload a Bengaluru traffic image (sample images in sample_images/)
3. Click ANALYZE → spinner → annotated image appears with red violation boxes
4. See violation badges: "⚠ Helmet Non-Compliance 87%" etc.
5. Click "SAVE TO LOG" → appears in Evidence Log tab
6. Switch to Evidence Log → see table entry → click VIEW → modal with full JSON + export
7. Switch to Analytics → see bar chart of violations, stat cards
8. (Optional) Upload a short video clip → show timeline of frames

---

## Session Changelog

### Session: June 18, 2026 — Late Night (Antigravity AI)

**Goal:** Improve error handling and add diagnostics to debug why the Roboflow pipeline returns detections but 0 violations on test images.

#### Changes to `drishti-backend/pipeline/detect.py`
- **Raw API response logging** in `_call_roboflow()` — every Roboflow call now logs:
  - Image dimensions + buffer size before sending
  - Full raw JSON response from Roboflow
  - Prediction count returned
- **Granular exception handling** — replaced single catch-all `except` with:
  - `requests.exceptions.Timeout` (60s limit)
  - `requests.exceptions.ConnectionError`
  - `requests.exceptions.HTTPError` (logs status code + response body)
  - Fallback with `type(e).__name__` for unexpected errors
- **Lowered confidence thresholds (TEMPORARY for testing):**
  - Vehicle detection: `0.35` → `0.15`
  - Helmet detection: `0.35` → `0.15`
  - Plate detection: `0.40` → `0.20`
  - ⚠ **MUST raise back before demo day**
- **Per-prediction diagnostic logging** — every vehicle, helmet, and plate prediction now logs class, confidence, and accept/skip reason

#### Changes to `drishti-backend/main.py`
- **`POST /debug/image`** — new route that returns raw Roboflow predictions for all 3 models without any pipeline processing. Also runs helmet model on two-wheeler crops and plate model on first 3 vehicles.
- **`GET /debug/models`** — new route that smoke-tests all 3 Roboflow models with a tiny test image, reports API key preview + connectivity status.
- ⚠ **Both debug routes must be removed before demo day**

#### What was NOT changed
- `pipeline/ocr.py`, `pipeline/annotate.py`, `pipeline/evidence.py` — untouched
- Frontend — not started yet
- Model weights — still using Roboflow hosted models

---

## How to Test Tonight

### 1. Prerequisites
```bash
cd drishti-backend
# Make sure .env exists with your Roboflow API key
copy .env.example .env
# Edit .env and add: ROBOFLOW_API_KEY=your_key_here
```

### 2. Install dependencies & start server
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Quick smoke test — check all 3 models are reachable
Open browser or run:
```bash
curl http://localhost:8000/debug/models
```
Expected: all 3 models show `"status": "ok"`

### 4. Test with your image — raw debug output
```bash
curl -X POST http://localhost:8000/debug/image -F "file=@images.jpg"
```
This returns raw predictions from all 3 Roboflow models — no filtering. Check:
- `vehicle_prediction_count` > 0?
- `helmet_debug` → does the helmet model see riders?
- `plate_debug` → does the plate model see plates?

### 5. Test the actual pipeline
```bash
curl -X POST http://localhost:8000/analyze/image -F "file=@images.jpg"
```
Watch the **terminal logs** — you'll now see every prediction with its confidence and whether it was accepted or skipped.

### 6. What to look for in logs
```
Roboflow [vehicle-detection-3mmwj/8] raw response: {...}
Vehicle pred: class=motorcycle, conf=0.9709, raw={...}
  -> ACCEPTED: bbox=[403, 158, 549, 356]
Two-wheeler detected (motorcycle), running helmet check...
Helmet crop size: 218x198
Roboflow [helmet-detection-ligfk/4] raw response: {...}
  Helmet pred: class=no-helmet, conf=0.8200
```

If helmet model returns 0 predictions → the crop might be too small or the model doesn't recognise the angle. If it returns predictions but all get skipped → thresholds are still too high.

### 7. After confirming detections work
Raise thresholds back in `detect.py`:
- `conf < 0.15` → `conf < 0.35` (two places: vehicles + helmets)
- `pconf < 0.20` → `pconf < 0.40` (plates)

---
*Last updated: June 19, 2026 — Frontend wired to backend (sightline-command-main)*