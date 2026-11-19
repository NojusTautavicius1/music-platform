"""Measure tempo, key and a few raw audio features for every file in public/audio.

Writes audio-analyzer/features.json ({song id: features}). The numbers are raw;
scripts/applyAudioAnalysis.ts turns them into energy / valence / mood and saves them.

    pip install librosa
    python audio-analyzer/analyze.py          # only files not in features.json yet
    python audio-analyzer/analyze.py --all    # everything again
"""

import json
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

import librosa
import numpy as np

AUDIO_DIR = Path("public/audio")
OUT = Path(__file__).with_name("features.json")
SR = 22050

NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
# Krumhansl-Kessler key profiles
MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


def estimate_key(chroma: np.ndarray) -> tuple[str, float]:
    """Best matching key, and how much more major than minor the song sounds (-1..1)."""
    profile = chroma.mean(axis=1)
    major = [np.corrcoef(profile, np.roll(MAJOR, i))[0, 1] for i in range(12)]
    minor = [np.corrcoef(profile, np.roll(MINOR, i))[0, 1] for i in range(12)]
    if max(major) >= max(minor):
        key = f"{NOTES[int(np.argmax(major))]} major"
    else:
        key = f"{NOTES[int(np.argmax(minor))]} minor"
    return key, float(max(major) - max(minor))


def fold_tempo(bpm: float) -> float:
    # Beat trackers often lock onto half or double time; keep it in a range people would tap along to.
    while bpm < 60:
        bpm *= 2
    while bpm >= 190:
        bpm /= 2
    return bpm


def analyze(path: Path) -> tuple[str, dict]:
    y, sr = librosa.load(path, sr=SR, mono=True, duration=30)
    onset = librosa.onset.onset_strength(y=y, sr=sr)
    bpm = float(librosa.feature.tempo(onset_envelope=onset, sr=sr, aggregate=np.median)[0])
    rms = librosa.feature.rms(y=y)[0]
    key, major_minus_minor = estimate_key(librosa.feature.chroma_cqt(y=y, sr=sr))
    return path.stem, {
        "bpm": round(fold_tempo(bpm), 1),
        "key": key,
        "loudness": round(float(20 * np.log10(rms.mean() + 1e-9)), 2),  # dBFS
        "onsetStrength": round(float(onset.mean()), 4),
        "brightness": round(float(librosa.feature.spectral_centroid(y=y, sr=sr).mean()), 1),  # Hz
        "majorness": round(major_minus_minor, 4),
    }


def main() -> None:
    features = {} if "--all" in sys.argv or not OUT.exists() else json.loads(OUT.read_text())
    todo = [p for p in sorted(AUDIO_DIR.glob("*.mp3")) if p.stem not in features]
    print(f"{len(todo)} files to analyse ({len(features)} already done)")

    with ProcessPoolExecutor() as pool:
        for n, (song_id, result) in enumerate(pool.map(analyze, todo), 1):
            features[song_id] = result
            print(f"[{n}/{len(todo)}] {song_id} {result['bpm']} BPM, {result['key']}")

    OUT.write_text(json.dumps(features, indent=1, sort_keys=True))
    print(f"saved {OUT}")


if __name__ == "__main__":
    main()
