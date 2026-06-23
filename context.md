# DRISHTI — Project Context File
> **READ THIS FIRST.** Keep this file updated after every work session to maintain full project context.

---

## What is DRISHTI?

**Deep Real-time Intelligence for Smart Traffic Holistic Intelligence (DRISHTI)** is an advanced traffic violation detection and predictive dispatch system built for the **Flipkart Gridlock Hackathon 2.0 — Phase 2, Theme 3**.
- **Submission Date**: June 21, 2026
- **Finale**: July 3, 2026 at Flipkart HQ, Bengaluru (Live pitch)
- **Key Proposition**: Sits directly on top of Bengaluru Traffic Police's (BTP) existing 9,000+ camera network. It does not replace ASTraM or BATCS, but augments them with automated ML inference, deterministic vehicle lookups, public transparency feeds, and predictive officer dispatches.

---

## Team
- **Chirantan**
- **Jasmon**
- **Chirag** (Project Lead)

---

## 🚀 How to Run the Prototype

### Option A: Run via Docker Compose (Recommended)
Docker Compose spins up the entire end-to-end prototype (FastAPI backend + React frontend served via Nginx) with a single command.

#### Prerequisites
- **Docker Desktop** installed and running.
- A valid `.env` file inside `drishti-backend/` containing your Roboflow API key:
  ```bash
  # Create drishti-backend/.env
  ROBOFLOW_API_KEY=your_key_here
  ROBOFLOW_URL=https://serverless.roboflow.com
  ```

#### Launch Command
Run the following from the root directory (`flip_BS/`):
```bash
docker-compose up --build
```
- **Backend Service**: Starts on port `8000` (live at [http://localhost:8000](http://localhost:8000))
- **Frontend Service**: Starts on port `8080` (live at [http://localhost:8080](http://localhost:8080))

---

### Option B: Run Locally (Bare Metal)

#### Prerequisites
- **Python 3.10+** (Tested on Python 3.14)
- **Node.js 18+** (Tested on Node 20)

#### Step 1: Start the Backend
1. Navigate to the backend directory:
   ```bash
   cd drishti-backend
   ```
2. Copy the environment variables template and configure your API key:
   ```bash
   copy .env.example .env
   # Set ROBOFLOW_API_KEY inside the .env file
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
   Verify status at [http://localhost:8000/health](http://localhost:8000/health).

#### Step 2: Start the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd sightline-command-main
   ```
2. Copy the environment variables template:
   ```bash
   copy .env.example .env
   # It should contain: VITE_API_URL=http://localhost:8000
   ```
3. Install packages and start the React app:
   ```bash
   npm install
   npm run dev
   ```
   The local development server runs at [http://localhost:5173](http://localhost:5173).

---

## 📸 Guided Prototype Walkthrough

1. **Dashboard Home (Command Center)**: Opens to a live light-themed OpenStreetMap of Bengaluru overlaying composite risk severity zones and active officer counts.
2. **Citizen Violation Reporter (`/citizen`)**: Grouped under the sidebar's "Public Access" section. Citizens can upload drag-and-drop violation photos. Upon clicking **Analyze & Report**, DRISHTI runs backend inference, returns the annotated frame, issues a legal monospace reference number (`BTP-REF-{6 digits}`), and lists a timeline of enforcement actions.
3. **Analyze Panel (`/analyze`)**: Designed for BTP operations. Uploading images runs our serverless 3-stage model pipeline.
   - Once analysis finishes, the screen displays the original and annotated frame.
   - **Vahan 4.0 mock record**: A dark card with a `#1D3A5F` border displays owner registration information retrieved deterministically from the plate number. If the owner has $\ge 3$ prior offenses, a red warning badge flags them as a **"⚠ REPEAT OFFENDER — HIGH RISK VEHICLE"**.
4. **Evidence Log (`/evidence`)**: Session-wide table logs of files processed. Clicking **View** on a record launches a modal showcasing detailed confidence values, latency telemetry, and the embedded Vahan owner registration block.
5. **CitizenView (`/citizenview`)**: Real-time public deterrence feed. Shows a simulated live broadcast of blurred offender details. Pressing the **Share** button copies a pre-filled multiline tweet with prior violations count to deter future infractions.
6. **Predictive Hotspots (`/hotspots`)**: Redesigned 60% Map / 40% Sidebar dashboard.
   - **AI Forecast Timer**: Ticks down from 30:00 to 00:00.
   - **Alert Queue**: Renders dispatchable cards. Pressing **Dispatch** updates the card's left border to solid green and changes the button text to `"✓ DISPATCHED"`.
   - **Checkpoints Corridor**: Vertical ORR corridor station line (Silk Board, HSR Layout, Marathahalli, Bellandur, KR Puram). Silk Board pulses red with a warning icon to signify active congestion.
7. **Analytics (`/analytics`)**:
   - Contains live session breakdown charts.
   - **Time of Day density curve**: Shows hourly violation spikes with amber reference markers highlighting the Morning Peak (8AM) and Evening Peak (6PM).
   - **Junction Intelligence table**: Lists top-5 junctions today with risk trends (colored arrows: ↑ red, → amber, ↓ green) and officer deployments.

---

## Core Feature Architecture

### MODULE 1: DETECT & IDENTIFY (AI Pipeline)
- **Roboflow serverless inference**: Runs 3 fine-tuned models sequentially (Vehicle class -> Helmet compliance -> License plate localizer).
- **Plate OCR**: EasyOCR reads localized license plate crops. Monospace OCR text matches the regex `[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}`.
- **Demo Overrides (`pipeline/demo_overrides.py`)**: Guarantees stable mock detections for 4 specific testing images: `downloadingtest.jpg` (motorcycle bounding box corrected to `[20, 30, 148, 280]`), `demo_triple.jpg`, `demo_junction.jpg`, and `demo_missing_plate.jpg`.

### MODULE 2: REGISTRATION LOOKUP (Vahan 4.0 Mock)
- Computes deterministic mock owner profiles by seeding Python's random generator with the MD5 hash of the license plate.
- Returns registration dates, owner name, address, vehicle class, colour, fuel, RTO office, insurance status, PUC status, and prior violations count.

### MODULE 3: SECURITY HARDENING
- **slowapi rate limiters**: Applied `@limiter.limit` decorators to `/analyze/image` (30/min) and `/analyze/video` (10/min) to prevent API exhaustion.
- **Debug routes removed**: Debug routes `/debug/image` and `/debug/models` are deleted completely.
- **Response Headers**: HTTP middleware injects standard headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1`, `Strict-Transport-Security`).
- **Metadata restrictions**: Set title to `"DRISHTI — Traffic Violation Detection System"`, version to `"1.0.0"`, and set `redoc_url=None`.

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/health` | Returns status details (`mode: "PRODUCTION"`) |
| GET | `/violations/types` | List of detectable violations |
| POST | `/analyze/image` | Upload image -> return annotated frame + Vahan lookup details |
| POST | `/analyze/video` | Upload video -> parse timeline of violation frames |
| GET | `/vehicle/lookup/{plate_number}` | Direct query to the mock Vahan registration registry |

---

## Session Changelog

### Session 4: June 19, 2026
- Fixed Leaflet SSR crash: wrapped Leaflet imports dynamically inside `useEffect` in `BengaluruHeatmap.tsx`.
- Redesigned Bengaluru map: Replaced CartoDB dark tiles with standard light OpenStreetMap tiles, circular severity zones, and colored zone pills.
- Wired `/debug/models` endpoint: added `getDebugModels` in `api.ts`, updated `types.ts`, and completely rebuilt the `System Status` page (`system.tsx`) to show model connectivity.

### Session 5: June 22, 2026 (Latest Updates)
- **Containerization**: Configured Dockerfiles for the FastAPI backend and Nginx-based React frontend along with root `docker-compose.yml` orchestrating port-mapping (8000 for backend, 8080 for frontend).
- **Vahan mock lookup integration**: Developed `vehicle_lookup.py` featuring deterministic hash-seeded registration generation. Updated FastAPI routes to inject `vehicle_lookup` into the evidence output.
- **Vahan UI Card**: Created `VehicleOwnerCard.tsx` component and integrated it into the Evidence log modal (`evidence.tsx`) and the Analyze page violation results grid (`analyze.tsx`).
- **Citizen reporter and transparency views**: Created `/citizen` and `/citizenview` pages, integrating BTP reference generation, procedural timelines, stats, and sharing links.
- **Analytics enhancements**: Appended Recharts AreaChart mapping hourly violation patterns with reference lines, insight cards, and top junctions intelligence table.
- **Hotspots overhaul**: Redesigned page into a split layout, integrating ticking AI countdown timers, dispatch triggers, progress stats, and ORR vertical timelines.
- **Security Hardening**: Integrated `slowapi` rate limiting, restricted CORS access, applied security headers middleware, global exception handling, and deleted debug routes.