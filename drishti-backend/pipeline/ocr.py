import re
import cv2
import numpy as np
import easyocr
import logging

logger = logging.getLogger(__name__)

# More flexible — handles spaces, partial reads, BH series
INDIAN_PLATE_PATTERN = re.compile(
    r'[A-Z]{2}[\s\-]?\d{1,2}[\s\-]?[A-Z]{1,3}[\s\-]?\d{4}',
    re.IGNORECASE
)

class PlateOCR:
    def __init__(self):
        logger.info("Loading EasyOCR (English)...")
        # gpu=False forces CPU mode — works on all machines
        self.reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        logger.info("EasyOCR loaded successfully.")

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

            # Upscale small plates — EasyOCR needs minimum ~100px width
            ph, pw = crop.shape[:2]
            if pw < 120:
                scale = 120 / pw
                crop = cv2.resize(crop, None, fx=scale, fy=scale, 
                                interpolation=cv2.INTER_CUBIC)

            # Preprocessing pipeline for Indian plates
            # 1. Convert to grayscale
            gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
            
            # 2. CLAHE for contrast enhancement (handles faded plates)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4, 4))
            enhanced = clahe.apply(gray)
            
            # 3. Denoise
            denoised = cv2.fastNlMeansDenoising(enhanced, h=10)
            
            # 4. Threshold — try both and pick best
            _, thresh_otsu = cv2.threshold(
                denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU
            )
            thresh_adaptive = cv2.adaptiveThreshold(
                denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 11, 2
            )
            
            # Try OCR on multiple versions: original color crop, 
            # grayscale, otsu, adaptive
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
                    results = self.reader.readtext(candidate_img)
                    if not results:
                        continue
                        
                    raw_texts = [r[1].upper().replace(" ", "").replace("-", "") 
                                for r in results]
                    raw_combined = " ".join(raw_texts)
                    
                    for bbox, text, conf in results:
                        cleaned = text.upper().replace(" ", "").replace("-", "")
                        match = INDIAN_PLATE_PATTERN.search(cleaned)
                        if match and conf > best_conf:
                            best_text = match.group(0)
                            best_conf = conf
                            best_raw = raw_combined
                except Exception:
                    continue
            
            if best_text:
                return {
                    "plate_text": best_text,
                    "confidence": round(float(best_conf), 4),
                    "raw_ocr": best_raw
                }
            
            # No pattern match — return best raw text anyway
            # (partial read is better than UNREADABLE)
            all_results = self.reader.readtext(crop)
            if all_results:
                best_result = max(all_results, key=lambda r: r[2])
                raw_text = best_result[1].upper().strip()
                return {
                    "plate_text": raw_text if len(raw_text) >= 4 else "UNREADABLE",
                    "confidence": round(float(best_result[2]), 4),
                    "raw_ocr": raw_text
                }
            
            return {"plate_text": "UNREADABLE", "confidence": 0.0, "raw_ocr": ""}
            
        except Exception as e:
            logger.error(f"OCR failed: {e}")
            return {"plate_text": "UNREADABLE", "confidence": 0.0, "raw_ocr": ""}
