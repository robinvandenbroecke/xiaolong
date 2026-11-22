/* Opstarten, navigatie en kleine onderdelen (venster, bevestigen, confetti). */
(function () {
  'use strict';
  var h = U.h;
  var App = {};
  var current = null;

  App.go = function (name, opts) {
    Snd.stop();
    closeModal();
    current = name;
    window.scrollTo(0, 0);
    document.body.dataset.screen = name;
    var fn = {
      chooser: Screens.chooser, newplayer: Screens.newplayer, home: Screens.home, path: Screens.path, album: Screens.album,
      mine: Mine.show, adventure: Mine.adventure, china: Mine.china, wardrobe: Mine.wardrobe, hongbao: Screens.hongbao, story: Screens.story, parent: Parent.show
    }[name];
    if (fn) fn(opts);
    reloadIfReady();
  };
  App.screen = function () { return current; };

  /* Na een les: welke feestjes volgen er? */
  App.eventsAfter = function (p, stageBefore, goalBefore) {
    var ev = [];
    if (!p.hatch) ev.push('hatch');
    else if (Store.stage(p) > stageBefore && stageBefore > 0) ev.push('grow');
    if (!goalBefore && Store.dayTotals(p).s >= p.set.goal && !p.hb[U.dayKey()]) ev.push('goal');
    var fw = Store.familyWeek();
    if (Store.players().length > 1 && fw.lessons >= fw.goal && !p.fam[fw.week]) { p.fam[fw.week] = Date.now(); Store.save(); ev.push('family'); }
    return ev;
  };

  App.startLesson = function (node) {
    var p = Store.current();
    if (!p) { App.go('chooser'); return; }
    current = 'lesson';
    document.body.dataset.screen = 'lesson';
    var before = Store.stage(p), goalBefore = Store.dayTotals(p).s >= p.set.goal;
    Lesson.run(p, node, function (res) {
      App.syncSoon();
      if (res.aborted) { App.go('home'); return; }
      current = 'results';
      document.body.dataset.screen = 'results';
      Screens.results(res, App.eventsAfter(p, before, goalBefore));
    });
  };

  /* ---- vensters ---- */
  var modalEl = null;
  function closeModal() {
    if (modalEl) { modalEl.remove(); modalEl = null; }
  }
  App.closeModal = closeModal;
  App.modal = function (content, opts) {
    opts = opts || {};
    closeModal();
    var box = h('div.modal-box' + (opts.sheet ? '.sheet' : ''), { role: 'dialog' });
    var x = h('button.modal-x', { type: 'button', 'aria-label': 'Sluiten' }, '✕');
    x.addEventListener('click', function () { closeModal(); if (opts.onClose) opts.onClose(); });
    box.appendChild(x);
    box.appendChild(content);
    modalEl = h('div.modal' + (opts.sheet ? '.sheet' : ''), box);
    modalEl.addEventListener('click', function (e) { if (e.target === modalEl) { closeModal(); if (opts.onClose) opts.onClose(); } });
    document.body.appendChild(modalEl);
    return box;
  };
  App.confirm = function (text, yes, no) {
    return new Promise(function (resolve) {
      var body = h('div.confirm', h('p', text));
      var row = h('div.row');
      var b1 = h('button.btn.ghost', { type: 'button' }, no || 'Nee');
      var b2 = h('button.btn.primary', { type: 'button' }, yes || 'Ja');
      b1.addEventListener('click', function () { closeModal(); resolve(false); });
      b2.addEventListener('click', function () { closeModal(); resolve(true); });
      row.appendChild(b1); row.appendChild(b2);
      body.appendChild(row);
      App.modal(body, { onClose: function () { resolve(false); } });
    });
  };
  App.toast = function (text, ms) {
    var t = h('div.toast', text);
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 400); }, ms || 2600);
  };

  /* Confetti in rood en goud (niet op e-ink). */
  App.confetti = function () {
    if (U.isEink() || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    var c = h('canvas.confetti');
    document.body.appendChild(c);
    var W = c.width = window.innerWidth, H = c.height = window.innerHeight, ctx = c.getContext('2d');
    var colors = ['#E0362C', '#F6B73C', '#1E9E7E', '#FFFFFF', '#F28C28'];
    var parts = [];
    for (var i = 0; i < 90; i++) parts.push({ x: W / 2 + (Math.random() - 0.5) * 120, y: H * 0.35, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 4, c: U.pick(colors), a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3 });
    var t0 = performance.now();
    (function loop(t) {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.a += p.va; p.vx *= 0.99;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
      });
      if (t - t0 < 2600) requestAnimationFrame(loop); else c.remove();
    })(t0);
  };

  /* ---- ouderpoort: een getal in letters intypen ---- */
  var EEN = ['', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen'];
  var TIEN = ['tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien'];
  var TIENTAL = ['', '', 'twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig'];
  function under100(n) {
    if (n < 10) return EEN[n];
    if (n < 20) return TIEN[n - 10];
    var e = n % 10, t = Math.floor(n / 10);
    if (!e) return TIENTAL[t];
    var u = EEN[e];
    return u + (/e$/.test(u) ? 'ën' : 'en') + TIENTAL[t];
  }
  function under1000(n) {
    var hd = Math.floor(n / 100), r = n % 100;
    return (hd ? (hd > 1 ? EEN[hd] : '') + 'honderd' : '') + under100(r);
  }
  App.numberWords = function (n) {
    var th = Math.floor(n / 1000), r = n % 1000;
    return ((th ? (th > 1 ? under1000(th) : '') + 'duizend' : '') + (th && r ? ' ' : '') + under1000(r)).trim();
  };
  App.parentGate = function () {
    return new Promise(function (resolve) {
      var n = 1000 + Math.floor(Math.random() * 8999);
      var body = h('div.gate');
      body.appendChild(h('h3', 'Ouderhoek'));
      body.appendChild(h('p', 'Typ dit getal in cijfers:'));
      body.appendChild(h('p.gate-n', App.numberWords(n)));
      var inp = h('input.gate-in', { type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '5' });
      body.appendChild(inp);
      var row = h('div.row');
      var ok = h('button.btn.primary', { type: 'button' }, 'Open');
      function check() {
        if (parseInt(inp.value.replace(/\D/g, ''), 10) === n) { closeModal(); resolve(true); }
        else { inp.classList.add('shake'); setTimeout(function () { inp.classList.remove('shake'); }, 400); inp.value = ''; }
      }
      ok.addEventListener('click', check);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
      row.appendChild(ok);
      body.appendChild(row);
      App.modal(body, { onClose: function () { resolve(false); } });
      setTimeout(function () { inp.focus(); }, 50);
    });
  };

  /* ---- synchroniseren ---- */
  var syncTimer = null;
  App.syncSoon = function () {
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () { Sync.now(false); }, 1500);
  };

  /* ---- e-ink ---- */
  App.applyDevice = function () {
    var d = Store.device();
    var params = new URLSearchParams(location.search);
    if (params.get('eink') === '1') d.eink = true;
    if (params.get('eink') === '0') d.eink = false;
    document.documentElement.classList.toggle('eink', !!d.eink);
    if (d.eink) document.documentElement.style.setProperty('--pc', '#000');
    else document.documentElement.style.removeProperty('--pc');
    Snd.setEnabled(d.sound !== false);
  };

  /* Een nieuwe worker neemt over zodra de versie voor offline gebruik klaarstaat. */
  var updateReady = false;
  var reloading = false;
  var updateRegistration;
  var manualUpdate;

  function reloadIfReady() {
    if (!updateReady || reloading || document.visibilityState === 'hidden') return;
    if (current !== 'home' && current !== 'chooser' && current !== 'newplayer' && !(manualUpdate && current === 'parent')) return;
    reloading = true;
    Store.save();
    location.reload();
  }

  function startUpdates() {
    if (!('serviceWorker' in navigator) || window.isSecureContext === false) return;
    var serviceWorker = navigator.serviceWorker;
    var previous = serviceWorker.controller;
    function checkController() {
      var next = serviceWorker.controller;
      if (previous && next && previous !== next) updateReady = true;
      if (next) previous = next;
      reloadIfReady();
      return next;
    }
    serviceWorker.addEventListener('controllerchange', check);
    var registration = serviceWorker.register('sw.js', { updateViaCache: 'none' });
    updateRegistration = registration;
    registration.catch(function () {});
    var lastCheck = 0;
    function check() {
      var controller = checkController();
      if (navigator.onLine === false || reloading || document.visibilityState === 'hidden') return;
      if (controller && !updateReady) controller.postMessage('CACHE_AUDIO');
      if (updateReady || Date.now() - lastCheck < 15000) return;
      lastCheck = Date.now();
      registration.then(function (reg) { return reg.update(); }).catch(function () {
        lastCheck = 0;
      });
    }
    check();
    window.addEventListener('online', function () { lastCheck = 0; check(); });
    window.addEventListener('focus', check);
    window.setInterval(check, 60000);
    window.addEventListener('pageshow', function (event) { if (event.persisted) check(); });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') check();
    });
  }

  App.checkForUpdate = function (report) {
    if (!updateRegistration) return Promise.resolve('Deze browser ondersteunt geen app-updates.');
    if (navigator.onLine === false) return Promise.resolve('Verbind met wifi en probeer opnieuw.');
    if (manualUpdate) return manualUpdate;
    if (updateReady) {
      manualUpdate = Promise.resolve();
      reloadIfReady();
      return manualUpdate;
    }

    var serviceWorker = navigator.serviceWorker;
    var initial = serviceWorker.controller;
    var timeout;
    var interval;
    var stop;
    var finish = new Promise(function (resolve) { stop = resolve; });
    function inspect(registration, worker) {
      if (updateReady || (initial && serviceWorker.controller && serviceWorker.controller !== initial)) {
        updateReady = true;
        report('Update klaar. De app wordt opnieuw geladen.');
        reloadIfReady();
        stop('De update opent zodra je terugkeert naar het startscherm.');
        return;
      }
      if (worker && worker.state === 'redundant' && !registration.installing && !registration.waiting) {
        stop('De update kon niet worden geladen. Probeer opnieuw.');
      }
    }
    timeout = setTimeout(function () {
      stop('De controle duurt langer dan verwacht. Probeer straks opnieuw.');
    }, 45000);

    manualUpdate = finish.then(function (message) {
      clearTimeout(timeout);
      clearInterval(interval);
      manualUpdate = null;
      return message;
    });
    updateRegistration.then(function (registration) {
      var worker = registration.installing || registration.waiting;
      return registration.update().then(function () {
        if (!manualUpdate) return;
        worker = registration.installing || registration.waiting || worker;
        inspect(registration, worker);
        if (!worker && !updateReady) {
          stop('Je hebt de nieuwste versie.');
          return;
        }
        report('Update wordt geladen…');
        interval = setInterval(function () {
          if (!initial && serviceWorker.controller) stop('Je hebt de nieuwste versie.');
          else inspect(registration, worker);
        }, 250);
      });
    }).catch(function () {
      stop('Controleren lukt niet. Controleer je verbinding en probeer opnieuw.');
    });
    return manualUpdate;
  };

  /* ---- opstarten ---- */
  App.boot = function () {
    Family.load();
    Store.load(Family.account());
    App.applyDevice();
    // koppellink uit de spreadsheet: #koppel=...
    var m = location.hash.match(/koppel=([A-Za-z0-9_\-]+)/);
    if (m) {
      try {
        var cfg = JSON.parse(U.b64d(m[1]));
        if (!Family.active() && cfg.u && cfg.k) {
          Store.device().sync = { url: cfg.u, key: cfg.k, last: 0, status: 'nieuw' };
          Store.save();
          setTimeout(function () { App.toast('Gekoppeld aan de spreadsheet.'); }, 300);
        }
      } catch (e) { /* ongeldige link */ }
      history.replaceState(null, '', location.pathname + location.search);
    }
    Store.onChange(function () { var el = document.getElementById('syncIcon'); if (el) el.textContent = Sync.icon(); });
    document.addEventListener('pointerdown', function once() { Snd.unlock(); document.removeEventListener('pointerdown', once); });
    var p = Store.current();
    if (Store.players().length === 0) App.go('newplayer');
    else if (Store.players().length === 1 && p) App.go('home');
    else App.go('chooser');
    Sync.now(false).then(function (changed) {
      if (changed && (current === 'chooser' || current === 'home' || (current === 'newplayer' && Store.players().length))) App.go(current === 'newplayer' ? 'chooser' : current);
    });
    window.addEventListener('online', App.syncSoon);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') Sync.now(false).then(function (changed) {
        if (changed && (current === 'chooser' || current === 'home' || (current === 'newplayer' && Store.players().length))) App.go(current === 'newplayer' ? 'chooser' : current);
      });
    });
    startUpdates();
  };

  window.App = App;
  document.addEventListener('DOMContentLoaded', App.boot);
})();
