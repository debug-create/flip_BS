"""YOLOv8-based violation detection with DEMO MODE mock overlay."""

from __future__ import annotations

import logging
import os
import random
from pathlib import Path
from typing import Any

import numpy as np

from pipeline.preprocess import preprocess_image, remap_bbox_to_original

logger = logging.getLogger(__name__)

CLASS_NAMES = {
    0: "person",
    1: "bicycle",
    2: "motorcycle",
    3: "car",
    4: "bus",
    5: "truck",
    "helmet_violation": "Helmet Non-Compliance",
    "no_seatbelt": "Seatbelt Non-Compliance",
    "triple_riding": "Triple Riding",
    "wrong_side": "Wrong-Side Driving",
    "stop_line": "Stop-Line Violation",
    "red_light": "Red-Light Running",
    "illegal_parking": "Illegal Parking",
    "defective_plate": "Defective/Missing Plate",
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

VEHICLE_CLASSES = {"motorcycle", "car", "bus", "truck", "bicycle"}
DEFAULT_MODEL = "models/yolov8n.pt"
FINE_TUNED_MODEL = "models/drishti.pt"

# Class schema from Colab training notebook (drishti.pt)
DRISHTI_VIOLATION_CLASS_MAP = {
    "helmet_violation": "Helmet Non-Compliance",
    "triple_riding": "Triple Riding",
    "stop_line_violation": "Stop-Line Violation",
    "red_light_violation": "Red-Light Running",
    "illegal_parking": "Illegal Parking",
    "wrong_side": "Wrong-Side Driving",
}
DRISHTI_VEHICLE_CLASSES = {"motorcycle", "car", "bus", "truck"}


def _bbox_center(bbox: list[int]) -> tuple[float, float]:
    x1, y1, x2, y2 = bbox
    return (x1 + x2) / 2, (y1 + y2) / 2


def _bbox_area(bbox: list[int]) -> float:
    x1, y1, x2, y2 = bbox
    return max(0, x2 - x1) * max(0, y2 - y1)


def _point_in_bbox(point: tuple[float, float], bbox: list[int], margin: float = 0.15) -> bool:
    x, y = point
    x1, y1, x2, y2 = bbox
    w = x2 - x1
    h = y2 - y1
    return (
        x1 - w * margin <= x <= x2 + w * margin
        and y1 - h * margin <= y <= y2 + h * margin
    )


def mock_violation_overlay(detections: list[dict], image_shape: tuple[int, int]) -> list[dict]:
    """
    DEMO MODE — replace with fine-tuned model for production.

    Adds plausible violation labels on top of real COCO detections so the
    hackathon demo looks convincing before custom weights are trained.
    """
    if not detections:
        return detections

    _, img_h = image_shape
    persons = [d for d in detections if d["class_name"] == "person"]
    motorcycles = [d for d in detections if d["class_name"] == "motorcycle"]
    cars = [d for d in detections if d["class_name"] in {"car", "bus", "truck"}]

    used_persons: set[int] = set()

    for moto in motorcycles:
        riders = []
        for idx, person in enumerate(persons):
            if idx in used_persons:
                continue
            cx, cy = _bbox_center(person["bbox"])
            if _point_in_bbox((cx, cy), moto["bbox"]):
                riders.append((idx, person))

        if len(riders) >= 3:
            moto["is_violation"] = True
            moto["violation_type"] = CLASS_NAMES["triple_riding"]
            moto["confidence"] = round(random.uniform(0.78, 0.94), 4)
            for idx, _ in riders:
                used_persons.add(idx)
        elif len(riders) >= 1:
            moto["is_violation"] = True
            moto["violation_type"] = CLASS_NAMES["helmet_violation"]
            moto["confidence"] = round(random.uniform(0.72, 0.91), 4)
            for idx, _ in riders:
                used_persons.add(idx)

    bottom_threshold = img_h * 0.75
    for vehicle in cars:
        _, cy = _bbox_center(vehicle["bbox"])
        _, y2 = vehicle["bbox"]
        if y2 >= bottom_threshold or cy >= bottom_threshold:
            vehicle["is_violation"] = True
            vehicle["violation_type"] = CLASS_NAMES["stop_line"]
            vehicle["confidence"] = round(random.uniform(0.70, 0.88), 4)

    return detections


class ViolationDetector:
    def __init__(self, model_path: str = DEFAULT_MODEL):
        from ultralytics import YOLO

        backend_root = Path(__file__).resolve().parent.parent
        resolved_path = backend_root / model_path

        if not resolved_path.exists():
            fine_tuned = backend_root / FINE_TUNED_MODEL
            if fine_tuned.exists():
                resolved_path = fine_tuned
                logger.info("Loaded fine-tuned weights from %s", fine_tuned)
            else:
                logger.warning(
                    "Fine-tuned weights not found at %s. "
                    "Using yolov8n.pt (auto-download). "
                    "Place trained weights at models/drishti.pt for production accuracy.",
                    fine_tuned,
                )
                resolved_path = backend_root / DEFAULT_MODEL

        self.model_path = str(resolved_path)
        self.model = YOLO(self.model_path)
        self.is_fine_tuned = "drishti.pt" in self.model_path
        self.model_version = "drishti.pt" if self.is_fine_tuned else "YOLOv8n-DEMO"

    def _parse_fine_tuned_detection(self, class_id: int, confidence: float, bbox: list[int]) -> dict | None:
        class_name = self.model.names.get(class_id, f"class_{class_id}")
        if class_name in DRISHTI_VIOLATION_CLASS_MAP:
            return {
                "class_id": class_id,
                "class_name": class_name,
                "confidence": confidence,
                "bbox": bbox,
                "is_violation": True,
                "violation_type": DRISHTI_VIOLATION_CLASS_MAP[class_name],
            }
        if class_name in DRISHTI_VEHICLE_CLASSES or class_name == "person":
            return {
                "class_id": class_id,
                "class_name": class_name,
                "confidence": confidence,
                "bbox": bbox,
                "is_violation": False,
                "violation_type": None,
            }
        return None

    def detect(self, image: np.ndarray) -> list[dict]:
        preprocessed, transform_info = preprocess_image(image)
        orig_h, orig_w = image.shape[:2]

        results = self.model.predict(preprocessed, verbose=False)
        detections: list[dict] = []

        if not results:
            return detections

        result = results[0]
        if result.boxes is None:
            return detections

        for box in result.boxes:
            class_id = int(box.cls.item())
            confidence = round(float(box.conf.item()), 4)
            xyxy = box.xyxy[0].tolist()
            bbox = remap_bbox_to_original(xyxy, transform_info)

            if self.is_fine_tuned:
                parsed = self._parse_fine_tuned_detection(class_id, confidence, bbox)
                if parsed:
                    detections.append(parsed)
                continue

            class_name = CLASS_NAMES.get(class_id, f"class_{class_id}")
            if class_name not in VEHICLE_CLASSES and class_name != "person":
                continue

            detections.append(
                {
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": confidence,
                    "bbox": bbox,
                    "is_violation": False,
                    "violation_type": None,
                }
            )

        if not self.is_fine_tuned:
            detections = mock_violation_overlay(detections, (orig_w, orig_h))
        return detections
