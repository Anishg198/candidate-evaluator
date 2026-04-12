"""
Emotion analysis service using DeepFace.

DeepFace detects 7 raw emotions:
  angry, disgust, fear, happy, sad, surprise, neutral

These are mapped to 3 interview-relevant labels:
  confident  → happy + surprise  (positive engagement / self-assurance)
  neutral    → neutral           (composed, neither positive nor negative)
  stressed   → angry + fear + sad + disgust (negative arousal states)

The mapping is a weighted vote: the interview label whose raw-emotion
bucket has the highest cumulative probability wins.
"""
import base64
import io
import logging
import sys

import numpy as np

sys.setrecursionlimit(10000)

logger = logging.getLogger(__name__)

# Each interview label maps to a list of (deepface_emotion, weight) tuples.
# Weights boosted on non-neutral labels so mild expressions overcome neutral dominance.
EMOTION_MAP: dict[str, list[tuple[str, float]]] = {
    "confident": [("happy", 1.8), ("surprise", 1.0)],
    "neutral":   [("neutral", 0.7)],
    "stressed":  [("angry", 1.6), ("fear", 1.4), ("sad", 1.1), ("disgust", 0.8)],
}

FALLBACK_LABEL = "neutral"
FALLBACK_RAW = {e: 0.0 for e in ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]}
FALLBACK_RAW["neutral"] = 100.0


def _decode_frame(frame_b64: str) -> np.ndarray:
    """Decode base64 JPEG/PNG frame to a numpy RGB array."""
    if "," in frame_b64:
        frame_b64 = frame_b64.split(",", 1)[1]
    raw_bytes = base64.b64decode(frame_b64)
    from PIL import Image
    img = Image.open(io.BytesIO(raw_bytes)).convert("RGB")
    return np.array(img)


def _map_to_interview_label(raw: dict[str, float]) -> tuple[str, float]:
    """
    Given a DeepFace emotion dict (values 0–100), return
    (interview_label, confidence_score 0.0-1.0).
    """
    total = sum(raw.values()) or 1.0
    normalised = {k: v / total for k, v in raw.items()}

    scores: dict[str, float] = {}
    for label, components in EMOTION_MAP.items():
        scores[label] = sum(normalised.get(emotion, 0.0) * weight for emotion, weight in components)

    best_label = max(scores, key=lambda k: scores[k])
    bucket_total = sum(scores.values()) or 1.0
    confidence = scores[best_label] / bucket_total
    return best_label, round(confidence, 4)


def analyze_frame(frame_b64: str) -> dict:
    """
    Analyze a single base64-encoded video frame.

    Returns:
        {
          "raw_emotions": {angry: ..., disgust: ..., ...},
          "dominant_raw_emotion": "happy",
          "interview_label": "confident",
          "confidence_score": 0.72
        }

    Falls back to neutral if no face is detected or DeepFace raises.
    """
    try:
        from deepface import DeepFace

        img_array = _decode_frame(frame_b64)

        result = DeepFace.analyze(
            img_path=img_array,
            actions=["emotion"],
            enforce_detection=False,
            detector_backend="opencv",
            silent=True,
        )

        face_data = result[0] if isinstance(result, list) else result
        raw_emotions: dict[str, float] = face_data["emotion"]
        dominant_raw: str = face_data["dominant_emotion"]

    except Exception as exc:
        logger.warning("DeepFace analysis failed, using fallback: %s", exc)
        raw_emotions = FALLBACK_RAW.copy()
        dominant_raw = "neutral"

    interview_label, confidence = _map_to_interview_label(raw_emotions)

    return {
        "raw_emotions": {k: round(float(v), 2) for k, v in raw_emotions.items()},
        "dominant_raw_emotion": dominant_raw,
        "interview_label": interview_label,
        "confidence_score": confidence,
    }
