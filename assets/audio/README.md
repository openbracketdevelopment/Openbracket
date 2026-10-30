# OpenBracket supplied audio

Original files are preserved byte-for-byte in `originals/`:

- `typing.mp3` — supplied `/Users/tam/Downloads/typing.mp3` (18.913 seconds).
- `turn-on.mp3` — supplied `/Users/tam/Downloads/turn-on.mp3` (10.136 seconds).
- `turn-off.mp3` — supplied `/Users/tam/Downloads/turn-off.mp3` (0.810 seconds).

Only processed derivatives in `public/audio/` are served by the website. No source file was overwritten. `edits.json` records original SHA-256 hashes, exact source ranges, gains, measured RMS/peak levels, durations and output sizes.

## Processing

Run `python3 scripts/prepare-audio.py --ffmpeg /path/to/ffmpeg` to reproduce the edits. FFmpeg is a preparation tool only; no runtime dependency was added to the website.

Three isolated typing transients were selected at 2.416–2.512, 3.208–3.298 and 4.108–4.198 seconds. The startup edit uses the concentrated first event at 0.185–0.725 seconds, excluding the later events around 1.3 and 6.4 seconds. Shutdown uses 0.085–0.405 seconds, retaining the primary transient and secondary decay. These selections were made from waveform/envelope analysis, not an auditory judgment about the recordings' contents.

Outputs are mono 22.05 kHz, 16-bit PCM WAV: about 50 KB total, broadly browser-compatible, with no codec priming delay. Gentle 55 Hz high-pass and 8.5 kHz low-pass filters remove rumble and limit the upper bandwidth. Boundary fades are 1–2 ms at entry and 10–25 ms at exit. Gain targets are conservative and peak-limited to −11 dBFS for keys and −7 dBFS for power; runtime gains keep typing below power cues. No denoising, compression, limiting, or time-stretching was applied. Gain is limited mathematically before writing, with no clipped samples.

The three key buffers cycle at their recorded pitch and retain their tails. They are triggered by the existing visible-character events, with no clicks during deletion, pauses or whole-line boot output. At most three interaction voices overlap. Power cues start once per accepted action; the primary transients occur approximately 15–30 ms after activation, during the initial screen transition. The 540 ms startup clip ends during the existing 850 ms warm-up; the 320 ms shutdown clip decays during the existing 540 ms collapse/contraction/afterglow. Visual timing was preserved; no aggressive audio stretching was used.

The audio controller fetches and decodes each clip once per mounted controller, caches successes, retries missing files on a later enable, aborts requests on disposal, and never queues missed cues. The old synthesized interaction effects were removed. The room ambience now uses the separate supplied recording described below. Mute and hidden-tab handling remain independent of terminal playback. Fresh page loads always request audio and normal-motion terminal playback; old stored mute settings are ignored.

## Listening limitation

The editing environment did not provide reliable audio audition. Original and processed clips were inspected for waveform transients, silence, levels, duration, fade endpoints and clipping; playback scheduling and mute/power/typing integration are covered by automated tests. **Individual clips and the full interaction sequence still require a listening pass** to confirm that the selected sections are semantically appropriate, the tails sound natural, and the perceived loudness/repetition are comfortable. No claim is made that the recordings were heard or that subjective listening QA is complete.

## Supplied background ambience

`originals/background-noise.mp3` preserves the approximately 309-second recording from `/Users/tam/Downloads/background-noise.mp3`. `python3 scripts/prepare-ambience.py --ffmpeg /path/to/ffmpeg` produces `public/audio/room-ambience.mp3`: a 30-second mono 22.05 kHz/64 kbps MP3 loop, approximately 241 KB. The 10–41 second source section is level-stable (roughly −43 dBFS RMS); a one-second linear overlap crossfade connects its end and beginning. Source levels and speed are preserved, with no denoising, compression or pitch change. Runtime gain is 0.18 with a 300ms fade-in, keeping ambience well below interaction effects. The file loads/decodes once with the other buffers and loops through Web Audio; mute/hidden-tab/unmount handling covers it. See `ambience-edit.json` for the source hash and exact range. Auditory review was unavailable, so the loop's content and subjective seamlessness still need listening confirmation.
