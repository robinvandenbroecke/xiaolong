# -*- coding: utf-8 -*-
"""Controleert de leerinhoud en schrijft js/content.js.

Gebruik:  python3 tools/build_content.py [--check]

- splitst pinyin in lettergrepen en koppelt ze aan de tekens
- vergelijkt elke lettergreep met pypinyin (als dat beschikbaar is)
- kijkt welke audio er is (audio/manifest.json, gemaakt door build_audio.py)
- schrijft js/content.js
"""
import json, os, re, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import content_src as C

TONE_MARKS = {
    "ā": ("a", 1), "á": ("a", 2), "ǎ": ("a", 3), "à": ("a", 4),
    "ē": ("e", 1), "é": ("e", 2), "ě": ("e", 3), "è": ("e", 4),
    "ī": ("i", 1), "í": ("i", 2), "ǐ": ("i", 3), "ì": ("i", 4),
    "ō": ("o", 1), "ó": ("o", 2), "ǒ": ("o", 3), "ò": ("o", 4),
    "ū": ("u", 1), "ú": ("u", 2), "ǔ": ("u", 3), "ù": ("u", 4),
    "ǖ": ("ü", 1), "ǘ": ("ü", 2), "ǚ": ("ü", 3), "ǜ": ("ü", 4),
}

# Alle geldige lettergrepen (zonder toon), uit de lijst van audio-cmn,
# met een ingebouwde reserve als die lijst er niet is.
def load_bases():
    bases = set()
    p = os.environ.get("SYLLABLE_LIST")
    if p and os.path.exists(p):
        for line in open(p, encoding="utf-8"):
            w = line.strip().lower()
            if not w or w.startswith("_"):
                continue
            w = re.sub(r"[1-5]$", "", w).replace("v", "ü")
            bases.add(w)
    if not bases:
        raise SystemExit("SYLLABLE_LIST ontbreekt")
    return bases

BASES = None

def detone(syl):
    """'mǎ' -> ('ma', 3); 'ma' -> ('ma', 5)"""
    out, tone = [], 5
    for ch in syl:
        if ch in TONE_MARKS:
            b, t = TONE_MARKS[ch]
            out.append(b); tone = t
        else:
            out.append(ch)
    return "".join(out), tone

def split_word(word):
    """Splitst een pinyinwoord in lettergrepen (langste geldige eerst, met terugzoeken)."""
    w = word.lower()
    parts = w.split("'")
    res = []
    for part in parts:
        r = _split(part)
        if r is None:
            raise ValueError("kan pinyin niet splitsen: %r" % word)
        res.extend(r)
    return res

def _split(s):
    if s == "":
        return []
    for n in range(min(6, len(s)), 0, -1):
        head = s[:n]
        base, _ = detone(head)
        if base in BASES:
            # een toonteken hoort bij de lettergreep: niet halverwege afknippen
            rest = _split(s[n:])
            if rest is not None:
                return [head] + rest
    return None

HANZI_RE = re.compile(r"[㐀-鿿\U00020000-\U0002ffff]")

def syllabify(hz, py, original_case=None):
    chars = HANZI_RE.findall(hz)
    words = re.findall(r"[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüê']+", py)
    syls = []
    orig = re.findall(r"[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüê']+", py)
    for w in words:
        for s in split_word(w):
            syls.append(s)
    if len(syls) != len(chars):
        raise ValueError("%s: %d tekens maar %d lettergrepen (%s)" % (hz, len(chars), len(syls), py))
    out = []
    for c, s in zip(chars, syls):
        base, tone = detone(s)
        out.append({"c": c, "m": s, "s": base, "t": tone})
    return out

# ---------------------------------------------------------------------------
def check_pypinyin(hz, syls, problems):
    try:
        from pypinyin import pinyin, Style
    except ImportError:
        return
    sandhi_ok = {"一": {1, 2, 4}, "不": {2, 4}}
    for i, s in enumerate(syls):
        cands = pinyin(s["c"], style=Style.TONE3, heteronym=True, neutral_tone_with_five=True)[0]
        ok = False
        for cand in cands:
            m = re.match(r"([a-zü]+)([1-5])?$", cand.replace("v", "ü"))
            if not m:
                continue
            b, t = m.group(1), int(m.group(2) or 5)
            if b != s["s"]:
                continue
            if s["t"] == t or s["t"] == 5:
                ok = True
            elif s["c"] in sandhi_ok and s["t"] in sandhi_ok[s["c"]]:
                ok = True
        if not ok:
            problems.append("%s: %s%s volgens pypinyin %s" % (hz, s["c"], s["m"], cands))

# ---------------------------------------------------------------------------
def main():
    global BASES
    BASES = load_bases()
    problems = []
    items, units, ids = {}, [], set()
    manifest_p = os.path.join(ROOT, "audio", "manifest.json")
    manifest = json.load(open(manifest_p, encoding="utf-8")) if os.path.exists(manifest_p) else {}

    def audio_for(key):
        return manifest.get(key, [])

    order = 0
    for u in C.UNITS:
        uid = u["id"]
        for it in u["items"]:
            if it["id"] in ids:
                problems.append("dubbele id " + it["id"])
            ids.add(it["id"])
            d = dict(it)
            d["u"] = uid
            d["o"] = order; order += 1
            try:
                d["syl"] = syllabify(it["hz"], it["py"])
            except ValueError as e:
                problems.append(str(e)); continue
            check_pypinyin(it["hz"], d["syl"], problems)
            if it.get("tiles"):
                if "".join(it["tiles"]) != it["hz"]:
                    problems.append("tegels kloppen niet: %s" % it["hz"])
                # pinyin per tegel
                tp, k = [], 0
                for t in it["tiles"]:
                    n = len(HANZI_RE.findall(t))
                    tp.append(" ".join(x["m"] for x in d["syl"][k:k + n]))
                    k += n
                d["tilepy"] = tp
            d["au"] = audio_for(it["id"])
            pcs = manifest.get("_pc", {})
            if d["au"] and pcs.get(d["au"][0]):
                d["pc"] = pcs[d["au"][0]]
            if not d["au"]:
                problems.append("geen audio: " + it["id"])
            items[it["id"]] = d
        lessons = []
        for l in u["lessons"]:
            for n in l["new"]:
                if n not in items:
                    problems.append("les %s noemt onbekend item %s" % (l["id"], n))
            ll = dict(l)
            if l["kind"] == "tekens":
                ll["comps"] = C.COMPONENT_LESSONS.get(l["id"], [])
            lessons.append(ll)
        units.append({k: v for k, v in u.items() if k not in ("items", "lessons")} |
                     {"items": [i["id"] for i in u["items"]], "lessons": lessons})

    # elk item in precies één les
    seen = {}
    for u in C.UNITS:
        for l in u["lessons"]:
            for n in l["new"]:
                if n in seen:
                    problems.append("%s zit in %s en %s" % (n, seen[n], l["id"]))
                seen[n] = l["id"]
    for i in items:
        if i not in seen:
            problems.append("item %s zit in geen enkele les" % i)

    # verhalen
    stories = {}
    for sid, st in C.STORIES.items():
        lines = []
        for n, (who, hz, py, nl, scene) in enumerate(st["lines"]):
            key = "%s_%d" % (sid, n)
            try:
                syl = syllabify(hz, py)
                check_pypinyin(hz, syl, problems)
            except ValueError as e:
                problems.append(str(e)); syl = []
            au = audio_for(key)
            if not au:
                problems.append("geen audio: " + key)
            lines.append({"who": who, "hz": hz, "py": py, "nl": nl, "sc": scene, "syl": syl, "au": au})
        qs = [{"q": q, "o": [{"em": e, "nl": t} for e, t in opts], "a": a} for q, opts, a in st["qs"]]
        stories[sid] = {"title": st["title"], "lines": lines, "qs": qs}

    # tekenfamilies: alleen tekens die in de leerstof voorkomen
    all_chars = {}
    for it in items.values():
        for s in it["syl"]:
            all_chars.setdefault(s["c"], it["id"])
    comps = {}
    for k, v in C.COMPONENTS.items():
        chars = [c for c in v["chars"] if c in all_chars]
        missing = [c for c in v["chars"] if c not in all_chars]
        if missing:
            problems.append("onderdeel %s: tekens niet in leerstof: %s" % (k, "".join(missing)))
        comps[k] = {"nl": v["nl"], "em": v["em"], "chars": chars,
                    "items": {c: all_chars[c] for c in chars}}

    # lettergrepen voor tonentraining
    tones = {}
    for b in C.TONE_SYLLABLES:
        tones[b] = {}
        for t in (1, 2, 3, 4):
            au = audio_for("syl_%s%d" % (b, t))
            if au:
                tones[b][t] = au
        if len(tones[b]) < 4:
            problems.append("toonlettergreep %s mist tonen: %s" % (b, sorted(tones[b])))

    praise = []
    for pid, hz, py, nl, kind in C.PRAISE:
        praise.append({"id": pid, "hz": hz, "py": py, "nl": nl, "kind": kind, "au": audio_for(pid)})
        if not audio_for(pid):
            problems.append("geen audio: " + pid)

    stickers = []
    for sid, hz, py, nl, em, cat, fact in C.STICKERS:
        stickers.append({"id": sid, "hz": hz, "py": py, "nl": nl, "em": em, "cat": cat, "fact": fact,
                         "au": audio_for(sid)})
        if not audio_for(sid):
            problems.append("geen audio: " + sid)

    # emoji die in één eenheid twee keer voorkomen (verwarrend als keuze)
    for u in C.UNITS:
        seen_em = {}
        for it in u["items"]:
            if it["k"] == "z" or it["id"] == "kou":
                continue
            if it["em"] and it["em"] in seen_em:
                problems.append("zelfde plaatje %s voor %s en %s" % (it["em"], seen_em[it["em"]], it["id"]))
            seen_em[it["em"]] = it["id"]

    data = {"v": 1, "units": units, "items": items, "stories": stories, "comps": comps,
            "tones": tones, "praise": praise, "stickers": stickers,
            "chars": "".join(sorted(all_chars))}

    for p in problems:
        print("!", p)
    if "--check" in sys.argv:
        return
    out = os.path.join(ROOT, "js", "content.js")
    with open(out, "w", encoding="utf-8") as f:
        f.write("/* Gemaakt door tools/build_content.py. Niet met de hand aanpassen. */\n")
        f.write("var CONTENT = ")
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    # alle tekens, voor het lettertype
    txt = set()
    for it in items.values():
        txt.update(it["hz"]);
        for t in it.get("tiles", []): txt.update(t)
    for st in stories.values():
        for l in st["lines"]: txt.update(l["hz"])
        for q in st["qs"]:
            for o in q["o"]: txt.update(o["nl"])
    for s in stickers: txt.update(s["hz"])
    for p in praise: txt.update(p["hz"])
    for k, v in C.COMPONENTS.items(): txt.update(k)
    for u in C.UNITS: txt.update(u["zh"])
    txt.update("小龙圆圆小猴奶奶学中文你好")
    cjk = "".join(sorted(c for c in txt if HANZI_RE.match(c) or c in "，。！？……、"))
    open(os.path.join(HERE, "cjk_chars.txt"), "w", encoding="utf-8").write(cjk)
    print("items:", len(items), "verhalen:", len(stories), "tekens:", len(cjk), "problemen:", len(problems))

if __name__ == "__main__":
    main()
