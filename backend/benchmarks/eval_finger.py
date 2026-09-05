"""Automated Fingerprint-recognition benchmark (bio_fingerprint.py) on the
public SOCOFing dataset.

Fully automated: downloads a Hugging Face Hub mirror of SOCOFing
(600 subjects x 10 fingers, ~898MB) via `requests` into a
tempfile.TemporaryDirectory(), extracts only the specific images sampled
for pairing, evaluates, and cleans up.

Pairing strategy: SOCOFing provides exactly one "Real" capture per finger
per subject (no repeated real captures to pair against each other), plus
three synthetically altered versions of every real image (Altered-Easy/
-Medium/-Hard: obliteration, central rotation, or z-cut distortions of
that same real fingerprint) - this is the standard way SOCOFing is used
for verification benchmarks in the literature. A genuine pair matches a
Real image against one of its own Altered versions (same finger); an
impostor pair matches unrelated fingers/subjects.

Usage:
    python benchmarks/eval_finger.py [n_pairs]
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

import bio_fingerprint
from benchmarks.metrics import compute_metrics

DATASET_URL = "https://huggingface.co/datasets/ThanhQuy78/socofing/resolve/main/socofing.zip"
FILENAME_RE = re.compile(r"(\d+)__[MF]_(Left|Right)_(\w+finger)")


def _finger_id(filename: str):
    """Extract a (subject_id, hand, finger) key identifying one real finger."""
    match = FILENAME_RE.search(os.path.basename(filename))
    return match.groups() if match else None


def _list_remote_members(zip_bytes_path: str):
    with zipfile.ZipFile(zip_bytes_path) as zf:
        return zf.namelist()


def _build_pairs(real_by_finger: dict, altered_by_finger: dict, n_pairs: int, seed: int = 42):
    rng = np.random.default_rng(seed)
    finger_ids = [fid for fid in real_by_finger if fid in altered_by_finger]
    n_genuine = n_pairs // 2
    n_impostor = n_pairs - n_genuine

    genuine_pairs = []
    rng.shuffle(finger_ids)
    for fid in finger_ids[:n_genuine]:
        altered = altered_by_finger[fid]
        genuine_pairs.append((real_by_finger[fid], altered[rng.integers(len(altered))], 1))

    impostor_pairs = []
    attempts = 0
    while len(impostor_pairs) < n_impostor and attempts < n_impostor * 20:
        attempts += 1
        fid_a, fid_b = rng.choice(len(finger_ids), size=2, replace=False)
        impostor_pairs.append((real_by_finger[finger_ids[fid_a]], real_by_finger[finger_ids[fid_b]], 0))

    all_pairs = genuine_pairs + impostor_pairs
    rng.shuffle(all_pairs)
    return all_pairs


def run(n_pairs: int = 500, seed: int = 42) -> dict:
    with tempfile.TemporaryDirectory() as tmp_dir:
        print("Downloading public SOCOFing dataset zip (~898MB)...")
        zip_path = os.path.join(tmp_dir, "socofing.zip")
        response = requests.get(DATASET_URL, headers={"User-Agent": "Mozilla/5.0"}, stream=True, timeout=180)
        response.raise_for_status()
        with open(zip_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=1 << 20):
                f.write(chunk)

        with zipfile.ZipFile(zip_path) as zf:
            names = zf.namelist()
            real_by_finger, altered_by_finger = {}, defaultdict(list)
            for name in names:
                if not name.lower().endswith((".bmp", ".jpg", ".png")):
                    continue
                fid = _finger_id(name)
                if fid is None:
                    continue
                if "/Real/" in name or name.startswith("Real/"):
                    real_by_finger[fid] = name
                elif "/Altered-" in name or name.startswith("Altered-"):
                    altered_by_finger[fid].append(name)

            pairs = _build_pairs(real_by_finger, altered_by_finger, n_pairs, seed=seed)

            needed = {m for pair in pairs for m in (pair[0], pair[1])}
            extract_dir = os.path.join(tmp_dir, "extracted")
            for member in needed:
                zf.extract(member, extract_dir)

        scores, labels, skipped = [], [], 0
        for count, (name_a, name_b, label) in enumerate(pairs, start=1):
            img_a = cv2.imread(os.path.join(extract_dir, name_a))
            img_b = cv2.imread(os.path.join(extract_dir, name_b))
            if img_a is None or img_b is None:
                skipped += 1
                continue
            vec_a = bio_fingerprint.extract_fingerprint_vector(img_a)
            vec_b = bio_fingerprint.extract_fingerprint_vector(img_b)
            scores.append(float(np.dot(vec_a, vec_b)))
            labels.append(label)
            if count % 50 == 0:
                print(f"  processed {count}/{len(pairs)} pairs...")

        metrics = compute_metrics(scores, labels)
        metrics.update(
            {
                "method": "fingerprint",
                "dataset": "SOCOFing (HF mirror, 600 subjects x 10 fingers)",
                "n_pairs_skipped": skipped,
            }
        )
        return metrics


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 500
    result = run(n_pairs=n)
    print(json.dumps(result, indent=2))
