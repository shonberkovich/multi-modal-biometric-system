"""AI Quality Assessment (QA) filter — the project's "unique improvement".

Fast-rejects low-quality captures *before* they reach the heavy biometric
feature-extraction models, improving both response time and downstream
matching accuracy.

- Images: Laplacian variance (blur detection).
- Audio: Signal-to-Noise Ratio (SNR).
"""
from dataclasses import dataclass

import cv2
import numpy as np

BLUR_VARIANCE_THRESHOLD = 100.0  # below this, an image is considered too blurry
SNR_THRESHOLD_DB = 10.0  # below this, audio is considered too noisy


@dataclass
class QAResult:
    passed: bool
    score: float
    reason: str = ""


def check_image_quality(image_bgr: np.ndarray, threshold: float = BLUR_VARIANCE_THRESHOLD) -> QAResult:
    """Reject blurry images using the variance of the Laplacian.

    A sharp image has high-frequency edges -> high Laplacian variance.
    A blurry image is smooth -> low Laplacian variance.
    """
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()

    if variance < threshold:
        return QAResult(passed=False, score=variance, reason=f"Image too blurry (variance={variance:.1f} < {threshold})")
    return QAResult(passed=True, score=variance)


def check_audio_quality(signal: np.ndarray, threshold_db: float = SNR_THRESHOLD_DB) -> QAResult:
    """Reject noisy audio using an estimated Signal-to-Noise Ratio (SNR).

    Treats the quietest 10% of frame-energies as the noise floor, and the
    remaining signal energy against that floor. Silent input reports a QA
    failure rather than raising, since the caller should fast-reject it too.
    """
    frame_len = 2048
    hop = frame_len // 2
    frames = [
        signal[i : i + frame_len]
        for i in range(0, max(len(signal) - frame_len, 0) + 1, hop)
    ]
    if not frames:
        frames = [signal]

    energies = np.array([np.mean(np.square(frame)) for frame in frames if len(frame) > 0])
    if energies.size == 0 or np.all(energies == 0):
        return QAResult(passed=False, score=-np.inf, reason="Audio is silent")

    noise_floor = np.percentile(energies, 10)
    signal_power = np.mean(energies)

    if noise_floor <= 0:
        noise_floor = 1e-10

    snr_db = 10 * np.log10(signal_power / noise_floor)

    if snr_db < threshold_db:
        return QAResult(passed=False, score=snr_db, reason=f"Audio too noisy (SNR={snr_db:.1f}dB < {threshold_db}dB)")
    return QAResult(passed=True, score=snr_db)
