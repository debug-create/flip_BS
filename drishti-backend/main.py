"""DRISHTI FastAPI backend — traffic violation detection pipeline."""

from __future__ import annotations

import logging
import os
import tempfile
import time
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# Load .env from backend directory before any pipeline imports read env vars
load_dotenv(Path(__file__).resolve().parent / ".env")

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from pipeline.annotate import annotate_image
from pipeline.detect import VIOLATION_TYPES, get_detector
from pipeline.evidence import aggregate_violation_breakdown, build_evidence_package
from pipeline.ocr import PlateOCR

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drishti")

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
MAX_VIDEO_SECONDS = 30
VIDEO_SAMPLE_FPS = 2

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": {".jpg", ".jpeg"},
    "image/png": {".png"},
    "image/webp": {".webp"},
}
ALLOWED_VIDEO_TYPES = {
    "video/mp4": {".mp4"},
    "video/x-msvideo": {".avi"},
    "video/avi": {".avi"},
}

VIOLATION_DESCRIPTIONS = {
    "Helmet Non-Compliance": "Rider without a helmet on a two-wheeler.",
    "Seatbelt Non-Compliance": "Vehicle occupant not wearing a seatbelt.",
    "Triple Riding": "More than two persons on a single two-wheeler.",
    "Wrong-Side Driving": "Vehicle traveling against permitted traffic flow.",
    "Stop-Line Violation": "Vehicle crossed the stop line before signal clearance.",
    "Red-Light Running": "Vehicle entered junction during red signal phase.",
    "Illegal Parking": "Vehicle parked in a no-parking or obstructive zone.",
    "Defective/Missing Plate": "License plate missing, obscured, or unreadable.",
}

detector = None
plate_ocr: PlateOCR | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global detector, plate_ocr

    detector = get_detector()
    plate_ocr = PlateOCR()
    logger.info("DRISHTI backend ready — Roboflow 3-model pipeline + EasyOCR active.")
    yield


app = FastAPI(
    title="DRISHTI API",
    description="Traffic violation detection backend for Bengaluru Traffic Police",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_extension(filename: str | None) -> str:
    if not filename or "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()


def _validate_file_size(file_bytes: bytes) -> None:
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Maximum allowed size is 50MB.")


def _validate_image_upload(file: UploadFile, file_bytes: bytes) -> None:
    extension = _get_extension(file.filename)
    content_type = (file.content_type or "").lower()

    allowed_exts = set().union(*ALLOWED_IMAGE_TYPES.values())
    if extension not in allowed_exts and content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Unsupported image type. Allowed formats: jpg, jpeg, png, webp.",
        )

    try:
        Image.open(BytesIO(file_bytes)).verify()
    except Exception as exc:
        raise HTTPException(status_code=415, detail="Invalid or corrupted image file.") from exc


def _validate_video_upload(file: UploadFile, file_bytes: bytes) -> None:
    extension = _get_extension(file.filename)
    content_type = (file.content_type or "").lower()

    allowed_exts = set().union(*ALLOWED_VIDEO_TYPES.values())
    if extension not in allowed_exts and content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Unsupported video type. Allowed formats: mp4, avi.",
        )


def _decode_image(file_bytes: bytes) -> np.ndarray:
    image_array = np.frombuffer(file_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=415, detail="Unable to decode image file.")
    return image


def _run_image_pipeline(image: np.ndarray, source_filename: str) -> dict[str, Any]:
    if detector is None or plate_ocr is None:
        raise HTTPException(status_code=500, detail="Inference services are not initialized.")

    start = time.perf_counter()

    try:
        detections = detector.detect(image)

        for det in detections:
            plate_bbox = det.pop("plate_bbox", None)
            det.pop("violation_confidence", None)

            if plate_bbox:
                det["plate"] = plate_ocr.extract_plate(image, plate_bbox)
            else:
                det["plate"] = {"plate_text": "UNDETECTED", "confidence": 0.0, "raw_ocr": ""}

        plates = [det["plate"] for det in detections]
        annotated = annotate_image(image, detections, plates)
        inference_time_ms = (time.perf_counter() - start) * 1000

        return build_evidence_package(
            original_image=image,
            annotated_image=annotated,
            detections=detections,
            plates=plates,
            source_filename=source_filename,
            inference_time_ms=inference_time_ms,
            model_version=detector.model_version,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Image inference failed")
        raise HTTPException(status_code=500, detail=f"Inference failed: {exc}") from exc


def _extract_video_frames(file_bytes: bytes) -> list[np.ndarray]:
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as temp_file:
        temp_file.write(file_bytes)
        temp_path = temp_file.name

    capture = cv2.VideoCapture(temp_path)
    if not capture.isOpened():
        raise HTTPException(status_code=415, detail="Unable to open video file.")

    fps = capture.get(cv2.CAP_PROP_FPS) or 25.0
    frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    duration_seconds = frame_count / fps if frame_count > 0 else 0

    if duration_seconds > MAX_VIDEO_SECONDS:
        capture.release()
        raise HTTPException(
            status_code=413,
            detail=f"Video too long. Maximum allowed duration is {MAX_VIDEO_SECONDS} seconds.",
        )

    frame_interval = max(1, int(round(fps / VIDEO_SAMPLE_FPS)))
    frames: list[np.ndarray] = []
    frame_index = 0

    while True:
        success, frame = capture.read()
        if not success:
            break
        if frame_index % frame_interval == 0:
            frames.append(frame)
        frame_index += 1

    capture.release()

    try:
        os.remove(temp_path)
    except OSError:
        pass

    if not frames:
        raise HTTPException(status_code=415, detail="No frames could be extracted from video.")

    return frames


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "model": "roboflow-3model",
        "mode": "PRODUCTION",
    }


@app.get("/violations/types")
def violation_types() -> list[dict[str, str]]:
    return [
        {"name": name, "description": VIOLATION_DESCRIPTIONS[name]}
        for name in VIOLATION_TYPES
    ]


@app.post("/analyze/image")
async def analyze_image(file: UploadFile = File(...)) -> dict[str, Any]:
    file_bytes = await file.read()
    _validate_file_size(file_bytes)
    _validate_image_upload(file, file_bytes)

    image = _decode_image(file_bytes)
    return _run_image_pipeline(image, file.filename or "uploaded_image")


@app.post("/analyze/video")
async def analyze_video(file: UploadFile = File(...)) -> dict[str, Any]:
    file_bytes = await file.read()
    _validate_file_size(file_bytes)
    _validate_video_upload(file, file_bytes)

    frames = _extract_video_frames(file_bytes)
    timeline: list[dict[str, Any]] = []
    total_violations = 0

    for frame_index, frame in enumerate(frames, start=1):
        frame_name = f"{file.filename or 'uploaded_video'}#frame_{frame_index}"
        evidence = _run_image_pipeline(frame, frame_name)
        timeline.append(evidence)
        total_violations += evidence["summary"]["total_violations_detected"]

    return {
        "total_frames_analyzed": len(timeline),
        "total_violations_found": total_violations,
        "violation_timeline": timeline,
        "aggregate_violation_breakdown": aggregate_violation_breakdown(timeline),
    }
