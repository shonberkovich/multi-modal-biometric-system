"""Voice biometric feature extraction module.

Removes silence from the input audio, then extracts a speaker embedding
using the pretrained speechbrain/spkrec-ecapa-voxceleb model.
"""
from typing import List, Union

import numpy as np

_classifier = None  # lazily loaded singleton (model load is expensive)


def _get_classifier():
    global _classifier
    if _classifier is None:
        from speechbrain.inference.speaker import EncoderClassifier
        from speechbrain.utils.fetching import LocalStrategy

        _classifier = EncoderClassifier.from_hparams(
            source="speechbrain/spkrec-ecapa-voxceleb",
            savedir="pretrained_models/spkrec-ecapa-voxceleb",
            # Symlinking the downloaded HF Hub cache into savedir requires
            # elevated privileges / dev mode on Windows; copy instead.
            local_strategy=LocalStrategy.COPY,
        )
    return _classifier


def _remove_silence(signal: np.ndarray, sample_rate: int, top_db: int = 30) -> np.ndarray:
    """Trim leading/trailing silence and drop silent interior segments."""
    import librosa

    intervals = librosa.effects.split(signal, top_db=top_db)
    if len(intervals) == 0:
        return signal
    return np.concatenate([signal[start:end] for start, end in intervals])


def extract_voice_vector(audio_path: str) -> List[float]:
    """Extract a speaker embedding vector from an audio file.

    Args:
        audio_path: Path to a mono/stereo audio file (wav/mp3/etc.).

    Returns:
        A list of floats representing the (L2-normalized) speaker embedding.

    Raises:
        ValueError: If the audio contains no non-silent speech.
    """
    import torch
    import librosa

    signal, sample_rate = librosa.load(audio_path, sr=16000, mono=True)
    signal = _remove_silence(signal, sample_rate)

    if signal.size == 0:
        raise ValueError("Audio contains no non-silent segments")

    classifier = _get_classifier()
    waveform = torch.tensor(signal, dtype=torch.float32).unsqueeze(0)
    embedding = classifier.encode_batch(waveform).squeeze().detach().numpy()

    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm

    return embedding.tolist()
