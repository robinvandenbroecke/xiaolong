# -*- coding: utf-8 -*-
"""Maakt sync/Code.gs: het Apps Script met een kopie van js/merge.js erin."""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
src = open(os.path.join(ROOT, "sync", "Code.src.gs"), encoding="utf-8").read()
merge = open(os.path.join(ROOT, "js", "merge.js"), encoding="utf-8").read()
# In Apps Script bestaat 'self' niet; 'this' is het globale object.
merge = merge.replace("typeof self !== 'undefined' ? self : this", "typeof globalThis !== 'undefined' ? globalThis : this")
out = src.replace("/*@@MERGE@@*/", merge)
open(os.path.join(ROOT, "sync", "Code.gs"), "w", encoding="utf-8").write(out)
print("sync/Code.gs", len(out), "tekens")
