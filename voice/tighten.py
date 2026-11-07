# Shrink long pauses in voice_raw.wav (Gemini TTS, slow pace), then speed up with ffmpeg atempo to the target length.
import subprocess, re, json, numpy as np, sys
SR = 48000
raw = subprocess.run(["ffmpeg","-v","quiet","-i","voice_raw.wav","-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout
x = np.frombuffer(raw, np.float32).copy()
log = subprocess.run(["ffmpeg","-hide_banner","-i","voice_raw.wav","-af","silencedetect=noise=-40dB:d=0.2","-f","null","-"],capture_output=True,text=True).stderr
st = [float(v) for v in re.findall(r"silence_start: ([\d.]+)", log)]; en = [float(v) for v in re.findall(r"silence_end: ([\d.]+)", log)]
words = json.load(open("words_raw.json"))
def sentence_end(t):  # is the word just before t sentence-final?
    prev = [w for w in words if w["e"] <= t + 0.05]
    return bool(prev) and prev[-1]["w"][-1] in ".?!"
segs, cur = [], 0.0
lead = 0.12
for a, b in zip(st, en):
    if a < 0.05:  # leading silence
        cur = max(0, b - lead); continue
    cap = 0.46 if sentence_end(a) else 0.22
    if b - a > cap:
        segs.append((cur, a + cap * 0.5)); cur = b - cap * 0.5
segs.append((cur, len(x) / SR))
y = np.concatenate([x[int(a * SR):int(b * SR)] for a, b in segs])
# 6 ms crossfade-free joins are inside silence (< -40 dB), so no clicks
tight = len(y) / SR
target = float(sys.argv[1]) if len(sys.argv) > 1 else 61.5
tempo = tight / target
print(f"raw {len(x)/SR:.2f}s -> tight {tight:.2f}s, tempo {tempo:.3f}")
y.astype(np.float32).tofile("tight.f32")
subprocess.run(["ffmpeg","-v","error","-y","-f","f32le","-ar",str(SR),"-ac","1","-i","tight.f32","-af",f"atempo={tempo:.4f},highpass=f=60,loudnorm=I=-16:TP=-1.5:LRA=7","-ar",str(SR),"-c:a","pcm_s16le","voice.wav"],check=True)
