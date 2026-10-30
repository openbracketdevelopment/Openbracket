#!/usr/bin/env python3
"""Build a 30-second crossfaded loop from the supplied room recording."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--ffmpeg", default="ffmpeg")
args = parser.parse_args()
source = root / "assets/audio/originals/background-noise.mp3"
output = root / "public/audio/room-ambience.mp3"
# Sequence middle -> tail/head blend -> middle gives a continuous loop boundary.
filters = "[0:a]atrim=start=10:end=41,asetpts=PTS-STARTPTS,asplit=3[h][m][t];[h]atrim=end=1,asetpts=PTS-STARTPTS[head];[m]atrim=start=1:end=30,asetpts=PTS-STARTPTS[middle];[t]atrim=start=30,asetpts=PTS-STARTPTS[tail];[tail][head]acrossfade=d=1:c1=tri:c2=tri[seam];[middle][seam]concat=n=2:v=0:a=1[out]"
subprocess.run([args.ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(source), "-filter_complex", filters, "-map", "[out]", "-ac", "1", "-ar", "22050", "-c:a", "libmp3lame", "-b:a", "64k", str(output)], check=True)
(root / "assets/audio/ambience-edit.json").write_text(json.dumps({"source": source.name, "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(), "source_range_seconds": [10, 41], "crossfade_seconds": 1, "loop_seconds": 30, "output": output.name, "bytes": output.stat().st_size, "audition": "Not available; waveform/level analysis only"}, indent=2) + "\n")
print(f"Prepared {output.name}: {output.stat().st_size} bytes")
