"""Automated Voice-recognition benchmark (bio_voice.py) on a public subset
of VoxCeleb1.

Fully automated: uses huggingface_hub.hf_hub_download (part of the Hugging
Face `datasets`/hub tooling) to fetch ProgramComputer/voxceleb's mirror of
the official VoxCeleb1 test set (vox1_test_wav.zip, ~1GB, 40 speakers,
4874 real interview clips) into a tempfile.TemporaryDirectory(), extracts
only the specific clips sampled for pairing, evaluates, and cleans up.

Note: `datasets.load_dataset` is used for TODO 8.1's suggested
HF-hub-native datasets, but the two candidates the spec names for voice
(VoxCeleb, PolyAI/minds14) don't work well through it here: minds14 has no
speaker-identity field at all (only intent/language labels, unusable for
verification pairs), and VoxCeleb's HF mirror is published as plain
zip files rather than a `datasets`-formatted repo. hf_hub_download is the
Hugging Face Hub library's own direct-file API - still a one-line,
fully-automated fetch, just not the `datasets.load_dataset` wrapper.

Usage:
    python benchmarks/eval_voice.py [n_pairs]
"""
import json
import os
import sys
import tempfile
import zipfile
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # backend/ on path

import numpy as np
from huggingface_hub import hf_hub_download

import bio_voice
from benchmarks.metrics import compute_metrics

REPO_ID = "ProgramComputer/voxceleb"
ZIP_PATH_IN_REPO = "vox1/vox1_test_wav.zip"


def _build_pairs(clips_by_speaker: dict, n_pairs: int, seed: int = 42):
    rng = np.random.default_rng(seed)
    speakers = list(clips_by_speaker.keys())
    n_genuine = n_pairs // 2
    n_impostor = n_pairs - n_genuine

    genuine_pairs = []
    attempts = 0
    while len(genuine_pairs) < n_genuine and attempts < n_genuine * 20:
        attempts += 1
        speaker = rng.choice(speakers)
        clips = clips_by_speaker[speaker]
        if len(clips) < 2:
            continue
        i, j = rng.choice(len(clips), size=2, replace=False)
        genuine_pairs.append((clips[i], clips[j], 1))

    impostor_pairs = []
    attempts = 0
    while len(impostor_pairs) < n_impostor and attempts < n_impostor * 20:
        attempts += 1
        spk_a, spk_b = rng.choice(speakers, size=2, replace=False)
        clip_a = clips_by_speaker[spk_a][rng.integers(len(clips_by_speaker[spk_a]))]
        clip_b = clips_by_speaker[spk_b][rng.integers(len(clips_by_speaker[spk_b]))]
        impostor_pairs.append((clip_a, clip_b, 0))

    all_pairs = genuine_pairs + impostor_pairs
    rng.shuffle(all_pairs)
    return all_pairs


def run(n_pairs: int = 500, seed: int = 42) -> dict:
    with tempfile.TemporaryDirectory() as tmp_dir:
        print("Downloading VoxCeleb1 test set (auto-fetched via huggingface_hub)...")
        zip_path = hf_hub_download(
            repo_id=REPO_ID,
            repo_type="dataset",
            filename=ZIP_PATH_IN_REPO,
            cache_dir=tmp_dir,
        )

        with zipfile.ZipFile(zip_path) as zf:
            all_members = [n for n in zf.namelist() if n.endswith(".wav")]
            clips_by_speaker = defaultdict(list)
            for member in all_members:
                speaker = member.split("/")[1]
                clips_by_speaker[speaker].append(member)

            pairs = _build_pairs(clips_by_speaker, n_pairs, seed=seed)

            needed_members = {m for pair in pairs for m in (pair[0], pair[1])}
            extract_dir = os.path.join(tmp_dir, "extracted")
            for member in needed_members:
                zf.extract(member, extract_dir)

        scores, labels, skipped = [], [], 0
        for count, (member_a, member_b, label) in enumerate(pairs, start=1):
            path_a = os.path.join(extract_dir, member_a)
            path_b = os.path.join(extract_dir, member_b)
            try:
                vec_a = bio_voice.extract_voice_vector(path_a)
                vec_b = bio_voice.extract_voice_vector(path_b)
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
                "method": "voice",
                "dataset": "VoxCeleb1 test set (HF mirror, 40 speakers)",
                "n_pairs_skipped": skipped,
            }
        )
        return metrics
    # tempfile.TemporaryDirectory() deletes the downloaded zip + extracted
    # clips automatically on exit, per the automated-cleanup requirement.


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 500
    result = run(n_pairs=n)
    print(json.dumps(result, indent=2))
