"""Automated Palmprint-recognition benchmark (bio_palm.py) on a public
contactless palmprint dataset.

Fully automated: downloads a public 99-identity palmprint ROI dataset
(github.com/ruofei7/Palmprint_Recognition, CASIA-style, MIT-licensed
student project - files named "<person_id>-<sample_id>.bmp") as a zip via
`requests`, extracts it into a tempfile.TemporaryDirectory(), evaluates,
and deletes the temp files when done.

Note: like virtually every publicly redistributable palmprint dataset,
this one ships as pre-segmented ~128x128 palm ROI patches rather than raw
hand photos (the untouched originals used by CASIA/IITD/Tongji require
per-institution registration and are not freely redistributable). There
is therefore no hand to run MediaPipe Hands landmark detection on here -
this script calls bio_palm.extract_palm_vector_from_roi() directly on
each patch, which is the ROI-to-embedding half of the same bio_palm.py
pipeline used in the live app (only the upstream hand-detection/cropping
step, which needs a full hand image, is out of scope for this dataset
format).

Usage:
    python benchmarks/eval_palm.py [n_pairs]
"""
import json
import os
import re
import sys
import tempfile
import zipfile
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # backend/ on path

import cv2
import numpy as np
import requests

import bio_palm
from benchmarks.metrics import compute_metrics

DATASET_URL = "https://raw.githubusercontent.com/ruofei7/Palmprint_Recognition/master/Palmprint.zip"
SPLIT_DIR = "Palmprint/testing"  # 99 identities x 3 samples, self-contained


def _download_and_extract(tmp_dir: str) -> str:
    print("Downloading public palmprint dataset zip...")
    response = requests.get(DATASET_URL, timeout=60)
    response.raise_for_status()
    zip_path = os.path.join(tmp_dir, "palmprint.zip")
    with open(zip_path, "wb") as f:
        f.write(response.content)

    print("Extracting...")
    with zipfile.ZipFile(zip_path) as zf:
        zf.extractall(tmp_dir)
    return os.path.join(tmp_dir, SPLIT_DIR)


def _build_pairs(images_by_id: dict, n_pairs: int, seed: int = 42):
    """Build a balanced set of genuine (same-id) and impostor (diff-id) pairs."""
    rng = np.random.default_rng(seed)
    ids = list(images_by_id.keys())
    n_genuine = n_pairs // 2
    n_impostor = n_pairs - n_genuine

    genuine_pairs = []
    for person_id, files in images_by_id.items():
        for i in range(len(files)):
            for j in range(i + 1, len(files)):
                genuine_pairs.append((files[i], files[j], 1))
    rng.shuffle(genuine_pairs)
    genuine_pairs = genuine_pairs[:n_genuine]

    impostor_pairs = []
    attempts = 0
    while len(impostor_pairs) < n_impostor and attempts < n_impostor * 20:
        attempts += 1
        id_a, id_b = rng.choice(ids, size=2, replace=False)
        file_a = images_by_id[id_a][rng.integers(len(images_by_id[id_a]))]
        file_b = images_by_id[id_b][rng.integers(len(images_by_id[id_b]))]
        impostor_pairs.append((file_a, file_b, 0))

    all_pairs = genuine_pairs + impostor_pairs
    rng.shuffle(all_pairs)
    return all_pairs


def run(n_pairs: int = 500, seed: int = 42) -> dict:
    with tempfile.TemporaryDirectory() as tmp_dir:
        split_path = _download_and_extract(tmp_dir)

        images_by_id = defaultdict(list)
        for fname in os.listdir(split_path):
            match = re.match(r"(\d+)-\d+\.bmp", fname)
            if match:
                images_by_id[match.group(1)].append(os.path.join(split_path, fname))

        pairs = _build_pairs(images_by_id, n_pairs, seed=seed)

        scores, labels, skipped = [], [], 0
        for count, (path_a, path_b, label) in enumerate(pairs, start=1):
            img_a, img_b = cv2.imread(path_a), cv2.imread(path_b)
            if img_a is None or img_b is None:
                skipped += 1
                continue
            vec_a = bio_palm.extract_palm_vector_from_roi(img_a)
            vec_b = bio_palm.extract_palm_vector_from_roi(img_b)
            scores.append(float(np.dot(vec_a, vec_b)))
            labels.append(label)
            if count % 50 == 0:
                print(f"  processed {count}/{len(pairs)} pairs...")

        metrics = compute_metrics(scores, labels)
        metrics.update(
            {
                "method": "palm",
                "dataset": "ruofei7/Palmprint_Recognition (CASIA-style, 99 identities)",
                "n_pairs_skipped": skipped,
            }
        )
        return metrics
    # TemporaryDirectory is auto-deleted on exit, per the automated-cleanup requirement.


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 500
    result = run(n_pairs=n)
    print(json.dumps(result, indent=2))
