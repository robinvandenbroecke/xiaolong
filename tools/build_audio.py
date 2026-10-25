# -*- coding: utf-8 -*-
"""Maakt alle geluidsbestanden in audio/ en audio/manifest.json.

Bronnen:
  - menselijke opnames uit audio-cmn (CC BY-SA): woorden (Yue Tan) en
    losse lettergrepen (Chen Wang)
  - spraaksynthese (Kokoro via sherpa-onnx) voor zinnen, verhalen en
    woorden zonder opname, en als tweede stem voor elk woord

Omgevingsvariabelen:
  AUDIO_CMN   map met de audio-cmn repository
  TTS_DIR     map met sherpa-onnx en de Kokoro- en Paraformer-modellen
  SYLLABLE_LIST, PYTHONPATH (pypinyin) zoals bij build_content.py

Stappen (allemaal standaard):  synth  asr  encode
"""
import hashlib, json, os, re, subprocess, sys, wave
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import content_src as C
import build_content as BC
from pitch import contour

ACMN = os.environ.get("AUDIO_CMN", "")
TTS = os.environ.get("TTS_DIR", "")
WORK = os.environ.get("AUDIO_WORK", os.path.join(TTS, "work"))
OUT = os.path.join(ROOT, "audio")
BIN = os.path.join(TTS, "sherpa-onnx-v1.13.8-linux-x64-static", "bin")
K = os.path.join(TTS, "kokoro-multi-lang-v1_1")
PARA = os.path.join(TTS, "sherpa-onnx-paraformer-zh-2024-03-09")

# Stemmen (Kokoro-sprekers). Gekozen op verstaanbaarheid via spraakherkenning.
VOICES = {
    "a": {"engine": "matcha", "len": 1.0},     # vrouw (Biaobei/baker), standaardstem
    "b": {"sid": 65, "len": 1.0},              # man, tweede stem
    "long": {"sid": 10, "len": 1.0},           # Xiǎolóng
    "yuan": {"sid": 44, "len": 1.0},           # Yuányuan
    "hou": {"sid": 36, "len": 1.0},            # Xiǎohóu
    "nai": {"sid": 30, "len": 1.05},           # Oma
    "all": {"engine": "matcha", "len": 1.0},
}
FALLBACK = "a"
MATCHA = os.path.join(TTS, "matcha-icefall-zh-baker")
SR = 24000

PUNCT = "，。！？、…,.!?"

def surface_tones(syls):
    """Uitgesproken tonen: derde toon voor derde toon wordt tweede toon."""
    tones = [s["t"] for s in syls]
    i = 0
    while i < len(tones):
        if tones[i] == 3:
            j = i
            while j + 1 < len(tones) and tones[j + 1] == 3:
                j += 1
            for k in range(i, j):
                tones[k] = 2
            i = j + 1
        else:
            i += 1
    return tones

def clauses(hz, syls):
    """Splitst in stukken tussen leestekens: [(tekst, lettergrepen)]."""
    out, cur, k = [], [], 0
    text = ""
    for ch in hz:
        if BC.HANZI_RE.match(ch):
            cur.append(syls[k]); text += ch; k += 1
        elif ch in PUNCT or ch == " ":
            if cur:
                out.append((text, cur)); cur, text = [], ""
    if cur:
        out.append((text, cur))
    return out

def lexicon_entries(sylmap, hz, syls):
    lines = []
    for text, cs in clauses(hz, syls):
        tones = surface_tones(cs)
        ph = []
        for s, t in zip(cs, tones):
            base = s["s"].replace("v", "ü")
            if base not in sylmap:
                raise SystemExit("geen klankteken voor %s" % base)
            ph.append(sylmap[base] + " " + str(t))
        lines.append(text + " " + " ".join(ph))
    return lines

# ---------------------------------------------------------------------------
def jobs():
    """Alle geluiden: sleutel -> lijst van (stem, bron)."""
    BC.BASES = BC.load_bases()
    have = set(l.strip() for l in open(os.path.join(ACMN, "lists", "cmn-audios_words.txt"), encoding="utf-8"))
    syl_have = set()
    for l in open(os.path.join(ACMN, "lists", "pin1yin1-syllables-all-by-letter.txt"), encoding="utf-8"):
        syl_have.add(l.strip().lower())
    J = {}
    texts = []   # (hz, syls) voor het eigen lexicon

    def human_word(hz):
        if hz in have:
            return ("h", "file", os.path.join(ACMN, "64k", "hsk", "cmn-%s.mp3" % hz))
        return None
    def human_syl(base, t):
        k = "%s%d" % (base.replace("ü", "v"), t)
        if k in syl_have:
            return ("s", "file", os.path.join(ACMN, "64k", "syllabs", "cmn-%s.mp3" % k))
        return None

    for u in C.UNITS:
        for it in u["items"]:
            syls = BC.syllabify(it["hz"], it["py"])
            texts.append((it["hz"], syls))
            srcs = []
            if it["k"] != "z" and len(syls) == 1:
                # losse lettergreep: alleen menselijke opnames (synthese zakt in toon weg)
                h = human_word(it["hz"])
                if h:
                    srcs.append(h)
                if syls[0]["t"] in (1, 2, 3, 4):
                    hs = human_syl(syls[0]["s"], syls[0]["t"])
                    if hs:
                        srcs.append(hs)
                if not srcs:
                    srcs.append(("a", "tts", it["hz"] + "。"))
            elif it["k"] != "z":
                h = human_word(it["hz"])
                srcs.append(h if h else ("a", "tts", it["hz"] + "。"))
                srcs.append(("b", "tts", it["hz"] + "。"))
            else:
                srcs.append(("a", "tts", it["hz"] + "。"))
                srcs.append(("b", "tts", it["hz"] + "。"))
            J[it["id"]] = srcs

    for sid, st in C.STORIES.items():
        for n, (who, hz, py, nl, scene) in enumerate(st["lines"]):
            syls = BC.syllabify(hz, py)
            texts.append((hz, syls))
            J["%s_%d" % (sid, n)] = [(who, "tts", hz)]

    for pid, hz, py, nl, kind in C.PRAISE:
        texts.append((hz, BC.syllabify(hz, py)))
        J[pid] = [("long", "tts", hz)]

    for sid, hz, py, nl, em, cat, fact in C.STICKERS:
        syls = BC.syllabify(hz, py)
        texts.append((hz, syls))
        h = human_word(hz)
        if not h and len(syls) == 1:
            h = human_syl(syls[0]["s"], syls[0]["t"])
        J[sid] = [h] if h else [("a", "tts", hz + "。")]

    for b in C.TONE_SYLLABLES:
        for t in (1, 2, 3, 4):
            h = human_syl(b, t)
            if h:
                J["syl_%s%d" % (b, t)] = [h]
    return J, texts

# ---------------------------------------------------------------------------
def run(cmd):
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

def synth(voice, text, out_wav, lex):
    v = VOICES[voice]
    if v.get("engine") == "matcha":
        cmd = [os.path.join(BIN, "sherpa-onnx-offline-tts"),
               "--matcha-acoustic-model=" + os.path.join(MATCHA, "model-steps-3.onnx"),
               "--matcha-vocoder=" + os.path.join(TTS, "vocos-22khz-univ.onnx"),
               "--matcha-lexicon=" + lex["matcha"],
               "--matcha-tokens=" + os.path.join(MATCHA, "tokens.txt"),
               "--tts-rule-fsts=%s,%s,%s" % (os.path.join(MATCHA, "phone.fst"), os.path.join(MATCHA, "date.fst"), os.path.join(MATCHA, "number.fst")),
               "--matcha-length-scale=%.2f" % v["len"], "--num-threads=1",
               "--output-filename=" + out_wav, text]
    else:
        cmd = [os.path.join(BIN, "sherpa-onnx-offline-tts"),
               "--kokoro-model=" + os.path.join(K, "model.onnx"),
               "--kokoro-voices=" + os.path.join(K, "voices.bin"),
               "--kokoro-tokens=" + os.path.join(K, "tokens.txt"),
               "--kokoro-data-dir=" + os.path.join(K, "espeak-ng-data"),
               "--kokoro-lexicon=%s,%s,%s" % (lex["kokoro"], os.path.join(K, "lexicon-zh.txt"), os.path.join(K, "lexicon-us-en.txt")),
               "--tts-rule-fsts=%s,%s,%s" % (os.path.join(K, "date-zh.fst"), os.path.join(K, "number-zh.fst"), os.path.join(K, "phone-zh.fst")),
               "--kokoro-length-scale=%.2f" % v["len"],
               "--sid=%d" % v["sid"], "--num-threads=1",
               "--output-filename=" + out_wav, text]
    r = run(cmd)
    if r.returncode != 0 or not os.path.exists(out_wav):
        raise RuntimeError("synthese mislukt: %s %s\n%s" % (voice, text, r.stderr[-500:]))

_BAKER_CHAR = None
def baker_char_tone(ch):
    """Toon die het baker-lexicon zelf voor een los teken gebruikt (None = licht, zonder cijfer)."""
    global _BAKER_CHAR
    if _BAKER_CHAR is None:
        _BAKER_CHAR = {}
        for line in open(os.path.join(MATCHA, "lexicon.txt"), encoding="utf-8"):
            parts = line.split()
            if len(parts) == 2 and len(parts[0]) == 1:
                m = re.match(r"[a-z]+([1-5])?$", parts[1])
                if m:
                    _BAKER_CHAR.setdefault(parts[0], int(m.group(1)) if m.group(1) else None)
    return _BAKER_CHAR.get(ch)

def matcha_entries(hz, syls):
    """Zoals het baker-model getraind is: lichte toon alleen bij echte partikels (了, 吗, 的…),
    anders de gewone toon van het teken; wel toonverandering bij derde tonen en 一/不."""
    lines = []
    for text, cs in clauses(hz, syls):
        tones = surface_tones(cs)
        out = []
        for s, t in zip(cs, tones):
            if t == 5:
                bt = baker_char_tone(s["c"])
                t = bt if bt else 5
            out.append(s["s"].replace("ü", "v") + ("" if t == 5 else str(t)))
        lines.append(text + " " + " ".join(out))
    return lines

def asr(wavs):
    out = []
    for i in range(0, len(wavs), 60):
        r = run([os.path.join(BIN, "sherpa-onnx-offline"), "--tokens=" + os.path.join(PARA, "tokens.txt"),
                 "--paraformer=" + os.path.join(PARA, "model.int8.onnx"), "--num-threads=2"] + wavs[i:i + 60])
        out.extend(json.loads(l)["text"] for l in (r.stdout + r.stderr).splitlines() if l.startswith("{"))
    return out

def similarity(want_text, heard):
    from pypinyin import lazy_pinyin, Style
    import difflib
    want = re.sub(r"[^\u4e00-\u9fff]", "", want_text)
    a = lazy_pinyin(want, style=Style.NORMAL); b = lazy_pinyin(heard, style=Style.NORMAL)
    return difflib.SequenceMatcher(None, a, b).ratio(), len(want)

def key_hash(*parts):
    return hashlib.sha1("|".join(map(str, parts)).encode("utf-8")).hexdigest()[:10]

def main():
    steps = sys.argv[1:] or ["synth", "asr", "encode"]
    os.makedirs(WORK, exist_ok=True); os.makedirs(OUT, exist_ok=True)
    J, texts = jobs()
    sylmap = json.load(open(os.path.join(HERE, "kokoro_sylmap.json"), encoding="utf-8"))
    lexk = os.path.join(WORK, "xiaolong-lexicon.txt")
    entries, seen = [], set()
    for hz, syls in texts:
        for line in lexicon_entries(sylmap, hz, syls):
            w = line.split(" ", 1)[0]
            if w not in seen:
                seen.add(w); entries.append(line)
    open(lexk, "w", encoding="utf-8").write("\n".join(entries) + "\n")
    # baker: één bestand (eigen woorden eerst, dan de rest van het originele lexicon)
    lexm = os.path.join(WORK, "xiaolong-lexicon-matcha.txt")
    mentries, mseen = [], set()
    for hz, syls in texts:
        for line in matcha_entries(hz, syls):
            w = line.split(" ", 1)[0]
            if w not in mseen:
                mseen.add(w); mentries.append(line)
    for line in open(os.path.join(MATCHA, "lexicon.txt"), encoding="utf-8"):
        w = line.split(" ", 1)[0]
        if w and w not in mseen:
            mentries.append(line.rstrip("\n"))
    open(lexm, "w", encoding="utf-8").write("\n".join(mentries) + "\n")
    lex = {"kokoro": lexk, "matcha": lexm}
    lexhash = {"kokoro": key_hash(open(lexk, encoding="utf-8").read()),
               "matcha": key_hash("\n".join(mentries[:len(mseen)]))}
    decisions_p = os.path.join(WORK, "decisions.json")
    decisions = json.load(open(decisions_p)) if os.path.exists(decisions_p) else {}

    # lijst van taken
    tasks = []
    for key, srcs in J.items():
        for (voice, kind, src) in srcs:
            name = "%s-%s" % (key, voice)
            if kind == "tts":
                h = key_hash(voice, src, VOICES[voice], lexhash["matcha" if VOICES[voice].get("engine") == "matcha" else "kokoro"])
                tasks.append({"key": key, "name": name, "voice": voice, "kind": kind, "src": src,
                              "wav": os.path.join(WORK, "%s.%s.wav" % (name, h))})
            else:
                tasks.append({"key": key, "name": name, "voice": voice, "kind": kind, "src": src})

    if "synth" in steps:
        todo = [t for t in tasks if t["kind"] == "tts" and not os.path.exists(t["wav"])]
        print("synthese:", len(todo), "van", sum(1 for t in tasks if t["kind"] == "tts"))
        def one(t):
            synth(t["voice"], t["src"], t["wav"], lex)
            return t["name"]
        with ThreadPoolExecutor(max_workers=int(os.environ.get("JOBS", "2"))) as ex:
            for i, name in enumerate(ex.map(one, todo)):
                if i % 25 == 0:
                    print(" ", i, name, flush=True)

    if "asr" in steps:
        tts = [t for t in tasks if t["kind"] == "tts"]
        heard = asr([t["wav"] for t in tts])
        report, fallback = [], []
        decisions = {}
        for t, hd in zip(tts, heard):
            sim, n = similarity(t["src"], hd)
            t["asr"], t["sim"] = hd, sim
            if sim < 0.99:
                report.append("%.2f %-22s %s -> %s" % (sim, t["name"], t["src"], hd))
            # zin of uitdrukking van 3+ tekens die slecht verstaan wordt: andere stem proberen
            if n >= 3 and sim < 0.85 and t["voice"] != FALLBACK:
                fallback.append(t)
            # tweede stem bij een woord: weglaten als ze slecht verstaan wordt
            if t["voice"] == "b" and n >= 2 and sim < 0.5:
                decisions[t["name"]] = {"drop": True, "why": hd}
        # korte uitdrukking: als de eerste stem slecht verstaan wordt en de tweede perfect, alleen de tweede
        bykey = {}
        for t in tts:
            bykey.setdefault(t["key"], {})[t["voice"]] = t
        for k, vs in bykey.items():
            if "a" in vs and "b" in vs and vs["a"]["sim"] < 0.6 and vs["b"]["sim"] >= 0.99:
                decisions[vs["a"]["name"]] = {"drop": True, "why": vs["a"]["asr"] + " (tweede stem is beter)"}
        if fallback:
            for t in fallback:
                t["fbwav"] = t["wav"].replace(".wav", ".fb.wav")
                if not os.path.exists(t["fbwav"]):
                    synth(FALLBACK, t["src"], t["fbwav"], lex)
            hfb = asr([t["fbwav"] for t in fallback])
            for t, hd in zip(fallback, hfb):
                sim2, n = similarity(t["src"], hd)
                if sim2 > t["sim"]:
                    decisions[t["name"]] = {"use": t["fbwav"], "why": "%s (%.2f) -> %s (%.2f)" % (t["asr"], t["sim"], hd, sim2)}
                    report.append("     andere stem voor %s: %s (%.2f)" % (t["name"], hd, sim2))
        report.sort()
        open(os.path.join(WORK, "asr_report.txt"), "w", encoding="utf-8").write("\n".join(report) + "\n")
        json.dump(decisions, open(decisions_p, "w"), ensure_ascii=False, indent=1)
        print("herkenning: %d van %d niet perfect, %d met andere stem, %d weggelaten (zie asr_report.txt)" % (
            sum(1 for t in tts if t["sim"] < 0.99), len(tts),
            sum(1 for d in decisions.values() if "use" in d), sum(1 for d in decisions.values() if d.get("drop"))))

    if "encode" in steps:
        manifest, pcs = {}, {}
        def enc(t):
            out_name = t["name"] + ".mp3"
            out = os.path.join(OUT, out_name)
            src = t["wav"] if t["kind"] == "tts" else t["src"]
            filt = []
            v = VOICES.get(t["voice"], {})
            if v.get("pitch"):
                r = 2 ** (v["pitch"] / 12.0)
                filt.append("asetrate=%d,aresample=%d,atempo=%.4f" % (int(SR * r), SR, 1 / r))
            trim = "silenceremove=start_periods=1:start_silence=0.03:start_threshold=-42dB"
            filt += [trim, "areverse", trim, "areverse", "loudnorm=I=-17:TP=-1.5:LRA=11",
                     "adelay=50", "apad=pad_dur=0.15"]
            r = run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", ",".join(filt),
                     "-ac", "1", "-ar", str(SR), "-c:a", "libmp3lame", "-b:a", "48k", out])
            if r.returncode != 0:
                raise RuntimeError(r.stderr)
            # toonlijn
            r = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", out, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                               stdout=subprocess.PIPE)
            import numpy as np
            x = np.frombuffer(r.stdout, dtype=np.int16).astype(np.float64) / 32768.0
            return t, out_name, contour(x, 16000, 32)
        enc_tasks = []
        for t in tasks:
            d = decisions.get(t["name"], {})
            if d.get("drop"):
                continue
            if d.get("use") and os.path.exists(d["use"]):
                t = dict(t, wav=d["use"], voice=FALLBACK)
            enc_tasks.append(t)
        with ThreadPoolExecutor(max_workers=2) as ex:
            for t, out_name, pc in ex.map(enc, enc_tasks):
                manifest.setdefault(t["key"], []).append(out_name)
                if pc:
                    pcs[out_name] = pc
        # menselijke opname eerst
        for k in manifest:
            manifest[k].sort(key=lambda f: (0 if f.endswith("-h.mp3") or f.endswith("-s.mp3") else 1, f))
        manifest["_pc"] = pcs
        json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False)
        # oude bestanden opruimen
        keep = set(f for k, v in manifest.items() if k != "_pc" for f in v)
        for f in os.listdir(OUT):
            if f.endswith(".mp3") and f not in keep:
                os.remove(os.path.join(OUT, f))
        size = sum(os.path.getsize(os.path.join(OUT, f)) for f in keep)
        print("audio: %d bestanden, %.1f MB" % (len(keep), size / 1e6))

if __name__ == "__main__":
    main()
