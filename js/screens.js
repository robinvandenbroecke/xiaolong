/* Schermen: wie speelt er, start (leerpad), resultaten, verhalen, envelopje, album. */
(function () {
  'use strict';
  var h = U.h;
  var Scr = {};

  function app() { return U.clear(U.$('#app')); }
  function item(id) { return CONTENT.items[id]; }

  /* ---------- lantaarn (knop op het pad) ---------- */
  function lanternSVG(state, color) {
    var body = state === 'locked' ? '#3A4166' : (color || '#E0362C');
    var rib = state === 'locked' ? '#4D557E' : 'rgba(0,0,0,.18)';
    var cap = state === 'locked' ? '#5A628C' : '#F6B73C';
    return '<svg viewBox="0 0 80 100" class="lantern-svg" aria-hidden="true">' +
      '<rect x="26" y="6" width="28" height="9" rx="3" fill="' + cap + '"/>' +
      '<ellipse cx="40" cy="50" rx="35" ry="34" fill="' + body + '"/>' +
      '<ellipse cx="40" cy="50" rx="22" ry="34" fill="none" stroke="' + rib + '" stroke-width="3"/>' +
      '<ellipse cx="40" cy="50" rx="8" ry="34" fill="none" stroke="' + rib + '" stroke-width="3"/>' +
      '<rect x="26" y="83" width="28" height="8" rx="3" fill="' + cap + '"/>' +
      '<path d="M40,91 L40,99 M35,92 L33,99 M45,92 L47,99" stroke="' + cap + '" stroke-width="2.5" stroke-linecap="round"/>' +
      '</svg>';
  }
  Scr.lanternSVG = lanternSVG;

  function nodeLabel(lesson) {
    if (lesson.kind === 'groei') return lesson.level;
    if (lesson.kind === 'verhaal') return '📜';
    if (lesson.kind === 'toonles') return lesson.id === 'u1a' ? 'ā à' : lesson.id === 'u1b' ? 'á ǎ' : 'āáǎà';
    if (lesson.kind === 'tekens') return lesson.comps.join('');
    var first = item(lesson.new[0]);
    return first ? first.hz.replace(/[，。！？]/g, '').slice(0, 3) : '·';
  }

  /* ---------- wie speelt er? ---------- */
  Scr.chooser = function () {
    var root = app();
    var wrap = h('div.chooser');
    wrap.appendChild(h('h1.title', { lang: 'zh-CN' }, h('span.hz', '小龙'), h('span.sub', 'Xiǎolóng')));
    wrap.appendChild(h('p.lead', 'Wie speelt er?'));
    var grid = h('div.who');
    Store.players().forEach(function (p) {
      var col = Store.colorOf(p);
      var b = h('button.who-tile', { type: 'button', style: { '--pc': col.main } },
        h('span.who-dragon', { html: Dragon.forPlayer(p, 'happy') }),
        h('span.who-name', p.prof.name),
        h('span.who-meta', '🏮 ' + Store.streak(p) + '   ★ ' + Store.totalStars(p)));
      b.addEventListener('click', function () { Snd.unlock(); Snd.fx('tap'); Store.setCurrent(p.id); App.go('home'); App.syncSoon(); });
      grid.appendChild(b);
    });
    var add = h('button.who-tile.add', { type: 'button' }, h('span.who-plus', '+'), h('span.who-name', 'Nieuwe speler'));
    add.addEventListener('click', function () {
      Snd.unlock();
      if (Family.active()) App.parentGate().then(function (ok) { if (ok) App.go('parent', { tab: 'sync' }); });
      else App.go('newplayer');
    });
    grid.appendChild(add);
    wrap.appendChild(grid);
    var foot = h('div.foot-links');
    var parent = h('button.link', { type: 'button' }, 'Ouderhoek');
    parent.addEventListener('click', function () { App.parentGate().then(function (ok) { if (ok) App.go('parent'); }); });
    foot.appendChild(parent);
    wrap.appendChild(foot);
    root.appendChild(wrap);
  };

  /* ---------- nieuwe speler ---------- */
  Scr.newplayer = function (opts) {
    opts = opts || {};
    var edit = opts.player || null;
    if (!edit && Family.active()) { App.go('parent', { tab: 'sync' }); return; }
    var shared = edit && Store.familyPlayer(edit.id);
    var root = app();
    var chosen = edit ? edit.prof.color : Store.COLORS[Math.floor(Math.random() * Store.COLORS.length)].id;
    var wrap = h('div.newplayer');
    wrap.appendChild(h('h2', edit ? 'Speler aanpassen' : 'Een nieuwe draak!'));
    var preview = h('div.np-dragon');
    function paint() {
      var col = Store.COLORS.filter(function (c) { return c.id === chosen; })[0];
      preview.innerHTML = Dragon.svg({ color: col, stage: edit ? Math.max(1, Store.stage(edit)) : 0, mood: 'happy', crack: false });
    }
    wrap.appendChild(preview);
    var name = h('input.np-name', { type: 'text', maxlength: '20', placeholder: 'Je naam', value: edit ? edit.prof.name : '', autocomplete: 'off' });
    wrap.appendChild(shared ? h('p.np-lbl', edit.prof.name) : h('label.np-lbl', 'Hoe heet je?', name));
    var colors = h('div.np-colors');
    Store.COLORS.forEach(function (c) {
      var b = h('button.np-color', { type: 'button', 'aria-label': c.nl, style: { background: c.main } });
      if (c.id === chosen) b.classList.add('sel');
      b.addEventListener('click', function () {
        chosen = c.id; Snd.fx('tap');
        U.$$('.np-color', colors).forEach(function (x) { x.classList.remove('sel'); });
        b.classList.add('sel'); paint();
      });
      colors.appendChild(b);
    });
    wrap.appendChild(h('div.np-lbl', 'Welke kleur heeft je draak?', colors));
    if (!edit) wrap.appendChild(h('p.np-note', 'Je draak zit nog in een ei. Na je eerste les komt hij eruit!'));
    var row = h('div.row');
    var back = h('button.btn.ghost', { type: 'button' }, 'Terug');
    back.addEventListener('click', function () { App.go(opts.back || (Store.players().length ? 'chooser' : 'chooser')); });
    var ok = h('button.btn.primary', { type: 'button' }, edit ? 'Bewaren' : 'Maak mijn draak');
    ok.addEventListener('click', function () {
      var n = name.value.trim();
      if (!n) { name.focus(); name.classList.add('shake'); setTimeout(function () { name.classList.remove('shake'); }, 400); return; }
      if (edit) { Store.editPlayer(edit, shared ? { color: chosen } : { name: n, color: chosen }); App.go(opts.back || 'parent'); }
      else { Store.addPlayer(n, chosen); App.go('home'); }
      App.syncSoon();
    });
    row.appendChild(back); row.appendChild(ok);
    wrap.appendChild(row);
    if (!edit && !Family.active()) {
      wrap.appendChild(h('button.btn.ghost', { type: 'button', onclick: function () {
        App.parentGate().then(function (ok) { if (ok) App.go('parent', { tab: 'sync' }); });
      } }, 'Ik heb al een gezinsaccount'));
    }
    root.appendChild(wrap);
    paint();
    setTimeout(function () { if (!edit) name.focus(); }, 100);
  };

  /* ---------- start ---------- */
  var GREETINGS = [
    { hz: '你好', py: 'nǐ hǎo', nl: 'hallo' },
    { hz: '加油', py: 'jiāyóu', nl: 'zet hem op' },
    { hz: '我们玩吧', py: 'wǒmen wán ba', nl: 'kom, we spelen' },
    { hz: '你好吗', py: 'nǐ hǎo ma', nl: 'hoe gaat het?' }
  ];

  Scr.home = function () {
    var p = Store.current();
    if (!p) { App.go('chooser'); return; }
    var root = app();
    var col = Store.colorOf(p);
    document.documentElement.style.setProperty('--pc', U.isEink() ? '#000' : col.main);
    var home = h('div.home');

    // bovenbalk
    var who = h('button.chip.who-chip', { type: 'button' },
      h('span.chip-dragon', { html: Dragon.forPlayer(p, 'normal', { crop: 'head' }) }), h('span', p.prof.name), h('span.chev', '▾'));
    who.addEventListener('click', function () { Snd.fx('tap'); App.go('chooser'); });
    var stars = h('span.chip.stat', { 'aria-label': Store.totalStars(p) + ' groeisterren' }, h('span.star-ic', '★'), String(Store.totalStars(p)));
    var sync = null;
    if (Sync.configured()) {
      sync = h('button.chip.sync-ic', { type: 'button', 'aria-label': 'Synchroniseren', id: 'syncIcon' }, Sync.icon());
      sync.addEventListener('click', function () { Sync.now(true).then(function (ch) { if (ch) App.go('home'); }); });
    }
    var gear = h('button.chip.gear', { type: 'button', 'aria-label': 'Ouderhoek' }, '⚙');
    gear.addEventListener('click', function () { App.parentGate().then(function (ok) { if (ok) App.go('parent'); }); });
    home.appendChild(h('header.topbar', who, h('div.top-stats', stars, sync, gear)));

    // Startscherm: de volgende les staat bovenaan.
    var side = h('section.side');
    side.appendChild(lessonOverview(p));
    var stage = Store.stage(p);
    var dt = Store.dayTotals(p);
    var goal = p.set.goal || 20;
    var g = GREETINGS[(U.dayNum() + p.prof.name.length) % GREETINGS.length];
    var hero = h('div.hero');
    var dragonEl = h('div.hero-dragon', { html: Dragon.forPlayer(p, stage === 0 ? 'normal' : (dt.s >= goal ? 'cheer' : 'happy'), { crack: stage === 0 && Store.totalStars(p) > 0 }) });
    dragonEl.addEventListener('click', function () {
      Snd.fx('pop');
      dragonEl.classList.remove('wiggle'); void dragonEl.offsetWidth; dragonEl.classList.add('wiggle');
      var pr = U.pick(CONTENT.praise.filter(function (x) { return x.kind === 'good'; }));
      if (pr.au && pr.au.length) Snd.play(pr.au[0]);
    });
    var bubble = h('div.bubble');
    if (stage === 0) bubble.appendChild(h('p', 'Je draak zit nog in het ei. Speel je eerste les, dan komt hij eruit!'));
    else {
      bubble.appendChild(h('p.bub-zh', { lang: 'zh-CN' }, g.hz + '，' + p.prof.name + '！'));
      bubble.appendChild(h('p.bub-py', g.py));
      bubble.appendChild(h('p.bub-nl', g.nl + '!'));
    }
    hero.appendChild(bubble); hero.appendChild(dragonEl);
    var ns = Store.nextStage(p);
    hero.appendChild(h('p.stage-name', Store.STAGES[stage].nl + (ns && stage > 0 ? ' · nog ' + (ns.min - Store.totalStars(p)) + ' ★ tot ' + ns.nl.toLowerCase() : '')));
    side.appendChild(hero);
    // dagdoel en envelopje
    var pct = Math.min(100, Math.round(100 * dt.s / goal));
    var goalBox = h('div.goal');
    goalBox.appendChild(h('div.goal-top', h('span', 'Vandaag'), h('span.goal-n', Math.min(dt.s, goal) + ' / ' + goal + ' ★')));
    goalBox.appendChild(h('div.goal-bar', h('div.goal-fill', { style: { width: pct + '%' } })));
    var today = U.dayKey();
    if (dt.s >= goal && !p.hb[today]) {
      var hb = h('button.hongbao-btn', { type: 'button' }, h('span.hb-env', '🧧'), h('span', 'Open je rode envelopje!'));
      hb.addEventListener('click', function () { App.go('hongbao'); });
      goalBox.appendChild(hb);
    } else if (p.hb[today]) {
      goalBox.appendChild(h('p.goal-done', 'Dagdoel gehaald. 太棒了！'));
    }
    side.appendChild(goalBox);

    // week
    var week = h('div.week');
    ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].forEach(function (d, i) {
      var w = Store.weekLanterns(p)[i];
      week.appendChild(h('div.wday' + (w.on ? '.on' : '') + (w.today ? '.today' : ''), h('span.wl', { html: lanternSVG(w.on ? 'done' : 'locked') }), h('span.wd', d)));
    });
    side.appendChild(week);

    // knoppen
    var due = Lesson.reviewCount(p);
    var acts = h('div.actions');
    var practice = h('button.act', { type: 'button', disabled: Store.knownItems(p).length < 3 },
      h('span.act-ic', '🔁'), h('span.act-t', 'Oefenen'), h('span.act-s', due ? due + ' klaar om te herhalen' : 'woorden herhalen'));
    practice.addEventListener('click', function () { Snd.unlock(); App.startLesson({ kind: 'oefen' }); });
    var tones = h('button.act', { type: 'button', disabled: !Store.nodeDone(p, 'u1a') },
      h('span.act-ic', '🎵'), h('span.act-t', 'Toonspel'), h('span.act-s', 'de vier tonen'));
    tones.addEventListener('click', function () { Snd.unlock(); App.startLesson({ kind: 'toonspel' }); });
    acts.appendChild(practice); acts.appendChild(tones);
    side.appendChild(acts);
    var rewards = h('div.home-rewards');
    rewards.appendChild(h('button.mine-entry.adventure-entry', { type: 'button', onclick: function () { App.go('adventure'); } },
      h('strong', '🐉 Expeditiekamp'), h('span', Mine.balance(p) + ' 🪙 · Missies en schatten')));
    side.appendChild(rewards);

    // samen-doel
    if (Store.players().length > 1) {
      var fw = Store.familyWeek();
      var fam = h('div.family');
      fam.appendChild(h('p', fw.lessons >= fw.goal ? 'Samen deze week: doel gehaald, al ' + fw.lessons + ' lessen!' : 'Samen deze week: ' + fw.lessons + ' van ' + fw.goal + ' lessen'));
      var row = h('div.fam-row');
      for (var i = 0; i < fw.goal; i++) row.appendChild(h('span.fam-l' + (i < fw.lessons ? '.on' : ''), { html: lanternSVG(i < fw.lessons ? 'done' : 'locked') }));
      fam.appendChild(row);
      side.appendChild(fam);
    }
    home.appendChild(side);

    root.appendChild(home);
  };

  function lessonOverview(p) {
    var all = Store.allNodes();
    var done = all.filter(function (entry) { return Store.nodeDone(p, entry.lesson.id); }).length;
    var currentId = Store.currentNode(p);
    var index = all.findIndex(function (entry) { return entry.lesson.id === currentId; });
    var currentLesson = all[index];
    var section = h('section.lesson-overview', { 'aria-label': 'Leerpad en voortgang' });
    var full = h('button.btn.ghost.lesson-path-link', { type: 'button', onclick: function () { App.go('path'); } }, 'Hele leerpad');
    section.appendChild(h('div.lesson-overview-head', h('h2', 'Leerpad'), full));
    var review = Growth.nextReview(p, U.dayNum());
    if (review) section.appendChild(h('button.btn.ghost', { type: 'button', onclick: function () { App.go('growth', { lesson: review.lesson }); } },
      'Herhaal · ' + review.lesson.title));
    section.appendChild(h('div.lesson-meter',
      h('progress', { value: done, max: all.length || 1, 'aria-label': 'Afgeronde lessen' }),
      h('span', done + ' van ' + all.length + ' lessen klaar')));
    if (!currentLesson) return section;

    function open(entry) {
      Snd.unlock();
      Scr.nodeSheet(p, entry.unit, entry.lesson);
    }
    var complete = done === all.length;
    section.appendChild(h('button.btn.primary.home-resume', { type: 'button', onclick: function () { open(currentLesson); } },
      h('strong', complete ? 'Laatste les opnieuw' : done ? 'Verder oefenen' : 'Speel je eerste les'),
      h('span', currentLesson.lesson.title),
      h('span.lesson-unit', currentLesson.unit.nl)));
    var nearby = h('ol.lesson-nearby');
    all.slice(Math.max(0, index - 1), index + 3).forEach(function (entry) {
      var position = all.indexOf(entry);
      if (position === index) return;
      var previous = position < index;
      var available = Store.nodeOpen(p, entry.lesson.id);
      var label = previous ? 'Vorige les' : position === index + 1 ? 'Hierna' : 'Daarna';
      var content = [h('span.lesson-step-label', label), h('strong', entry.lesson.title)];
      var row = available ? h('button.lesson-step', { type: 'button', onclick: function () { open(entry); } }, content) :
        h('div.lesson-step.lesson-step-locked', content, h('span.lesson-lock', { 'aria-label': 'Nog gesloten' }, '🔒'));
      nearby.appendChild(h('li', row));
    });
    if (nearby.children.length) section.appendChild(nearby);
    section.appendChild(h('button.btn.ghost', { type: 'button', onclick: function () { App.go('growth', { quick: true }); } },
      'Probeer een gesprek'));
    return section;
  }

  Scr.path = function () {
    var p = Store.current();
    if (!p) { App.go('chooser'); return; }
    var root = app();
    var wrap = h('main.full-path');
    wrap.appendChild(h('header.sub-top',
      h('button.btn.ghost', { type: 'button', onclick: function () { App.go('home'); } }, '← Terug'),
      h('h2', 'Hele leerpad')));
    var path = h('section.path');
    var cur = Store.currentNode(p);
    CONTENT.units.forEach(function (u, ui) {
      var unit = h('div.unit', { style: { '--uc': u.color } });
      var done = u.lessons.filter(function (l) { return Store.nodeDone(p, l.id); }).length;
      unit.appendChild(h('div.unit-banner',
        h('span.unit-zh', { lang: 'zh-CN' }, u.zh),
        h('span.unit-txt', h('strong', u.nl), h('span', u.py + ' · ' + done + ' / ' + u.lessons.length))));
      var nodes = h('div.nodes');
      u.lessons.forEach(function (l, li) {
        var open = Store.nodeOpen(p, l.id), isDone = Store.nodeDone(p, l.id), isCur = l.id === cur;
        var st = isDone ? 'done' : open ? 'open' : 'locked';
        var best = p.nodes[l.id] ? p.nodes[l.id].best : 0;
        var n = h('div.node.' + st + (isCur ? '.current' : '') + '.pos' + (li % 4));
        var b = h('button.lantern', { type: 'button', disabled: !open, 'aria-label': l.title },
          h('span.l-svg', { html: lanternSVG(st === 'locked' ? 'locked' : 'done', st === 'open' ? u.color : null) }),
          h('span.l-txt' + (l.kind === 'les' || l.kind === 'tekens' ? '.zh' : ''), { lang: l.kind === 'groei' ? null : 'zh-CN' }, nodeLabel(l)));
        b.addEventListener('click', function () { Snd.unlock(); Snd.fx('tap'); Scr.nodeSheet(p, u, l); });
        n.appendChild(b);
        if (isCur) n.appendChild(h('span.node-dragon', { html: Dragon.forPlayer(p, 'happy', { crop: 'head' }) }));
        n.appendChild(h('span.node-title', l.title));
        if (isDone) n.appendChild(h('span.node-stars', '🏮'.repeat(Math.max(1, best))));
        nodes.appendChild(n);
      });
      unit.appendChild(nodes);
      path.appendChild(unit);
    });
    path.appendChild(h('p.path-end', 'Einde van het groeipad · 加油！'));
    wrap.appendChild(path);
    root.appendChild(wrap);
  };

  /* Paneel met uitleg over een les, en de startknop. */
  Scr.nodeSheet = function (p, u, l) {
    var open = Store.nodeOpen(p, l.id);
    var body = h('div.node-sheet');
    body.appendChild(h('p.ns-unit', u.nl));
    body.appendChild(h('h3', l.title));
    if (u.lessons[0].id === l.id && u.intro) body.appendChild(h('p.ns-intro', u.intro));
    if (l.kind === 'les' && l.new.length) {
      var chips = h('div.ns-chips');
      l.new.forEach(function (id) {
        var it = item(id);
        var c = h('button.ns-chip', { type: 'button' }, h('span.hz', { lang: 'zh-CN' }, it.hz), h('span.lbl', it.nl));
        if (Store.introduced(p, id)) c.addEventListener('click', function () { Snd.play(Snd.nextVoice(it)); });
        else c.classList.add('new');
        chips.appendChild(c);
      });
      body.appendChild(chips);
    } else if (l.kind === 'verhaal') {
      body.appendChild(h('p', 'Een kort verhaal om naar te luisteren, met vragen achteraf.'));
    } else if (l.kind === 'groei') {
      body.appendChild(h('p', l.aim));
    } else if (l.kind === 'toonles') {
      body.appendChild(h('p', 'Luister naar de tonen en teken ze met je vinger.'));
    } else if (l.kind === 'tekens') {
      body.appendChild(h('p', 'Zoek stukjes die in veel tekens terugkomen: ' + l.comps.map(function (c) { return c + ' ' + CONTENT.comps[c].nl; }).join(', ') + '.'));
    }
    if (!open) body.appendChild(h('p.ns-locked', 'Speel eerst de lessen ervoor.'));
    var done = Store.nodeDone(p, l.id);
    var go = h('button.btn.primary.big', { type: 'button', disabled: !open }, done ? 'Nog eens spelen' : 'Start');
    go.addEventListener('click', function () {
      App.closeModal();
      if (l.kind === 'verhaal') App.go('story', { unit: u, lesson: l });
      else if (l.kind === 'groei') App.go('growth', { lesson: l });
      else App.startLesson({ unit: u, lesson: l });
    });
    body.appendChild(go);
    App.modal(body, { sheet: true });
  };

  /* ---------- resultaat ---------- */
  Scr.results = function (res, events) {
    var p = Store.current();
    var missionCoins = Mine.claimMissions(p);
    var root = app();
    var wrap = h('div.results');
    var acc = res.total ? Math.round(100 * res.ok / res.total) : 100;
    wrap.appendChild(h('div.res-dragon', { html: Dragon.forPlayer(p, 'cheer', { crack: true }) }));
    wrap.appendChild(h('h2', U.pick(['Les klaar!', 'Goed gedaan!', 'Knap gespeeld!'])));
    wrap.appendChild(h('p.res-zh', { lang: 'zh-CN' }, '太棒了！', h('span', ' tài bàng le')));
    var lan = h('div.res-lanterns');
    for (var i = 1; i <= 3; i++) lan.appendChild(h('span.rl' + (i <= res.lanterns ? '.on' : ''), { html: lanternSVG(i <= res.lanterns ? 'done' : 'locked') }));
    wrap.appendChild(lan);
    wrap.appendChild(h('div.res-stats',
      h('div', h('strong', '+' + res.stars), h('span', 'sterren')),
      h('div', h('strong', res.total ? acc + '%' : '—'), h('span', res.retryNode !== undefined ? 'eerste poging' : 'juist')),
      h('div', h('strong', Math.max(1, Math.round(res.secs / 60))), h('span', 'minuten'))));
    if (res.coins) wrap.appendChild(h('p.mine-reward', '+' + res.coins + ' drakenmunten · ' + Mine.balance(p) + ' 🪙 in je buidel'));
    if (missionCoins) wrap.appendChild(h('p.mine-reward', 'Missie volbracht! +' + missionCoins + ' 🪙'));
    if (res.repairs) wrap.appendChild(h('p.mine-reward', res.repairs === 1 ? '↺ Eén antwoord lukte bij de tweede kans.' : '↺ ' + res.repairs + ' antwoorden lukten bij de tweede kans.'));
    if (res.retained) wrap.appendChild(h('p.mine-reward', res.retained === 1 ? 'Eén woord lukte op twee verschillende dagen.' : res.retained + ' woorden lukten op twee verschillende dagen.'));
    if (res.needsPractice) wrap.appendChild(h('p', 'Nog een kort oefenrondje voor de volgende les.'));
    if (res.newItems && res.newItems.length) {
      var nw = h('div.res-new');
      nw.appendChild(h('p', 'Nieuw geleerd'));
      var chips = h('div.ns-chips');
      res.newItems.forEach(function (id) {
        var it = item(id);
        var c = h('button.ns-chip', { type: 'button' }, h('span.hz', { lang: 'zh-CN' }, it.hz), h('span.lbl', it.py));
        c.addEventListener('click', function () { Snd.play(Snd.nextVoice(it)); });
        chips.appendChild(c);
      });
      nw.appendChild(chips);
      wrap.appendChild(nw);
    }
    var go = h('button.btn.primary.big', { type: 'button' }, res.needsPractice ? 'Kort oefenrondje' : 'Verder');
    var destination = 'home';
    go.addEventListener('click', function () { if (res.needsPractice) destination = 'retry'; nextEvent(); });
    wrap.appendChild(go);
    if (res.needsPractice) wrap.appendChild(h('button.btn.ghost', { type: 'button', onclick: nextEvent }, 'Naar mijn draak'));
    wrap.appendChild(h('button.btn.ghost', { type: 'button', onclick: function () {
      destination = 'adventure';
      nextEvent();
    } }, 'Naar het expeditiekamp'));
    root.appendChild(wrap);
    Snd.fx('done');
    var queue = (events || []).slice();
    function nextEvent() {
      var e = queue.shift();
      if (!e) {
        if (destination === 'retry') App.startLesson(Object.assign({}, res.retryNode, { focused: true }));
        else App.go(destination);
        return;
      }
      if (e === 'hatch') Scr.hatch(nextEvent);
      else if (e === 'grow') Scr.grow(nextEvent);
      else if (e === 'goal') Scr.goalReached(nextEvent);
      else if (e === 'family') Scr.familyReached(nextEvent);
      else nextEvent();
    }
  };

  /* Het ei komt uit. */
  Scr.hatch = function (done) {
    var p = Store.current();
    var col = Store.colorOf(p);
    var root = app();
    var wrap = h('div.event.hatch');
    var d = h('div.ev-dragon', { html: Dragon.svg({ color: col, stage: 0, crack: true }) });
    wrap.appendChild(d);
    var title = h('h2', 'Er beweegt iets…');
    wrap.appendChild(title);
    var txt = h('p', 'Tik op het ei!');
    wrap.appendChild(txt);
    root.appendChild(wrap);
    var taps = 0;
    d.addEventListener('click', function () {
      taps++;
      Snd.fx('pop');
      d.classList.remove('wiggle'); void d.offsetWidth; d.classList.add('wiggle');
      if (taps >= 3) {
        p.hatch = Date.now(); Store.save();
        Snd.fx('level');
        d.innerHTML = Dragon.forPlayer(p, 'cheer');
        d.classList.add('pop-in');
        title.textContent = 'Je draak is geboren!';
        txt.textContent = 'Hij groeit als je sterren verdient. In het Chinees is een kleine draak 小龙 xiǎolóng.';
        App.confetti();
        var go = h('button.btn.primary.big', { type: 'button' }, 'Hallo, draakje!');
        go.addEventListener('click', done);
        wrap.appendChild(go);
      }
    });
  };
  Scr.grow = function (done) {
    var p = Store.current(), st = Store.stage(p);
    var root = app();
    var wrap = h('div.event');
    wrap.appendChild(h('div.ev-dragon.pop-in', { html: Dragon.forPlayer(p, 'cheer') }));
    wrap.appendChild(h('h2', 'Je draak is gegroeid!'));
    var extra = { 2: 'Hij heeft nu hoorns en snorharen.', 3: 'Hij heeft een magische parel gevonden.', 4: 'Hij kan nu op een wolk zweven.', 5: 'Hij is een gouden draak geworden!' }[st] || '';
    wrap.appendChild(h('p', Store.STAGES[st].nl + '. ' + extra));
    var go = h('button.btn.primary.big', { type: 'button' }, 'Verder');
    go.addEventListener('click', done);
    wrap.appendChild(go);
    root.appendChild(wrap);
    Snd.fx('level'); App.confetti();
  };
  Scr.goalReached = function (done) {
    var root = app();
    var wrap = h('div.event');
    var env = h('button.hb-big', { type: 'button' }, h('span', { lang: 'zh-CN' }, '福'));
    wrap.appendChild(env);
    wrap.appendChild(h('h2', 'Dagdoel gehaald!'));
    wrap.appendChild(h('p', 'Je krijgt een rood envelopje, een 红包 hóngbāo. Tik om het open te maken.'));
    env.addEventListener('click', function () { App.go('hongbao', { then: done }); });
    var later = h('button.btn.ghost', { type: 'button' }, 'Straks openen');
    later.addEventListener('click', done);
    wrap.appendChild(later);
    root.appendChild(wrap);
  };
  Scr.familyReached = function (done) {
    var root = app();
    var wrap = h('div.event.family-ev');
    var row = h('div.fam-row.big');
    for (var i = 0; i < 7; i++) row.appendChild(h('span.fam-l.on', { html: lanternSVG('done') }));
    wrap.appendChild(row);
    wrap.appendChild(h('h2', 'Samen gehaald!'));
    wrap.appendChild(h('p', 'Jullie hebben deze week samen genoeg lessen gespeeld. Je verdient 4 drakenmunten.'));
    var go = h('button.btn.primary.big', { type: 'button' }, '太棒了！');
    go.addEventListener('click', done);
    wrap.appendChild(go);
    root.appendChild(wrap);
    Snd.fx('hongbao'); App.confetti();
  };

  /* ---------- rood envelopje ---------- */
  Scr.hongbao = function (opts) {
    opts = opts || {};
    var p = Store.current();
    var root = app();
    var wrap = h('div.event.hb');
    var env = h('button.hb-big', { type: 'button' }, h('span', { lang: 'zh-CN' }, '福'));
    wrap.appendChild(env);
    var title = h('h2', 'Tik op het envelopje!');
    wrap.appendChild(title);
    var note = h('p.hb-note', 'Het teken 福 (fú, geluk) staat ondersteboven. Ondersteboven is 倒 dào, en dat klinkt als 到 dào, aankomen: het geluk komt aan!');
    wrap.appendChild(note);
    root.appendChild(wrap);
    var opened = false;
    env.addEventListener('click', function () {
      var today = U.dayKey();
      if (opened || p.hb[today] || Store.dayTotals(p, today).s < p.set.goal) return;
      opened = true;
      env.classList.add('open');
      Snd.fx('hongbao');
      p.hb[today] = Date.now();
      var coins = Mine.bonus(p, 'envelope:' + today, 3);
      var free = CONTENT.stickers.filter(function (s) { return !p.stickers[s.id]; });
      var st = free.length ? U.pick(free) : null;
      if (st) p.stickers[st.id] = Date.now();
      Store.save();
      App.syncSoon();
      setTimeout(function () {
        App.confetti();
        env.remove(); note.remove();
        title.textContent = st ? 'Een nieuwe sticker!' : 'Je stickeralbum is compleet!';
        if (st) wrap.insertBefore(stickerCard(st, true), title);
        if (coins) wrap.appendChild(h('p.mine-reward', '+' + coins + ' drakenmunten'));
        var go = h('button.btn.primary.big', { type: 'button' }, 'Naar mijn stickers');
        go.addEventListener('click', function () { if (opts.then) opts.then(); else App.go('album'); });
        if (opts.then) go.textContent = 'Verder';
        wrap.appendChild(go);
        if (st && st.au && st.au.length) setTimeout(function () { Snd.play(st.au[0]); }, 400);
      }, 1100);
    });
  };

  function stickerCard(st, big) {
    var card = h('div.sticker' + (big ? '.big' : ''));
    card.appendChild(h('span.st-em', st.em));
    card.appendChild(h('span.hz.st-hz', { lang: 'zh-CN' }, st.hz));
    card.appendChild(h('span.st-py', st.py));
    card.appendChild(h('span.st-nl', st.nl));
    if (big) {
      card.appendChild(h('p.st-fact', st.fact));
      var b = h('button.speaker', { type: 'button', 'aria-label': 'Luister' }, '🔊');
      b.addEventListener('click', function () { if (st.au && st.au.length) Snd.play(st.au[0]); });
      card.appendChild(b);
    }
    return card;
  }

  Scr.album = function () {
    var p = Store.current();
    var root = app();
    var wrap = h('div.album');
    var back = h('button.btn.ghost.back', { type: 'button' }, '← Kamp');
    back.addEventListener('click', function () { App.go('adventure'); });
    wrap.appendChild(h('header.sub-top', back, h('h2', 'Verzameling'), h('span.al-n', Object.keys(p.stickers).length + ' / ' + CONTENT.stickers.length)));
    wrap.appendChild(Mine.collectionNav('album'));
    wrap.appendChild(h('p.lead', 'Open je rode envelopje na je dagdoel voor een sticker en 3 drakenmunten.'));
    [['dier', 'De twaalf dieren van de Chinese kalender'], ['china', 'Dingen uit China']].forEach(function (cat) {
      wrap.appendChild(h('h3', cat[1]));
      var grid = h('div.al-grid');
      CONTENT.stickers.filter(function (s) { return s.cat === cat[0]; }).forEach(function (st) {
        if (p.stickers[st.id]) {
          var b = h('button.al-cell', { type: 'button' }, stickerCard(st, false));
          b.addEventListener('click', function () {
            if (st.au && st.au.length) Snd.play(st.au[0]);
            App.modal(stickerCard(st, true));
          });
          grid.appendChild(b);
        } else grid.appendChild(h('div.al-cell.locked', h('span', '?')));
      });
      wrap.appendChild(grid);
    });
    root.appendChild(wrap);
  };

  /* ---------- verhaal ---------- */
  var WHO = { long: { em: '🐉', nl: 'Xiǎolóng' }, yuan: { em: '🐼', nl: 'Yuányuan' }, hou: { em: '🐵', nl: 'Xiǎohóu' }, nai: { em: '👵', nl: 'Oma' }, all: { em: '🎉', nl: 'Allemaal' } };
  Scr.story = function (opts) {
    var p = Store.current();
    var st = CONTENT.stories[opts.lesson.id];
    var root = app();
    var t0 = Date.now();
    var stageBefore = Store.stage(p), goalBefore = Store.dayTotals(p).s >= p.set.goal;
    var wrap = h('div.story');
    var close = h('button.ls-close', { type: 'button', 'aria-label': 'Stoppen' }, '✕');
    close.addEventListener('click', function () { Snd.stop(); App.go('home'); });
    var dots = h('div.st-dots');
    st.lines.forEach(function () { dots.appendChild(h('span')); });
    wrap.appendChild(h('header.ls-top', close, h('h2.st-title', st.title), dots));
    var stage = h('div.st-stage', { tabindex: '0', 'aria-label': 'Verhaal of vraag' });
    wrap.appendChild(stage);
    var ctrl = h('div.st-ctrl');
    wrap.appendChild(ctrl);
    root.appendChild(wrap);
    var i = -1, showPy = p.set.pinyin !== 'never';
    var nlShown = false;

    function showLine() {
      var ln = st.lines[i];
      U.$$('span', dots).forEach(function (d, k) { d.className = k < i ? 'seen' : k === i ? 'cur' : ''; });
      U.clear(stage);
      stage.scrollTop = 0;
      var who = WHO[ln.who] || WHO.all;
      stage.appendChild(h('div.st-scene', ln.sc));
      var bubble = h('div.st-bubble', h('span.st-who', who.em + ' ' + who.nl));
      var hz = h('span.hz.lg', { lang: 'zh-CN' });
      var k = 0;
      Array.from(ln.hz).forEach(function (ch) {
        var s = ln.syl[k];
        if (s && s.c === ch) { var r = h('ruby', ch); r.appendChild(h('rt' + (showPy ? '' : '.hide'), s.m)); hz.appendChild(r); k++; }
        else hz.appendChild(h('span.punct', ch));
      });
      bubble.appendChild(hz);
      var nl = h('p.st-nl' + (nlShown ? '' : '.hide'), ln.nl);
      bubble.appendChild(nl);
      stage.appendChild(bubble);
      var play = function (slow) { return Snd.play(ln.au[0], { slow: slow }); };
      U.clear(ctrl);
      var again = h('button.btn.ghost', { type: 'button' }, '🔊 Nog eens');
      again.addEventListener('click', function () { play(false); });
      var slow = h('button.btn.ghost', { type: 'button' }, '🐢');
      slow.addEventListener('click', function () { play(true); });
      var mean = h('button.btn.ghost', { type: 'button' }, nlShown ? 'Verberg vertaling' : 'Wat betekent het?');
      mean.addEventListener('click', function () {
        nlShown = !nlShown; nl.classList.toggle('hide', !nlShown);
        mean.textContent = nlShown ? 'Verberg vertaling' : 'Wat betekent het?';
      });
      var pyb = h('button.btn.ghost', { type: 'button' }, showPy ? 'Pinyin uit' : 'Pinyin aan');
      pyb.addEventListener('click', function () {
        showPy = !showPy; U.$$('rt', hz).forEach(function (r) { r.classList.toggle('hide', !showPy); });
        pyb.textContent = showPy ? 'Pinyin uit' : 'Pinyin aan';
      });
      var next = h('button.btn.primary', { type: 'button' }, i < st.lines.length - 1 ? 'Verder' : 'Naar de vragen');
      next.addEventListener('click', function () { Snd.fx('tap'); go(); });
      ctrl.appendChild(h('div.st-tools', again, slow, mean, pyb));
      ctrl.appendChild(next);
      play(false);
    }
    function go() {
      i++;
      if (i < st.lines.length) showLine();
      else questions();
    }
    function questions() {
      var qi = 0, okCount = 0;
      function q() {
        U.clear(stage); U.clear(ctrl);
        stage.scrollTop = 0;
        if (qi >= st.qs.length) return finish();
        var qq = st.qs[qi];
        stage.appendChild(h('p.ex-q', 'Vraag ' + (qi + 1) + ' van ' + st.qs.length));
        stage.appendChild(h('h3.st-q', qq.q));
        var opts = U.shuffle(qq.o.map(function (o, k) { return { o: o, ok: k === qq.a }; }));
        var g = h('div.choices.n' + opts.length);
        var answered = false;
        opts.forEach(function (x) {
          var b = h('button.choice', { type: 'button' }, h('span.card', h('span.emoji', x.o.em), h('span.lbl', x.o.nl)));
          b.addEventListener('click', function () {
            if (answered) return; answered = true;
            b.classList.add(x.ok ? 'right' : 'wrong');
            if (!x.ok) U.$$('.choice', g).forEach(function (bb, k) { if (opts[k].ok) bb.classList.add('right'); });
            if (x.ok) { okCount++; Snd.fx('good'); Store.addStars(p, 2); Mine.earn(p); } else Snd.fx('oops');
            Store.countExercise(p, x.ok, 'L');
            Store.save();
            var nx = h('button.btn.primary', { type: 'button' }, 'Verder');
            nx.addEventListener('click', function () { qi++; q(); });
            ctrl.appendChild(nx);
          });
          g.appendChild(b);
        });
        stage.appendChild(g);
      }
      q();
      function finish() {
        var secs = (Date.now() - t0) / 1000;
        Store.addSeconds(p, secs);
        var lanterns = okCount === st.qs.length ? 3 : okCount >= st.qs.length - 1 ? 2 : 1;
        Store.addStars(p, 3);
        Store.lessonDone(p, opts.lesson.id, lanterns);
        Store.log({ type: 'verhaal', player: p.id, name: p.prof.name, node: opts.lesson.id, title: st.title,
          ok: okCount, total: st.qs.length, stars: okCount * 2 + 3, secs: Math.round(secs) });
        Store.save();
        App.syncSoon();
        Scr.results({ stars: okCount * 2 + 3, coins: okCount, ok: okCount, total: st.qs.length, lanterns: lanterns, secs: secs, newItems: [] },
          App.eventsAfter(p, stageBefore, goalBefore));
      }
    }
    go();
  };

  window.Screens = Scr;
})();
