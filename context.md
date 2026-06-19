# DRISHTI — Project Context File
> **READ THIS FIRST.** Paste this into any new AI coding session (Cursor / AG) to restore full context.
> Keep this file updated after every work session.

---

## What is DRISHTI?

Traffic violation detection system built for **Flipkart Gridlock Hackathon 2.0 — Phase 2, Theme 3**.
- **Submission deadline: June 21, 2026**
- Finale: July 3, 2026 at Flipkart HQ, Bengaluru (top 10 teams pitch live)
- Full name: **Deep Real-time Intelligence for Smart Traffic Holistic Intelligence**
- Judges: Flipkart engineering + Bengaluru Traffic Police (BTP) leadership
- Key pitch: DRISHTI sits ON TOP of BTP's existing 9,000+ camera infrastructure. No new hardware. Augments ASTraM + BATCS, doesn't replace them.

---

## Team
- **Chirantan** 
- **Jasmon**
- **Chirag** (project lead, has all API keys)

> 🔑 **Need API keys?** Ask Chirag for the Roboflow API key. Never commit `.env` files.

---

## 🚀 How to Run the Prototype (FOR TEAMMATES)

### Prerequisites
- **Python 3.10+** (tested on 3.14)
- **Node.js 18+** (for frontend)
- **Git**

### Step 1: Clone the repo
```bash
git clone https://github.com/debug-create/flip_BS.git
cd flip_BS
```

### Step 2: Start the Backend
```bash
cd drishti-backend

# Create your .env file (ask Chirag for the API key)
copy .env.example .env
# Edit .env and set: ROBOFLOW_API_KEY=<ask Chirag for this>

# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload --port 8000
```
Backend will be live at: **http://localhost:8000**

Quick test: open http://localhost:8000/health — should return `{"status": "ok", ...}`

### Step 3: Start the Frontend
```bash
# Open a NEW terminal
cd sightline-command-main

# Install Node dependencies
npm install

# Create frontend .env
copy .env.example .env
# It should have: VITE_API_URL=http://localhost:8000

# Start the frontend dev server
npm run dev
```
Frontend will be live at: **http://localhost:5173** (or next available port)

### Step 4: Test End-to-End
1. Open the frontend URL in your browser
2. Navigate to **Analyze** page
3. Upload a traffic image (sample images in `drishti-backend/sample_images/`)
4. Click Analyze → wait ~15-20s → see annotated image with violation boxes
5. Save to Evidence Log → check Evidence page
6. Check Analytics page for violation breakdown charts
7. Check Command Center / Hotspots for the Leaflet heatmap

### Troubleshooting
- **Backend won't start?** Make sure `.env` has a valid `ROBOFLOW_API_KEY`
- **Frontend can't connect?** Check `VITE_API_URL` in frontend `.env` points to backend
- **CORS errors?** Backend has `allow_origins=["*"]`, should work. If not, check ports.
- **Slow inference (~15-20s)?** Normal — 3 Roboflow API calls per vehicle (vehicle → helmet → plate)
- **0 violations detected?** Check terminal logs — the pipeline logs every prediction with confidence

---

## Core Features (4 Modules)

### MODULE 1: DETECT
- Roboflow hosted 3-model pipeline (vehicle + helmet + plate)
- 8 violation types listed, **4 actually detectable** from single images:
  - ✅ Helmet Non-Compliance (helmet model)
  - ✅ Triple Riding (helmet model counts ≥3 riders)
  - ✅ Defective/Missing Plate (plate model + OCR)
  - ⚠️ Seatbelt Non-Compliance (scope cut — needs interior camera)
  - ❌ Wrong-Side / Stop-Line / Red-Light / Illegal Parking (need scene context)
- Helmet model runs on ALL vehicle crops (not just two-wheelers) because the Roboflow vehicle model returns generic "vehicle" class

### MODULE 2: IDENTIFY  
- EasyOCR for license plate text extraction
- Indian plate regex: `[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}`
- Plates that fail OCR → "UNREADABLE", no plate bbox → "UNDETECTED" (flagged as violation)

### MODULE 3: PREDICT
- Hotspot prediction module
- NOT working ML — shown as **Leaflet.js heatmap** with real BTP hotspot data
- Uses leaflet + leaflet.heat on CartoDB dark tiles
- 18 violation hotspots based on BTP's 64 accident black spots + ORR corridor data

### MODULE 4: COMMAND (Dashboard)
- React 19 + Vite + TanStack Router + TypeScript
- Pages: Command Center / Analyze / Evidence Log / Analytics / Fleet / Hotspots
- Dark command center aesthetic matching BTP ops center
- Session evidence state via `EvidenceProvider` + sessionStorage
- Recharts for violation breakdown charts
- Real Leaflet.js map with heatmap overlay on Command Center + Hotspots pages

---

## Tech Stack

### Backend
- Python 3.10+ (tested on 3.14)
- FastAPI + Uvicorn
- Roboflow serverless API (3 models: vehicle / helmet / plate)
- EasyOCR for plate text reading
- OpenCV (cv2), Pillow, numpy
- NO database (return JSON, frontend holds session state)
- NO auth (hackathon demo)

### Frontend
- React 19 + Vite + TanStack Router (in `sightline-command-main/`)
- Tailwind CSS v4 (dark theme)
- Recharts for charts
- Leaflet + leaflet.heat for heatmap
- TypeScript
- Session evidence state via `EvidenceProvider` + sessionStorage

---

## Project Structure

```
drishti/
├── drishti-backend/
│   ├── main.py                    # FastAPI app + routes
│   ├── pipeline/
│   │   ├── __init__.py
│   │   ├── preprocess.py 
│   │   ├── detect.py              # 3-model Roboflow pipeline
│   │   ├── ocr.py                 # EasyOCR plate reader
│   │   ├── annotate.py            # Draw boxes on images
│   │   └── evidence.py            # Build evidence JSON
│   ├── models/                    # Place drishti.pt here (unused — using Roboflow hosted)
│   ├── sample_images/             # Test images
│   ├── .env.example               # Template for API keys
│   ├── requirements.txt
│   └── README.md
│
├── sightline-command-main/        # Frontend dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── BengaluruHeatmap.tsx   # Leaflet heatmap component
│   │   │   ├── CityMap.tsx            # Old mock map (unused now)
│   │   │   └── ui-bits.tsx            # Shared UI components
│   │   ├── lib/
│   │   │   ├── api.ts                 # Backend API client
│   │   │   ├── evidenceStore.tsx       # Session evidence state
│   │   │   ├── analytics.ts           # Violation analytics helpers
│   │   │   └── mockData.ts            # Mock data for non-wired pages
│   │   ├── routes/
│   │   │   ├── index.tsx              # Command Center (home)
│   │   │   ├── analyze.tsx            # Image/video upload + analysis
│   │   │   ├── evidence.tsx           # Evidence log table
│   │   │   ├── analytics.tsx          # Violation charts
│   │   │   ├── fleet.tsx              # Fleet monitoring (mock data)
│   │   │   └── hotspots.tsx           # Hotspot heatmap
│   │   ├── styles.css                 # Global styles + Leaflet overrides
│   │   └── router.tsx
│   ├── .env.example
│   └── package.json
│
├── training/
│   ├── DRISHTI_YOLOv8_Training.ipynb  # YOLOv8 fine-tuning (Colab)
│   └── README.md
│
├── FRONTEND_INTEGRATION.md        # API contract doc
├── context.md                     # ← YOU ARE HERE
└── .gitignore
```

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Returns `{"status": "ok", "model": "roboflow-3model", "mode": "PRODUCTION"}` |
| GET | `/violations/types` | List of 8 violation type objects |
| POST | `/analyze/image` | Upload image → get detections + annotated image (base64) |
| POST | `/analyze/video` | Upload video (max 30s) → frame-by-frame analysis |
| POST | `/debug/image` | Raw Roboflow predictions (no processing) — **remove before demo** |
| GET | `/debug/models` | Smoke-test all 3 models — **remove before demo** |

---

## Design System

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
Monospace:      JetBrains Mono
```

---

## Key Business Context (for pitch)

- BTP has 9,000+ CCTV cameras but analysis is manual
- ASTraM monitors congestion every 15 min — no prediction layer
- BATCS adaptive signals cover only 165/500 junctions
- 1.46 lakh delivery executive violations in Bengaluru 2023-2025
- 64 accident black spots formally identified by BTP
- East Bengaluru (Whitefield, KR Puram, Indiranagar) = Flipkart's primary zone
- Flipkart judges: frame fleet intelligence angle
- BTP judges: frame as augmenting their existing work
- Legal: MAEP (multi-angle evidence) stronger under Section 136A, MV Amendment Act 2019

---

## Current State (June 19, 2026)

### ✅ Completed
- [x] Backend: FastAPI + all pipeline files (detect, ocr, annotate, evidence)
- [x] Backend: Roboflow 3-model hosted inference (vehicle + helmet + plate)
- [x] Backend: Helmet check runs on ALL vehicles (fixed generic "vehicle" class bug)
- [x] Backend: Defective/Missing Plate violation detection
- [x] Backend: Debug routes (`/debug/image`, `/debug/models`)
- [x] Backend: Granular error handling + diagnostic logging
- [x] Frontend: Full dashboard scaffold (6 pages)
- [x] Frontend: Analyze page wired to backend (image + video upload)
- [x] Frontend: Evidence Log wired to session store
- [x] Frontend: Analytics wired to live violation breakdown
- [x] Frontend: Real Leaflet.js heatmap on Command Center + Hotspots
- [x] Frontend: Dynamic loading of Leaflet in browser to fix SSR `window is not defined` crash
- [x] Frontend: Wired `/debug/models` to real-time status cards on System Status page
- [x] Frontend: api.ts + evidenceStore + types
- [x] Integration: Frontend ↔ Backend fully wired
- [x] Model: Colab training notebook created

### ⚠️ Before Demo Day (June 21)
- [ ] Raise confidence thresholds back in `detect.py` (currently lowered for testing)
- [ ] Remove `/debug/image` and `/debug/models` routes from `main.py`
- [ ] Test end-to-end with real Bengaluru traffic images
- [ ] Delete `CityMap.tsx` (replaced by `BengaluruHeatmap.tsx`)
- [ ] Prepare 3-5 sample images for live demo

### Known Issues
- Inference is slow (~15-20s per image) — 3 sequential Roboflow API calls per vehicle
- Confidence thresholds are currently LOWERED for testing (see detect.py)
- Fleet page uses mock data (not wired to backend)
- 5 out of 8 violation types require scene context and always show 0

---

## What NOT to Build (Scope Cuts)

- ❌ Real-time RTSP stream processing (demo uses image/video upload)
- ❌ Actual Parivahan/Vahan API integration
- ❌ Seatbelt detection (needs interior camera angle)
- ❌ Authentication / user management
- ❌ Database / persistent storage
- ❌ Docker / deployment config
- ❌ Mobile responsive design (desktop command dashboard only)

---

## Demo Flow for Judges

1. Open dashboard → Command Center with live Bengaluru heatmap
2. Navigate to **Analyze** → upload Bengaluru traffic image
3. Click ANALYZE → spinner → annotated image with red violation boxes
4. See violation badges: "⚠ Helmet Non-Compliance 87%" etc.
5. Click "SAVE TO LOG" → appears in Evidence Log
6. Switch to **Evidence Log** → table entry → click VIEW → modal with full JSON
7. Switch to **Analytics** → bar chart of violations, stat cards
8. Switch to **Hotspots** → Leaflet heatmap with BTP hotspot data
9. Switch to **System Status** → check live connectivity checks of individual Roboflow models (Vehicle, Helmet, Plate)
10. (Optional) Upload a short video clip → show frame-by-frame timeline

---

## Important File Locations

| What | Where |
|------|-------|
| Backend code | `drishti-backend/` |
| Frontend code | `sightline-command-main/` |
| Backend secrets | `drishti-backend/.env` (gitignored) |
| Frontend env | `sightline-command-main/.env` |
| API contract | `FRONTEND_INTEGRATION.md` |
| Wiring spec | `DRISHTI wiring endpoints.docx` |
| Training notebook | `training/DRISHTI_YOLOv8_Training.ipynb` |
| Sample images | `drishti-backend/sample_images/` |
| GitHub | https://github.com/debug-create/flip_BS |
| Backend URL | http://localhost:8000 |
| Frontend URL | http://localhost:8081 |

---

## Session Changelog

### Session 1: June 18, 2026 — Late Night
- Added diagnostic logging to `detect.py` (raw API responses, per-prediction logs)
- Added granular error handling (Timeout, ConnectionError, HTTPError)
- Lowered confidence thresholds for testing (0.35→0.15, 0.40→0.20)
- Added `/debug/image` and `/debug/models` routes

### Session 2: June 18-19, 2026 — Overnight  
- **Fixed critical bug:** Roboflow vehicle model returns generic "vehicle" class, not "motorcycle" — helmet check was never running. Fixed by running helmet model on ALL vehicle crops.
- Added Defective/Missing Plate violation detection in `main.py`
- Frontend fully wired to backend (Analyze, Evidence, Analytics, Health)

### Session 3: June 19, 2026 — Evening
- Replaced mock SVG CityMap with real Leaflet.js heatmap (`BengaluruHeatmap.tsx`)
- Installed leaflet + leaflet.heat + @types/leaflet
- CartoDB dark tiles, 18 BTP hotspot points, zone labels, ORR corridor line
- Updated Command Center (index.tsx) and Hotspots (hotspots.tsx) pages
- Added Leaflet CSS overrides to styles.css

### Session 4: June 19, 2026 — Night (Latest Updates)
- Fixed Leaflet SSR crash: wrapped Leaflet module imports dynamically inside `useEffect` in `BengaluruHeatmap.tsx` to prevent `window is not defined` crashes.
- Wired `/debug/models` endpoint: added `getDebugModels` in `api.ts`, updated `types.ts`, and completely rebuilt the `System Status` page (`system.tsx`) to show real-time connectivity status for the three Roboflow models (Vehicle, Helmet, and Plate) individually.
- Resolved Python dependency loading mismatch: identified that the system had multiple Python environments (3.13 and 3.14). Forced backend startup under Python 3.14 to utilize installed ML packages (`cv2`, `easyocr`).

---
*Last updated: June 19, 2026 — 11:25 PM IST*
*Next: test with real images → raise thresholds → prep for demo*