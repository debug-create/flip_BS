import re
import numpy as np
import easyocr
import logging

logger = logging.getLogger(__name__)

# Indian license plate pattern
# Covers: KA03MJ1234, MH12AB1234, DL8CAB1234 etc.
INDIAN_PLATE_PATTERN = re.compile(
    r'[A-Z]{2}[\s\-]?[0-9]{1,2}[\s\-]?[A-Z]{1,3}[\s\-]?[0-9]{4}'
)

class PlateOCR:
    def __init__(self):
        logger.info("Loading EasyOCR (English)...")
        # gpu=False forces CPU mode — works on all machines
        self.reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        logger.info("EasyOCR loaded successfully.")

    def extract_plate(self, image: np.ndarray, plate_bbox: list) -> dict:
        """
        Crop plate region, run OCR, extract Indian plate text.

        Args:
            image: full frame numpy array (BGR, OpenCV format)
            plate_bbox: [x1, y1, x2, y2] in pixel coords from plate model

        Returns:
            dict with plate_text, confidence, raw_ocr
        """
        try:
            x1, y1, x2, y2 = [int(c) for c in plate_bbox]
            h, w = image.shape[:2]
            # Plate bbox is already tight from plate model — minimal padding only
            x1p = max(0, x1 - 3)
            y1p = max(0, y1 - 3)
            x2p = min(w, x2 + 3)
            y2p = min(h, y2 + 3)
            crop = image[y1p:y2p, x1p:x2p]
            
            if crop.size == 0:
                return {"plate_text": "UNREADABLE", "confidence": 0.0, "raw_ocr": ""}
            
            # EasyOCR returns list of [bbox, text, confidence]
            results = self.reader.readtext(crop)
            
            if not results:
                return {"plate_text": "UNREADABLE", "confidence": 0.0, "raw_ocr": ""}
            
            # Collect all detected text
            raw_texts = [r[1].upper().replace(" ", "").replace("-", "") 
                        for r in results]
            raw_combined = " | ".join(raw_texts)
            
            # Try to match Indian plate pattern in each result
            best_plate = None
            best_conf = 0.0
            
            for bbox, text, conf in results:
                cleaned = text.upper().replace(" ", "").replace("-", "")
                match = INDIAN_PLATE_PATTERN.search(cleaned)
                if match and conf > best_conf:
                    best_plate = match.group(0).replace(" ", "").replace("-", "")
                    best_conf = conf
            
            if best_plate:
                return {
                    "plate_text": best_plate,
                    "confidence": round(float(best_conf), 4),
                    "raw_ocr": raw_combined
                }
            else:
                # No valid plate pattern found — return best text anyway
                # (useful for partial reads)
                best_result = max(results, key=lambda r: r[2])
                return {
                    "plate_text": "UNREADABLE",
                    "confidence": 0.0,
                    "raw_ocr": raw_combined
                }
                
        except Exception as e:
            logger.error(f"OCR failed for plate bbox {plate_bbox}: {e}")
            return {"plate_text": "UNREADABLE", "confidence": 0.0, "raw_ocr": ""}
