# DRISHTI Backend

FastAPI inference service for **DRISHTI** — a traffic violation detection system built for Bengaluru Traffic Police (Flipkart Gridlock Hackathon 2.0). Accepts images or short video clips, runs YOLOv8 detection + PaddleOCR plate reading, and returns structured JSON evidence for the React dashboard.

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

> **Note:** First startup downloads `yolov8n.pt` (~6 MB) and initializes PaddleOCR models. This can take a few minutes on CPU.

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

## DEMO MODE

Without fine-tuned weights, the backend uses COCO `yolov8n.pt` plus a **mock violation overlay** (helmet, triple riding, stop-line) so the demo looks realistic. Replace with trained weights:

1. Train YOLOv8 on Roboflow/Kaggle
2. Download `best.pt`
3. Save as `models/drishti.pt`
4. Restart the server

## Frontend Integration

See **`../FRONTEND_INTEGRATION.md`** in the project root — share this with the frontend developer for the full API contract, CORS setup, and example `fetch` calls.

## Project Layout

```
drishti-backend/
├── main.py              # FastAPI routes
├── pipeline/
│   ├── preprocess.py    # CLAHE + letterbox
│   ├── detect.py        # YOLOv8 + mock violations
│   ├── ocr.py           # PaddleOCR plates
│   ├── annotate.py      # Draw boxes/labels
│   └── evidence.py      # JSON evidence builder
├── models/              # Place drishti.pt here
└── sample_images/       # Test images
```
