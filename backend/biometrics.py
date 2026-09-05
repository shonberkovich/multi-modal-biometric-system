"""Shared dispatch layer: QA filtering + feature extraction + similarity,
used by the /enroll and /verify/* API endpoints.
"""
from typing import List, Tuple

import cv2
import librosa
import numpy as np

import bio_face
import bio_fingerprint
import bio_gait
import bio_palm
import bio_voice
import qa_filter

METHODS = ("face", "voice", "palm", "gait", "fingerprint")

# Cosine-similarity match thresholds per method. These are placeholder
# defaults - Phase 8's benchmark scripts compute per-method EER against
# public datasets, which should be used to tune these in production.
MATCH_THRESHOLDS = {
    "face": 0.5,
    "voice": 0.5,
    "palm": 0.5,
    "gait": 0.5,
    "fingerprint": 0.5,
}


class QAFailure(Exception):
    """Raised when a capture fails the AI Quality Assessment filter."""


class ExtractionFailure(Exception):
    """Raised when feature extraction fails (e.g. no face/hand detected)."""


def extract_vector(method: str, file_path: str) -> List[float]:
    """Run the QA filter (where applicable) then extract a feature vector.

    Raises:
        QAFailure: if the capture fails the quality assessment filter.
        ExtractionFailure: if feature extraction itself fails.
        ValueError: if `method` is not recognized.
    """
    if method not in METHODS:
        raise ValueError(f"Unknown method: {method}")

    try:
        if method == "face":
            image = cv2.imread(file_path)
            if image is None:
                raise ExtractionFailure("Could not read image file")
            qa = qa_filter.check_image_quality(image)
            if not qa.passed:
                raise QAFailure(qa.reason)
            return bio_face.extract_face_vector(image)

        if method == "palm":
            image = cv2.imread(file_path)
            if image is None:
                raise ExtractionFailure("Could not read image file")
            qa = qa_filter.check_image_quality(image)
            if not qa.passed:
                raise QAFailure(qa.reason)
            return bio_palm.extract_palm_vector(image)

        if method == "fingerprint":
            image = cv2.imread(file_path)
            if image is None:
                raise ExtractionFailure("Could not read image file")
            qa = qa_filter.check_image_quality(image)
            if not qa.passed:
                raise QAFailure(qa.reason)
            return bio_fingerprint.extract_fingerprint_vector(image)

        if method == "voice":
            signal, _ = librosa.load(file_path, sr=16000, mono=True)
            qa = qa_filter.check_audio_quality(signal)
            if not qa.passed:
                raise QAFailure(qa.reason)
            return bio_voice.extract_voice_vector(file_path)

        if method == "gait":
            # No QA filter is defined for video in this project (Phase 3
            # only specifies image blur and audio SNR checks).
            return bio_gait.extract_gait_vector(file_path)

    except (QAFailure, ExtractionFailure):
        raise
    except Exception as exc:
        raise ExtractionFailure(str(exc)) from exc

    raise ValueError(f"Unknown method: {method}")  # pragma: no cover


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    a = np.asarray(vec_a, dtype=np.float64)
    b = np.asarray(vec_b, dtype=np.float64)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def best_match(
    query_vector: List[float], candidates: List[Tuple[str, List[float]]]
) -> Tuple[str, float]:
    """Return (random_id, score) of the highest-cosine-similarity candidate.

    `candidates` is a list of (random_id, vector) pairs. Returns
    (None, 0.0) if `candidates` is empty.
    """
    best_id, best_score = None, 0.0
    for random_id, vector in candidates:
        score = cosine_similarity(query_vector, vector)
        if score > best_score or best_id is None:
            best_id, best_score = random_id, score
    return best_id, best_score
