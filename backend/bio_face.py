"""Face biometric feature extraction module.

Takes a raw face image, and outputs a normalized 512-d Facenet512 embedding
via DeepFace.represent().
"""
from typing import List, Union

import numpy as np


def extract_face_vector(image: Union[str, np.ndarray]) -> List[float]:
    """Extract a 512-d Facenet512 face embedding.

    Args:
        image: Path to an image file, or a BGR numpy array (as read by cv2.imread).

    Returns:
        A 512-length list of floats (L2-normalized).

    Raises:
        ValueError: If no face could be detected/embedded in the image.
    """
    from deepface import DeepFace

    try:
        result = DeepFace.represent(
            img_path=image,
            model_name="Facenet512",
            # The installed opencv-python wheel does not bundle Haar cascade
            # data files (DeepFace's default "opencv" detector needs them),
            # and modern mediapipe (>=1.0) dropped the legacy `solutions` API
            # DeepFace's "mediapipe" backend relies on. mtcnn is a pure
            # TensorFlow detector with no such dependency.
            detector_backend="mtcnn",
            enforce_detection=True,
        )
    except Exception as exc:
        raise ValueError(f"Face embedding failed: {exc}") from exc

    if not result:
        raise ValueError("No face detected in image")

    vector = np.array(result[0]["embedding"], dtype=np.float32)
    norm = np.linalg.norm(vector)
    if norm > 0:
        vector = vector / norm

    return vector.tolist()
