# Render (in chunks; SwiftShader, Remotion's own headless shell)
npx remotion render src/index.ts MolassesShort out/part_0000.mp4 --gl=swangle --frames=0-249 --scale 0.6667 --crf 18 --concurrency=1
# ...repeat for 250-499, 500-749, ... 1750-1889, then concat and mux:
# ffmpeg -f concat -safe 0 -i parts.txt -i audio/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest out/molasses_final.mp4
# Each new page rebuilds the world (~80-90 s setup); per-frame cost after that not measured here (skill note: ~2.3 s/frame at 720p).
