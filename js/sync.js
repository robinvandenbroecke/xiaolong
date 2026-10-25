/* Synchroniseren met een Google-spreadsheet (via een Apps Script web-app).
 *
 * Elk toestel stuurt zijn spelers op. Het script voegt ze samen met wat al in
 * de spreadsheet staat (zelfde regels als js/merge.js) en stuurt het resultaat
 * terug. Zo hebben alle toestellen dezelfde spelers en dezelfde voortgang.
 */
(function () {
  'use strict';
  var Sync = {};
  var busy = null;

  Sync.config = function () { return Store.device().sync; };
  Sync.configured = function () { var c = Sync.config(); return !!(c && c.url && c.key); };

  Sync.icon = function () {
    var c = Sync.config();
    if (!c || !c.url) return '☁︎';
    if (c.status === 'bezig') return '⟳';
    if (c.status === 'fout') return '⚠︎';
    return '☁︎✓';
  };

  function setStatus(s, msg) {
    var c = Sync.config(); if (!c) return;
    c.status = s; if (msg !== undefined) c.msg = msg;
    if (s === 'ok') c.last = Date.now();
    Store.save();
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('Geen antwoord van de spreadsheet (time-out).')); }, ms);
      promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
    });
  }
  function readJson(r) {
    return r.text().then(function (t) {
      try { return JSON.parse(t); }
      catch (e) {
        if (/<html|<!DOCTYPE/i.test(t)) throw new Error('De spreadsheet gaf een webpagina terug in plaats van gegevens. Staat "Wie heeft toegang" op "Iedereen"?');
        throw new Error('Onverwacht antwoord van de spreadsheet.');
      }
    });
  }
  function get(url, params) {
    var q = Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    return withTimeout(fetch(url + (url.indexOf('?') >= 0 ? '&' : '?') + q, { method: 'GET', redirect: 'follow' }), 25000).then(readJson);
  }
  function post(url, body) {
    // text/plain: dan vraagt de browser geen voorafgaande toestemming (CORS) en werkt Apps Script gewoon
    return withTimeout(fetch(url, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) }), 40000).then(readJson);
  }

  Sync.test = function (url, key) {
    return get(url, { a: 'ping', k: key }).then(function (r) {
      if (!r.ok) throw new Error(r.error === 'sleutel' ? 'De sleutel klopt niet.' : (r.error || 'Fout'));
      return r;
    });
  };

  /* Woordenlijst voor het tabblad "Woorden" in de spreadsheet. */
  function dictionary() {
    var d = {};
    Object.keys(CONTENT.items).forEach(function (id) { var it = CONTENT.items[id]; d[id] = [it.hz, it.py, it.nl]; });
    return d;
  }

  /* Voert een synchronisatie uit. Geeft true terug als er iets veranderd is. */
  Sync.now = function (manual) {
    if (!Sync.configured()) {
      if (manual) App.toast('Nog niet gekoppeld. Dat kan in de ouderhoek.');
      return Promise.resolve(false);
    }
    if (busy) return busy;
    if (navigator.onLine === false) {
      setStatus('fout', 'Geen internet.');
      if (manual) App.toast('Geen internet. De voortgang blijft bewaard op dit toestel.');
      return Promise.resolve(false);
    }
    var c = Sync.config();
    var st = Store.state();
    var sent = st.outbox.slice();
    var mine = Object.keys(st.players).map(function (k) { return st.players[k]; });
    var before = JSON.stringify(st.players);
    setStatus('bezig');
    busy = post(c.url, { a: 'push', k: c.key, dev: st.device.id, devName: st.device.name || '', players: mine, log: sent, dict: dictionary() })
      .then(function (r) {
        if (!r.ok) throw new Error(r.error === 'sleutel' ? 'De sleutel klopt niet.' : (r.error || 'Fout bij de spreadsheet.'));
        var all = XLMerge.mergePlayers(Object.keys(st.players).map(function (k) { return st.players[k]; }), r.players || []);
        all.forEach(function (p) { st.players[p.id] = p; });
        var sentIds = {};
        sent.forEach(function (e) { sentIds[e.id] = 1; });
        st.outbox = st.outbox.filter(function (e) { return !sentIds[e.id]; });
        if (st.device.lastPlayer && st.players[st.device.lastPlayer] && st.players[st.device.lastPlayer].del) st.device.lastPlayer = null;
        setStatus('ok', '');
        if (manual) App.toast('Gesynchroniseerd.');
        return JSON.stringify(st.players) !== before;
      })
      .catch(function (e) {
        var msg = e && e.message ? e.message : String(e);
        if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) msg = 'De spreadsheet is niet bereikbaar. Klopt de link, en is het script als web-app gepubliceerd?';
        setStatus('fout', msg);
        if (manual) App.toast(msg, 4500);
        return false;
      })
      .then(function (changed) { busy = null; return changed; });
    return busy;
  };

  /* Link om een ander toestel te koppelen. */
  Sync.link = function () {
    var c = Sync.config();
    if (!c) return '';
    var base = location.origin + location.pathname;
    return base + '#koppel=' + U.b64e(JSON.stringify({ u: c.url, k: c.key }));
  };

  Sync.newKey = function () { return U.uid(16); };

  /* Het Apps Script, met de sleutel al ingevuld. */
  Sync.scriptText = function (key) {
    return fetch('sync/Code.gs').then(function (r) { return r.text(); }).then(function (t) {
      return t.replace(/var SLEUTEL = '[^']*';/, "var SLEUTEL = '" + key + "';");
    });
  };

  window.Sync = Sync;
})();
