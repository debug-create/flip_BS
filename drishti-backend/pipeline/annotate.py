"""Draw detection boxes and labels on images."""

from __future__ import annotations

import cv2
import numpy as np

COLOR_VEHICLE = (0, 200, 0)
COLOR_VIOLATION = (0, 0, 220)
COLOR_PLATE = (0, 220, 220)


def _draw_label(
    image: np.ndarray,
    text: str,
    x: int,
    y: int,
    color: tuple[int, int, int],
) -> None:
    font = cv2.FONT_HERSHEY_SIMPLEX
    scale = 0.6
    thickness = 2
    (text_w, text_h), baseline = cv2.getTextSize(text, font, scale, thickness)

    label_y = max(y, text_h + baseline + 4)
    cv2.rectangle(
        image,
        (x, label_y - text_h - baseline - 4),
        (x + text_w + 8, label_y),
        color,
        -1,
    )
    cv2.putText(
        image,
        text,
        (x + 4, label_y - baseline - 2),
        font,
        scale,
        (255, 255, 255),
        thickness,
        cv2.LINE_AA,
    )


def annotate_image(
    image: np.ndarray,
    detections: list[dict],
    plates: list[dict],
) -> np.ndarray:
    annotated = image.copy()

    for detection, plate in zip(detections, plates):
        x1, y1, x2, y2 = detection["bbox"]
        is_violation = detection.get("is_violation", False)
        color = COLOR_VIOLATION if is_violation else COLOR_VEHICLE

        cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)

        label_name = detection.get("violation_type") or detection["class_name"]
        label = f"{label_name} {detection['confidence']:.0%}"
        _draw_label(annotated, label, x1, y1, color)

        plate_text = plate.get("plate_text")
        if plate_text and plate_text != "UNREADABLE":
            plate_label = f"PLATE: {plate_text}"
            plate_y = min(y2 + 22, annotated.shape[0] - 4)
            _draw_label(annotated, plate_label, x1, plate_y, COLOR_PLATE)

    return annotated
