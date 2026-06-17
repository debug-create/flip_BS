"""License plate OCR using PaddleOCR."""

from __future__ import annotations

import re

import cv2
import numpy as np

INDIAN_PLATE_PATTERN = re.compile(r"^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$")


def _normalize_plate_text(text: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", text.upper())


class PlateOCR:
    def __init__(self):
        from paddleocr import PaddleOCR

        self.ocr = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)

    def extract_plate(self, image: np.ndarray, vehicle_bbox: list[int]) -> dict:
        x1, y1, x2, y2 = vehicle_bbox
        h, w = image.shape[:2]

        pad = 10
        x1 = max(0, x1 - pad)
        y1 = max(0, y1 - pad)
        x2 = min(w, x2 + pad)
        y2 = min(h, y2 + pad)

        crop = image[y1:y2, x1:x2]
        if crop.size == 0:
            return {"plate_text": "UNREADABLE", "confidence": 0.0, "raw_ocr": ""}

        result = self.ocr.ocr(crop, cls=True)
        if not result or result[0] is None:
            return {"plate_text": "UNREADABLE", "confidence": 0.0, "raw_ocr": ""}

        best_match: dict | None = None
        raw_texts: list[str] = []

        for line in result[0]:
            text = line[1][0]
            confidence = float(line[1][1])
            raw_texts.append(text)
            normalized = _normalize_plate_text(text)

            if INDIAN_PLATE_PATTERN.match(normalized):
                if best_match is None or confidence > best_match["confidence"]:
                    best_match = {
                        "plate_text": normalized,
                        "confidence": round(confidence, 4),
                        "raw_ocr": text,
                    }

        if best_match:
            return best_match

        return {
            "plate_text": "UNREADABLE",
            "confidence": 0.0,
            "raw_ocr": " | ".join(raw_texts),
        }
