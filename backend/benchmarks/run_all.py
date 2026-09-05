"""Run every eval_*.py benchmark and aggregate the results.

Saves the combined metrics to backend/benchmarks/consolidated_metrics.json.

Usage:
    python benchmarks/run_all.py [n_pairs]
"""
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # backend/ on path

from benchmarks import eval_face, eval_finger, eval_gait, eval_palm, eval_voice

OUTPUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "consolidated_metrics.json")

BENCHMARKS = {
    "face": eval_face.run,
    "voice": eval_voice.run,
    "palm": eval_palm.run,
    "gait": eval_gait.run,
    "fingerprint": eval_finger.run,
}


def run_all(n_pairs: int = 500) -> dict:
    results = {}
    for method, run_fn in BENCHMARKS.items():
        print(f"\n=== Running {method} benchmark ===")
        try:
            results[method] = run_fn(n_pairs=n_pairs)
        except Exception as exc:
            print(f"  {method} benchmark failed: {exc}")
            results[method] = {"error": str(exc)}

    consolidated = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "n_pairs_requested": n_pairs,
        "results": results,
    }

    with open(OUTPUT_PATH, "w") as f:
        json.dump(consolidated, f, indent=2)

    print(f"\nSaved consolidated metrics to {OUTPUT_PATH}")
    return consolidated


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 500
    run_all(n_pairs=n)
