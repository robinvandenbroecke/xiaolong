/* Geluid: opnames afspelen en kleine effecten (zelf gemaakt met Web Audio,
 * in de vijftoonstoonladder die in Chinese muziek veel voorkomt). */
(function () {
  'use strict';
  var Snd = {};
  var ctx = null;
  var enabled = true;
  var current = null;
  var cache = {};
  var storyVoices = null;
  var nextVoice = {};

  function pronunciationKey(it) {
    return it.syl.map(function (s) { return s.c + ':' + s.m; }).join(' ');
  }

  Snd.voices = function (it) {
    if (!it || !it.au || !it.au.length) return [];
    if (!storyVoices) {
      storyVoices = {};
      Object.keys(CONTENT.stories).forEach(function (id) {
        CONTENT.stories[id].lines.forEach(function (line) {
          var file = line.au[0];
          // Een vervangende standaardopname telt niet als stem van het personage.
          if (!file || line.who === 'all' || !file.endsWith('-' + line.who + '.mp3')) return;
          var key = pronunciationKey(line);
          if (!storyVoices[key]) storyVoices[key] = {};
          if (!storyVoices[key][line.who]) storyVoices[key][line.who] = file;
        });
      });
    }
    var voices = storyVoices[pronunciationKey(it)] || {};
    return it.au.concat(Object.keys(voices).map(function (who) { return voices[who]; }));
  };

  Snd.nextVoice = function (it) {
    var files = Snd.voices(it);
    if (!files.length) return null;
    var i = nextVoice[it.id] || 0;
    nextVoice[it.id] = (i + 1) % files.length;
    return files[i];
  };

  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  Snd.context = ac;
  Snd.setEnabled = function (v) { enabled = !!v; };
  Snd.unlock = function () { ac(); };

  /* ---- opnames ---- */
  Snd.url = function (file) { return 'audio/' + file; };
  Snd.preload = function (files) {
    (files || []).forEach(function (f) {
      if (!f || cache[f]) return;
      var a = new Audio();
      a.preload = 'auto';
      a.src = Snd.url(f);
      cache[f] = a;
    });
  };
  Snd.stop = function () {
    if (current) { try { current.pause(); } catch (e) { /* niets */ } current = null; }
  };
  /* Speelt een bestand; geeft een Promise die afloopt als het klaar is. */
  Snd.play = function (file, opts) {
    opts = opts || {};
    Snd.stop();
    if (!file) return Promise.resolve();
    return new Promise(function (resolve) {
      var a = cache[file];
      if (!a) { a = new Audio(Snd.url(file)); cache[file] = a; }
      try { a.currentTime = 0; } catch (e) { /* niets */ }
      a.playbackRate = opts.slow ? 0.72 : 1;
      if ('preservesPitch' in a) a.preservesPitch = true;
      var done = false;
      function fin() { if (done) return; done = true; a.removeEventListener('ended', fin); resolve(); }
      a.addEventListener('ended', fin);
      setTimeout(fin, 9000);
      current = a;
      var pr = a.play();
      if (pr && pr.catch) pr.catch(function () { fin(); });
    });
  };

  /* ---- effecten ---- */
  // C D E G A in verschillende octaven
  var PENTA = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5, 1567.98, 1760.0];

  function bell(freq, t0, dur, vol, type) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    var o2 = c.createOscillator(), g2 = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    o2.type = 'sine'; o2.frequency.value = freq * 2.76; // klokachtige boventoon
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    g2.gain.setValueAtTime(0.0001, t0);
    g2.gain.exponentialRampToValueAtTime(vol * 0.25, t0 + 0.01);
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur * 0.4);
    o.connect(g); o2.connect(g2); g.connect(c.destination); g2.connect(c.destination);
    o.start(t0); o2.start(t0); o.stop(t0 + dur + 0.05); o2.stop(t0 + dur + 0.05);
  }
  function noiseBurst(t0, dur, vol, freq) {
    var c = ac(); if (!c) return;
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    var s = c.createBufferSource(); s.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1800; f.Q.value = 0.8;
    var g = c.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(c.destination);
    s.start(t0);
  }
  function gong(t0, vol) {
    var c = ac(); if (!c) return;
    [110, 166, 231, 297, 352].forEach(function (f, i) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f * 1.02, t0); o.frequency.exponentialRampToValueAtTime(f, t0 + 1.5);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol / (i + 1.3), t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.6 - i * 0.3);
      o.connect(g); g.connect(c.destination);
      o.start(t0); o.stop(t0 + 2.8);
    });
    noiseBurst(t0, 0.25, vol * 0.4, 600);
  }

  var FX = {
    tap: function (t) { bell(PENTA[4], t, 0.08, 0.08); },
    good: function (t) { bell(PENTA[2], t, 0.35, 0.18); bell(PENTA[5], t + 0.09, 0.5, 0.18); },
    combo: function (t) { [2, 3, 4, 5, 7].forEach(function (n, i) { bell(PENTA[n], t + i * 0.07, 0.4, 0.13); }); },
    oops: function (t) {
      var c = ac(); if (!c) return;
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(220, t + 0.25);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.4);
    },
    star: function (t) { bell(PENTA[7], t, 0.2, 0.08); bell(PENTA[9], t + 0.05, 0.25, 0.06); },
    done: function (t) {
      var mel = [0, 1, 2, 4, 3, 5, 7, 9];
      mel.forEach(function (n, i) { bell(PENTA[n], t + i * 0.12, 0.5, 0.14); });
      gong(t + mel.length * 0.12, 0.25);
    },
    level: function (t) {
      [0, 2, 4, 5, 7, 9].forEach(function (n, i) { bell(PENTA[n], t + i * 0.09, 0.6, 0.14); });
      [5, 7, 9].forEach(function (n) { bell(PENTA[n], t + 0.7, 1.2, 0.1); });
    },
    hongbao: function (t) {
      for (var i = 0; i < 14; i++) noiseBurst(t + i * 0.06 + Math.random() * 0.04, 0.05, 0.35, 1500 + Math.random() * 2500);
      gong(t + 0.95, 0.3);
      [5, 7, 9].forEach(function (n, i) { bell(PENTA[n], t + 1.0 + i * 0.1, 0.8, 0.1); });
    },
    pop: function (t) { bell(PENTA[0] * 1.5, t, 0.12, 0.12, 'triangle'); },
    swipe: function (t) {
      var c = ac(); if (!c) return;
      var o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(500, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.15);
      g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.22);
    }
  };
  Snd.fx = function (name) {
    if (!enabled) return;
    var c = ac(); if (!c || !FX[name]) return;
    try { FX[name](c.currentTime + 0.01); } catch (e) { /* niets */ }
  };
  /* Een toon voordoen als zuivere klank (bij de toonuitleg). */
  Snd.toneDemo = function (tone) {
    var c = ac(); if (!c || !enabled) return;
    var t = c.currentTime + 0.02, base = 260, dur = 0.7;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle';
    var f = o.frequency;
    if (tone === 1) { f.setValueAtTime(base * 1.5, t); f.setValueAtTime(base * 1.5, t + dur); }
    if (tone === 2) { f.setValueAtTime(base * 1.1, t); f.exponentialRampToValueAtTime(base * 1.55, t + dur); }
    if (tone === 3) { f.setValueAtTime(base * 1.05, t); f.exponentialRampToValueAtTime(base * 0.8, t + dur * 0.55); f.exponentialRampToValueAtTime(base * 1.25, t + dur); }
    if (tone === 4) { f.setValueAtTime(base * 1.6, t); f.exponentialRampToValueAtTime(base * 0.9, t + dur * 0.6); dur *= 0.6; }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.03);
    g.gain.setValueAtTime(0.15, t + dur - 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  };

  window.Snd = Snd;
})();
