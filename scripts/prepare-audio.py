#!/usr/bin/env python3
"""Prepare supplied recordings without modifying originals (requires FFmpeg)."""
import argparse
import array
import hashlib
import json
import math
from pathlib import Path
import subprocess
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
# Waveform-selected isolated transients; editorial listening remains required.
EDITS = [
    ("typing.mp3", "key-1.wav", 2.416, 2.512, -29, -11, 0.001, 0.010),
    ("typing.mp3", "key-2.wav", 3.208, 3.298, -29, -11, 0.001, 0.010),
    ("typing.mp3", "key-3.wav", 4.108, 4.198, -29, -11, 0.001, 0.010),
    ("turn-on.mp3", "power-on.wav", 0.185, 0.725, -24, -7, 0.002, 0.025),
    ("turn-off.mp3", "power-off.wav", 0.085, 0.405, -24, -7, 0.002, 0.020),
]

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", default="ffmpeg")
    args = parser.parse_args()
    output = ROOT / "public/audio"
    output.mkdir(parents=True, exist_ok=True)
    report = []
    with tempfile.TemporaryDirectory() as temporary:
        for source, target, start, end, rms_db, peak_db, fade_in, fade_out in EDITS:
            original = ROOT / "assets/audio/originals" / source
            decoded = Path(temporary) / target
            duration = end - start
            filters = f"atrim=start={start}:end={end},asetpts=PTS-STARTPTS,highpass=f=55,lowpass=f=8500,afade=t=in:d={fade_in},afade=t=out:st={duration-fade_out}:d={fade_out}"
            subprocess.run([args.ffmpeg, "-hide_banner", "-loglevel", "error", "-i", str(original), "-af", filters, "-ac", "1", "-ar", "22050", "-c:a", "pcm_s16le", str(decoded)], check=True)
            with wave.open(str(decoded)) as audio:
                data = array.array("h", audio.readframes(audio.getnframes()))
            values = [value / 32768 for value in data]
            rms = math.sqrt(sum(value * value for value in values) / len(values))
            peak = max(abs(value) for value in values)
            gain = min(10 ** (rms_db / 20) / max(rms, 1e-9), 10 ** (peak_db / 20) / max(peak, 1e-9))
            processed = array.array("h", (round(value * gain) for value in data))
            with wave.open(str(output / target), "wb") as audio:
                audio.setparams((1, 2, 22050, 0, "NONE", "not compressed"))
                audio.writeframes(processed.tobytes())
            report.append({"source": source, "source_sha256": hashlib.sha256(original.read_bytes()).hexdigest(), "output": target, "source_start": start, "source_end": end, "duration": len(processed) / 22050, "gain_db": round(20 * math.log10(gain), 2), "peak_dbfs": round(20 * math.log10(max(abs(value) for value in processed) / 32768), 2), "rms_dbfs": round(20 * math.log10(rms * gain), 2), "bytes": (output / target).stat().st_size})
    (ROOT / "assets/audio/edits.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))

if __name__ == "__main__":
    main()
