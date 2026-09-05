"""Gait biometric feature extraction module.

Runs MediaPipe's PoseLandmarker task over every frame of a video, collects
the 33 body landmark coordinates per frame, and flattens the resulting time
series into a fixed-size vector via temporal pooling (per-landmark mean +
std across all frames).
"""
import os
import urllib.request
from typing import List

import cv2
import numpy as np

_pose_landmarker = None

NUM_LANDMARKS = 33
COORDS_PER_LANDMARK = 3  # x, y, z

_MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
_POSE_MODEL_PATH = os.path.join(_MODEL_DIR, "pose_landmarker.task")
_POSE_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
)


def _ensure_pose_model() -> str:
    if not os.path.exists(_POSE_MODEL_PATH):
        os.makedirs(_MODEL_DIR, exist_ok=True)
        urllib.request.urlretrieve(_POSE_MODEL_URL, _POSE_MODEL_PATH)
    return _POSE_MODEL_PATH


def _get_pose_landmarker():
    global _pose_landmarker
    if _pose_landmarker is None:
        from mediapipe.tasks import python as mp_python
        from mediapipe.tasks.python import vision

        options = vision.PoseLandmarkerOptions(
            base_options=mp_python.BaseOptions(model_asset_path=_ensure_pose_model()),
            running_mode=vision.RunningMode.VIDEO,
            min_pose_detection_confidence=0.5,
        )
        _pose_landmarker = vision.PoseLandmarker.create_from_options(options)
    return _pose_landmarker


def _extract_landmark_sequence(video_path: str) -> np.ndarray:
    """Return an (num_frames, 33*3) array of pose landmark coordinates."""
    import mediapipe as mp

    landmarker = _get_pose_landmarker()
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_vectors = []
    frame_index = 0

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            timestamp_ms = int((frame_index / fps) * 1000)
            result = landmarker.detect_for_video(mp_image, timestamp_ms)
            frame_index += 1

            if not result.pose_landmarks:
                continue

            coords = [c for lm in result.pose_landmarks[0] for c in (lm.x, lm.y, lm.z)]
            frame_vectors.append(coords)
    finally:
        cap.release()

    return np.array(frame_vectors, dtype=np.float32)


def pool_landmark_sequence(sequence: np.ndarray) -> List[float]:
    """Temporal pooling: concatenate the per-coordinate mean and standard
    deviation across all frames of a (num_frames, num_coords) landmark
    sequence into one fixed-size, L2-normalized vector.

    Works on any joint-coordinate time series, not just MediaPipe Pose's
    33 landmarks - see benchmarks/eval_gait.py, which pools a public
    motion-capture dataset's own (differently-shaped) joint sequences
    with this same function.
    """
    if sequence.size == 0:
        raise ValueError("Empty landmark sequence - no frames to pool")

    mean_vec = sequence.mean(axis=0)
    std_vec = sequence.std(axis=0)
    vector = np.concatenate([mean_vec, std_vec])

    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector.tolist()


def extract_gait_vector(video_path: str) -> List[float]:
    """Extract a fixed-size gait feature vector from a video file.

    Runs MediaPipe Pose over every frame, then temporally pools the
    resulting (num_frames, 33*3) landmark sequence into a fixed
    (33*3*2 = 198)-dim vector via pool_landmark_sequence().

    Raises:
        ValueError: If no pose could be detected in any frame.
    """
    sequence = _extract_landmark_sequence(video_path)
    if sequence.size == 0:
        raise ValueError("No pose landmarks detected in any frame of the video")
    return pool_landmark_sequence(sequence)
