import os
import re
import cv2
import numpy as np
import requests
import logging

logger = logging.getLogger(__name__)

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")
ROBOFLOW_URL = os.getenv("ROBOFLOW_URL", "https://serverless.roboflow.com")
PLATE_OCR_MODEL = "indian-plate/1"

# More flexible — handles spaces, partial reads, BH series
INDIAN_PLATE_PATTERN = re.compile(
    r'[A-Z]{2}[\s\-]?\d{1,2}[\s\-]?[A-Z]{1,3}[\s\-]?\d{4}',
    re.IGNORECASE
)


class PlateOCR:
    def __init__(self):
        if not ROBOFLOW_API_KEY:
            raise ValueError(
                "ROBOFLOW_API_KEY is not set. "
                "Copy drishti-backend/.env.example to .env and add your Roboflow API key."
            )
        self.session = requests.Session()
        logger.info("PlateOCR ready (Roboflow indian-plate/1 via HTTP).")

    def _infer_plate(self, image: np.ndarray) -> list[dict]:
        """
        Send a plate crop to the indian-plate/1 Roboflow model via HTTP.
        Returns list of prediction dicts (each with 'class', 'confidence',
        and spatial coords 'x', 'y', 'width', 'height').
        """
        try:
            ok, buffer = cv2.imencode(".jpg", image)
            if not ok:
                logger.error("PlateOCR: cv2.imencode failed")
                return []

            response = self.session.post(
                f"{ROBOFLOW_URL}/{PLATE_OCR_MODEL}",
                params={"api_key": ROBOFLOW_API_KEY},
                files={"file": ("plate.jpg", buffer.tobytes(), "image/jpeg")},
                timeout=60,
            )
            response.raise_for_status()
            result = response.json()

            # Handle both object-detection and classification responses
            predictions = result.get("predictions", [])
            if not predictions and "top" in result:
                return [{"class": result["top"], "confidence": result.get("confidence", 0.0)}]
            return predictions
        except Exception as e:
            logger.error(f"PlateOCR inference error: {type(e).__name__}: {e}")
            return []

    @staticmethod
    def _assemble_plate_text(preds: list[dict]) -> tuple[str, float]:
        """
        The indian-plate/1 model is a character-level object detection model.
        Each prediction has class='<char>' and x=<position>.
        Sort predictions left-to-right by x-coordinate, concatenate classes
        to form the full plate string, and average confidences.
        Returns (assembled_text, avg_confidence).
        """
        if not preds:
            return "", 0.0

        # Filter out very low confidence detections
        good_preds = [p for p in preds if float(p.get("confidence", 0)) >= 0.15]
        if not good_preds:
            return "", 0.0

        # Sort left-to-right by x coordinate (center of each detected char)
        sorted_preds = sorted(good_preds, key=lambda p: float(p.get("x", 0)))

        chars = []
        confs = []
        for p in sorted_preds:
            char = str(p.get("class", "")).strip()
            if char:  # skip empty
                chars.append(char.upper())
                confs.append(float(p.get("confidence", 0)))

        assembled = "".join(chars)
        avg_conf = sum(confs) / len(confs) if confs else 0.0

        return assembled, avg_conf

    def extract_plate(self, image: np.ndarray, plate_bbox: list) -> dict:
        try:
            x1, y1, x2, y2 = [int(c) for c in plate_bbox]
            h, w = image.shape[:2]
            x1p = max(0, x1 - 3)
            y1p = max(0, y1 - 3)
            x2p = min(w, x2 + 3)
            y2p = min(h, y2 + 3)
            crop = image[y1p:y2p, x1p:x2p]

            if crop.size == 0:
                return {"plate_text": "UNDETECTED", "confidence": 0.0, "raw_ocr": ""}

            # Upscale small plates for better inference
            ph, pw = crop.shape[:2]
            if pw < 120:
                scale = 120 / pw
                crop = cv2.resize(crop, None, fx=scale, fy=scale,
                                  interpolation=cv2.INTER_CUBIC)

            # Preprocessing pipeline
            gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4, 4))
            enhanced = clahe.apply(gray)
            denoised = cv2.fastNlMeansDenoising(enhanced, h=10)
            _, thresh_otsu = cv2.threshold(
                denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
            )
            thresh_adaptive = cv2.adaptiveThreshold(
                denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 11, 2
            )

            best_text = ""
            best_conf = 0.0
            best_raw = ""

            candidates = [
                ("color", crop),
                ("gray", cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)),
                ("otsu", cv2.cvtColor(thresh_otsu, cv2.COLOR_GRAY2BGR)),
                ("adaptive", cv2.cvtColor(thresh_adaptive, cv2.COLOR_GRAY2BGR)),
            ]

            for name, candidate_img in candidates:
                try:
                    preds = self._infer_plate(candidate_img)
                    if not preds:
                        continue

                    # Assemble all character detections into one string
                    assembled, avg_conf = self._assemble_plate_text(preds)
                    logger.info(
                        f"  Plate OCR [{name}]: assembled='{assembled}' "
                        f"(chars={len(preds)}), avg_conf={avg_conf:.4f}"
                    )

                    if not assembled:
                        continue

                    # Try Indian plate pattern match first
                    cleaned = assembled.replace(" ", "").replace("-", "")
                    match = INDIAN_PLATE_PATTERN.search(cleaned)
                    if match and avg_conf > best_conf:
                        best_text = match.group(0)
                        best_conf = avg_conf
                        best_raw = assembled
                    elif not best_text and len(assembled) >= 4 and avg_conf > best_conf:
                        # No Indian pattern match, but we have a decent read
                        best_text = assembled
                        best_conf = avg_conf
                        best_raw = assembled
                except Exception:
                    continue

            if best_text:
                return {
                    "plate_text": best_text,
                    "confidence": round(float(best_conf), 4),
                    "raw_ocr": best_raw
                }

            # Fallback — try color crop one more time
            fallback_preds = self._infer_plate(crop)
            if fallback_preds:
                assembled, avg_conf = self._assemble_plate_text(fallback_preds)
                logger.info(f"  Plate OCR [fallback]: assembled='{assembled}', avg_conf={avg_conf:.4f}")
                if assembled and len(assembled) >= 2:
                    return {
                        "plate_text": assembled,
                        "confidence": round(avg_conf, 4),
                        "raw_ocr": assembled
                    }

            return {"plate_text": "UNREADABLE", "confidence": 0.0, "raw_ocr": ""}

        except Exception as e:
            logger.error(f"OCR failed: {e}")
            return {"plate_text": "UNREADABLE", "confidence": 0.0, "raw_ocr": ""}
