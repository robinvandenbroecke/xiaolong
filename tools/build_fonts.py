# -*- coding: utf-8 -*-
"""Perkt de lettertypen in tot de tekens die de app gebruikt (fonts/*.woff).

Omgevingsvariabelen met de bronbestanden:
  WENKAI   LXGWWenKaiGB-Medium.ttf  (github.com/lxgw/LxgwWenkaiGB, releases)
  ANDIKA   map met Andika-Regular.ttf en Andika-Bold.ttf (google/fonts, ofl/andika)
  FREDOKA  Fredoka[wdth,wght].ttf (google/fonts, ofl/fredoka)
"""
import os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# tekens die niet uit de leerstof komen maar wel in de app staan
EXTRA = "福倒到小龙圆猴奶学中文你好太棒了加油没关系再试一次对很真厉害犭亻氵忄女口木日月目手火人大子马"
LATIN = "U+0020-007E,U+00A0-00FF,U+0100-017F,U+01CD-01DC,U+2010-2027,U+2190-2193,U+2713,U+2026,U+00B7"

chars = open(os.path.join(HERE, "cjk_chars.txt"), encoding="utf-8").read()
chars = "".join(sorted(set(chars + EXTRA)))
tmp = os.path.join(HERE, "cjk_chars.txt")
open(tmp, "w", encoding="utf-8").write(chars)

def subset(src, out, *args):
    cmd = ["pyftsubset", src, "--flavor=woff", "--layout-features=*", "--output-file=" + os.path.join(ROOT, "fonts", out)] + list(args)
    subprocess.run(cmd, check=True)
    print(out, os.path.getsize(os.path.join(ROOT, "fonts", out)), "bytes")

subset(os.environ["WENKAI"], "wenkai.woff", "--text-file=" + tmp, "--unicodes=U+3000-303F,U+FF01-FF1F,U+2026,U+00B7")
subset(os.path.join(os.environ["ANDIKA"], "Andika-Regular.ttf"), "andika-regular.woff", "--unicodes=" + LATIN)
subset(os.path.join(os.environ["ANDIKA"], "Andika-Bold.ttf"), "andika-bold.woff", "--unicodes=" + LATIN)
subset(os.environ["FREDOKA"], "fredoka.woff", "--unicodes=" + LATIN)
