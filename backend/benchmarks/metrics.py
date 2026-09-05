"""Shared verification metrics: Accuracy, FAR, FRR, EER.

Used by every eval_*.py benchmark script in this package.
"""
from typing import Sequence

import numpy as np


def compute_metrics(scores: Sequence[float], labels: Sequence[int]) -> dict:
    """Compute Accuracy/FAR/FRR/EER from similarity scores + genuine/impostor labels.

    Args:
        scores: cosine-similarity scores, one per pair.
        labels: 1 for a genuine (same-identity) pair, 0 for an impostor pair.

    Sweeps every observed score as a candidate match threshold and reports
    the metrics at the threshold where FAR and FRR are closest (the EER
    operating point); EER is their average at that point.
    """
    scores = np.asarray(scores, dtype=np.float64)
    labels = np.asarray(labels, dtype=np.int64)

    if len(scores) == 0:
        return {"accuracy": None, "far": None, "frr": None, "eer": None, "threshold": None, "n_pairs": 0}

    genuine = labels == 1
    impostor = labels == 0

    best = None
    for threshold in np.unique(scores):
        predicted_match = scores >= threshold
        far = float(np.mean(predicted_match[impostor])) if impostor.any() else 0.0
        frr = float(np.mean(~predicted_match[genuine])) if genuine.any() else 0.0
        accuracy = float(np.mean(predicted_match == genuine))
        diff = abs(far - frr)
        if best is None or diff < best[0]:
            best = (diff, float(threshold), far, frr, accuracy)

    _, threshold, far, frr, accuracy = best
    return {
        "accuracy": accuracy,
        "far": far,
        "frr": frr,
        "eer": (far + frr) / 2,
        "threshold": threshold,
        "n_pairs": int(len(scores)),
    }
