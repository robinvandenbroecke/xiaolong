#!/bin/bash
# Bouwt alles opnieuw na een wijziging in tools/content_src.py.
#
# Nodig (zie README): audio-cmn, sherpa-onnx met Kokoro en Paraformer,
# python-pinyin. Zet de paden in deze variabelen:
#   AUDIO_CMN   map met https://github.com/hugolpz/audio-cmn
#   TTS_DIR     map met sherpa-onnx-v1.13.8-linux-x64-static, kokoro-multi-lang-v1_1
#               en sherpa-onnx-paraformer-zh-2024-03-09
#   PYPINYIN    map met https://github.com/mozillazg/python-pinyin
set -e
cd "$(dirname "$0")/.."
export SYLLABLE_LIST="$AUDIO_CMN/lists/pin1yin1-syllables-all-by-letter.txt"
export PYTHONPATH="$PYPINYIN"
python3 tools/build_audio.py          # audio/ en audio/manifest.json
python3 tools/build_content.py        # js/content.js en tools/cjk_chars.txt
python3 tools/build_sync.py           # sync/Code.gs
python3 tools/build_sw.py             # sw.js
echo "Klaar. Lettertypen opnieuw maken is alleen nodig bij nieuwe tekens (zie README)."
