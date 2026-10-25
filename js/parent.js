/* Ouderhoek: voortgang, instellingen, spelers, synchroniseren, dit toestel. */
(function () {
  'use strict';
  var h = U.h;
  var P = {};
  var tab = 'overzicht';
  var selected = null;

  var SKILLS = [['L', 'Luisteren'], ['H', 'Tekens lezen'], ['P', 'Pinyin'], ['T', 'Tonen'], ['S', 'Spreken']];

  P.show = function (opts) {
    if (opts && opts.tab) tab = opts.tab;
    var root = U.clear(U.$('#app'));
    var wrap = h('div.parent');
    var back = h('button.btn.ghost.back', { type: 'button' }, '← Terug');
    back.addEventListener('click', function () { App.go(Store.current() ? 'home' : 'chooser'); });
    wrap.appendChild(h('header.sub-top', back, h('h2', 'Ouderhoek')));
    var tabs = h('nav.tabs');
    [['overzicht', 'Voortgang'], ['instellingen', 'Instellingen'], ['sync', 'Synchroniseren'], ['toestel', 'Dit toestel'], ['over', 'Over de app']].forEach(function (t) {
      var b = h('button.tab' + (tab === t[0] ? '.on' : ''), { type: 'button' }, t[1]);
      b.addEventListener('click', function () { tab = t[0]; P.show(); });
      tabs.appendChild(b);
    });
    wrap.appendChild(tabs);
    var body = h('div.tab-body');
    wrap.appendChild(body);
    root.appendChild(wrap);
    ({ overzicht: overview, instellingen: settings, sync: sync, toestel: device, over: about })[tab](body);
  };

  /* ---------- voortgang ---------- */
  function overview(body) {
    var players = Store.players();
    if (!players.length) { body.appendChild(h('p', 'Nog geen spelers.')); return; }
    players.forEach(function (p) {
      var card = h('section.pcard');
      var col = Store.colorOf(p);
      var items = Object.keys(p.items).filter(function (id) { return CONTENT.items[id] && p.items[id].b > 0; });
      var known = items.filter(function (id) { return p.items[id].b >= 3; });
      var chars = {};
      known.forEach(function (id) { CONTENT.items[id].syl.forEach(function (s) { chars[s.c] = 1; }); });
      var start = U.weekStart(U.dayNum()), minWeek = 0, lesWeek = 0;
      for (var i = 0; i < 7; i++) { var t = Store.dayTotals(p, U.numToKey(start + i)); minWeek += t.m; lesWeek += t.l; }
      card.appendChild(h('div.pc-head', h('span.pc-dragon', { html: Dragon.forPlayer(p, 'happy', { crop: 'head' }) }),
        h('div', h('h3', p.prof.name), h('p', Store.STAGES[Store.stage(p)].nl + ' · ★ ' + Store.totalStars(p) + ' · reeks ' + Store.streak(p) + ' dagen'))));
      card.appendChild(h('div.pc-stats',
        stat(items.length, 'woorden gezien'), stat(known.length, 'goed gekend'), stat(Object.keys(chars).length, 'tekens gekend'),
        stat(Math.round(minWeek / 60), 'minuten deze week'), stat(lesWeek, 'lessen deze week')));
      // vaardigheden
      var sk = Store.skillTotals(p);
      var bars = h('div.skills');
      SKILLS.forEach(function (s) {
        var v = sk[s[0]], pct = v && v[1] ? Math.round(100 * v[0] / v[1]) : null;
        bars.appendChild(h('div.skill', h('span.sk-l', s[1]),
          h('span.sk-bar', h('span.sk-fill', { style: { width: (pct || 0) + '%', background: col.main } })),
          h('span.sk-v', pct === null ? '–' : pct + '%'), h('span.sk-n', v ? v[1] + '×' : '')));
      });
      card.appendChild(bars);
      // laatste 14 dagen
      var days = h('div.days14');
      var maxM = 1, vals = [];
      for (i = 13; i >= 0; i--) { var k = U.numToKey(U.dayNum() - i); var tt = Store.dayTotals(p, k); vals.push({ k: k, m: tt.m, l: tt.l }); maxM = Math.max(maxM, tt.m); }
      vals.forEach(function (v) {
        days.appendChild(h('span.d14', { title: v.k + ': ' + Math.round(v.m / 60) + ' min, ' + v.l + ' lessen' },
          h('span.d14-bar', { style: { height: Math.round(100 * v.m / maxM) + '%', background: col.main } })));
      });
      card.appendChild(h('div.d14-wrap', h('p.small', 'Speeltijd, laatste twee weken'), days));
      // moeilijke woorden
      var hard = items.filter(function (id) { return p.items[id].w > 0; })
        .sort(function (a, b) { return (p.items[b].w - p.items[b].c / 4) - (p.items[a].w - p.items[a].c / 4); }).slice(0, 8);
      if (hard.length) {
        var chips = h('div.ns-chips');
        hard.forEach(function (id) {
          var it = CONTENT.items[id];
          var c = h('button.ns-chip', { type: 'button' }, h('span.hz', { lang: 'zh-CN' }, it.hz), h('span.lbl', it.py + ' · ' + it.nl));
          c.addEventListener('click', function () { Snd.play(it.au[0]); });
          chips.appendChild(c);
        });
        card.appendChild(h('div', h('p.small', 'Woorden die nog lastig zijn'), chips));
      }
      body.appendChild(card);
    });
    body.appendChild(h('p.small.muted', 'Met synchronisatie staat dit ook in de spreadsheet: tabbladen Overzicht, Woorden en Logboek.'));
  }
  function stat(n, label) { return h('div.st', h('strong', String(n)), h('span', label)); }

  /* ---------- instellingen per speler ---------- */
  function settings(body) {
    var players = Store.players();
    if (!selected || !Store.player(selected)) selected = (Store.current() || players[0] || {}).id;
    var pick = h('div.seg');
    players.forEach(function (p) {
      var b = h('button.seg-b' + (p.id === selected ? '.on' : ''), { type: 'button' }, p.prof.name);
      b.addEventListener('click', function () { selected = p.id; P.show(); });
      pick.appendChild(b);
    });
    var add = h('button.seg-b', { type: 'button' }, '+ speler');
    add.addEventListener('click', function () { App.go('newplayer', { back: 'parent' }); });
    pick.appendChild(add);
    body.appendChild(pick);
    var p = Store.player(selected);
    if (!p) return;
    function choice(label, help, key, options) {
      var row = h('div.set-row', h('div.set-l', h('strong', label), help ? h('span', help) : null));
      var seg = h('div.seg');
      options.forEach(function (o) {
        var b = h('button.seg-b' + (p.set[key] === o[0] ? '.on' : ''), { type: 'button' }, o[1]);
        b.addEventListener('click', function () { Store.setSetting(p, key, o[0]); App.syncSoon(); P.show(); });
        seg.appendChild(b);
      });
      row.appendChild(seg);
      body.appendChild(row);
    }
    choice('Dagdoel', 'Sterren per dag voor het rode envelopje. Eén les levert er ongeveer 15 op.', 'goal', [[10, '10'], [20, '20'], [40, '40'], [60, '60']]);
    choice('Lengte van een les', 'Aantal vragen, zonder de kennismaking met nieuwe woorden.', 'len', [[8, 'kort'], [12, 'gewoon'], [16, 'lang']]);
    choice('Pinyin boven de tekens', 'Stilaan weg: pinyin verdwijnt bij woorden die het kind goed kent, zodat het naar het teken kijkt.', 'pinyin', [['fade', 'stilaan weg'], ['always', 'altijd'], ['never', 'nooit']]);
    choice('Spreekoefeningen', 'Nazeggen met de toonlijn, en zelf zeggen met spraakherkenning (Chrome, met internet).', 'speak', [[true, 'aan'], [false, 'uit']]);
    choice('Alle lessen open', 'Handig als het kind al wat kent en wil springen.', 'unlockAll', [[false, 'nee'], [true, 'ja']]);
    var row = h('div.row');
    var edit = h('button.btn.ghost', { type: 'button' }, 'Naam of kleur wijzigen');
    edit.addEventListener('click', function () { App.go('newplayer', { player: p, back: 'parent' }); });
    var del = h('button.btn.danger', { type: 'button' }, 'Speler verwijderen');
    del.addEventListener('click', function () {
      App.confirm(p.prof.name + ' en alle voortgang verwijderen, ook op gekoppelde toestellen?', 'Verwijderen', 'Annuleren').then(function (y) {
        if (!y) return;
        Store.deletePlayer(p); selected = null; App.syncSoon(); P.show();
      });
    });
    row.appendChild(edit); row.appendChild(del);
    body.appendChild(row);
  }

  /* ---------- synchroniseren ---------- */
  function sync(body) {
    var c = Store.device().sync;
    if (Sync.configured()) {
      var st = c.status === 'fout' ? 'Probleem: ' + (c.msg || '') : c.last ? 'Laatst gesynchroniseerd: ' + new Date(c.last).toLocaleString('nl-BE') : 'Nog niet gesynchroniseerd.';
      body.appendChild(h('section.box', h('h3', 'Gekoppeld aan een Google-spreadsheet'), h('p', st)));
      var now = h('button.btn.primary', { type: 'button' }, 'Nu synchroniseren');
      now.addEventListener('click', function () { now.disabled = true; Sync.now(true).then(function () { P.show(); }); });
      body.appendChild(h('div.row', now));
      var link = Sync.link();
      var box = h('section.box');
      box.appendChild(h('h3', 'Een ander toestel koppelen'));
      box.appendChild(h('p', 'Scan deze code met de camera van de tablet of telefoon, of stuur de link door. Open de link in Chrome; daarna kan je de app op het beginscherm zetten.'));
      var qr = h('div.qr');
      try {
        var q = qrcode(0, 'L'); q.addData(link); q.make();
        qr.innerHTML = q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      } catch (e) { qr.textContent = 'QR-code lukt niet; gebruik de link.'; }
      box.appendChild(qr);
      var copy = h('button.btn.ghost', { type: 'button' }, 'Kopieer de link');
      copy.addEventListener('click', function () { copyText(link); });
      box.appendChild(h('div.row', copy));
      box.appendChild(h('p.small.muted', 'Deze link bevat de sleutel van je spreadsheet. Deel hem alleen met je eigen toestellen.'));
      body.appendChild(box);
      var off = h('button.btn.danger', { type: 'button' }, 'Ontkoppelen');
      off.addEventListener('click', function () {
        App.confirm('Dit toestel ontkoppelen? De voortgang blijft op dit toestel en in de spreadsheet.', 'Ontkoppelen', 'Annuleren').then(function (y) {
          if (y) { Store.device().sync = null; Store.save(); P.show(); }
        });
      });
      body.appendChild(h('div.row', off));
      return;
    }
    var key = (c && c.pendingKey) || Sync.newKey();
    Store.device().sync = { pendingKey: key };
    Store.save();
    var steps = h('ol.steps');
    function step(title, kids) { steps.appendChild(h('li', h('strong', title), kids)); }
    var copyScript = h('button.btn.ghost', { type: 'button' }, 'Kopieer het script');
    copyScript.addEventListener('click', function () {
      Sync.scriptText(key).then(copyText).catch(function () { App.toast('Kopiëren lukt niet. Open sync/Code.gs uit de app-map.'); });
    });
    step('Maak een nieuwe Google-spreadsheet', h('p', 'Doe dit op een computer, op sheets.google.com. Geef ze een naam, bv. Xiǎolóng voortgang.'));
    step('Plak het script', h('div', h('p', 'Kies in de spreadsheet Extensies > Apps Script. Wis wat er staat, plak het script en klik op Opslaan. De geheime sleutel staat er al in.'), copyScript));
    step('Publiceer als web-app', h('p', 'Klik op Implementeren > Nieuwe implementatie. Kies het type Web-app, Uitvoeren als: Ik, Wie heeft toegang: Iedereen. Klik op Implementeren en geef toestemming. Google waarschuwt dat de app niet geverifieerd is: kies Geavanceerd en dan Ga naar … (je eigen script).'));
    var url = h('input.inp', { type: 'url', placeholder: 'https://script.google.com/macros/s/…/exec', autocomplete: 'off' });
    var test = h('button.btn.primary', { type: 'button' }, 'Koppelen');
    var msg = h('p.small');
    test.addEventListener('click', function () {
      var u = url.value.trim();
      if (!/^https:\/\/script\.google(usercontent)?\.com\//.test(u)) { msg.textContent = 'Plak de URL van de web-app. Die begint met https://script.google.com/'; return; }
      test.disabled = true; msg.textContent = 'Even testen…';
      Sync.test(u, key).then(function (r) {
        Store.device().sync = { url: u, key: key, last: 0, status: 'nieuw' };
        Store.save();
        msg.textContent = 'Gekoppeld aan "' + r.name + '".';
        return Sync.now(true);
      }).then(function () { P.show(); }).catch(function (e) {
        test.disabled = false;
        msg.textContent = (e && e.message) || 'Dat lukte niet.';
      });
    });
    step('Plak de URL van de web-app hier', h('div', url, h('div.row', test), msg));
    body.appendChild(h('section.box', h('h3', 'Voortgang delen tussen toestellen'),
      h('p', 'De spelers en hun voortgang komen in een Google-spreadsheet van jezelf. Zo kunnen de kinderen op elk toestel verder waar ze gebleven waren, en zie jij in de spreadsheet hoe het gaat.'),
      steps));
    body.appendChild(h('p.small.muted', 'Zonder synchronisatie werkt alles ook, maar dan blijft de voortgang op dit toestel.'));
  }
  function copyText(t) {
    var done = function () { App.toast('Gekopieerd.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, fallback);
    else fallback();
    function fallback() {
      var ta = h('textarea', { style: { position: 'fixed', top: '-1000px' } }); ta.value = t;
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { App.toast('Kopiëren lukt niet.'); }
      ta.remove();
    }
  }

  /* ---------- dit toestel ---------- */
  function device(body) {
    var d = Store.device();
    var name = h('input.inp', { type: 'text', value: d.name || '', placeholder: 'bv. tablet, telefoon papa, Boox', maxlength: '30' });
    name.addEventListener('change', function () { d.name = name.value.trim(); Store.save(); });
    body.appendChild(h('div.set-row', h('div.set-l', h('strong', 'Naam van dit toestel'), h('span', 'Zie je terug in het logboek van de spreadsheet.')), name));
    function toggle(label, help, key, onSet) {
      var seg = h('div.seg');
      [[true, 'aan'], [false, 'uit']].forEach(function (o) {
        var b = h('button.seg-b' + ((!!d[key]) === o[0] ? '.on' : ''), { type: 'button' }, o[1]);
        b.addEventListener('click', function () { d[key] = o[0]; Store.save(); if (onSet) onSet(); P.show(); });
        seg.appendChild(b);
      });
      body.appendChild(h('div.set-row', h('div.set-l', h('strong', label), h('span', help)), seg));
    }
    toggle('E-inkweergave', 'Voor de Boox: zwart-wit, geen bewegingen, dikke lijnen.', 'eink', App.applyDevice);
    if (d.sound === undefined) d.sound = true;
    toggle('Geluidjes', 'De effecten. De Chinese stemmen hoor je altijd.', 'sound', App.applyDevice);
    var caps = [];
    caps.push(Voice.hasMic() ? 'Microfoon: beschikbaar.' : 'Microfoon: niet beschikbaar in deze browser.');
    caps.push(Voice.hasASR() ? 'Spraakherkenning: beschikbaar (met internet).' : 'Spraakherkenning: niet beschikbaar. Nazeggen met de toonlijn werkt wel.');
    body.appendChild(h('section.box', h('h3', 'Wat kan dit toestel?'), caps.map(function (c) { return h('p', c); })));
    var inst = h('section.box', h('h3', 'Op het beginscherm zetten'),
      h('p', 'Android (Chrome): menu ⋮ > App installeren of Toevoegen aan startscherm. De app werkt daarna ook zonder internet.'),
      h('p', 'iPad of iPhone (Safari): deelknop > Zet op beginscherm.'),
      h('p', 'Boox: open de link in Chrome (via de Play Store) en zet de e-inkweergave hierboven aan.'));
    body.appendChild(inst);
    var reset = h('button.btn.danger', { type: 'button' }, 'Alles op dit toestel wissen');
    reset.addEventListener('click', function () {
      App.confirm('Alle spelers en voortgang op dit toestel wissen? Wat al in de spreadsheet staat, blijft daar.', 'Wissen', 'Annuleren').then(function (y) {
        if (y) { U.storage.del('xiaolong.v1'); location.reload(); }
      });
    });
    body.appendChild(h('div.row', reset));
  }

  /* ---------- over ---------- */
  function about(body) {
    var txt = [
      ['Waarom zo?', 'Xiǎolóng leert Chinees zoals kinderen een taal het best oppikken: veel luisteren naar echte stemmen, korte stukjes, elke dag een beetje, en pas daarna lezen en spreken. Woorden komen terug net voor ze vergeten zijn (gespreide herhaling), en het kind moet ze telkens zelf ophalen in plaats van ze alleen te herlezen.'],
      ['Tonen', 'De tonen krijgen veel aandacht omdat ze voor Nederlandstaligen het moeilijkst zijn. Het kind hoort veel verschillende stemmen en lettergrepen, wat het oor beter traint dan altijd dezelfde opname. Het tekent de toon met de vinger: dat soort toongebaren helpt volgens onderzoek om tonen en woorden te onthouden. De toontekens staan in het zwart; kleuren per toon bleken in onderzoek minder te helpen dan de tekens zelf.'],
      ['Tekens en pinyin', 'Bij een nieuw woord verschijnt eerst het teken met de klank, en pas daarna de pinyin en de betekenis, zodat het kind naar het teken kijkt. Bij woorden die het goed kent, verdwijnt de pinyin stilaan. Tekens met hetzelfde onderdeel (女, 口, 木…) worden samen geoefend, want dat helpt beginners. Letters die in pinyin anders klinken dan in het Nederlands (x, q, zh, c, ü…) krijgen een tip.'],
      ['Spreken', 'Nazeggen gaat met een toonlijn: het kind ziet zijn eigen stem naast die van de opname. Op Android met Chrome en internet kan de spraakherkenning van Google ook nagaan of het woord klopt. Spraakherkenning is minder betrouwbaar bij kinderstemmen, dus een fout telt nooit als fout in het herhalingsschema.'],
      ['Belonen', 'Sterren, een draak die groeit, een rood envelopje met een sticker als het dagdoel gehaald is, lantaarns per dag, en een doel dat broers en zussen samen halen in plaats van tegen elkaar. Er zijn geen levens of straffen.'],
      ['Stemmen', 'Losse woorden en lettergrepen zijn opnames van moedertaalsprekers uit audio-cmn (Yue Tan en Chen Wang, CC BY-SA). Zinnen en verhalen zijn gemaakt met spraaksynthese en gecontroleerd met spraakherkenning; wat slecht verstaan werd, kreeg een andere stem.']
    ];
    txt.forEach(function (t) { body.appendChild(h('section.box', h('h3', t[0]), h('p', t[1]))); });
  }

  window.Parent = P;
})();
