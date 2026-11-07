#!/bin/bash
cd /workspace/projects/13fc64db-b353-4066-badc-996621f64fe7/molasses_1919
mkdir -p out/parts
T0=$(date +%s)
for s in $(seq 0 150 1889); do
  e=$((s+149)); [ $e -gt 1889 ] && e=1889
  f=out/parts/p_$(printf %04d $s).mp4
  [ -s $f.done ] && continue
  el=$(( $(date +%s)-T0 ))
  [ $el -gt 900 ] && { echo "pause at $s after ${el}s"; exit 0; }
  t=$(date +%s)
  npx remotion render src/index.ts MolassesShort $f --gl=swangle --frames=$s-$e --width=720 --height=1280 --crf 18 --concurrency=2 --timeout=150000 --log=error > out/rc_$s.log 2>&1 && touch $f.done
  echo "chunk $s-$e exit $? $(( $(date +%s)-t ))s"
done
ls out/parts/*.done | wc -l
