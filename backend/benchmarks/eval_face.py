"""Automated Face-recognition benchmark (bio_face.py) on the public LFW dataset.

Fully automated: sklearn.datasets.fetch_lfw_pairs downloads and caches the
dataset itself on first run (to ~/scikit_learn_data) - no manual download
or folder setup required.

Usage:
    python benchmarks/eval_face.py [n_pairs]
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # backend/ on path

import numpy as np
from sklearn.datasets import fetch_lfw_pairs

import bio_face
from benchmarks.metrics import compute_metrics


def run(n_pairs: int = 500, seed: int = 42) -> dict:
    print(f"Fetching LFW pairs dataset (auto-downloaded/cached by scikit-learn)...")
    data = fetch_lfw_pairs(subset="test", color=True, resize=1.0)
    pairs, labels = data.pairs, data.target

    n_pairs = min(n_pairs, len(pairs))
    rng = np.random.default_rng(seed)
    indices = rng.choice(len(pairs), size=n_pairs, replace=False)

    scores, used_labels, skipped = [], [], 0
    for count, i in enumerate(indices, start=1):
        img_a = (pairs[i, 0] * 255).astype(np.uint8)[:, :, ::-1]  # RGB -> BGR
        img_b = (pairs[i, 1] * 255).astype(np.uint8)[:, :, ::-1]
        try:
            vec_a = bio_face.extract_face_vector(img_a)
            vec_b = bio_face.extract_face_vector(img_b)
        except Exception:
            skipped += 1
            continue
        scores.append(float(np.dot(vec_a, vec_b)))  # both already L2-normalized
        used_labels.append(int(labels[i]))
        if count % 50 == 0:
            print(f"  processed {count}/{n_pairs} pairs...")

    metrics = compute_metrics(scores, used_labels)
    metrics.update({"method": "face", "dataset": "LFW (sklearn fetch_lfw_pairs)", "n_pairs_skipped": skipped})
    return metrics


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 500
    result = run(n_pairs=n)
    print(json.dumps(result, indent=2))
