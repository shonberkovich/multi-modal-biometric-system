"""Automated Gait-recognition benchmark (bio_gait.py) on the public
ASPset-510 motion-capture dataset.

Fully automated: downloads the dataset's "trainval joints_3d" archive
(archive.org/details/aspset510, CC0-licensed, ~17MB - Google/CSIRO's
ASPset-510 3D human pose dataset) via `requests` into a
tempfile.TemporaryDirectory(), extracts it, evaluates, and cleans up.

Note: ASPset-510's public archives split video (multi-GB) from the 3D
joint annotations (17MB) as separate downloads. This script uses the
joint annotations directly - real per-frame 3D joint coordinates for 15
real subjects across ~30 clips each - rather than the raw video, which
means there's no video to run MediaPipe Pose on. It instead reads each
clip's 17-joint C3D motion-capture file and pools it with the exact same
bio_gait.pool_landmark_sequence() used downstream of MediaPipe Pose in
the live app (only the upstream "video -> per-frame joints" step, which
needs actual video frames, differs by necessity).

Usage:
    python benchmarks/eval_gait.py [n_pairs]
"""
import json
import os
import sys
import tarfile
import tempfile
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # backend/ on path

import c3d
import numpy as np
import requests

import bio_gait
from benchmarks.metrics import compute_metrics

DATASET_URL = "https://archive.org/download/aspset510/aspset510_v1_trainval-joints_3d.tar.gz"


def _download_and_extract(tmp_dir: str) -> str:
    print("Downloading public ASPset-510 3D-joints dataset...")
    response = requests.get(DATASET_URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=60)
    response.raise_for_status()
    archive_path = os.path.join(tmp_dir, "joints_3d.tar.gz")
    with open(archive_path, "wb") as f:
        f.write(response.content)

    print("Extracting...")
    with tarfile.open(archive_path) as tf:
        tf.extractall(tmp_dir, filter="data")
    return os.path.join(tmp_dir, "ASPset-510", "trainval", "joints_3d")


def _load_clip(path: str) -> np.ndarray:
    """Read a .c3d motion-capture clip into a (num_frames, 17*3) array."""
    with open(path, "rb") as f:
        reader = c3d.Reader(f)
        frames = [points[:, :3].reshape(-1) for _, points, _ in reader.read_frames()]
    return np.array(frames, dtype=np.float32)


def _build_pairs(clips_by_subject: dict, n_pairs: int, seed: int = 42):
    rng = np.random.default_rng(seed)
    subjects = list(clips_by_subject.keys())
    n_genuine = n_pairs // 2
    n_impostor = n_pairs - n_genuine

    genuine_pairs = []
    for subject, clips in clips_by_subject.items():
        for i in range(len(clips)):
            for j in range(i + 1, len(clips)):
                genuine_pairs.append((clips[i], clips[j], 1))
    rng.shuffle(genuine_pairs)
    genuine_pairs = genuine_pairs[:n_genuine]

    impostor_pairs = []
    attempts = 0
    while len(impostor_pairs) < n_impostor and attempts < n_impostor * 20:
        attempts += 1
        subj_a, subj_b = rng.choice(subjects, size=2, replace=False)
        clip_a = clips_by_subject[subj_a][rng.integers(len(clips_by_subject[subj_a]))]
        clip_b = clips_by_subject[subj_b][rng.integers(len(clips_by_subject[subj_b]))]
        impostor_pairs.append((clip_a, clip_b, 0))

    all_pairs = genuine_pairs + impostor_pairs
    rng.shuffle(all_pairs)
    return all_pairs


def run(n_pairs: int = 500, seed: int = 42) -> dict:
    with tempfile.TemporaryDirectory() as tmp_dir:
        joints_dir = _download_and_extract(tmp_dir)

        clips_by_subject = defaultdict(list)
        for subject in sorted(os.listdir(joints_dir)):
            subject_dir = os.path.join(joints_dir, subject)
            if not os.path.isdir(subject_dir):
                continue
            for fname in sorted(os.listdir(subject_dir)):
                if fname.endswith(".c3d"):
                    clips_by_subject[subject].append(os.path.join(subject_dir, fname))

        pairs = _build_pairs(clips_by_subject, n_pairs, seed=seed)

        scores, labels, skipped = [], [], 0
        for count, (path_a, path_b, label) in enumerate(pairs, start=1):
            try:
                seq_a, seq_b = _load_clip(path_a), _load_clip(path_b)
                vec_a = np.array(bio_gait.pool_landmark_sequence(seq_a))
                vec_b = np.array(bio_gait.pool_landmark_sequence(seq_b))
            except Exception:
                skipped += 1
                continue
            scores.append(float(np.dot(vec_a, vec_b)))
            labels.append(label)
            if count % 50 == 0:
                print(f"  processed {count}/{len(pairs)} pairs...")

        metrics = compute_metrics(scores, labels)
        metrics.update(
            {
                "method": "gait",
                "dataset": "ASPset-510 3D joints (archive.org, CC0, 15 subjects)",
                "n_pairs_skipped": skipped,
            }
        )
        return metrics


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 500
    result = run(n_pairs=n)
    print(json.dumps(result, indent=2))
