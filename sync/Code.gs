/**
 * Xiǎolóng: voortgang bewaren in deze spreadsheet.
 *
 * Installeren (één keer, op een computer):
 *  1. Maak een nieuwe Google-spreadsheet, bv. "Xiǎolóng voortgang".
 *  2. Menu Extensies > Apps Script. Wis wat er staat en plak dit hele script.
 *  3. Klik op Opslaan (het schijfje).
 *  4. Klik rechtsboven op Implementeren > Nieuwe implementatie.
 *     Type: Web-app. Uitvoeren als: Ik. Wie heeft toegang: Iedereen.
 *  5. Klik op Implementeren en geef toestemming (Geavanceerd > Ga naar ... ).
 *  6. Kopieer de URL van de web-app en plak die in de app (ouderhoek >
 *     Synchroniseren).
 *
 * De sleutel hieronder beschermt je gegevens: alleen wie de sleutel kent,
 * kan lezen of schrijven. De app vult hem in als je het script daar kopieert.
 */
var SLEUTEL = 'VUL-HIER-JE-SLEUTEL-IN';

var CHUNK = 45000;

function doGet(e) {
  return handle((e && e.parameter) || {}, null);
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { body = {}; }
  return handle(body, body);
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function handle(p, body) {
  if (!p.k || p.k !== SLEUTEL) return out({ ok: false, error: 'sleutel' });
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (p.a === 'ping') return out({ ok: true, name: ss.getName() });
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    setup(ss);
    var stored = readPlayers(ss);
    if (p.a === 'pull') return out({ ok: true, players: stored });
    if (p.a === 'push') {
      var merged = XLMerge.mergePlayers(stored, (body && body.players) || []);
      writePlayers(ss, merged);
      appendLog(ss, (body && body.log) || [], body && body.devName);
      var live = merged.filter(function (pl) { return !pl.del; });
      writeOverview(ss, live);
      if (body && body.dict) writeWords(ss, live, body.dict);
      return out({ ok: true, players: merged });
    }
    return out({ ok: false, error: 'onbekende vraag' });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- tabbladen ---------- */
function sheet(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function setup(ss) {
  sheet(ss, 'Overzicht', ['Speler', 'Sterren', 'Reeks (dagen)', 'Woorden gezien', 'Woorden gekend', 'Lessen deze week', 'Minuten deze week', 'Laatst gespeeld', 'Luisteren', 'Tekens lezen', 'Pinyin', 'Tonen', 'Spreken', 'Stickers']);
  sheet(ss, 'Logboek', ['Tijd', 'Speler', 'Toestel', 'Soort', 'Les', 'Juist', 'Vragen', 'Sterren', 'Minuten', 'id']);
  sheet(ss, 'Woorden', ['Speler', 'Hanzi', 'Pinyin', 'Betekenis', 'Doos (1-6)', 'Juist', 'Fout', 'Laatst geoefend', 'Volgende keer']);
  var data = sheet(ss, 'Gegevens', ['id', 'naam', 'bijgewerkt', 'data']);
  var first = ss.getSheets()[0];
  if (first.getName() !== 'Overzicht') {
    ss.setActiveSheet(ss.getSheetByName('Overzicht'));
    ss.moveActiveSheet(1);
  }
  var blank = ss.getSheetByName('Blad1') || ss.getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0 && ss.getSheets().length > 4) ss.deleteSheet(blank);
  return data;
}

function readPlayers(ss) {
  var sh = ss.getSheetByName('Gegevens');
  var n = sh.getLastRow() - 1;
  if (n < 1) return [];
  var cols = Math.max(4, sh.getLastColumn());
  var rows = sh.getRange(2, 1, n, cols).getValues();
  var out = [];
  rows.forEach(function (r) {
    if (!r[0]) return;
    var json = r.slice(3).join('');
    try { out.push(JSON.parse(json)); } catch (e) { /* kapotte rij overslaan */ }
  });
  return out;
}

function writePlayers(ss, players) {
  var sh = ss.getSheetByName('Gegevens');
  var rows = [], maxChunks = 1;
  players.forEach(function (p) {
    var json = JSON.stringify(p), chunks = [];
    for (var i = 0; i < json.length; i += CHUNK) chunks.push(json.slice(i, i + CHUNK));
    maxChunks = Math.max(maxChunks, chunks.length);
    rows.push([p.id, (p.prof && p.prof.name) || '', new Date()].concat(chunks));
  });
  rows = rows.map(function (r) { while (r.length < 3 + maxChunks) r.push(''); return r; });
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, sh.getLastColumn()).clearContent();
  if (rows.length) {
    if (sh.getMaxColumns() < 3 + maxChunks) sh.insertColumnsAfter(sh.getMaxColumns(), 3 + maxChunks - sh.getMaxColumns());
    sh.getRange(2, 1, rows.length, 3 + maxChunks).setValues(rows);
  }
}

function appendLog(ss, log, devName) {
  if (!log.length) return;
  var sh = ss.getSheetByName('Logboek');
  var last = sh.getLastRow();
  var seen = {};
  if (last > 1) {
    var from = Math.max(2, last - 400);
    sh.getRange(from, 10, last - from + 1, 1).getValues().forEach(function (r) { seen[r[0]] = 1; });
  }
  var rows = [];
  log.forEach(function (e) {
    if (!e || !e.id || seen[e.id]) return;
    rows.push([new Date(e.ts || Date.now()), e.name || '', e.devName || devName || '', e.type === 'verhaal' ? 'verhaal' : (e.aborted ? 'les (gestopt)' : 'les'),
      e.title || e.node || '', e.ok || 0, e.total || 0, e.stars || 0, Math.round((e.secs || 0) / 6) / 10, e.id]);
  });
  if (rows.length) sh.getRange(last + 1, 1, rows.length, rows[0].length).setValues(rows);
}

/* ---------- overzicht ---------- */
function pad(n) { return (n < 10 ? '0' : '') + n; }
function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function keyToNum(k) { var p = k.split('-'); return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
function todayNum() { var d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }
function weekStart(n) { return n - ((n + 3) % 7); }

function dayTotals(p, key) {
  var d = (p.days || {})[key] || {}, r = { s: 0, l: 0, m: 0 };
  Object.keys(d).forEach(function (dev) { r.s += d[dev].s || 0; r.l += d[dev].l || 0; r.m += d[dev].m || 0; });
  return r;
}

function streak(p) {
  var act = {};
  Object.keys(p.days || {}).forEach(function (k) { var t = dayTotals(p, k); if (t.l > 0 || t.s > 0) act[keyToNum(k)] = true; });
  var n = todayNum(), count = 0, used = {};
  if (!act[n]) n -= 1;
  var gap = 0, guard = 0;
  while (n > 0 && guard++ < 3000) {
    if (act[n]) { count++; gap = 0; }
    else {
      var w = weekStart(n);
      if (!used[w] && gap === 0 && act[n - 1]) { used[w] = true; gap = 1; } else break;
    }
    n--;
  }
  return count;
}

function writeOverview(ss, players) {
  var sh = ss.getSheetByName('Overzicht');
  var start = weekStart(todayNum());
  var rows = players.map(function (p) {
    var stars = 0; Object.keys(p.stars || {}).forEach(function (d) { stars += p.stars[d] || 0; });
    var items = p.items || {}, seen = 0, known = 0, last = 0;
    Object.keys(items).forEach(function (id) { var r = items[id]; if (r.b > 0) seen++; if (r.b >= 3) known++; last = Math.max(last, r.t || 0); });
    var lw = 0, mw = 0;
    Object.keys(p.days || {}).forEach(function (k) { var n = keyToNum(k); if (n >= start) { var t = dayTotals(p, k); lw += t.l; mw += t.m; } });
    var sk = {};
    Object.keys(p.skill || {}).forEach(function (dev) {
      Object.keys(p.skill[dev]).forEach(function (k) { sk[k] = sk[k] || [0, 0]; sk[k][0] += p.skill[dev][k][0]; sk[k][1] += p.skill[dev][k][1]; });
    });
    function pct(k) { return sk[k] && sk[k][1] ? Math.round(100 * sk[k][0] / sk[k][1]) + '% (' + sk[k][1] + ')' : ''; }
    Object.keys(p.nodes || {}).forEach(function (id) { last = Math.max(last, p.nodes[id].t || 0); });
    return [(p.prof && p.prof.name) || '', stars, streak(p), seen, known, lw, Math.round(mw / 60), last ? new Date(last) : '',
      pct('L'), pct('H'), pct('P'), pct('T'), pct('S'), Object.keys(p.stickers || {}).length];
  });
  var lastRow = sh.getLastRow();
  if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, 14).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, 14).setValues(rows);
}

function writeWords(ss, players, dict) {
  var sh = ss.getSheetByName('Woorden');
  var rows = [];
  players.forEach(function (p) {
    var items = p.items || {};
    Object.keys(items).sort(function (a, b) { return (items[a].b - items[b].b) || ((items[b].w || 0) - (items[a].w || 0)); }).forEach(function (id) {
      var r = items[id], d = dict[id];
      if (!d || !(r.b > 0)) return;
      var next = new Date((r.d || 0) * 86400000);
      rows.push([(p.prof && p.prof.name) || '', d[0], d[1], d[2], r.b, r.c || 0, r.w || 0, r.t ? new Date(r.t) : '', next]);
    });
  });
  var lastRow = sh.getLastRow();
  if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, 9).clearContent();
  if (rows.length) sh.getRange(2, 1, rows.length, 9).setValues(rows);
  sh.getRange(2, 9, Math.max(1, rows.length), 1).setNumberFormat('yyyy-mm-dd');
}

/* ---------- samenvoegen (kopie van js/merge.js) ---------- */
/* Samenvoegen van spelergegevens van verschillende toestellen.
 *
 * Dit bestand wordt zowel in de app als in het Google Apps Script gebruikt
 * (sync/Code.gs bevat een kopie). Daarom: geen DOM, geen andere bestanden.
 *
 * De regels zorgen ervoor dat samenvoegen in elke volgorde hetzelfde geeft,
 * en dat twee keer samenvoegen niets verandert:
 *  - profiel en instellingen: de laatst gewijzigde versie wint (veld t)
 *  - woorden: per woord de laatst geoefende versie
 *  - sterren en dagtellers: per toestel het hoogste getal (elk toestel telt
 *    alleen zijn eigen sterren, dus niets gaat verloren of telt dubbel)
 *  - lessen, stickers, envelopjes: alles wat ergens gehaald is, blijft gehaald
 */
(function (root) {
  'use strict';

  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function num(x) { return typeof x === 'number' && isFinite(x) ? x : 0; }

  function lww(a, b) {
    if (!isObj(a)) return isObj(b) ? clone(b) : a;
    if (!isObj(b)) return clone(a);
    if (num(b.t) > num(a.t)) return clone(b);
    if (num(b.t) < num(a.t)) return clone(a);
    // gelijk: kies deterministisch (op tekst) zodat beide kanten hetzelfde kiezen
    return JSON.stringify(a) >= JSON.stringify(b) ? clone(a) : clone(b);
  }
  function clone(x) { return x === undefined ? x : JSON.parse(JSON.stringify(x)); }

  function mergeItems(a, b) {
    var out = {}, k;
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    for (k in a) if (a.hasOwnProperty(k)) out[k] = clone(a[k]);
    for (k in b) {
      if (!b.hasOwnProperty(k)) continue;
      if (!out[k]) { out[k] = clone(b[k]); continue; }
      var x = out[k], y = b[k];
      var tx = num(x.t), ty = num(y.t);
      if (ty > tx || (ty === tx && JSON.stringify(y) > JSON.stringify(x))) out[k] = clone(y);
    }
    return out;
  }

  /* Per sleutel het maximum, recursief voor geneste tellers. */
  function maxTree(a, b) {
    if (typeof a === 'number' || typeof b === 'number') return Math.max(num(a), num(b));
    if (Array.isArray(a) || Array.isArray(b)) {
      var x = Array.isArray(a) ? a : [], y = Array.isArray(b) ? b : [], r = [];
      for (var i = 0; i < Math.max(x.length, y.length); i++) r.push(Math.max(num(x[i]), num(y[i])));
      return r;
    }
    var out = {}, k;
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    for (k in a) if (a.hasOwnProperty(k)) out[k] = b.hasOwnProperty(k) ? maxTree(a[k], b[k]) : clone(a[k]);
    for (k in b) if (b.hasOwnProperty(k) && !out.hasOwnProperty(k)) out[k] = clone(b[k]);
    return out;
  }

  /* Vereniging; bij beide aanwezig: de vroegste tijd. */
  function union(a, b) {
    var out = {}, k;
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    for (k in a) if (a.hasOwnProperty(k)) out[k] = a[k];
    for (k in b) {
      if (!b.hasOwnProperty(k)) continue;
      out[k] = out.hasOwnProperty(k) ? Math.min(num(out[k]) || num(b[k]), num(b[k]) || num(out[k])) : b[k];
    }
    return out;
  }

  function mergeNodes(a, b) {
    var out = {}, k;
    a = isObj(a) ? a : {}; b = isObj(b) ? b : {};
    for (k in a) if (a.hasOwnProperty(k)) out[k] = clone(a[k]);
    for (k in b) {
      if (!b.hasOwnProperty(k)) continue;
      if (!out[k]) { out[k] = clone(b[k]); continue; }
      out[k] = { n: Math.max(num(out[k].n), num(b[k].n)), best: Math.max(num(out[k].best), num(b[k].best)), t: Math.max(num(out[k].t), num(b[k].t)) };
    }
    return out;
  }

  function mergePlayer(a, b) {
    if (!isObj(a)) return clone(b);
    if (!isObj(b)) return clone(a);
    var hatchA = num(a.hatch), hatchB = num(b.hatch);
    return {
      id: a.id || b.id,
      v: Math.max(num(a.v), num(b.v)) || 1,
      prof: lww(a.prof, b.prof),
      set: lww(a.set, b.set),
      del: Math.max(num(a.del), num(b.del)),
      items: mergeItems(a.items, b.items),
      nodes: mergeNodes(a.nodes, b.nodes),
      stars: maxTree(a.stars, b.stars),
      days: maxTree(a.days, b.days),
      skill: maxTree(a.skill, b.skill),
      stickers: union(a.stickers, b.stickers),
      hb: union(a.hb, b.hb),
      fam: union(a.fam, b.fam),
      seen: union(a.seen, b.seen),
      hatch: hatchA && hatchB ? Math.min(hatchA, hatchB) : (hatchA || hatchB)
    };
  }

  /* Lijsten van spelers samenvoegen op id. */
  function mergePlayers(listA, listB) {
    var byId = {}, order = [];
    function add(p) {
      if (!isObj(p) || !p.id) return;
      if (byId[p.id]) byId[p.id] = mergePlayer(byId[p.id], p);
      else { byId[p.id] = clone(p); order.push(p.id); }
    }
    (listA || []).forEach(add);
    (listB || []).forEach(add);
    order.sort();
    return order.map(function (id) { return byId[id]; });
  }

  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (!value || typeof value !== 'object') return value;
    var ordered = Object.create(null);
    Object.keys(value).sort().forEach(function (key) { ordered[key] = canonical(value[key]); });
    return ordered;
  }

  function same(a, b) {
    return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
  }

  var api = { mergePlayer: mergePlayer, mergePlayers: mergePlayers, same: same };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.XLMerge = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

