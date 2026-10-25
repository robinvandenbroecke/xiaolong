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

  var api = { mergePlayer: mergePlayer, mergePlayers: mergePlayers };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.XLMerge = api;
})(typeof self !== 'undefined' ? self : this);
