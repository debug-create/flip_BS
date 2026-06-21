import os
import time
import logging

import cv2
import numpy as np
import requests

logger = logging.getLogger(__name__)

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")
ROBOFLOW_URL = os.getenv("ROBOFLOW_URL", "https://serverless.roboflow.com")

HELMET_MODEL = "helmet-model-omssm/2"
VEHICLE_MODEL = "vehicle-detection-3mmwj/8"
PLATE_MODEL = "license-plate-recognition-rxg4e/11"

TWO_WHEELER_CLASSES = {
    "motorcycle", "bike", "motorbike", "bicycle",
    "two-wheeler", "scooter", "moto", "motor",
}

VEHICLE_CLASSES = {
    "motorcycle", "bike", "motorbike", "bicycle", "scooter",
    "car", "bus", "truck", "van", "auto", "vehicle",
}

VIOLATION_TYPES = [
    "Helmet Non-Compliance",
    "Seatbelt Non-Compliance",
    "Triple Riding",
    "Wrong-Side Driving",
    "Stop-Line Violation",
    "Red-Light Running",
    "Illegal Parking",
    "Defective/Missing Plate",
]


class ViolationDetector:
    model_version = "Roboflow-3Model"

    def __init__(self):
        if not ROBOFLOW_API_KEY:
            raise ValueError(
                "ROBOFLOW_API_KEY is not set. "
                "Copy drishti-backend/.env.example to .env and add your Roboflow API key."
            )
        self.session = requests.Session()
        logger.info(
            "DRISHTI ViolationDetector ready. "
            "Models: vehicle=%s, helmet=%s, plate=%s",
            VEHICLE_MODEL, HELMET_MODEL, PLATE_MODEL,
        )

    def _call_roboflow(self, image: np.ndarray, model_id: str) -> list:
        """
        Send a numpy BGR image to Roboflow hosted inference via HTTP.
        Returns list of prediction dicts, or [] on any failure.
        """
        try:
            ok, buffer = cv2.imencode(".jpg", image)
            if not ok:
                logger.error(f"Roboflow [{model_id}]: cv2.imencode failed")
                return []

            img_h, img_w = image.shape[:2]
            logger.info(f"Roboflow [{model_id}] sending image {img_w}x{img_h} ({len(buffer)} bytes)")

            response = self.session.post(
                f"{ROBOFLOW_URL}/{model_id}",
                params={"api_key": ROBOFLOW_API_KEY},
                files={"file": ("image.jpg", buffer.tobytes(), "image/jpeg")},
                timeout=60,
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Roboflow [{model_id}] raw response keys: {list(result.keys())}")
            predictions = result.get("predictions", [])
            logger.info(f"Roboflow [{model_id}] returned {len(predictions)} predictions")
            return predictions
        except requests.exceptions.Timeout:
            logger.error(f"Roboflow API timeout [{model_id}]: request exceeded 60s")
            return []
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Roboflow API connection error [{model_id}]: {e}")
            return []
        except requests.exceptions.HTTPError:
            logger.error(f"Roboflow API HTTP error [{model_id}]: status={response.status_code}, body={response.text[:500]}")
            return []
        except Exception as e:
            logger.error(f"Roboflow API unexpected error [{model_id}]: {type(e).__name__}: {e}")
            return []

    @staticmethod
    def _pred_to_xyxy(pred: dict, img_w: int = 99999,
                      img_h: int = 99999) -> list[float]:
        """
        Convert Roboflow center-format prediction to [x1,y1,x2,y2].
        Roboflow returns: x=cx, y=cy, width=w, height=h
        Coordinates are clamped to [0, img_w) x [0, img_h).
        """
        cx = pred.get("x", 0)
        cy = pred.get("y", 0)
        bw = pred.get("width", 0)
        bh = pred.get("height", 0)
        x1 = max(0, cx - bw / 2)
        y1 = max(0, cy - bh / 2)
        x2 = min(img_w, cx + bw / 2)
        y2 = min(img_h, cy + bh / 2)
        return [x1, y1, x2, y2]

    @staticmethod
    def _crop_with_padding(image: np.ndarray, bbox: list, pad: int = 20) -> tuple:
        """
        Crop image at bbox [x1,y1,x2,y2] with padding.
        Returns (crop, x1_padded, y1_padded) so bbox coords can be
        remapped back to full image space.
        """
        h, w = image.shape[:2]
        x1, y1, x2, y2 = [int(c) for c in bbox]
        x1p = max(0, x1 - pad)
        y1p = max(0, y1 - pad)
        x2p = min(w, x2 + pad)
        y2p = min(h, y2 + pad)
        return image[y1p:y2p, x1p:x2p], x1p, y1p

    def detect(self, image: np.ndarray) -> list[dict]:
        """
        3-stage detection pipeline:
          Stage 1 — Vehicle detection on full image
          Stage 2 — Helmet check on every two-wheeler crop
          Stage 3 — Plate localisation on every vehicle crop

        Args:
            image: numpy array in BGR uint8 (standard OpenCV format)

        Returns:
            List of detection dicts (see API contract in context.md)
        """
        start = time.perf_counter()
        detections = []
        det_id = 1

        vehicle_preds = self._call_roboflow(image, VEHICLE_MODEL)
        h, w = image.shape[:2]

        raw_vehicles = []
        for pred in vehicle_preds:
            conf = pred.get("confidence", 0)
            cls_name = pred.get("class", "unknown").lower()
            logger.info(f"Vehicle pred: class={cls_name}, conf={conf:.4f}, raw={pred}")
            if conf < 0.15:
                logger.info(f"  -> SKIPPED (conf {conf:.4f} < 0.15)")
                continue
            bbox = self._pred_to_xyxy(pred, img_w=w, img_h=h)
            box_w = bbox[2] - bbox[0]
            box_h = bbox[3] - bbox[1]
            if box_w < 5 or box_h < 5:
                logger.warning(f"Skipping degenerate bbox: {bbox}")
                continue
            logger.info(f"  -> ACCEPTED: bbox={[round(c) for c in bbox]}")
            raw_vehicles.append({
                "cls_name": cls_name,
                "conf": conf,
                "bbox": bbox,
            })

        if not raw_vehicles:
            logger.info("No vehicles detected in image (0 predictions passed threshold).")
            return []

        for v in raw_vehicles:
            det = {
                "detection_id": f"D{det_id:03d}",
                "class_name": v["cls_name"],
                "confidence": round(v["conf"], 4),
                "bbox": [round(c) for c in v["bbox"]],
                "is_violation": False,
                "violation_type": None,
                "violation_confidence": None,
                "plate": None,
                "plate_bbox": None,
            }
            det_id += 1

            is_two_wheeler = any(tw in v["cls_name"] for tw in TWO_WHEELER_CLASSES)

            # The Roboflow vehicle model often returns generic "vehicle" class
            # instead of specific types like "motorcycle". So we run the helmet
            # model on ALL vehicles — if it detects riders/heads, it's a
            # two-wheeler. This makes the helmet model double as a classifier.
            should_check_helmet = is_two_wheeler or v["cls_name"] in ("vehicle", "unknown")

            if should_check_helmet:
                if is_two_wheeler:
                    logger.info(f"Two-wheeler detected ({v['cls_name']}), running helmet check...")
                else:
                    logger.info(f"Generic class '{v['cls_name']}' — running helmet check to classify...")
                crop, _, _ = self._crop_with_padding(image, v["bbox"], pad=20)

                if crop.size > 0:
                    logger.info(f"Helmet crop size: {crop.shape[1]}x{crop.shape[0]}")
                    helmet_preds = self._call_roboflow(crop, HELMET_MODEL)

                    rider_count = 0
                    no_helmet_cnt = 0
                    best_nh_conf = 0.0

                    for hp in helmet_preds:
                        hcls = hp.get("class", "").lower()
                        hconf = hp.get("confidence", 0)
                        logger.info(f"  Helmet pred: class={hcls}, conf={hconf:.4f}")
                        if hconf < 0.15:
                            logger.info(f"    -> SKIPPED (conf {hconf:.4f} < 0.15)")
                            continue

                        rider_count += 1

                        is_no_helmet = any(
                            neg in hcls
                            for neg in ["no", "without", "non", "bare", "nohelmet"]
                        )
                        if is_no_helmet:
                            no_helmet_cnt += 1
                            best_nh_conf = max(best_nh_conf, hconf)

                    # If helmet model found riders, reclassify generic "vehicle"
                    if rider_count > 0 and not is_two_wheeler:
                        logger.info(f"Helmet model found {rider_count} rider(s) — reclassifying '{v['cls_name']}' → 'motorcycle'")
                        det["class_name"] = "motorcycle"

                    if rider_count >= 3:
                        det["is_violation"] = True
                        det["violation_type"] = "Triple Riding"
                        det["violation_confidence"] = round(
                            min(0.99, 0.75 + rider_count * 0.04), 4
                        )
                        logger.info(f"  ⚠ VIOLATION: Triple Riding ({rider_count} riders)")
                    elif no_helmet_cnt > 0:
                        det["is_violation"] = True
                        det["violation_type"] = "Helmet Non-Compliance"
                        det["violation_confidence"] = round(best_nh_conf, 4)
                        logger.info(f"  ⚠ VIOLATION: Helmet Non-Compliance (conf={best_nh_conf:.4f})")
                    elif rider_count > 0:
                        logger.info(f"  ✓ {rider_count} rider(s) all wearing helmets — no violation")
                    else:
                        logger.info(f"  Helmet model found 0 riders — likely a car/truck, skipping")

            detections.append(det)

        for det in detections:
            crop, ox, oy = self._crop_with_padding(image, det["bbox"], pad=5)
            if crop.size == 0:
                continue

            plate_preds = self._call_roboflow(crop, PLATE_MODEL)

            best_conf = 0.0
            best_plate_bbox = None

            for pp in plate_preds:
                pconf = pp.get("confidence", 0)
                logger.info(f"  Plate pred: conf={pconf:.4f}, class={pp.get('class', '?')}")
                if pconf < 0.20 or pconf <= best_conf:
                    logger.info(f"    -> SKIPPED (conf {pconf:.4f} < 0.20 or <= best {best_conf:.4f})")
                    continue
                best_conf = pconf
                ch, cw = crop.shape[:2]
                px1, py1, px2, py2 = self._pred_to_xyxy(pp, img_w=cw, img_h=ch)
                best_plate_bbox = [
                    ox + px1, oy + py1,
                    ox + px2, oy + py2,
                ]

            if best_plate_bbox:
                det["plate_bbox"] = [round(c) for c in best_plate_bbox]

        elapsed_ms = (time.perf_counter() - start) * 1000
        violations = sum(1 for d in detections if d["is_violation"])
        logger.info(
            f"Pipeline complete — {len(detections)} vehicles, "
            f"{violations} violations, {elapsed_ms:.1f}ms",
        )
        return detections


def get_detector() -> ViolationDetector:
    """Module-level singleton. Call once on startup, reuse everywhere."""
    if not hasattr(get_detector, "_instance"):
        get_detector._instance = ViolationDetector()
    return get_detector._instance
