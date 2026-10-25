/* Spreken: microfoon, toonlijn (toonhoogte meten) en spraakherkenning.
 *
 * Twee manieren om te controleren:
 *  1. Spraakherkenning van de browser (Chrome op Android), als die er is
 *     en er internet is. Die vergelijkt de klanken, niet de tonen.
 *  2. Altijd: de toonlijn. We meten de toonhoogte van het kind en leggen die
 *     naast de lijn van de opname. Voor één lettergreep raden we ook de toon.
 */
(function () {
  'use strict';
  var V = {};
  var stream = null;

  V.hasMic = function () { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); };
  V.hasASR = function () { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); };

  /* ---- toonhoogte (YIN) ---- */
  function yin(buf, sr) {
    var N = buf.length, half = Math.floor(N / 2);
    var tauMin = Math.floor(sr / 600), tauMax = Math.min(Math.floor(sr / 75), half - 1);
    var d = new Float32Array(tauMax + 1), rms = 0, i, tau;
    for (i = 0; i < N; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / N);
    if (rms < 0.012) return { f: 0, rms: rms };
    for (tau = 1; tau <= tauMax; tau++) {
      var s = 0;
      for (i = 0; i < half; i++) { var x = buf[i] - buf[i + tau]; s += x * x; }
      d[tau] = s;
    }
    var run = 0, best = -1;
    d[0] = 1;
    for (tau = 1; tau <= tauMax; tau++) { run += d[tau]; d[tau] = run ? d[tau] * tau / run : 1; }
    for (tau = tauMin; tau < tauMax; tau++) {
      if (d[tau] < 0.2) {
        while (tau + 1 < tauMax && d[tau + 1] < d[tau]) tau++;
        best = tau; break;
      }
    }
    if (best < 0) {
      var mi = tauMin;
      for (tau = tauMin; tau < tauMax; tau++) if (d[tau] < d[mi]) mi = tau;
      if (d[mi] < 0.4) best = mi;
    }
    if (best < 0) return { f: 0, rms: rms };
    var a = d[best - 1], b = d[best], c = d[best + 1], den = a - 2 * b + c;
    var t = den ? best + 0.5 * (a - c) / den : best;
    return { f: sr / t, rms: rms };
  }

  /* Ruwe metingen (Hz, 0 = stil) naar een lijn in halve tonen rond de mediaan. */
  V.toContour = function (f0s, n) {
    n = n || 32;
    var v = f0s.filter(function (f) { return f > 0; });
    if (v.length < 4) return null;
    var sorted = v.slice().sort(function (a, b) { return a - b; });
    var med = sorted[Math.floor(sorted.length / 2)];
    var st = f0s.map(function (f) {
      if (!(f > 0)) return null;
      var s = 12 * Math.log(f / med) / Math.LN2;
      return Math.abs(s) > 9 ? null : s;
    });
    var first = -1, last = -1, i;
    for (i = 0; i < st.length; i++) if (st[i] !== null) { if (first < 0) first = i; last = i; }
    if (last - first < 3) return null;
    var seg = st.slice(first, last + 1);
    // gaten opvullen en een beetje gladmaken
    for (i = 0; i < seg.length; i++) {
      if (seg[i] === null) {
        var j = i; while (j < seg.length && seg[j] === null) j++;
        var a = seg[i - 1], b = j < seg.length ? seg[j] : a;
        for (var k = i; k < j; k++) seg[k] = a + (b - a) * (k - i + 1) / (j - i + 1);
        i = j;
      }
    }
    var sm = seg.map(function (x, i2) {
      var s = 0, c = 0;
      for (var q = Math.max(0, i2 - 2); q <= Math.min(seg.length - 1, i2 + 2); q++) { s += seg[q]; c++; }
      return s / c;
    });
    var out = [];
    for (i = 0; i < n; i++) {
      var x = i * (sm.length - 1) / (n - 1), lo = Math.floor(x), hi = Math.min(lo + 1, sm.length - 1);
      out.push(sm[lo] + (sm[hi] - sm[lo]) * (x - lo));
    }
    return out;
  };

  /* Welke toon is dit (één lettergreep)? Mild: kinderen zingen niet als een opname. */
  V.classifyTone = function (c) {
    if (!c) return 0;
    c = c.filter(function (x) { return x !== null && x !== undefined; });
    var n = c.length;
    if (n < 4) return 0;
    var start = avg(c, 0, Math.max(1, Math.floor(n * 0.2))), end = avg(c, Math.floor(n * 0.75), n);
    var minI = 0, maxI = 0;
    for (var i = 1; i < n; i++) { if (c[i] < c[minI]) minI = i; if (c[i] > c[maxI]) maxI = i; }
    var range = c[maxI] - c[minI], slope = end - start;
    if (range < 2.5) return 1;
    var rise = end - c[minI], fall = start - c[minI];
    if (minI > n * 0.2 && minI < n * 0.85 && fall > 1.2 && rise > 2.0 && rise > 0.35 * fall) return 3;
    if (slope > 2.5) return (minI < n * 0.45 && fall > 2.0) ? 3 : 2;
    if (slope < -2.0) return 4;
    if (slope > 0) return range > 3.5 ? 2 : 1;
    return range > 3.5 ? 4 : 1;
  };
  function avg(a, s, e) { var t = 0, c = 0; for (var i = s; i < e; i++) { t += a[i]; c++; } return c ? t / c : 0; }

  /* Gelijkenis tussen twee lijnen (0..1): vorm, niet hoogte. */
  V.similarity = function (a, b) {
    if (!a || !b) return 0;
    var A = clean(a), B = clean(b);
    if (!A || !B) return 0;
    var n = Math.min(A.length, B.length);
    var ma = avg(A, 0, n), mb = avg(B, 0, n), num = 0, da = 0, db = 0, diff = 0;
    for (var i = 0; i < n; i++) {
      var x = A[i] - ma, y = B[i] - mb;
      num += x * y; da += x * x; db += y * y; diff += Math.abs(x - y);
    }
    var flatA = Math.sqrt(da / n) < 1.0, flatB = Math.sqrt(db / n) < 1.0;
    if (flatA && flatB) return 0.95;
    var r = (da && db) ? num / Math.sqrt(da * db) : 0;
    var mad = diff / n; // gemiddeld verschil in halve tonen
    var s = 0.6 * Math.max(0, r) + 0.4 * Math.max(0, 1 - mad / 4);
    return Math.max(0, Math.min(1, s));
  };
  function clean(c) {
    var out = [];
    for (var i = 0; i < c.length; i++) if (c[i] !== null && c[i] !== undefined) out.push(c[i]);
    return out.length >= 4 ? out : null;
  }

  /* ---- opnemen ---- */
  V.getStream = function () {
    if (stream && stream.active) return Promise.resolve(stream);
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true }
    }).then(function (s) { stream = s; return s; });
  };
  V.release = function () {
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
  };

  /* Neemt op tot het kind stil is (of maxMs). onFrame(f0, rms) voor de live lijn.
   * Geeft { url, f0s, contour } terug. */
  V.record = function (opts) {
    opts = opts || {};
    var maxMs = opts.maxMs || 3500;
    return V.getStream().then(function (s) {
      var c = Snd.context();
      var src = c.createMediaStreamSource(s);
      var an = c.createAnalyser();
      an.fftSize = 2048;
      src.connect(an);
      var buf = new Float32Array(an.fftSize);
      var chunks = [], rec = null;
      if (window.MediaRecorder) {
        try { rec = new MediaRecorder(s); } catch (e) { rec = null; }
        if (rec) { rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); }; rec.start(); }
      }
      var f0s = [], t0 = performance.now(), heard = false, quietSince = 0;
      return new Promise(function (resolve) {
        var stopped = false;
        function stop() {
          if (stopped) return; stopped = true;
          try { src.disconnect(); } catch (e) { /* niets */ }
          var fin = function () {
            var url = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: chunks[0].type || 'audio/webm' })) : null;
            resolve({ url: url, f0s: f0s, contour: V.toContour(f0s, 32), heard: heard });
          };
          if (rec && rec.state !== 'inactive') { rec.onstop = fin; rec.stop(); } else fin();
        }
        if (opts.onStopFn) opts.onStopFn(stop);
        (function loop() {
          if (stopped) return;
          if (an.getFloatTimeDomainData) an.getFloatTimeDomainData(buf);
          else {
            var b8 = new Uint8Array(an.fftSize); an.getByteTimeDomainData(b8);
            for (var i = 0; i < b8.length; i++) buf[i] = (b8[i] - 128) / 128;
          }
          var r = yin(buf, c.sampleRate);
          var t = performance.now() - t0;
          if (r.f > 0 && r.rms > 0.02) { heard = true; quietSince = 0; f0s.push(r.f); }
          else { if (heard) f0s.push(0); if (heard && !quietSince) quietSince = t; }
          if (opts.onFrame) opts.onFrame(r.f, r.rms);
          if (t > maxMs || (heard && quietSince && t - quietSince > 650)) { stop(); return; }
          requestAnimationFrame(loop);
        })();
      });
    });
  };

  /* ---- spraakherkenning ---- */
  var pyMap = null;
  V.loadPinyinMap = function () {
    if (pyMap) return Promise.resolve(pyMap);
    if (window.HANZI_PY) { pyMap = window.HANZI_PY; return Promise.resolve(pyMap); }
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = 'js/hanzi_py.js';
      s.onload = function () { pyMap = window.HANZI_PY || {}; resolve(pyMap); };
      s.onerror = function () { pyMap = {}; resolve(pyMap); };
      document.head.appendChild(s);
    });
  };
  function sylsOf(ch) {
    var r = pyMap && pyMap[ch];
    return r ? r.split(',') : [];
  }
  /* Hoeveel van de doel-lettergrepen (zonder toon) zitten in de gehoorde tekst, in volgorde? */
  V.matchScore = function (item, heardTexts) {
    var target = item.syl.map(function (s) { return s.s; });
    var targetChars = item.syl.map(function (s) { return s.c; });
    var best = 0;
    heardTexts.forEach(function (txt) {
      var chars = Array.from(txt.replace(/[\s，。！？,.!?]/g, ''));
      // lettergrepen per gehoord teken (een teken in de leerstof telt met onze uitspraak)
      var sets = chars.map(function (ch) {
        var own = [];
        var k = targetChars.indexOf(ch);
        if (k >= 0) own.push(target[k]);
        return own.concat(sylsOf(ch));
      });
      // langste gemeenschappelijke deelrij
      var m = target.length, n = sets.length, dp = [], i, j;
      for (i = 0; i <= m; i++) { dp.push(new Array(n + 1).fill(0)); }
      for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
        dp[i][j] = sets[j - 1].indexOf(target[i - 1]) >= 0 ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
      var score = dp[m][n] / m;
      if (n > m + 2) score *= m / (n - 1); // veel meer gezegd dan nodig
      if (score > best) best = score;
    });
    return best;
  };

  /* Luistert één keer; geeft een lijst met mogelijke zinnen terug (of [] bij niets). */
  V.listen = function (opts) {
    opts = opts || {};
    var R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) return Promise.reject(new Error('geen spraakherkenning'));
    return new Promise(function (resolve, reject) {
      var r = new R();
      r.lang = 'zh-CN';
      r.interimResults = false;
      r.maxAlternatives = 5;
      r.continuous = false;
      var got = [], done = false;
      function fin(err) {
        if (done) return; done = true;
        clearTimeout(tm);
        if (err && !got.length) reject(err); else resolve(got);
      }
      r.onresult = function (e) {
        for (var i = 0; i < e.results.length; i++)
          for (var j = 0; j < e.results[i].length; j++) got.push(e.results[i][j].transcript);
      };
      r.onerror = function (e) { fin(new Error(e.error || 'fout')); };
      r.onend = function () { fin(null); };
      var tm = setTimeout(function () { try { r.stop(); } catch (e) { /* niets */ } }, opts.maxMs || 6000);
      if (opts.onStopFn) opts.onStopFn(function () { try { r.stop(); } catch (e) { /* niets */ } });
      try { r.start(); } catch (e) { fin(e); }
    });
  };

  window.Voice = V;
})();
