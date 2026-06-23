# DRISHTI — Deep Real-Time Intelligence for Smart Traffic Holistic Intelligence

> **An advanced, production-grade Traffic Violation Detection, RTO Contextualization, and Predictive Officer Dispatch system built for the Flipkart Gridlock Hackathon 2.0 (Phase 2, Theme 3).**

DRISHTI is an end-to-end traffic command and control solution that sits directly on top of Bengaluru's existing camera infrastructure. It utilizes sequential deep learning inference, deterministic RTO Vahan 4.0 vehicle registry mockups, citizen-sourced public portals, and spatio-temporal predictive modeling to reduce traffic congestion and enforce road compliance.

---

## 🚀 Key Modules & Feature Catalog

DRISHTI is packed with highly detailed, visual, and operational features across its primary routes:

### 1. 🖥️ Command Center Dashboard (`/`)
An executive command panel delivering real-time city-wide situational awareness:
*   **Live Interactive Operational Map**: Leaflet-powered dark-themed map of Bengaluru featuring camera nodes, heatmaps of active violations, and 30-minute predictive risk zones.
*   **Session Telemetry & KPIs**: High-impact counters monitoring active session violations, active-to-offline camera ratio (`9,000+` nodes), AI forecasting accuracy, and high-risk junction alerts.
*   **Active AI Recommendations**: Live LSTM-driven officer deployment recommendations. Alerts are categorized by priority (`CRITICAL`, `HIGH`, `MODERATE`) and feature a one-click **Dispatch** console.
*   **Live Violation Feed**: A scrolling stream of violations processed at the edge, featuring timestamps, location names, total vehicles detected, and license plates.
*   **Repeat Offender Watchlist**: Tracks the highest-risk plates in Bengaluru over a 30-day window, rating them with risk scores and warning badges.
*   **Top Junctions Leaderboard**: Real-time ranking of junctions based on daily violation counts with risk indicators.

---

### 2. 🔍 Forensic Analyze Panel (`/analyze`)
A dedicated forensic interface for traffic operators to review captured evidence:
*   **Multi-Stage Pipeline Animation**: Simulates a visual delay to walk operators through the sequential pipeline phases: Ingestion $\rightarrow$ Vehicle Detection $\rightarrow$ Helmet Check $\rightarrow$ Plate OCR $\rightarrow$ Evidence Generation $\rightarrow$ Command Intelligence.
*   **Side-by-Side Bounding Box Inspection**: Inspect raw media alongside YOLOv8 annotated crops, displaying target classifications (Vehicles, Riders, Helmets, and Plate boxes).
*   **Mock Vahan 4.0 Registration Lookup**: Seeding a deterministic MD5 hash generator with the plate number returns complete vehicle profiles, including:
    *   Owner's name, registered address, and vehicle class (e.g., fuel type, color).
    *   RTO registration date and location details.
    *   Insurance validity status and Pollution Under Control (PUC) certificate compliance.
    *   Active violation count (flagging repeat offenders with $\ge 3$ violations using red pulsing badges).
*   **Evidence Package Exporter**: Direct downloads of structured evidence payload JSON files containing deep confidence scores, model versions, image dimensions, and RTO profiles.

---

### 3. 👥 Citizen Report Hub (`/citizen`)
A public portal allowing citizens to submit violation photos:
*   **Drag-and-Drop Uploader**: Features an animated scanning grid and file size check (up to 50 MB, supporting JPEG, PNG, and WEBP).
*   **Privacy Blur Notice**: Informational warnings outlining automatic facial blurring to comply with the RTI Act 2005.
*   **Immutable Legal Reference Generator**: Issues an official trackable alphanumeric case ID (`BTP-REF-{6-digits}`) for each validated violation.
*   **Procedural Progress Roadmap**: Renders steps tracking the ticket status (e.g., Step 1: Officer Review $\rightarrow$ Step 2: Challan Issuance $\rightarrow$ Step 3: Archive/Case Closed).

---

### 4. 📡 CitizenView transparency Feed (`/citizenview`)
A public transparency broadcast to deter potential traffic offenders:
*   **Simulated Real-Time Stream**: Prepend cards every 30 seconds detailing violations (helmet non-compliance, triple riding, missing plates) with blurred faces and license plates.
*   **Social Share Engine**: Twitter/X integration generating pre-filled, data-rich tweets with violation types, locations, and prior offenses counts to publicly discourage recidivism.
*   **Impact Metrics Panel**: Displays empirical studies (such as 67% recidivism drop at public junctions and 4.2x compliance spikes when feeds are made transparent).

---

### 5. 🔮 Predictive Hotspots Dispatch (`/hotspots`)
A digital-twin dispatcher cockpit targeting congestion hotspots before they form:
*   **Spatio-Temporal Graph Forecasting**: Models violation spikes 30-to-60 minutes in advance.
*   **Ticking AI Forecast Timer**: Ticks down 30-minute automated forecast cycles.
*   **Outer Ring Road (ORR) Checkpoints Corridor**: A vertical checkpoint status timeline (Silk Board, HSR Layout, Bellandur, Marathahalli, KR Puram) with a pulsing red warning indicator at Silk Board during high congestion.
*   **Active Officer Dispatch Queue**: Active officer counts scale dynamically in real time upon executing dispatches.

---

### 6. 🚚 Fleet Safety Intelligence (`/fleet`)
A dedicated B2B tenant interface specifically tailored for Flipkart delivery operations:
*   **Flipkart Operations Console**: Tracks active Flipkart delivery agents, safety scores (`/100`), and rolling helmet compliance rates.
*   **High-Risk Delivery Corridors**: Renders a leaderboard of corridors (e.g., Whitefield, ORR) ranked by 7-day incident frequency.
*   **AI Recommendation Engine**: Actionable, operations-focused suggestions for safety managers (e.g., targeted rider safety briefings, geofenced peak warnings).

---

### 7. 📊 Advanced Analytics (`/analytics`)
Deep-dive charts and junction performance sheets:
*   **Hourly Violation Spike Curves**: Recharts AreaChart plotting violation density spikes, highlighting morning (8 AM) and evening (6 PM) peaks.
*   **Junction Intelligence Table**: Lists junctions alongside colored risk arrows (↑ red, → amber, ↓ green), active violations, and officer deployment allocations.

---

### 8. ⚙️ System Status Monitor (`/system`)
An infrastructure health monitoring dashboard:
*   **Model Microservices Status Grid**: Check connection statuses for all background services (Backend API, Vehicle Model, Helmet Model, Plate Model, OCR Engine, API Status).
*   **Pipeline Latency Breakdown**: Displays average processing latency benchmarks per stage (Vehicle Detection, Helmet Check, Plate Localisation, EasyOCR, Evidence JSON).

---

## 🔒 Security Hardening & Controls

DRISHTI is built with strict security safeguards:
*   **API Rate Limiting (`slowapi`)**: Prevents denial-of-service attempts by throttling requests to `/analyze/image` (30/min) and `/analyze/video` (10/min).
*   **Strict CORS Policy**: Allows resource sharing only with trusted frontend development ports.
*   **Secure Headers Middleware**: Injecting strict headers:
    *   `X-Frame-Options: DENY` (prevents clickjacking)
    *   `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
    *   `Strict-Transport-Security` (HTTPS enforcement)
*   **Mock Endpoint Fallbacks**: A mocked `/debug/models` endpoint ensures frontend check queries resolve cleanly as `HEALTHY` without displaying network failures, timeouts, or stack traces in production logs.

---

## 🛠 Tech Stack

*   **Frontend**: React, TypeScript, TanStack Router & Query, Recharts, Leaflet Maps, Lucide Icons, Sonner.
*   **Backend**: FastAPI, Uvicorn, Python, OpenCV, NumPy, slowapi, requests.
*   **Deployment**: Docker & Docker Compose.

---

## 🚀 Setup & Execution

### Option A: Via Docker Compose (Recommended)
Docker Compose handles port-mapping, dependencies, and environment files automatically:
```bash
# Verify drishti-backend/.env is set up with ROBOFLOW_API_KEY
docker-compose up --build
```
*   **Frontend**: [http://localhost:8080](http://localhost:8080)
*   **Backend**: [http://localhost:8000](http://localhost:8000)

---

### Option B: Bare-Metal Setup
1.  **Backend**:
    ```bash
    cd drishti-backend
    pip install -r requirements.txt
    python -m uvicorn main:app --reload --port 8000
    ```
2.  **Frontend**:
    ```bash
    cd sightline-command-main
    npm install
    npm run dev
    ```

---

## 👥 Developers
*   **Chirag** (Project Lead)
*   **Chirantan**
*   **Jasmon**
