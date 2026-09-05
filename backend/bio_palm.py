"""Palmprint biometric feature extraction module.

Detects the hand with MediaPipe's HandLandmarker task, crops the palm
region-of-interest (ROI), and extracts a feature vector by passing the ROI
through a pre-trained MobileNetV2 (ImageNet weights, global-average-pooled).
"""
import os
import urllib.request
from typing import List

import cv2
import numpy as np

_hand_landmarker = None
_mobilenet = None

_MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
_HAND_MODEL_PATH = os.path.join(_MODEL_DIR, "hand_landmarker.task")
_HAND_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/latest/hand_landmarker.task"
)


def _ensure_hand_model() -> str:
    if not os.path.exists(_HAND_MODEL_PATH):
        os.makedirs(_MODEL_DIR, exist_ok=True)
        urllib.request.urlretrieve(_HAND_MODEL_URL, _HAND_MODEL_PATH)
    return _HAND_MODEL_PATH


def _get_hand_landmarker():
    global _hand_landmarker
    if _hand_landmarker is None:
        import mediapipe as mp
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision

        options = vision.HandLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=_ensure_hand_model()),
            running_mode=vision.RunningMode.IMAGE,
            num_hands=1,
            min_hand_detection_confidence=0.5,
        )
        _hand_landmarker = vision.HandLandmarker.create_from_options(options)
    return _hand_landmarker


def _get_mobilenet():
    global _mobilenet
    if _mobilenet is None:
        from tensorflow.keras.applications import MobileNetV2

        _mobilenet = MobileNetV2(
            input_shape=(224, 224, 3),
            include_top=False,
            weights="imagenet",
            pooling="avg",
        )
    return _mobilenet


def _crop_palm_roi(image_bgr: np.ndarray) -> np.ndarray:
    """Detect hand landmarks and crop a square ROI around the palm."""
    import mediapipe as mp

    landmarker = _get_hand_landmarker()
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = landmarker.detect(mp_image)

    if not result.hand_landmarks:
        raise ValueError("No hand/palm detected in image")

    h, w = image_bgr.shape[:2]
    landmarks = result.hand_landmarks[0]
    xs = [lm.x * w for lm in landmarks]
    ys = [lm.y * h for lm in landmarks]

    x_min, x_max = max(int(min(xs)), 0), min(int(max(xs)), w)
    y_min, y_max = max(int(min(ys)), 0), min(int(max(ys)), h)

    # Add a small margin around the bounding box of the landmarks.
    margin_x = int((x_max - x_min) * 0.15)
    margin_y = int((y_max - y_min) * 0.15)
    x_min = max(x_min - margin_x, 0)
    y_min = max(y_min - margin_y, 0)
    x_max = min(x_max + margin_x, w)
    y_max = min(y_max + margin_y, h)

    roi = image_bgr[y_min:y_max, x_min:x_max]
    if roi.size == 0:
        raise ValueError("Palm ROI crop is empty")
    return roi


def extract_palm_vector_from_roi(roi_bgr: np.ndarray) -> List[float]:
    """Extract a MobileNetV2 feature vector from an already-cropped palm ROI.

    Used directly on public palmprint datasets, which are near-universally
    distributed as pre-segmented ROI patches rather than raw hand photos
    (see benchmarks/eval_palm.py) - there is no hand to detect landmarks
    on in those images, only the extracted patch itself.

    Returns:
        A list of floats (L2-normalized MobileNetV2 embedding).
    """
    from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

    roi_resized = cv2.resize(roi_bgr, (224, 224))
    roi_rgb = cv2.cvtColor(roi_resized, cv2.COLOR_BGR2RGB).astype(np.float32)
    batch = preprocess_input(np.expand_dims(roi_rgb, axis=0))

    model = _get_mobilenet()
    features = model.predict(batch, verbose=0)[0]

    norm = np.linalg.norm(features)
    if norm > 0:
        features = features / norm

    return features.tolist()


def extract_palm_vector(image: np.ndarray) -> List[float]:
    """Extract a palmprint feature vector from a raw BGR hand image (as read
    by cv2.imread): detects the hand, crops the palm ROI, then delegates to
    extract_palm_vector_from_roi().
    """
    roi = _crop_palm_roi(image)
    return extract_palm_vector_from_roi(roi)
