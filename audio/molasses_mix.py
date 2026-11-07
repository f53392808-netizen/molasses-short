# Sound for the molasses short: synthesized SFX (template sfx_gen / dsp) + an original slow vibes/pad/bass score,
# mixed under voice.wav (voice unchanged, music +3 dB, SFX -6 dB, music ducked 3 dB under speech), exact length 63.0 s.
import json, numpy as np
from dsp import SR, ns, rng, lp, hp, colored, fades, dbg
import sfx_gen as G, instruments as I
DUR = 1890 / 30; N = ns(DUR); R = rng(1919)
def put(buf, x, t, g=1.0):
    i = ns(t); x = x[: max(0, N - i)]; buf[i:i + len(x)] += x * g
def noise_bed(dur, lo, hi, seed):
    r = rng(seed); y = colored(ns(dur), r, 1.0); return hp(lp(y, hi), lo)
def env(n, a, b):
    t = np.arange(n) / SR; return np.clip(np.minimum(t / max(a, 1e-3), (t[-1] - t) / max(b, 1e-3)), 0, 1)
def roar(dur, seed, bright=900):
    y = noise_bed(dur, 30, bright, seed); y += 0.5 * lp(colored(ns(dur), rng(seed + 1), 2.0), 120)
    return y / (np.abs(y).max() + 1e-9)
def boom(r, dur=2.5, f=48):
    t = np.arange(ns(dur)) / SR
    y = np.sin(2 * np.pi * f * t * (1 - 0.25 * t / dur)) * np.exp(-t / 0.7) + 0.6 * lp(r.standard_normal(len(t)), 300) * np.exp(-t / 0.35)
    return fades(y / np.abs(y).max(), 0.002, 0.2)
def pop(r):
    t = np.arange(ns(0.25)) / SR
    y = hp(r.standard_normal(len(t)), 900) * np.exp(-t / 0.012) + 0.6 * np.sin(2 * np.pi * 1900 * t) * np.exp(-t / 0.03)
    return y / np.abs(y).max()
def clop(r):
    t = np.arange(ns(0.12)) / SR; y = (np.sin(2 * np.pi * 420 * t) + 0.5 * np.sin(2 * np.pi * 980 * t)) * np.exp(-t / 0.018)
    return y + 0.3 * hp(r.standard_normal(len(t)), 2000) * np.exp(-t / 0.006)
def groan(dur, r, f0=55):
    t = np.arange(ns(dur)) / SR; fm = f0 * (1 + 0.15 * np.sin(2 * np.pi * 0.7 * t) + 0.05 * r.standard_normal(len(t)).cumsum() / SR)
    ph = 2 * np.pi * np.cumsum(fm) / SR; y = sum(np.sin(k * ph) / k for k in (1, 2, 3, 5, 7))
    return lp(y, 900) * env(len(t), 0.4, 0.5)

sfx = np.zeros(N)
# hook: the wave rolling toward the lens, flash whoosh
put(sfx, roar(4.9, 1) * env(ns(4.9), 0.2, 0.3), 0.0, 0.8)
put(sfx, G.whoosh(1.0, rng(2), peak=0.25), 4.65, 0.7)
# street: murmur bed, horse hooves, a train on the el
put(sfx, noise_bed(5.3, 300, 2500, 3) * env(ns(5.3), 0.5, 0.6) * 0.15, 4.83)
put(sfx, G.babble(4.0, rng(4), 160, 1.0) * env(ns(4.0), 0.4, 0.6), 6.0, 0.35)
for k in range(10): put(sfx, clop(rng(10 + k)), 7.9 + k * 0.33 + 0.04 * (k % 2), 0.35)
put(sfx, roar(3.5, 5, 1400) * env(ns(3.5), 1.0, 1.2), 7.0, 0.25)
# drips (shots 3-5)
for k in range(10): put(sfx, pop(rng(30 + k)) * 0.2, 10.5 + k * 1.2)
# groan (shot 6) and rivets like gunfire, then the split + boom
put(sfx, groan(1.6, rng(40)), 23.4, 0.8); put(sfx, groan(2.0, rng(41), 42), 25.0, 0.7)
for t in [779, 783, 789, 794, 800]: put(sfx, pop(rng(t)), t / 30, 0.9)
put(sfx, boom(rng(50)), 27.15, 1.0)
# the wave: roar 27.3-35, firehouse crash, el slam
w = roar(8.0, 51) * env(ns(8.0), 0.15, 2.0); put(sfx, w, 27.3, 1.0)
put(sfx, G.wood_crack(rng(52)), 31.1, 0.9); put(sfx, boom(rng(53), 1.5, 70), 31.15, 0.6)
put(sfx, G.timber_tear(rng(54)) if hasattr(G, "timber_tear") else boom(rng(54)), 33.0, 0.5)
put(sfx, boom(rng(55), 1.8, 90), 33.0, 0.8)
# settling: slow thick bubbling (shots 10, 12)
put(sfx, G.bubbles(3.0, rng(56), 3, f_lo=120, f_hi=700) * 0.5, 36.4)
put(sfx, G.bubbles(4.0, rng(57), 2, f_lo=100, f_hi=600) * 0.5, 42.8)
# stamp thud (shot 14)
put(sfx, boom(rng(60), 0.4, 140), 1579 / 30, 0.7)
# hosing (shot 15)
put(sfx, noise_bed(2.8, 1500, 9000, 61) * env(ns(2.8), 0.3, 0.6) * 0.5, 54.9)
# summer evening: birds
put(sfx, G.bird_chirps(5.0, rng(62), density=0.6) * 0.5, 57.8)
sfx = sfx / (np.abs(sfx).max() + 1e-9) * 0.5

# ---- score: D minor, 66 bpm, vibes motif + warm pad + soft bass; lifts to D major for the summer ending ----
mus = np.zeros(N); beat = 60 / 66
def pad(f, dur, r):
    t = np.arange(ns(dur)) / SR
    y = sum(np.sin(2 * np.pi * f * k * t * (1 + 0.002 * d)) / k for k in (1, 2, 3) for d in (-1, 1))
    return lp(y, 1600) * env(len(t), 0.6, 0.8) * 0.2
prog = [(50, [62, 65, 69]), (46, [62, 65, 70]), (43, [62, 67, 70]), (45, [61, 64, 69])]
motif = [74, 72, 69, 70, 69, 65, 67, 69]
t = 0.0; bar = 4 * beat; k = 0
while t < DUR - 1:
    major = t > 57.6
    tense = 22.5 < t < 34.5
    root, ch = prog[k % 4]
    if major: root, ch = [(50, [62, 66, 69]), (55, [62, 67, 71]), (57, [61, 64, 69]), (50, [62, 66, 69])][k % 4]
    for m in ch: put(mus, pad(I.m2f(m), bar + 0.4, rng(k)), t, 0.6 if not tense else 0.3)
    put(mus, I.brass(I.m2f(root - 12), bar * 0.9, vel=0.35, r=rng(100 + k)) * 0.5, t)
    if not tense:
        for j in range(4):
            m = motif[(k * 4 + j) % 8] + (2 if major and motif[(k * 4 + j) % 8] in (65, 70, 72) else 0)
            put(mus, I.vibes(I.m2f(m), vel=0.45, r=rng(200 + k * 4 + j), dur=1.6), t + j * beat, 0.5)
    else:
        for j in range(8): put(mus, I.vibes(I.m2f(50 + (j % 2)), vel=0.3, r=rng(300 + j), dur=0.8), t + j * beat / 2, 0.4)
    t += bar; k += 1
# drop out for the toll (46.9-49.6), quiet under the snap
g = np.ones(N); tt_ = np.arange(N) / SR
g *= np.interp(tt_, [0, 46.6, 47.2, 49.4, 50.2, DUR], [1, 1, 0.15, 0.15, 1, 1])
g *= np.interp(tt_, [0, 26.9, 27.2, 28.4, 30, DUR], [1, 1, 0.2, 0.2, 1, 1])
g *= np.interp(tt_, [0, DUR - 1.8, DUR], [1, 1, 0])
mus = mus * g; mus = mus / (np.abs(mus).max() + 1e-9) * 0.5

# ---- voice + ducking + levels ----
import subprocess
raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", "../voice/voice.wav", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
v = np.zeros(N); vv = np.frombuffer(raw, np.float32); v[: min(N, len(vv))] = vv[:N]
words = json.load(open("../voice/words.json"))
duck = np.zeros(N)
for w in words: duck[ns(max(0, w["s"] - 0.08)): ns(w["e"] + 0.15)] = 1
duck = np.convolve(duck, np.ones(ns(0.15)) / ns(0.15), "same")
rms = lambda x: np.sqrt(np.mean(x[np.abs(x) > 1e-4] ** 2))
vr = rms(v)
mus_l = mus / rms(mus) * vr * dbg(-18 + 3) * dbg(-3 * duck)   # bed -18 dB re voice, +3 dB user rule
sfx_l = sfx / rms(sfx) * vr * dbg(-10 - 6)                      # effects -10 dB re voice, -6 dB user rule
mix = v + mus_l + sfx_l
mix = mix / np.abs(mix).max() * dbg(-1.2)
st = np.stack([mix, mix], 1)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", "mix.wav"], input=st.astype(np.float32).tobytes(), check=True)
for name, x in (("stem_music.wav", mus_l), ("stem_sfx.wav", sfx_l)):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s16le", name], input=x.astype(np.float32).tobytes(), check=True)
print("mix.wav", N / SR, "s")
