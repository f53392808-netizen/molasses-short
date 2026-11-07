import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("base.en", device="cpu", compute_type="int8")
import subprocess, numpy as np
raw = subprocess.run(["ffmpeg","-v","quiet","-i",sys.argv[1],"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True).stdout
audio = np.frombuffer(raw, np.int16).astype(np.float32)/32768
segs, info = m.transcribe(audio, word_timestamps=True, beam_size=5, language="en")
out = []
for s in segs:
    for w in s.words:
        out.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
json.dump(out, open(sys.argv[2], "w"), indent=0)
print(" ".join(f"{o['w']}@{o['s']}" for o in out))
