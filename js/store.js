/* Opslag, spelers, voortgang en herhalingsschema. */
(function () {
  'use strict';
  var LOCAL_KEY = 'xiaolong.v1';
  var key = LOCAL_KEY;
  var S = {};
  var state = null;
  var listeners = [];

  /* Herhaling: dagen tot de volgende keer, per doos (Leitner). Doos 0 = nog niet gezien. */
  S.INTERVALS = [0, 0, 1, 3, 7, 14, 30];
  S.MAXBOX = 6;
  S.COLORS = [
    { id: 'rood', nl: 'Rood', main: '#E0362C', dark: '#9E1F17', belly: '#FFD9A8' },
    { id: 'jade', nl: 'Jade', main: '#1E9E7E', dark: '#11624E', belly: '#D9F5C5' },
    { id: 'blauw', nl: 'Blauw', main: '#2F6FD6', dark: '#1B4590', belly: '#CFE6FF' },
    { id: 'paars', nl: 'Paars', main: '#8A4FD8', dark: '#55288F', belly: '#F0DAFF' },
    { id: 'oranje', nl: 'Oranje', main: '#F07F1C', dark: '#A64F05', belly: '#FFE7B0' },
    { id: 'roze', nl: 'Roze', main: '#E2508F', dark: '#97245A', belly: '#FFDCEB' }
  ];
  /* Groeistadia van de draak, op totaal aantal sterren. */
  S.STAGES = [
    { min: 0, nl: 'Drakenei' },
    { min: 1, nl: 'Babydraak' },
    { min: 150, nl: 'Kleine draak' },
    { min: 450, nl: 'Draak met parel' },
    { min: 900, nl: 'Wolkendraak' },
    { min: 1600, nl: 'Gouden draak' }
  ];
  S.DEFAULT_SET = { goal: 20, pinyin: 'fade', speak: true, len: 12, unlockAll: false, toneColors: false, growthBirth: 0, t: 0 };

  function now() { return Date.now(); }

  function blank() {
    return {
      device: { id: U.uid(8), name: '', eink: false, sound: true, sync: null, lastPlayer: null, created: now() },
      players: {},
      outbox: []
    };
  }

  S.load = function (account) {
    key = account ? LOCAL_KEY + '/' + account : LOCAL_KEY;
    var raw = U.storage.get(key);
    try { state = raw ? JSON.parse(raw) : null; } catch (e) { state = null; }
    if (!state || !state.device) state = blank();
    state.players = state.players || {};
    state.outbox = state.outbox || [];
    Object.keys(state.players).forEach(function (id) { fixPlayer(state.players[id]); });
    S.save();
    return state;
  };
  S.save = function () {
    var saved = U.storage.set(key, JSON.stringify(state));
    listeners.forEach(function (f) { try { f(); } catch (e) { /* niets */ } });
    return saved;
  };
  S.onChange = function (f) { listeners.push(f); };
  S.state = function () { return state; };
  S.device = function () { return state.device; };

  function fixPlayer(p) {
    p.prof = p.prof || { name: 'Speler', color: 'rood', c: now(), t: now() };
    p.set = p.set || JSON.parse(JSON.stringify(S.DEFAULT_SET));
    Object.keys(S.DEFAULT_SET).forEach(function (k) { if (p.set[k] === undefined) p.set[k] = S.DEFAULT_SET[k]; });
    ['items', 'nodes', 'stars', 'days', 'skill', 'stickers', 'hb', 'fam', 'seen'].forEach(function (k) { p[k] = p[k] || {}; });
    p.del = p.del || 0;
    p.hatch = p.hatch || 0;
    return p;
  }

  /* ---- spelers ---- */
  S.players = function () {
    return Object.keys(state.players).map(function (k) { return state.players[k]; })
      .filter(function (p) { return !p.del; })
      .sort(function (a, b) { return (a.prof.c || 0) - (b.prof.c || 0) || a.prof.name.localeCompare(b.prof.name); });
  };
  S.player = function (id) {
    var p = state.players[id || state.device.lastPlayer];
    return p && !p.del ? p : null;
  };
  S.current = function () { return S.player(state.device.lastPlayer); };
  S.setCurrent = function (id) { state.device.lastPlayer = id; S.save(); };
  S.mergePlayers = function (incoming) {
    var current = Object.keys(state.players).map(function (id) { return state.players[id]; });
    return S.replacePlayers(XLMerge.mergePlayers(current, incoming));
  };
  S.replacePlayers = function (players, aliases) {
    var next = {};
    players.forEach(function (p) { next[p.id] = fixPlayer(p); });
    var previous = state.device.lastPlayer;
    var selected = aliases && aliases[previous] || previous;
    if (selected === previous && XLMerge.same(state.players, next)) return false;
    state.players = next;
    state.device.lastPlayer = selected;
    S.save();
    return true;
  };
  S.familyPlayer = function (id) { return /^family-p[a-zA-Z0-9]{1,100}$/.test(id); };
  S.newFamilyPlayer = function (id, name, created) {
    return fixPlayer({
      id: id, v: 1, prof: { name: name, color: 'rood', c: created, t: 0 },
      ability: { L: {}, H: {}, P: {}, T: {}, S: {} }, mine: {}, outfit: {}
    });
  };
  S.localPlayers = function () {
    try {
      var local = JSON.parse(U.storage.get(LOCAL_KEY));
      return Object.keys(local.players).map(function (id) { return local.players[id]; })
        .filter(function (p) { return !p.del; });
    } catch (e) { return []; }
  };
  S.addPlayer = function (name, color, id) {
    var p = fixPlayer({ id: id || U.uid(10), v: 1, prof: { name: name, color: color, c: now(), t: now() } });
    p.set.t = now();
    state.players[p.id] = p;
    state.device.lastPlayer = p.id;
    S.save();
    return p;
  };
  S.editPlayer = function (p, fields) {
    Object.keys(fields).forEach(function (k) { p.prof[k] = fields[k]; });
    p.prof.t = now();
    S.save();
  };
  S.setSetting = function (p, k, v) { p.set[k] = v; p.set.t = now(); S.save(); };
  S.deletePlayer = function (p) {
    p.del = now();
    if (state.device.lastPlayer === p.id) state.device.lastPlayer = null;
    S.save();
  };
  S.colorOf = function (p) {
    var id = p && p.prof ? p.prof.color : 'rood';
    for (var i = 0; i < S.COLORS.length; i++) if (S.COLORS[i].id === id) return S.COLORS[i];
    return S.COLORS[0];
  };

  /* ---- sterren en dagen ---- */
  S.totalStars = function (p) {
    var t = 0;
    Object.keys(p.stars).forEach(function (d) { t += p.stars[d] || 0; });
    return t;
  };
  function today(p) {
    var k = U.dayKey(), dev = state.device.id;
    p.days[k] = p.days[k] || {};
    p.days[k][dev] = p.days[k][dev] || { s: 0, l: 0, x: 0, k: 0, m: 0 };
    return p.days[k][dev];
  }
  S.dayTotals = function (p, key) {
    var d = p.days[key || U.dayKey()] || {}, r = { s: 0, l: 0, x: 0, k: 0, m: 0 };
    Object.keys(d).forEach(function (dev) {
      Object.keys(r).forEach(function (f) { r[f] += d[dev][f] || 0; });
    });
    return r;
  };
  S.addStars = function (p, n) {
    var dev = state.device.id;
    p.stars[dev] = (p.stars[dev] || 0) + n;
    today(p).s += n;
  };
  S.countExercise = function (p, ok, skill) {
    var t = today(p);
    t.x += 1; if (ok) t.k += 1;
    if (skill) {
      var dev = state.device.id;
      p.skill[dev] = p.skill[dev] || {};
      var s = p.skill[dev][skill] = p.skill[dev][skill] || [0, 0];
      if (ok) s[0] += 1;
      s[1] += 1;
    }
  };
  S.addSeconds = function (p, sec) { today(p).m += Math.round(sec); };
  S.lessonDone = function (p, nodeId, lanterns, passed) {
    today(p).l += 1;
    if (passed === false) return;
    var n = p.nodes[nodeId] || { n: 0, best: 0, t: 0 };
    n.n += 1; n.best = Math.max(n.best, lanterns); n.t = now();
    p.nodes[nodeId] = n;
  };
  S.skillTotals = function (p) {
    var r = {};
    Object.keys(p.skill).forEach(function (dev) {
      Object.keys(p.skill[dev]).forEach(function (k) {
        r[k] = r[k] || [0, 0];
        r[k][0] += p.skill[dev][k][0]; r[k][1] += p.skill[dev][k][1];
      });
    });
    return r;
  };

  /* Reeks: dagen na elkaar met een les. Eén gemiste dag per week vergeeft de draak. */
  S.activeDays = function (p) {
    var set = {};
    Object.keys(p.days).forEach(function (k) { if (S.dayTotals(p, k).l > 0 || S.dayTotals(p, k).s > 0) set[U.keyToNum(k)] = true; });
    return set;
  };
  S.streak = function (p) {
    var act = S.activeDays(p), n = U.dayNum(), count = 0, freezesUsed = {};
    if (!act[n]) n -= 1; // vandaag nog niet gespeeld: reeks loopt nog
    var gap = 0;
    while (n > 0) {
      if (act[n]) { count += 1; gap = 0; }
      else {
        var w = U.weekStart(n);
        if (!freezesUsed[w] && gap === 0 && act[n - 1]) { freezesUsed[w] = true; gap = 1; }
        else break;
      }
      n -= 1;
      if (count > 2000) break;
    }
    return count;
  };
  S.weekLanterns = function (p) {
    var act = S.activeDays(p), start = U.weekStart(U.dayNum()), r = [];
    for (var i = 0; i < 7; i++) r.push({ n: start + i, on: !!act[start + i], today: start + i === U.dayNum() });
    return r;
  };
  /* Samen-doel: lessen van alle spelers deze week. */
  S.familyWeek = function () {
    var start = U.weekStart(U.dayNum()), total = 0;
    S.players().forEach(function (p) {
      for (var i = 0; i < 7; i++) total += S.dayTotals(p, U.numToKey(start + i)).l;
    });
    return { lessons: total, goal: Math.max(5, S.players().length * 5), week: U.numToKey(start) };
  };

  S.stage = function (p) {
    var st = S.totalStars(p), idx = 0;
    if (!p.hatch) return 0;
    for (var i = 0; i < S.STAGES.length; i++) if (st >= S.STAGES[i].min) idx = i;
    return Math.max(1, idx);
  };
  S.nextStage = function (p) {
    var s = S.stage(p);
    return s + 1 < S.STAGES.length ? S.STAGES[s + 1] : null;
  };

  /* ---- woorden en herhaling ---- */
  S.item = function (p, id) { return p.items[id]; };
  S.introduced = function (p, id) { var r = p.items[id]; return !!(r && r.b > 0); };
  S.introduce = function (p, id) {
    if (S.introduced(p, id)) return;
    p.items[id] = { b: 1, d: U.dayNum(), c: 0, w: 0, t: now() };
  };
  S.grade = function (p, id, ok) {
    var r = p.items[id];
    if (!r) { S.introduce(p, id); r = p.items[id]; }
    var td = U.dayNum();
    if (ok) {
      r.c += 1;
      if (r.d <= td) {
        r.b = Math.min(S.MAXBOX, r.b + 1);
        r.d = td + S.INTERVALS[r.b];
      }
    } else {
      r.w += 1;
      r.b = Math.max(1, r.b - 1);
      r.d = td;
    }
    r.t = now();
  };
  S.ability = function (p, id, skill) {
    return (p.ability && p.ability[skill] && p.ability[skill][id]) || { streak: 0, due: 0 };
  };
  S.gradeAbility = function (p, id, skill, ok, assisted) {
    if (['L', 'H', 'P', 'T', 'S'].indexOf(skill) < 0 || (ok && assisted)) return;
    var previous = S.ability(p, id, skill);
    var day = U.dayNum();
    // Een reeks vraagt gespreide successen. Een fout wordt meteen meegeteld.
    if (ok && previous.day === day && previous.streak > 0) return;
    var streak = ok ? Math.min(3, previous.streak + 1) : 0;
    p.ability = p.ability || {};
    p.ability[skill] = p.ability[skill] || {};
    p.ability[skill][id] = { streak: streak, day: day, due: day + [0, 1, 3, 7][streak], t: now() };
  };
  S.box = function (p, id) { var r = p.items[id]; return r ? r.b : 0; };
  S.dueItems = function (p) {
    var td = U.dayNum();
    return Object.keys(p.items).filter(function (id) {
      var r = p.items[id];
      return CONTENT.items[id] && r.b > 0 && r.d <= td;
    }).sort(function (a, b) { return p.items[a].d - p.items[b].d || p.items[a].b - p.items[b].b; });
  };
  S.knownItems = function (p) {
    return Object.keys(p.items).filter(function (id) { return CONTENT.items[id] && p.items[id].b > 0; });
  };

  /* ---- leerpad ---- */
  S.allNodes = function () {
    var r = [];
    CONTENT.units.forEach(function (u) { u.lessons.forEach(function (l) { r.push({ unit: u, lesson: l }); }); });
    return r;
  };
  S.nodeDone = function (p, id) { return !!(p.nodes[id] && p.nodes[id].n > 0); };
  /* Eerste les die nog niet af is. */
  S.currentNode = function (p) {
    var all = S.allNodes();
    for (var i = 0; i < all.length; i++) if (!S.nodeDone(p, all[i].lesson.id)) return all[i].lesson.id;
    return all[all.length - 1].lesson.id;
  };
  S.nodeOpen = function (p, id) {
    if (p.set.unlockAll) return true;
    var all = S.allNodes();
    for (var i = 0; i < all.length; i++) {
      if (all[i].lesson.id === id) return true;
      if (!S.nodeDone(p, all[i].lesson.id)) return false;
    }
    return false;
  };
  /* Alle items van eenheden tot en met de huidige, voor afleiders. */
  S.unlockedItems = function (p) {
    var cur = S.currentNode(p), ids = [];
    for (var i = 0; i < CONTENT.units.length; i++) {
      var u = CONTENT.units[i];
      ids = ids.concat(u.items);
      if (u.lessons.some(function (l) { return l.id === cur; })) break;
    }
    return ids;
  };

  /* ---- logboek voor de spreadsheet ---- */
  S.log = function (entry) {
    entry.id = U.uid(12);
    entry.dev = state.device.id;
    entry.devName = state.device.name || '';
    entry.ts = now();
    state.outbox.push(entry);
    if (state.outbox.length > 300) state.outbox = state.outbox.slice(-300);
  };

  window.Store = S;
})();
