"""Image preprocessing for YOLOv8 inference."""

from __future__ import annotations

import cv2
import numpy as np

TARGET_SIZE = 640
PAD_COLOR = (114, 114, 114)


def preprocess_image(image: np.ndarray) -> tuple[np.ndarray, dict]:
    """
    Enhance and letterbox an image for YOLO inference.

    Returns:
        preprocessed_image: 640x640 BGR array ready for the model
        transform_info: dict with original size, scale, and padding for bbox remap
    """
    original_h, original_w = image.shape[:2]

    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_channel = clahe.apply(l_channel)
    enhanced = cv2.merge([l_channel, a_channel, b_channel])
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    denoised = cv2.GaussianBlur(enhanced, (3, 3), 0)

    scale = min(TARGET_SIZE / original_w, TARGET_SIZE / original_h)
    new_w = int(round(original_w * scale))
    new_h = int(round(original_h * scale))

    resized = cv2.resize(denoised, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

    pad_w = TARGET_SIZE - new_w
    pad_h = TARGET_SIZE - new_h
    pad_left = pad_w // 2
    pad_top = pad_h // 2
    pad_right = pad_w - pad_left
    pad_bottom = pad_h - pad_top

    letterboxed = cv2.copyMakeBorder(
        resized,
        pad_top,
        pad_bottom,
        pad_left,
        pad_right,
        cv2.BORDER_CONSTANT,
        value=PAD_COLOR,
    )

    transform_info = {
        "original_size": (original_w, original_h),
        "scale": scale,
        "pad_left": pad_left,
        "pad_top": pad_top,
        "new_size": (new_w, new_h),
    }

    return letterboxed, transform_info


def remap_bbox_to_original(bbox: list[float], transform_info: dict) -> list[int]:
    """Map a bbox from letterboxed 640x640 space back to original image coordinates."""
    x1, y1, x2, y2 = bbox
    scale = transform_info["scale"]
    pad_left = transform_info["pad_left"]
    pad_top = transform_info["pad_top"]
    orig_w, orig_h = transform_info["original_size"]

    x1 = (x1 - pad_left) / scale
    y1 = (y1 - pad_top) / scale
    x2 = (x2 - pad_left) / scale
    y2 = (y2 - pad_top) / scale

    x1 = int(max(0, min(orig_w - 1, round(x1))))
    y1 = int(max(0, min(orig_h - 1, round(y1))))
    x2 = int(max(0, min(orig_w, round(x2))))
    y2 = int(max(0, min(orig_h, round(y2))))

    return [x1, y1, x2, y2]
