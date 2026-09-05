"""Fingerprint biometric feature extraction module.

Pre-processing: grayscale -> CLAHE (contrast enhancement) -> Gabor filter
(ridge enhancement). The enhanced image is then passed through a small,
lightweight CNN to produce a fixed-size feature vector.

Note: the CNN backbone is built with fixed, seeded random weights rather
than weights pretrained on a labeled fingerprint dataset (none is bundled
with this repo). It still acts as a deterministic, non-linear feature
extractor - the same enhanced fingerprint always maps to the same vector -
which is what similarity/matching downstream requires. Swap in trained
weights via `model.load_weights(...)` once a training set is available.
"""
from typing import List

import cv2
import numpy as np

_cnn = None
INPUT_SIZE = 96
FEATURE_DIM = 256


def _apply_clahe(gray: np.ndarray) -> np.ndarray:
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)


def _apply_gabor(gray: np.ndarray) -> np.ndarray:
    """Enhance ridge patterns with a bank of oriented Gabor filters."""
    accum = np.zeros_like(gray, dtype=np.float32)
    for theta in np.arange(0, np.pi, np.pi / 8):
        kernel = cv2.getGaborKernel((15, 15), sigma=4.0, theta=theta, lambd=10.0, gamma=0.5, ktype=cv2.CV_32F)
        filtered = cv2.filter2D(gray, cv2.CV_32F, kernel)
        accum = np.maximum(accum, filtered)
    cv2.normalize(accum, accum, 0, 255, cv2.NORM_MINMAX)
    return accum.astype(np.uint8)


def preprocess_fingerprint(image_bgr: np.ndarray) -> np.ndarray:
    """Grayscale -> CLAHE -> Gabor filter. Returns an (INPUT_SIZE, INPUT_SIZE) uint8 image."""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    enhanced = _apply_clahe(gray)
    ridges = _apply_gabor(enhanced)
    return cv2.resize(ridges, (INPUT_SIZE, INPUT_SIZE))


def _build_cnn():
    from tensorflow import keras
    from tensorflow.keras import layers

    keras.utils.set_random_seed(42)
    model = keras.Sequential(
        [
            layers.Input(shape=(INPUT_SIZE, INPUT_SIZE, 1)),
            layers.Conv2D(16, 3, activation="relu", padding="same"),
            layers.MaxPooling2D(),
            layers.Conv2D(32, 3, activation="relu", padding="same"),
            layers.MaxPooling2D(),
            layers.Conv2D(64, 3, activation="relu", padding="same"),
            layers.GlobalAveragePooling2D(),
            layers.Dense(FEATURE_DIM, activation="linear"),
        ]
    )
    return model


def _get_cnn():
    global _cnn
    if _cnn is None:
        _cnn = _build_cnn()
    return _cnn


def extract_fingerprint_vector(image_bgr: np.ndarray) -> List[float]:
    """Extract a fixed-size feature vector from a fingerprint image.

    Args:
        image_bgr: BGR image as read by cv2.imread.

    Returns:
        A FEATURE_DIM-length list of floats (L2-normalized).
    """
    processed = preprocess_fingerprint(image_bgr)
    batch = processed.astype(np.float32)[np.newaxis, ..., np.newaxis] / 255.0

    model = _get_cnn()
    features = model.predict(batch, verbose=0)[0]

    norm = np.linalg.norm(features)
    if norm > 0:
        features = features / norm

    return features.tolist()
