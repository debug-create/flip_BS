# Model Weights

Place trained YOLOv8 weights here:

- **Production:** `drishti.pt` (rename from Roboflow/Kaggle `best.pt`)
- **Fallback demo:** `yolov8n.pt` (auto-downloaded by Ultralytics if missing)

The backend prefers `drishti.pt` when present; otherwise it uses the COCO-pretrained nano model with DEMO MODE mock violation overlay.
