DRISHTI — Deep Real-time Intelligence for Smart Traffic Holistic Intelligence

<div align="center">

AI-Powered Traffic Violation Intelligence Platform

Gridlock Hackathon 2.0 — Phase 2 (PS3)

Built for Bengaluru Traffic Police (BTP) and Smart City Traffic Operations

Team: Jasmon • Chirantan • Chirag

</div>

⸻

Overview

DRISHTI (दृष्टि — Vision) is an AI-powered traffic violation intelligence platform designed to augment existing traffic surveillance infrastructure and transform passive camera networks into an intelligent, predictive enforcement system.

Unlike traditional Automated Number Plate Recognition (ANPR) solutions that focus solely on detection and challan generation, DRISHTI introduces an intelligence layer that enables:

* Automated traffic violation detection
* Multi-angle evidence generation
* License plate recognition
* Repeat offender identification
* Violation hotspot prediction
* Fleet-level safety analytics
* Officer deployment recommendations

The platform is designed to work on top of existing Bengaluru Traffic Police infrastructure without requiring new field hardware.

⸻

Problem Statement

Modern cities generate millions of traffic images through CCTV and automated monitoring systems.

Current challenges include:

* Manual inspection of traffic evidence
* High enforcement workload
* Poor detection of damaged or non-standard license plates
* Limited predictive capabilities
* Weak analytical insights
* Reactive officer deployment
* Lack of fleet-level safety intelligence

Although Bengaluru Traffic Police already uses ANPR and e-challan systems, significant intelligence gaps remain.

DRISHTI addresses these gaps through AI-powered computer vision and predictive analytics.

⸻

Key Features

1. Traffic Violation Detection

Automatically identifies:

* Helmet Non-Compliance
* Seatbelt Non-Compliance
* Triple Riding
* Wrong-Side Driving
* Stop-Line Violation
* Red-Light Running
* Illegal Parking
* Defective/Missing Plate

⸻

2. License Plate Recognition

Uses:

* PaddleOCR
* Indian Plate Regex Validation
* OCR Confidence Scoring

Future roadmap includes:

* Super-Resolution OCR
* Multi-camera plate reconstruction
* Kannada plate support

⸻

3. Multi-Angle Evidence Package (MAEP)

DRISHTI’s flagship innovation.

Instead of relying on a single image:

Camera A
Camera B
Camera C
Camera D
      ↓
Evidence Fusion
      ↓
360° Evidence Package

Benefits:

* Better legal defensibility
* Improved OCR accuracy
* Lower false positives
* Enhanced violation verification

⸻

4. Violation Intelligence Engine

Generates:

* Violation heatmaps
* Time-based trends
* Junction risk scores
* Compliance analytics
* Repeat offender insights

⸻

5. Hotspot Prediction

Inspired by demand forecasting systems used by modern logistics platforms.

Predicts:

* Violation-prone junctions
* High-risk time windows
* Future enforcement hotspots

Output:

* Officer deployment recommendations
* Junction risk forecasts
* AI-generated operational insights

⸻

6. Fleet Intelligence

Designed for enterprise fleets such as:

* Flipkart
* Swiggy
* Zomato

Provides:

* Fleet Safety Scores
* High-Risk Route Detection
* Zone-Based Violation Analysis
* Rider Compliance Trends

⸻

System Architecture

Traffic Images / Videos
            │
            ▼
     Image Preprocessing
            │
            ▼
      YOLO Detection
            │
            ▼
   Violation Classification
            │
            ▼
    License Plate OCR
            │
            ▼
 Evidence Package Generation
            │
            ▼
     Intelligence Engine
            │
            ├────────► Analytics
            ├────────► Fleet Intelligence
            ├────────► Repeat Offenders
            └────────► Hotspot Prediction

⸻

Technology Stack

Frontend

* React 18
* Vite
* Tailwind CSS
* Recharts
* Lucide Icons

Backend

* Python
* FastAPI
* Uvicorn
* OpenCV
* Ultralytics YOLOv8
* PaddleOCR
* NumPy
* Pillow

AI / ML

* YOLOv8
* PaddleOCR
* LightGBM (planned hotspot prediction)
* DeepSORT (future tracking)

⸻

Dashboard Modules

Command Center

Real-time operational overview including:

* Violations detected
* Active cameras
* AI recommendations
* Repeat offender watchlist
* Bengaluru traffic intelligence map

⸻

Analyze

Upload and process:

* Images
* Videos

Generate:

* Annotated evidence
* OCR results
* Violation summaries

⸻

Evidence Log

Searchable repository of:

* Violation records
* OCR results
* Evidence packages
* Metadata

⸻

Analytics

Interactive insights including:

* Violation breakdown
* Hourly trends
* Dangerous junctions
* Compliance patterns

⸻

Fleet Intelligence

Enterprise safety analytics:

* Fleet Safety Score
* Delivery Risk Zones
* Route Intelligence
* Compliance Tracking

⸻

Hotspot Prediction

Predictive policing and enforcement support:

* Junction Risk Forecasting
* Officer Deployment Suggestions
* Violation Surge Detection

⸻

System Status

Operational monitoring:

* Backend Health
* Model Status
* Camera Connectivity
* OCR Engine Status
* API Health

⸻

API Endpoints

Health Check

GET /health

⸻

Violation Types

GET /violations/types

⸻

Analyze Image

POST /analyze/image

Input:

file

⸻

Analyze Video

POST /analyze/video

Input:

file

⸻

Project Structure

drishti/
│
├── drishti-backend/
│
├── drishti-frontend/
│
├── training/
│
├── context.md
│
├── FRONTEND_INTEGRATION.md
│
└── README.md

⸻

Future Roadmap

Phase 1

* Traffic image analysis
* OCR integration
* Evidence generation
* Command center dashboard

Phase 2

* Multi-Angle Evidence Package (MAEP)
* Enhanced OCR
* Repeat offender intelligence
* Fleet analytics

Phase 3

* Live RTSP camera integration
* Hotspot prediction engine
* Officer deployment optimization
* Smart city integrations

⸻

Impact

DRISHTI transforms traffic enforcement from:

Violation Occurs
        ↓
Officer Reacts

to:

Violation Predicted
        ↓
Officer Deployed
        ↓
Violation Prevented

The goal is not to generate more challans.

The goal is to create safer roads through intelligent, proactive traffic management.

⸻

Team

Jasmon Chowdhury
Chirantan
Chirag

Gridlock Hackathon 2.0 — Phase 2 (PS3)

“Turning passive cameras into an active, self-improving traffic intelligence network.”
