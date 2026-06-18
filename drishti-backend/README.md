# DRISHTI Backend

FastAPI inference service for **DRISHTI** — a traffic violation detection system built for Bengaluru Traffic Police (Flipkart Gridlock Hackathon 2.0). Accepts images or short video clips, runs a **Roboflow 3-model pipeline** (vehicle + helmet + plate) with **EasyOCR** plate reading, and returns structured JSON evidence for the React dashboard.

## Install

```bash
cd drishti-backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create your local environment file (required for Roboflow API):

```bash
# Windows
copy .env.example .env
# Then edit .env and paste your Roboflow API key

# macOS/Linux
cp .env.example .env
```

Get a free API key at https://app.roboflow.com/settings/api

> **Note:** `.env` is gitignored — never commit API keys.

> **Note:** First startup initializes EasyOCR models. Each analysis calls Roboflow hosted inference (requires internet).

## Run

```bash
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Test

Health check:

```bash
curl http://localhost:8000/health
```

Analyze an image:

```bash
curl -X POST http://localhost:8000/analyze/image \
  -F "file=@sample_images/your_image.jpg"
```

Violation types:

```bash
curl http://localhost:8000/violations/types
```

## Detection Pipeline

1. **Vehicle model** — full-frame vehicle detection
2. **Helmet model** — helmet/triple-riding check on two-wheeler crops
3. **Plate model** — license plate localization per vehicle
4. **EasyOCR** — Indian plate text extraction on plate crop

Roboflow models are called via HTTP (`requests`). On Python 3.14, `inference-sdk` is not available, so the backend uses direct API calls to `https://serverless.roboflow.com`.

## Frontend Integration

See **`../FRONTEND_INTEGRATION.md`** in the project root — share this with the frontend developer for the full API contract, CORS setup, and example `fetch` calls.

## Project Layout

```
drishti-backend/
├── main.py              # FastAPI routes
├── pipeline/
│   ├── preprocess.py    # CLAHE + letterbox
│   ├── detect.py        # Roboflow 3-model pipeline
│   ├── ocr.py           # EasyOCR plates
│   ├── annotate.py      # Draw boxes/labels
│   └── evidence.py      # JSON evidence builder
├── models/              # (optional legacy local weights)
└── sample_images/       # Test images
```
