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
- React 18 + Vite
- Tailwind CSS v3 (dark theme)
- Recharts
- Plain JS (no TypeScript)
- No react-router (single page, view managed by state)

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
├── drishti-frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── views/
│   │   │   │   ├── AnalyzeView.jsx
│   │   │   │   ├── EvidenceLogView.jsx
│   │   │   │   └── AnalyticsView.jsx
│   │   │   ├── UploadZone.jsx
│   │   │   ├── ResultsPanel.jsx
│   │   │   ├── EvidenceModal.jsx
│   │   │   └── StatCard.jsx
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── formatters.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
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
Output: `{"status": "ok", "model": "YOLOv8n", "mode": "DEMO"}`

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
- [x] Backend: pipeline/detect.py (DEMO MODE with mock violations)
- [x] Backend: pipeline/ocr.py
- [x] Backend: pipeline/annotate.py
- [x] Backend: pipeline/evidence.py
- [ ] Frontend: project scaffold (Vite + Tailwind)
- [ ] Frontend: Header + Sidebar
- [ ] Frontend: AnalyzeView (upload + results)
- [ ] Frontend: EvidenceLogView (table + modal)
- [ ] Frontend: AnalyticsView (charts + stat cards)
- [ ] Frontend: api.js + formatters.js
- [ ] Model: fine-tuned weights trained (drishti.pt)
- [x] Model: Colab training notebook created (`training/DRISHTI_YOLOv8_Training.ipynb`)
- [x] Backend: `detect.py` supports fine-tuned `drishti.pt` class schema (no mock overlay)
- [ ] Integration: frontend talking to backend successfully
- [ ] Demo: tested end-to-end with real Bengaluru traffic images

### Known Issues / TODOs
> Add any bugs, incomplete features, or pending decisions here
- Backend uses Roboflow 3-model hosted inference + EasyOCR (Python 3.14 compatible)
- Roboflow API key in `drishti-backend/.env` (copy from `.env.example`) — never commit `.env`
- Teammates cloning the repo must run `copy .env.example .env` and add their own Roboflow key
- DEMO MODE uses COCO yolov8n.pt + mock violation overlay until `models/drishti.pt` is trained
- Run Colab notebook → download `drishti_best.pt` → save as `drishti-backend/models/drishti.pt`
- Frontend integration guide created at `FRONTEND_INTEGRATION.md` — share with frontend teammate

### File Locations of Note
> Add any non-obvious file paths, env vars, or config values here
- Model weights go in: `drishti-backend/models/drishti.pt`
- After training on Kaggle/Roboflow, download best.pt and rename to drishti.pt
- Backend runs on: http://localhost:8000
- Frontend runs on: http://localhost:5173
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

*Last updated: June 18, 2026 (Roboflow 3-model pipeline)*
*Next session should start by reading this file and updating Completed checkboxes*