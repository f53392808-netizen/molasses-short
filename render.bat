@echo off
cd /d %~dp0
call npm install
call npx remotion render src/index.ts MolassesShort out\video.mp4 --crf 18
ffmpeg -y -i out\video.mp4 -i audio\mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest out\final.mp4
echo Done: out\final.mp4
pause
