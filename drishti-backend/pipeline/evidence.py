"""Build structured evidence JSON for the frontend."""

from __future__ import annotations

import base64
import random
import string
from datetime import datetime, timezone

import cv2
import numpy as np

from pipeline.detect import VIOLATION_TYPES, VEHICLE_CLASSES

VEHICLE_TYPES = VEHICLE_CLASSES


def _generate_evidence_id() -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"DRISHTI-{timestamp}-{suffix}"


def _image_to_base64_jpeg(image: np.ndarray) -> str:
    success, buffer = cv2.imencode(".jpg", image, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    if not success:
        raise ValueError("Failed to encode annotated image as JPEG")
    return base64.b64encode(buffer).decode("utf-8")


def build_evidence_package(
    original_image: np.ndarray,
    annotated_image: np.ndarray,
    detections: list[dict],
    plates: list[dict],
    source_filename: str,
    inference_time_ms: float,
    model_version: str = "DRISHTI-v1.0",
    summary_override: dict | None = None,
) -> dict:
    height, width = original_image.shape[:2]

    violation_breakdown = {name: 0 for name in VIOLATION_TYPES}
    vehicle_detections = detections

    formatted_detections = []
    for idx, (detection, plate) in enumerate(zip(detections, plates), start=1):
        is_vehicle = (
            detection["class_name"] in VEHICLE_TYPES
            or any(v in detection["class_name"].lower() for v in VEHICLE_TYPES)
        )
        is_violation = bool(detection.get("is_violation"))
        violation_type = detection.get("violation_type")

        if is_violation and violation_type in violation_breakdown:
            violation_breakdown[violation_type] += 1

        plate_payload = None
        lookup_payload = detection.get("vehicle_lookup")
        if is_vehicle:
            plate_data = detection.get("plate") or plate
            plate_text = plate_data.get("plate_text", "UNREADABLE") if plate_data else "UNDETECTED"
            if plate_text not in {None, "UNDETECTED", "UNREADABLE"}:
                plate_payload = {
                    "plate_text": plate_text,
                    "confidence": plate_data.get("confidence", 0.0),
                }
            elif plate_text == "UNREADABLE":
                plate_payload = {
                    "plate_text": "UNREADABLE",
                    "confidence": plate_data.get("confidence", 0.0),
                }

            if lookup_payload is None and plate_text and plate_text not in ("UNREADABLE", "UNDETECTED"):
                from pipeline.vehicle_lookup import lookup_vehicle
                lookup_payload = lookup_vehicle(plate_text)

        formatted_detections.append(
            {
                "detection_id": detection.get("detection_id", f"D{idx:03d}"),
                "class_name": detection["class_name"],
                "confidence": detection["confidence"],
                "bbox": detection["bbox"],
                "is_violation": is_violation,
                "violation_type": violation_type,
                "plate": plate_payload,
                "vehicle_lookup": lookup_payload,
            }
        )

    if summary_override is not None:
        summary = summary_override
    else:
        total_violations = sum(violation_breakdown.values())
        summary = {
            "total_vehicles_detected": len(vehicle_detections),
            "total_violations_detected": total_violations,
            "violation_breakdown": violation_breakdown,
        }

    return {
        "evidence_id": _generate_evidence_id(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": source_filename or "live_feed",
        "summary": summary,
        "detections": formatted_detections,
        "annotated_image_b64": _image_to_base64_jpeg(annotated_image),
        "processing_metadata": {
            "model_version": model_version,
            "inference_time_ms": round(inference_time_ms, 2),
            "image_dimensions": [width, height],
        },
    }


def aggregate_violation_breakdown(evidence_list: list[dict]) -> dict[str, int]:
    aggregate = {name: 0 for name in VIOLATION_TYPES}
    for evidence in evidence_list:
        breakdown = evidence.get("summary", {}).get("violation_breakdown", {})
        for name in VIOLATION_TYPES:
            aggregate[name] += int(breakdown.get(name, 0))
    return aggregate
