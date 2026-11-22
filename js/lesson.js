/* Lessen: oefeningen samenstellen en tonen.
 *
 * Een les = een rij oefeningen. Nieuwe woorden krijgen eerst een kennismaking,
 * dan meteen een makkelijke vraag (herkennen), later moeilijkere (lezen zonder
 * pinyin, zelf zeggen). Woorden van vroeger komen terug als ze aan de beurt
 * zijn (gespreide herhaling). Wat fout gaat, komt later in de les nog eens.
 */
(function () {
  'use strict';
  var h = U.h;
  var L = {};

  /* ---------- hulp voor inhoud ---------- */
  function item(id) { return CONTENT.items[id]; }
  function au(it, which) {
    if (!it || !it.au || !it.au.length) return null;
    if (which === 'any') return U.pick(it.au);
    return it.au[0];
  }
  function singleSyl(it) { return it.syl.length === 1; }
  function toneless(it) { return it.syl.map(function (s) { return s.s; }).join(' '); }
  function tones(it) { return it.syl.map(function (s) { return s.t; }).join(''); }

  /* Twee items mogen niet samen als keuze verschijnen als ze te veel op elkaar lijken. */
  function clash(a, b, mode) {
    if (a.id === b.id) return true;
    if (a.hz === b.hz) return true;
    if (a.nl === b.nl) return true;
    if (a.em && a.em === b.em) return true;
    if (mode === 'listen' && toneless(a) === toneless(b)) return true;
    if (mode === 'pinyin' && a.py.toLowerCase() === b.py.toLowerCase()) return true;
    if (a.hz.indexOf(b.hz) >= 0 || b.hz.indexOf(a.hz) >= 0) return true; // 妈 en 妈妈
    return false;
  }

  /* Afleiders kiezen: liefst gekende woorden van dezelfde soort. */
  function distractors(ctx, it, n, mode, filter) {
    var p = ctx.player;
    var pool = Store.unlockedItems(p).map(item).filter(function (x) {
      if (!x || clash(x, it, mode)) return false;
      if ((it.k === 'z') !== (x.k === 'z')) return false;
      if (filter && !filter(x)) return false;
      return true;
    });
    // liefst gekende woorden van dezelfde soort (woord bij woord, uitdrukking bij uitdrukking)
    function rank(x) { return (Store.introduced(p, x.id) ? 0 : 2) + (x.k === it.k ? 0 : 1); }
    var shuffled = U.shuffle(pool);
    var known = shuffled.filter(function (x) { return Store.introduced(p, x.id); }).sort(function (a, b) { return rank(a) - rank(b); });
    var rest = shuffled.filter(function (x) { return !Store.introduced(p, x.id); }).sort(function (a, b) { return rank(a) - rank(b); });
    var out = [];
    known.concat(rest).forEach(function (x) {
      if (out.length >= n) return;
      if (out.some(function (y) { return clash(x, y, mode); })) return;
      out.push(x);
    });
    return out;
  }

  /* ---------- pinyin ---------- */
  var MARKS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ' };
  function markTone(base, t) {
    if (!t || t === 5) return base;
    var s = base, idx = -1;
    if (s.indexOf('a') >= 0) idx = s.indexOf('a');
    else if (s.indexOf('e') >= 0) idx = s.indexOf('e');
    else if (s.indexOf('ou') >= 0) idx = s.indexOf('o');
    else {
      for (var i = s.length - 1; i >= 0; i--) if ('iouü'.indexOf(s[i]) >= 0) { idx = i; break; }
    }
    if (idx < 0) return s;
    return s.slice(0, idx) + MARKS[s[idx]][t - 1] + s.slice(idx + 1);
  }
  L.markTone = markTone;
  var INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's', 'y', 'w'];
  function splitSyl(base) {
    for (var i = 0; i < INITIALS.length; i++) if (base.indexOf(INITIALS[i]) === 0) return [INITIALS[i], base.slice(INITIALS[i].length)];
    return ['', base];
  }
  var CONF_I = [['b', 'p'], ['d', 't'], ['g', 'k'], ['j', 'q', 'x'], ['zh', 'ch', 'sh', 'r'], ['z', 'c', 's'], ['m', 'n', 'l'], ['f', 'h'], ['y', 'w']];
  var CONF_F = [['an', 'ang', 'en', 'eng'], ['in', 'ing'], ['ao', 'ou', 'o'], ['ai', 'ei'], ['u', 'ü', 'i'], ['iu', 'ui'], ['ian', 'iang', 'an'], ['ong', 'ou'], ['i', 'ie', 'ia'], ['uo', 'o', 'ou'], ['e', 'a', 'er'], ['un', 'ui', 'uan'], ['iao', 'ao']];
  function similarOf(x, groups, all) {
    var g = groups.filter(function (gr) { return gr.indexOf(x) >= 0; })[0] || [];
    var cand = g.filter(function (y) { return y !== x; });
    var out = U.shuffle(cand).slice(0, 1);
    var rest = U.shuffle(all.filter(function (y) { return y !== x && out.indexOf(y) < 0; }));
    while (out.length < 2 && rest.length) out.push(rest.pop());
    return out;
  }
  var ALL_FINALS = ['a', 'o', 'e', 'i', 'u', 'ü', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'ong', 'ia', 'ie', 'iao', 'iu', 'ian', 'in', 'iang', 'ing', 'iong', 'ua', 'uo', 'uai', 'ui', 'uan', 'un', 'uang', 'üe', 'üan', 'ün', 'er'];

  /* Pinyintips voor Nederlandstaligen: letters die anders klinken dan je denkt. */
  var TIPS = [
    [/^x/, 'x klinkt als sj, zoals in sjaal.'],
    [/^q/, 'q klinkt als tsj, zoals in tsjilpen.'],
    [/^j/, 'j klinkt als dzj, zoals in jeans.'],
    [/^zh/, 'zh klinkt als dzj, met je tong naar achter gekruld.'],
    [/^ch/, 'ch klinkt als tsj, met je tong naar achter gekruld.'],
    [/^sh/, 'sh klinkt als sj, met je tong naar achter gekruld.'],
    [/^r/, 'r klinkt ongeveer als de zj in journaal.'],
    [/^z(?!h)/, 'z klinkt als ds, zoals in kids.'],
    [/^c(?!h)/, 'c klinkt als ts, zoals in fiets.'],
    [/^h/, 'h klinkt als de ch in lachen.'],
    [/^b/, 'b klinkt als een zachte p.'],
    [/^d/, 'd klinkt als een zachte t.'],
    [/^g/, 'g klinkt als een zachte k, zoals in kat.'],
    [/^p/, 'p met een flinke zucht lucht. Hou je hand voor je mond!'],
    [/^t/, 't met een flinke zucht lucht. Hou je hand voor je mond!'],
    [/^k/, 'k met een flinke zucht lucht. Hou je hand voor je mond!'],
    [/^(j|q|x|y)u/, 'Na j, q, x en y is u eigenlijk ü: zeg de u van nu.'],
    [/ü/, 'ü klinkt als de u van nu.'],
    [/^[^aeiouü]*e$/, 'e klinkt als de e in de.'],
    [/ui$/, 'ui klinkt als wee.'],
    [/iu$/, 'iu klinkt als jo, zoals in jojo.'],
    [/un$/, 'un klinkt als oen, zoals in schoen.'],
    [/ian$/, 'ian klinkt als jen.'],
    [/ao$/, 'ao klinkt als au in blauw.'],
    [/ou$/, 'ou klinkt als oo-w, zoals in het Engelse show.'],
    [/ai$/, 'ai klinkt als aai.'],
    [/ei$/, 'ei klinkt als ee in nee.'],
    [/^y/, 'y klinkt als de j van ja.'],
    [/^w/, 'w klinkt als oe: wǒ klinkt als oe-o.']
  ];
  function tipsFor(it) {
    var out = [];
    it.syl.forEach(function (s) {
      TIPS.forEach(function (tp) {
        if (out.length < 2 && tp[0].test(s.s) && out.indexOf(tp[1]) < 0) out.push(tp[1]);
      });
    });
    return out;
  }

  /* ---------- weergave ---------- */
  function toneIcon(t, size) {
    var paths = { 1: 'M6,9 L34,9', 2: 'M6,30 L34,8', 3: 'M6,14 Q16,38 24,30 T34,10', 4: 'M6,8 L34,32', 5: '' };
    var d = paths[t] || '';
    var dot = t === 5 ? '<circle cx="20" cy="20" r="5" fill="currentColor"/>' : '';
    return '<svg class="tone-ic" viewBox="0 0 40 40" width="' + (size || 40) + '" height="' + (size || 40) + '"><rect x="2" y="2" width="36" height="36" rx="8" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width="2"/>' +
      (d ? '<path d="' + d + '" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : '') + dot + '</svg>';
  }
  L.toneIcon = toneIcon;

  /* Hanzi met pinyin erboven (per teken). */
  function hzBlock(it, showPy, cls) {
    var wrap = h('span.hz' + (cls ? '.' + cls : ''), { lang: 'zh-CN' });
    var k = 0;
    Array.from(it.hz).forEach(function (ch) {
      var s = it.syl[k];
      if (s && s.c === ch) {
        var r = h('ruby', ch);
        r.appendChild(h('rt' + (showPy ? '' : '.hide'), { 'data-t': s.t }, s.m));
        wrap.appendChild(r); k++;
      } else {
        wrap.appendChild(h('span.punct', ch));
      }
    });
    return wrap;
  }
  L.hzBlock = hzBlock;
  function picture(it, big) {
    if (it.sw) return h('span.swatch' + (big ? '.big' : ''), { style: { background: it.sw } });
    return h('span.emoji' + (big ? '.big' : ''), { 'aria-hidden': 'true' }, it.em);
  }
  L.picture = picture;
  function speakerBtn(file, opts) {
    opts = opts || {};
    var b = h('button.speaker' + (opts.big ? '.big' : ''), { type: 'button', 'aria-label': 'Luister' },
      h('span', { html: '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>' }));
    b.addEventListener('click', function () {
      b.classList.add('playing');
      Snd.play(typeof file === 'function' ? file() : file).then(function () { b.classList.remove('playing'); });
    });
    return b;
  }
  function slowBtn(file) {
    var b = h('button.slow', { type: 'button', 'aria-label': 'Langzaam' }, '🐢');
    b.addEventListener('click', function () { Snd.play(typeof file === 'function' ? file() : file, { slow: true }); });
    return b;
  }

  /* ---------- oefeningen samenstellen ---------- */
  function speakOk(ctx) { return ctx.player.set.speak && Voice.hasMic() && !ctx.noMic; }

  function typesFor(ctx, it) {
    var b = Store.box(ctx.player, it.id);
    var t = [];
    var hasPic = !!(it.em || it.sw);
    if (it.k === 'z') {
      t = ['zb', 'lb'];
      if (b >= 2) t.push('zbl');
      if (b >= 2 && speakOk(ctx)) t.push('echo');
      return t;
    }
    if (b <= 1) {
      t = hasPic ? ['lp', 'lp', 'pp'] : ['lb', 'lb'];
      t.push('lh');
    } else if (b === 2) {
      t = hasPic ? ['lp', 'hp', 'pp'] : ['lb', 'hb'];
      t.push('lh', 'tp', 'hpy');
      if (singleSyl(it) && splitSyl(it.syl[0].s)[0]) t.push('pb');
      if (speakOk(ctx)) t.push(hasPic ? 'speak' : 'echo');
    } else {
      t = hasPic ? ['hp', 'hp'] : ['hb', 'hb'];
      t.push('lh', 'hpy', 'tp');
      if (singleSyl(it) && splitSyl(it.syl[0].s)[0]) t.push('pb');
      if (speakOk(ctx)) t.push(hasPic ? 'speak' : 'echo', 'echo');
    }
    if (it.k === 'c') t.push('lb');
    return t;
  }

  var exerciseSkill = { lp: 'L', lb: 'L', lh: 'H', hp: 'H', hb: 'H', pp: 'P', hpy: 'P', pb: 'P', tp: 'T', speak: 'S', echo: 'S', zb: 'H', zbl: 'L' };

  function weakness(player, id, skill) {
    var result = Store.ability(player, id, skill);
    if (!result.t) return 4;
    if (result.streak === 0) return 7;
    if (result.due <= U.dayNum()) return 5;
    return [7, 3, 2, 0][result.streak];
  }

  function choices(ctx, it) {
    var types = typesFor(ctx, it);
    if (Store.introduced(ctx.player, it.id) && it.k !== 'z') {
      types = types.concat([it.em || it.sw ? 'hp' : 'hb', 'hpy', 'tp']);
    }
    return types.filter(function (type, index) { return types.indexOf(type) === index; });
  }

  function priority(ctx, id) {
    return Math.max.apply(null, choices(ctx, item(id)).map(function (type) {
      return weakness(ctx.player, id, exerciseSkill[type]);
    }));
  }

  function exFor(ctx, it, avoidTypes) {
    var types = choices(ctx, it);
    var available = types.filter(function (type) {
      return !avoidTypes || avoidTypes.indexOf(type) < 0;
    });
    if (available.length) types = available;
    var ranked = U.shuffle(types).sort(function (a, b) {
      return weakness(ctx.player, it.id, exerciseSkill[b]) - weakness(ctx.player, it.id, exerciseSkill[a]);
    });
    var type = ranked[0];
    var skill = exerciseSkill[type];
    return { type: type, item: it.id, easy: Store.ability(ctx.player, it.id, skill).streak < 2,
      independent: skill === 'H' && Store.introduced(ctx.player, it.id) && /^(hp|hb|lh)$/.test(type) };
  }

  /* Volgorde zonder hetzelfde woord twee keer na elkaar. */
  function spread(list) {
    var out = [], pool = list.slice(), guard = 0;
    while (pool.length && guard++ < 500) {
      var i = 0;
      while (i < pool.length && out.length && pool[i].item && out[out.length - 1].item === pool[i].item) i++;
      if (i >= pool.length) i = 0;
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  }

  /* Gewone les. */
  function buildLes(ctx, lesson) {
    var p = ctx.player, len = p.set.len || 12;
    var fresh = lesson.new.filter(function (id) { return !Store.introduced(p, id); });
    var seq = [];
    // kennismaking, telkens gevolgd door een makkelijke vraag over het vorige nieuwe woord
    fresh.forEach(function (id, i) {
      seq.push({ type: 'intro', item: id });
      if (i > 0) seq.push({ type: item(fresh[i - 1]).k === 'z' ? 'zb' : (item(fresh[i - 1]).em || item(fresh[i - 1]).sw ? 'lp' : 'lb'), item: fresh[i - 1], easy: true });
    });
    if (fresh.length) {
      var last = item(fresh[fresh.length - 1]);
      seq.push({ type: last.k === 'z' ? 'zb' : (last.em || last.sw ? 'lp' : 'lb'), item: last.id, easy: true });
    }
    var body = [];
    var lessonItems = lesson.new.slice();
    // elk woord van deze les nog twee keer, op een andere manier
    lessonItems.forEach(function (id) {
      body.push(exFor(ctx, item(id), ['intro']));
      body.push(exFor(ctx, item(id), [body[body.length - 1].type]));
    });
    // herhaling van woorden die aan de beurt zijn
    var due = Store.dueItems(p).filter(function (id) { return lessonItems.indexOf(id) < 0; });
    var need = Math.max(3, len - body.length - (fresh.length ? 1 : 0));
    due.sort(function (a, b) { return priority(ctx, b) - priority(ctx, a); });
    due.slice(0, need).forEach(function (id) { body.push(exFor(ctx, item(id))); });
    // nog niet genoeg? dan zwakke of willekeurige gekende woorden
    if (body.length < len) {
      var known = U.shuffle(Store.knownItems(p).filter(function (id) { return lessonItems.indexOf(id) < 0 && due.indexOf(id) < 0; }));
      known.sort(function (a, b) { return priority(ctx, b) - priority(ctx, a) || Store.box(p, a) - Store.box(p, b); });
      known.slice(0, len - body.length).forEach(function (id) { body.push(exFor(ctx, item(id))); });
    }
    body = spread(U.shuffle(body)).slice(0, Math.max(len, lessonItems.length * 2));
    // paren zoeken als er genoeg woorden met een plaatje zijn
    var pairable = Store.knownItems(p).concat(lessonItems).filter(function (id, i, a) {
      var x = item(id); return a.indexOf(id) === i && x.k !== 'z' && (x.em || x.sw);
    });
    if (pairable.length >= 4) body.splice(Math.floor(body.length / 2), 0, { type: 'match', items: pairable });
    return seq.concat(body);
  }

  /* Tonenles (eenheid 1). */
  function buildToon(ctx, lesson) {
    var p = ctx.player, seq = [];
    var set = lesson.id === 'u1a' ? [1, 4] : lesson.id === 'u1b' ? [2, 3] : [1, 2, 3, 4];
    var all = lesson.id === 'u1b' ? [1, 2, 3, 4] : set;
    seq.push({ type: 'toneintro', tones: set });
    lesson.new.forEach(function (id) {
      if (!Store.introduced(p, id)) seq.push({ type: 'intro', item: id });
    });
    var body = [];
    for (var i = 0; i < 4; i++) body.push({ type: 'tone', tones: set });
    for (i = 0; i < 2; i++) body.push({ type: 'swipe', tones: set });
    if (lesson.id !== 'u1a') { body.push({ type: 'tone', tones: all }); body.push({ type: 'tone', tones: all }); }
    var words = CONTENT.units[0].items.filter(function (id) { return Store.introduced(p, id) || lesson.new.indexOf(id) >= 0; });
    words.forEach(function (id) { body.push({ type: 'lp', item: id }); });
    if (lesson.id === 'u1c') {
      body.push({ type: 'swipe', tones: all }); body.push({ type: 'tone', tones: all });
      words.forEach(function (id) { body.push({ type: 'tp', item: id }); });
      if (words.length >= 4) body.push({ type: 'match', items: words });
    }
    return seq.concat(spread(U.shuffle(body)));
  }

  /* Tekenfamilie: zoek het onderdeel. */
  function buildTekens(ctx, lesson) {
    var seq = [];
    lesson.comps.forEach(function (c) {
      seq.push({ type: 'compintro', comp: c });
      for (var i = 0; i < 3; i++) seq.push({ type: 'comp', comp: c });
    });
    var body = seq.filter(function (x) { return x.type === 'comp'; });
    var intros = seq.filter(function (x) { return x.type === 'compintro'; });
    // per onderdeel eerst de uitleg, dan de vragen; op het einde alles door elkaar
    var out = [];
    lesson.comps.forEach(function (c) {
      out.push(intros.filter(function (x) { return x.comp === c; })[0]);
      out = out.concat(body.filter(function (x) { return x.comp === c; }).slice(0, 2));
    });
    var mix = U.shuffle(lesson.comps.map(function (c) { return { type: 'comp', comp: c }; }));
    // en lezen van gekende woorden met die onderdelen
    var p = ctx.player;
    lesson.comps.forEach(function (c) {
      var ids = Object.keys(CONTENT.comps[c].items).map(function (ch) { return CONTENT.comps[c].items[ch]; })
        .filter(function (id) { return Store.introduced(p, id); });
      U.shuffle(ids).slice(0, 2).forEach(function (id) { var it = item(id); mix.push({ type: it.em || it.sw ? 'hp' : 'hb', item: id }); });
    });
    return out.concat(U.shuffle(mix));
  }

  /* Oefenen: alles wat aan de beurt is. */
  function buildOefen(ctx) {
    var p = ctx.player, len = p.set.len || 12;
    var due = Store.dueItems(p);
    var ids = U.shuffle(Store.knownItems(p)).sort(function (a, b) {
      return priority(ctx, b) - priority(ctx, a) ||
        Number(due.indexOf(b) >= 0) - Number(due.indexOf(a) >= 0);
    }).slice(0, len);
    var body = ids.map(function (id) { return exFor(ctx, item(id)); });
    var pairable = Store.knownItems(p).filter(function (id) { var x = item(id); return x.k !== 'z' && (x.em || x.sw); });
    if (pairable.length >= 4) body.push({ type: 'match', items: pairable });
    return spread(U.shuffle(body));
  }

  /* Toonspel: veel stemmen, veel lettergrepen (training met variatie). */
  function buildToonspel(ctx) {
    var body = [], p = ctx.player;
    for (var i = 0; i < 7; i++) body.push({ type: 'tone', tones: [1, 2, 3, 4], mixed: true });
    for (i = 0; i < 3; i++) body.push({ type: 'swipe', tones: [1, 2, 3, 4], mixed: true });
    var known = U.shuffle(Store.knownItems(p).filter(function (id) { return item(id).k !== 'z'; })).slice(0, 4);
    known.forEach(function (id) { body.push({ type: 'tp', item: id }); });
    return spread(U.shuffle(body));
  }

  L.build = function (ctx, node) {
    if (node.kind === 'oefen') return buildOefen(ctx);
    if (node.kind === 'toonspel') return buildToonspel(ctx);
    if (node.lesson.kind === 'toonles') return buildToon(ctx, node.lesson);
    if (node.lesson.kind === 'tekens') return buildTekens(ctx, node.lesson);
    return buildLes(ctx, node.lesson);
  };

  /* ---------- de les afspelen ---------- */
  L.run = function (player, node, onDone) {
    var app = U.$('#app');
    U.clear(app);
    var ctx = {
      player: player, node: node, stars: 0, combo: 0, bestCombo: 0, ok: 0, total: 0,
      newItems: [], t0: Date.now(), retries: {}, noMic: false
    };
    var seq = L.build(ctx, node);
    // geluid alvast laden
    var files = [];
    seq.forEach(function (ex) { if (ex.item && item(ex.item)) files = files.concat(item(ex.item).au.slice(0, 2)); });
    Snd.preload(files.slice(0, 40));

    var col = Store.colorOf(player);
    var root = h('div.lesson');
    var fill = h('div.ls-fill');
    var bar = h('div.ls-bar', fill, h('span.ls-head', { html: Dragon.svg({ color: col, stage: Math.max(1, Store.stage(player)), mood: 'happy', crop: 'head' }) }));
    var starEl = h('span.ls-stars', '0');
    var comboEl = h('span.ls-combo');
    var closeBtn = h('button.ls-close', { type: 'button', 'aria-label': 'Stoppen' }, '✕');
    var top = h('header.ls-top', closeBtn, bar, h('div.ls-score', comboEl, h('span.star-ic', '★'), starEl));
    var main = h('main.ls-main');
    var sheet = h('div.ls-sheet');
    root.appendChild(top); root.appendChild(main); root.appendChild(sheet);
    app.appendChild(root);
    var idx = 0, total = seq.length;

    closeBtn.addEventListener('click', function () {
      Snd.stop();
      App.confirm('Wil je stoppen? Je sterren van deze les blijven bewaard.', 'Stoppen', 'Verder spelen').then(function (yes) {
        if (yes) finish(true);
      });
    });

    function progress() {
      var pct = Math.min(100, Math.round(100 * idx / Math.max(1, total)));
      fill.style.width = pct + '%';
      bar.querySelector('.ls-head').style.left = 'calc(' + pct + '% - 18px)';
    }

    function next() {
      Snd.stop();
      sheet.className = 'ls-sheet';
      U.clear(sheet);
      if (idx >= seq.length) { finish(false); return; }
      var ex = seq[idx++];
      assisted = false;
      progress();
      U.clear(main);
      main.className = 'ls-main ex-' + ex.type;
      var fn = EX[ex.type];
      if (!fn || (ex.item && !item(ex.item))) { next(); return; }
      try { fn(ex, api); } catch (e) { console.error(e); next(); }
    }

    var answered = false;
    var assisted = false;
    var api = {
      ctx: ctx, main: main, player: player, item: item,
      showPy: function (it, strict) {
        var mode = player.set.pinyin;
        if (mode === 'always') return true;
        if (mode === 'never') return false;
        var b = Store.box(player, it.id);
        return strict ? b <= 1 : b <= 2;
      },
      begin: function () { answered = false; },
      usedHint: function () { assisted = true; },
      /* ok: juist/fout; info: { item, skill, label (wat juist was), noGrade, retryType } */
      answer: function (ok, info) {
        if (answered) return; answered = true;
        info = info || {};
        ctx.total += 1;
        var it = info.item ? item(info.item) : null;
        if (ok) {
          ctx.ok += 1; ctx.combo += 1; ctx.bestCombo = Math.max(ctx.bestCombo, ctx.combo);
          var add = info.stars || 1;
          if (ctx.combo > 0 && ctx.combo % 5 === 0) { add += 2; Snd.fx('combo'); } else Snd.fx('good');
          ctx.stars += add; Store.addStars(player, add);
          if (!info.almost) { Mine.earn(player); ctx.coins = (ctx.coins || 0) + 1; }
          starEl.textContent = ctx.stars;
          starEl.classList.remove('bump'); void starEl.offsetWidth; starEl.classList.add('bump');
        } else {
          ctx.combo = 0;
          Snd.fx('oops');
          // later in de les nog eens, op een makkelijkere manier
          if (it && !info.noRetry && (ctx.retries[it.id] || 0) < 1) {
            ctx.retries[it.id] = 1;
            var easy = { H: it.em || it.sw ? 'hp' : 'hb', P: it.em || it.sw ? 'pp' : 'hpy', T: 'tp' }[info.skill];
            if (it.k === 'z' || !easy) easy = it.k === 'z' ? 'zb' : (it.em || it.sw ? 'lp' : 'lb');
            seq.splice(Math.min(seq.length, idx + 3), 0, { type: info.retryType || easy, item: it.id, easy: true, retry: true });
            total = seq.length;
          }
        }
        comboEl.textContent = ctx.combo >= 3 ? '🔥' + ctx.combo : '';
        if (it && !info.noGrade) {
          Store.grade(player, it.id, ok);
          Store.gradeAbility(player, it.id, info.skill,
            info.skillOk !== undefined ? info.skillOk : ok, assisted || info.assisted);
        }
        Store.countExercise(player, info.skillOk !== undefined ? info.skillOk : ok, info.skill);
        Store.save();
        showSheet(ok, it, info);
      },
      next: next,
      sheet: sheet
    };

    function praise(kind) {
      var list = CONTENT.praise.filter(function (x) { return x.kind === kind; });
      return U.pick(list);
    }

    function showSheet(ok, it, info) {
      U.clear(sheet);
      sheet.className = 'ls-sheet show ' + (ok ? 'good' : 'oops');
      var pr = praise(ok ? 'good' : 'try');
      var head = h('div.sh-head',
        h('span.sh-dragon', { html: Dragon.svg({ color: col, stage: Math.max(1, Store.stage(player)), mood: ok ? 'happy' : 'oops', crop: 'head' }) }),
        h('div.sh-words', h('strong', ok && info.almost ? 'Goed geprobeerd!' : ok ? U.pick(['Goed zo!', 'Super!', 'Knap!', 'Juist!', 'Straf!', 'Amai!']) : 'Oei, net niet.'),
          h('span.sh-zh', { lang: 'zh-CN' }, pr.hz, ' ', h('em', pr.py))));
      if (ok && !info.almost) head.appendChild(h('span.mine-coin', '+1 🪙'));
      sheet.appendChild(head);
      if (it) {
        var reveal = h('div.sh-item', hzBlock(it, true, 'sm'), h('span.sh-nl', (it.em && it.k !== 'z' ? it.em + ' ' : '') + it.nl),
          speakerBtn(au(it)), slowBtn(au(it)));
        sheet.appendChild(reveal);
      } else if (info.label) {
        sheet.appendChild(h('div.sh-item', h('span.sh-nl', info.label)));
      }
      var btn = h('button.btn.primary.sh-next', { type: 'button' }, 'Verder');
      var myIdx = idx, gone = false;
      function go() { if (gone || idx !== myIdx) return; gone = true; clearTimeout(auto); next(); }
      btn.addEventListener('click', go);
      sheet.appendChild(btn);
      var auto = null;
      // de klank nog eens horen na het antwoord (behalve bij luistervragen waar hij net klonk)
      var p0 = Promise.resolve();
      if (it && !info.noReplay) p0 = U.wait(250).then(function () { return Snd.play(au(it)); });
      if (ok && Math.random() < 0.3 && pr.au && pr.au.length) p0 = p0.then(function () { return Snd.play(pr.au[0]); });
      if (ok && !info.noAuto) {
        p0.then(function () { if (!gone && idx === myIdx) auto = setTimeout(go, 900); });
      }
      setTimeout(function () { try { btn.focus({ preventScroll: true }); } catch (e) { /* niets */ } }, 50);
    }

    function finish(aborted) {
      var secs = (Date.now() - ctx.t0) / 1000;
      Store.addSeconds(player, secs);
      var acc = ctx.total ? ctx.ok / ctx.total : 1;
      var lanterns = aborted ? 0 : acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
      var nodeId = node.lesson ? node.lesson.id : node.kind;
      if (!aborted) Store.lessonDone(player, nodeId, lanterns);
      Store.log({ type: 'les', player: player.id, name: player.prof.name, node: nodeId,
        title: node.lesson ? node.lesson.title : (node.kind === 'oefen' ? 'Oefenen' : 'Toonspel'),
        ok: ctx.ok, total: ctx.total, stars: ctx.stars, secs: Math.round(secs), aborted: aborted });
      Store.save();
      onDone({ aborted: aborted, coins: ctx.coins || 0, stars: ctx.stars, ok: ctx.ok, total: ctx.total, lanterns: lanterns,
        newItems: ctx.newItems, secs: secs, bestCombo: ctx.bestCombo, nodeId: nodeId });
    }

    next();
  };

  /* ---------- de oefeningen ---------- */
  var EX = {};
  L.EX = EX;

  function prompt(api, text, extra) {
    api.main.appendChild(h('p.ex-q', text));
    if (extra) api.main.appendChild(extra);
  }
  function grid(n) { return h('div.choices.n' + n); }
  function choiceBtn(content, onPick) {
    var b = h('button.choice', { type: 'button' }, content);
    b.addEventListener('click', function () { onPick(b); });
    return b;
  }
  /* Meerkeuze: options = [{el, ok}] */
  function multiple(api, options, info, onAnswered) {
    api.begin();
    var g = grid(options.length);
    var done = false;
    options.forEach(function (o) {
      g.appendChild(choiceBtn(o.el, function (b) {
        if (done) return; done = true;
        Snd.fx('tap');
        U.$$('.choice', g).forEach(function (x) { x.disabled = true; });
        b.classList.add(o.ok ? 'right' : 'wrong');
        if (!o.ok) options.forEach(function (oo, i) { if (oo.ok) g.children[i].classList.add('right'); });
        if (onAnswered) onAnswered(o.ok);
        api.answer(o.ok, info);
      }));
    });
    api.main.appendChild(g);
    return g;
  }
  function picCard(it) { return h('span.card', picture(it), h('span.lbl', it.nl)); }
  function hzCard(it, showPy) { return h('span.card.hzc', hzBlock(it, showPy)); }
  function pyCard(text) { return h('span.card.pyc', h('span.py', text)); }

  function optionsWith(api, it, n, mode, filter) {
    var d = distractors(api.ctx, it, n - 1, mode, filter);
    return U.shuffle([it].concat(d));
  }
  function nOpts(api, it, ex) {
    if (ex.easy) return 2;
    return Store.box(api.player, it.id) <= 1 ? 3 : 4;
  }

  /* Kennismaking */
  EX.intro = function (ex, api) {
    var it = item(ex.item), p = api.player;
    Store.introduce(p, it.id);
    if (api.ctx.newItems.indexOf(it.id) < 0) api.ctx.newItems.push(it.id);
    Store.save();
    var card = h('div.intro-card');
    var label = it.k === 'z' ? 'Nieuwe zin' : it.k === 'c' ? 'Nieuwe uitdrukking' : 'Nieuw woord';
    card.appendChild(h('p.ex-q', label));
    var hzEl = hzBlock(it, false, 'xl');
    card.appendChild(hzEl);
    var more = h('div.intro-more.later');
    if (it.k !== 'z' && (it.em || it.sw)) more.appendChild(picture(it, true));
    more.appendChild(h('p.intro-nl', it.nl));
    var tools = h('div.intro-tools', speakerBtn(au(it), { big: true }), slowBtn(au(it)));
    card.appendChild(tools);
    card.appendChild(more);
    if (it.tk) card.appendChild(h('div.tk.later', h('span.tk-ic', '💡'), h('span', it.tk)));
    var tips = tipsFor(it);
    if (tips.length && it.k !== 'z') card.appendChild(h('div.tips.later', tips.map(function (t) { return h('p', t); })));
    api.main.appendChild(card);
    var row = h('div.intro-actions');
    if (speakOk(api.ctx)) {
      var sayBtn = h('button.btn.ghost', { type: 'button' }, '🎤 Zeg het na');
      sayBtn.addEventListener('click', function () {
        sayBtn.disabled = true;
        echoInline(api, it, row).then(function () { sayBtn.disabled = false; });
      });
      row.appendChild(sayBtn);
    }
    var go = h('button.btn.primary', { type: 'button' }, 'Verder');
    go.addEventListener('click', function () { Snd.fx('tap'); api.next(); });
    row.appendChild(go);
    api.main.appendChild(row);
    // eerst het teken en de klank, dan pas pinyin en betekenis (zo kijkt het kind naar het teken)
    Snd.play(au(it)).then(function () { return U.wait(200); }).then(function () {
      U.$$('rt', hzEl).forEach(function (r) { r.classList.remove('hide'); });
      U.$$('.later', card).forEach(function (x) { x.classList.add('shown'); });
    });
    setTimeout(function () {
      U.$$('rt', hzEl).forEach(function (r) { r.classList.remove('hide'); });
      U.$$('.later', card).forEach(function (x) { x.classList.add('shown'); });
    }, 2600);
  };

  /* Luister -> plaatje */
  EX.lp = function (ex, api) {
    var it = item(ex.item);
    var file = au(it, 'any');
    prompt(api, 'Wat hoor je?', h('div.ex-listen', speakerBtn(file, { big: true }), slowBtn(file)));
    var opts = optionsWith(api, it, nOpts(api, it, ex), 'listen', function (x) { return x.em || x.sw; });
    multiple(api, opts.map(function (x) { return { el: picCard(x), ok: x.id === it.id }; }), { item: it.id, skill: 'L', noReplay: false });
    U.wait(250).then(function () { Snd.play(file); });
  };
  /* Luister -> betekenis */
  EX.lb = function (ex, api) {
    var it = item(ex.item);
    var file = au(it, 'any');
    prompt(api, 'Wat betekent het?', h('div.ex-listen', speakerBtn(file, { big: true }), slowBtn(file)));
    var opts = optionsWith(api, it, ex.easy ? 2 : 3, 'listen');
    multiple(api, opts.map(function (x) { return { el: h('span.card.nlc', h('span.lbl', x.nl)), ok: x.id === it.id }; }), { item: it.id, skill: 'L' });
    U.wait(250).then(function () { Snd.play(file); });
  };
  /* Luister -> teken */
  EX.lh = function (ex, api) {
    var it = item(ex.item);
    var file = au(it, 'any');
    var showPy = api.showPy(it, true) && !(ex.independent && api.player.set.pinyin === 'fade');
    prompt(api, 'Welk teken hoor je?', h('div.ex-listen', speakerBtn(file, { big: true }), slowBtn(file)));
    var opts = optionsWith(api, it, nOpts(api, it, ex), 'listen');
    multiple(api, opts.map(function (x) { return { el: hzCard(x, showPy), ok: x.id === it.id }; }), { item: it.id, skill: 'H', assisted: showPy });
    U.wait(250).then(function () { Snd.play(file); });
  };
  /* Teken -> plaatje (lezen) */
  EX.hp = function (ex, api) {
    var it = item(ex.item);
    var showPy = api.showPy(it, true) && !(ex.independent && api.player.set.pinyin === 'fade');
    var blk = hzBlock(it, showPy, 'xl');
    var peek = null;
    if (!showPy && api.player.set.pinyin !== 'never') {
      peek = h('button.peek', { type: 'button' }, 'pinyin');
      peek.addEventListener('click', function () { api.usedHint(); U.$$('rt', blk).forEach(function (r) { r.classList.remove('hide'); }); peek.remove(); });
    }
    prompt(api, it.syl.length > 1 ? 'Wat betekent dit woord?' : 'Wat betekent dit teken?', h('div.ex-hz', blk, peek));
    var opts = optionsWith(api, it, nOpts(api, it, ex), null, function (x) { return x.em || x.sw; });
    multiple(api, opts.map(function (x) { return { el: picCard(x), ok: x.id === it.id }; }), { item: it.id, skill: 'H', assisted: showPy });
  };
  /* Teken -> betekenis (voor woorden zonder duidelijk plaatje) */
  EX.hb = function (ex, api) {
    var it = item(ex.item);
    var showPy = api.showPy(it, true) && !(ex.independent && api.player.set.pinyin === 'fade');
    prompt(api, 'Wat betekent dit?', h('div.ex-hz', hzBlock(it, showPy, 'xl')));
    var opts = optionsWith(api, it, 3, null);
    multiple(api, opts.map(function (x) { return { el: h('span.card.nlc', h('span.lbl', x.nl)), ok: x.id === it.id }; }), { item: it.id, skill: 'H', assisted: showPy });
  };
  /* Pinyin -> plaatje (pinyin lezen) */
  EX.pp = function (ex, api) {
    var it = item(ex.item);
    prompt(api, 'Lees de pinyin. Wat is het?', h('div.ex-py', h('span.py.xl', it.py)));
    var opts = optionsWith(api, it, nOpts(api, it, ex), 'pinyin', function (x) { return x.em || x.sw; });
    multiple(api, opts.map(function (x) { return { el: picCard(x), ok: x.id === it.id }; }), { item: it.id, skill: 'P' });
  };
  /* Teken -> pinyin */
  EX.hpy = function (ex, api) {
    var it = item(ex.item);
    prompt(api, 'Hoe spreek je dit uit?', h('div.ex-hz', hzBlock(it, false, 'xl')));
    var others = distractors(api.ctx, it, 1, 'pinyin', function (x) { return x.syl.length === it.syl.length; });
    var variants = toneVariants(it, 1);
    var opts = U.shuffle([{ t: it.py, ok: true }].concat(variants.map(function (v) { return { t: v, ok: false }; }))
      .concat(others.map(function (x) { return { t: x.py, ok: false }; })));
    multiple(api, opts.map(function (o) { return { el: pyCard(o.t), ok: o.ok }; }), { item: it.id, skill: 'P' });
  };
  /* Luister -> juiste tonen */
  function toneVariants(it, n) {
    var out = [], tries = 0;
    var base = it.syl.map(function (s) { return { s: s.s, t: s.t, m: s.m }; });
    while (out.length < n && tries++ < 40) {
      var v = base.map(function (s) { return { s: s.s, t: s.t }; });
      var changeable = v.map(function (s, i) { return s.t !== 5 ? i : -1; }).filter(function (i) { return i >= 0; });
      if (!changeable.length) break;
      var k = U.pick(changeable);
      var nt = U.pick([1, 2, 3, 4].filter(function (t) { return t !== v[k].t; }));
      v[k].t = nt;
      if (changeable.length > 2 && Math.random() < 0.4) {
        var k2 = U.pick(changeable); if (k2 !== k) v[k2].t = U.pick([1, 2, 3, 4].filter(function (t) { return t !== v[k2].t; }));
      }
      var txt = rebuildPy(it, v);
      if (txt !== it.py && out.indexOf(txt) < 0) out.push(txt);
    }
    return out;
  }
  function rebuildPy(it, sylls) {
    // zelfde woordgrenzen en hoofdletters als het origineel
    var k = 0;
    return it.py.replace(/[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+/g, function (word) {
      var out = '', rest = word;
      while (rest.length && k < sylls.length) {
        var orig = it.syl[k].m;
        var take = rest.slice(0, orig.length);
        var marked = markTone(sylls[k].s, sylls[k].t);
        if (take[0] && take[0] !== take[0].toLowerCase()) marked = marked[0].toUpperCase() + marked.slice(1);
        out += marked; rest = rest.slice(orig.length); k++;
      }
      return out + rest;
    });
  }
  EX.tp = function (ex, api) {
    var it = item(ex.item);
    var file = au(it, 'any');
    prompt(api, 'Welke tonen hoor je?', h('div.ex-listen', speakerBtn(file, { big: true }), slowBtn(file), h('div.ex-hzsmall', hzBlock(it, false))));
    var variants = toneVariants(it, 2);
    var opts = U.shuffle([{ t: it.py, ok: true }].concat(variants.map(function (v) { return { t: v, ok: false }; })));
    multiple(api, opts.map(function (o) { return { el: pyCard(o.t), ok: o.ok }; }), { item: it.id, skill: 'T' });
    U.wait(250).then(function () { Snd.play(file); });
  };

  /* Toon herkennen bij een losse lettergreep */
  function pickSyllable(ex, api) {
    // lettergreep uit de toonset (menselijke opname) of een gekend woord van één lettergreep
    var tones = ex.tones || [1, 2, 3, 4];
    var t = U.pick(tones);
    var bases = Object.keys(CONTENT.tones).filter(function (b) { return CONTENT.tones[b][t]; });
    if (ex.mixed && Math.random() < 0.35) {
      var words = Store.knownItems(api.player).map(item).filter(function (x) { return x.syl.length === 1 && tones.indexOf(x.syl[0].t) >= 0; });
      if (words.length) {
        var w = U.pick(words);
        return { base: w.syl[0].s, t: w.syl[0].t, file: au(w, 'any'), item: w };
      }
    }
    if (!bases.length) {
      var any = Store.knownItems(api.player).map(item).filter(function (x) { return x.syl.length === 1 && x.syl[0].t !== 5; });
      if (!any.length) any = Object.keys(CONTENT.items).map(item).filter(function (x) { return x.syl.length === 1 && x.syl[0].t !== 5; });
      var w2 = U.pick(any);
      return { base: w2.syl[0].s, t: w2.syl[0].t, file: au(w2, 'any'), item: w2 };
    }
    var b = U.pick(bases);
    return { base: b, t: t, file: CONTENT.tones[b][t][0] };
  }
  EX.tone = function (ex, api) {
    var s = pickSyllable(ex, api);
    prompt(api, 'Welke toon hoor je?', h('div.ex-listen', speakerBtn(s.file, { big: true }), slowBtn(s.file),
      h('div.ex-sylpy', h('span.py.xl', s.base.replace('v', 'ü')))));
    var tones = ex.tones || [1, 2, 3, 4];
    var opts = tones.map(function (t) {
      return { el: h('span.card.tonec', h('span', { html: toneIcon(t, 52) }), h('span.lbl', 'toon ' + t)), ok: t === s.t };
    });
    multiple(api, opts, { item: s.item ? s.item.id : null, skill: 'T', label: markTone(s.base.replace('v', 'ü'), s.t) + ' is toon ' + s.t, noGrade: !s.item },
      function (ok) {
        if (!s.item) setTimeout(function () { Snd.play(s.file); }, 300);
      });
    U.wait(250).then(function () { Snd.play(s.file); });
  };

  /* Toonvegen: teken de toon met je vinger */
  EX.swipe = function (ex, api) {
    var s = pickSyllable(ex, api);
    api.begin();
    prompt(api, 'Luister en teken de toon met je vinger.', h('div.ex-listen', speakerBtn(s.file, { big: true }), slowBtn(s.file),
      h('div.ex-sylpy', h('span.py.xl', s.base.replace('v', 'ü')))));
    var pad = h('div.swipe-pad');
    var cv = h('canvas');
    pad.appendChild(cv);
    pad.appendChild(h('div.swipe-guide', h('span', 'hoog'), h('span', 'laag')));
    api.main.appendChild(pad);
    var hint = h('p.ex-hint', 'Veeg van links naar rechts.');
    api.main.appendChild(hint);
    var pts = [], drawing = false, done = false;
    function size() {
      var r = pad.getBoundingClientRect();
      cv.width = r.width * (window.devicePixelRatio || 1); cv.height = r.height * (window.devicePixelRatio || 1);
      cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
    }
    setTimeout(size, 0);
    function pos(e) {
      var r = cv.getBoundingClientRect(), t = e.touches ? e.touches[0] : e;
      return { x: (t.clientX - r.left) / r.width, y: (t.clientY - r.top) / r.height };
    }
    function draw(color, list, width) {
      var c = cv.getContext('2d'), W = cv.width, H = cv.height;
      c.strokeStyle = color; c.lineWidth = width * (window.devicePixelRatio || 1); c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath();
      list.forEach(function (p, i) { if (i) c.lineTo(p.x * W, p.y * H); else c.moveTo(p.x * W, p.y * H); });
      c.stroke();
    }
    function start(e) { if (done) return; e.preventDefault(); drawing = true; pts = [pos(e)]; cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); }
    function move(e) { if (!drawing) return; e.preventDefault(); pts.push(pos(e)); cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); draw(getComputedStyle(pad).color, pts, 9); }
    function end() {
      if (!drawing) return; drawing = false;
      if (pts.length < 4 || Math.abs(pts[pts.length - 1].x - pts[0].x) < 0.15) { hint.textContent = 'Langer vegen, van links naar rechts.'; return; }
      done = true;
      var guess = classifyGesture(pts);
      var ok = guess === s.t;
      // de juiste lijn erbij tekenen
      draw(U.isEink() ? 'rgba(0,0,0,.45)' : 'rgba(30,158,126,.85)', idealPath(s.t), 7);
      Snd.fx('swipe');
      api.answer(ok, { item: s.item ? s.item.id : null, skill: 'T', noGrade: !s.item,
        label: (ok ? 'Toon ' + s.t + ': ' : 'Het was toon ' + s.t + ': ') + markTone(s.base.replace('v', 'ü'), s.t) });
      if (!s.item) setTimeout(function () { Snd.play(s.file); }, 300);
    }
    cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture && cv.setPointerCapture(e.pointerId); start(e); });
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    U.wait(250).then(function () { Snd.play(s.file); });
  };
  function idealPath(t) {
    var P = { 1: [[0.1, 0.2], [0.9, 0.2]], 2: [[0.1, 0.65], [0.9, 0.15]], 3: [[0.1, 0.45], [0.45, 0.85], [0.6, 0.85], [0.9, 0.3]], 4: [[0.1, 0.15], [0.9, 0.85]] }[t];
    var out = [];
    for (var i = 0; i < P.length - 1; i++) for (var k = 0; k <= 10; k++) {
      var a = P[i], b = P[i + 1];
      out.push({ x: a[0] + (b[0] - a[0]) * k / 10, y: a[1] + (b[1] - a[1]) * k / 10 });
    }
    return out;
  }
  /* Gebaar herkennen: vlak, omhoog, dal, omlaag (y groeit naar beneden). */
  function classifyGesture(pts) {
    var ys = pts.map(function (p) { return -p.y; });
    var n = ys.length, start = ys[0], end = ys[n - 1];
    var minI = 0;
    for (var i = 1; i < n; i++) if (ys[i] < ys[minI]) minI = i;
    var range = Math.max.apply(null, ys) - Math.min.apply(null, ys);
    if (range < 0.12) return 1;
    var dipDepth = Math.min(start, end) - ys[minI];
    if (dipDepth > 0.08 && minI > n * 0.15 && minI < n * 0.85) return 3;
    if (end - start > 0.1) return 2;
    if (start - end > 0.1) return 4;
    return 1;
  }
  L.classifyGesture = classifyGesture;

  /* Pinyin bouwen: begin + einde + toon */
  EX.pb = function (ex, api) {
    var it = item(ex.item);
    var s = it.syl[0];
    var parts = splitSyl(s.s);
    var file = au(it, 'any');
    api.begin();
    prompt(api, 'Bouw de pinyin van wat je hoort.', h('div.ex-listen', speakerBtn(file, { big: true }), slowBtn(file), h('div.ex-hzsmall', hzBlock(it, false))));
    var result = h('div.pb-result', h('span.pb-i', '?'), h('span.pb-f', '?'));
    api.main.appendChild(result);
    var chosen = { i: null, f: null, t: null };
    var rows = h('div.pb-rows');
    function row(label, values, key, render) {
      var r = h('div.pb-row', h('span.pb-lbl', label));
      values.forEach(function (v) {
        var b = h('button.pb-opt', { type: 'button' }, render ? render(v) : v);
        b.addEventListener('click', function () {
          Snd.fx('tap');
          U.$$('.pb-opt', r).forEach(function (x) { x.classList.remove('sel'); });
          b.classList.add('sel');
          chosen[key] = v;
          update();
        });
        r.appendChild(b);
      });
      rows.appendChild(r);
    }
    var ini = U.shuffle([parts[0]].concat(similarOf(parts[0], CONF_I, INITIALS)));
    var fin = U.shuffle([parts[1]].concat(similarOf(parts[1], CONF_F, ALL_FINALS)));
    row('begin', ini, 'i');
    row('einde', fin, 'f');
    row('toon', [1, 2, 3, 4], 't', function (t) { return h('span', { html: toneIcon(t, 34) }); });
    api.main.appendChild(rows);
    var check = h('button.btn.primary', { type: 'button', disabled: true }, 'Klaar');
    api.main.appendChild(check);
    function update() {
      result.children[0].textContent = chosen.i || '?';
      result.children[1].textContent = chosen.f ? (chosen.t ? markTone(chosen.f, chosen.t) : chosen.f) : '?';
      check.disabled = !(chosen.i && chosen.f && chosen.t);
    }
    check.addEventListener('click', function () {
      var ok = chosen.i === parts[0] && chosen.f === parts[1] && chosen.t === s.t;
      check.disabled = true;
      U.$$('.pb-opt', rows).forEach(function (x) { x.disabled = true; });
      api.answer(ok, { item: it.id, skill: 'P' });
    });
    U.wait(250).then(function () { Snd.play(file); });
  };

  /* Paren zoeken */
  EX.match = function (ex, api) {
    var pool = U.shuffle(ex.items.map(item));
    var chosen = [];
    pool.forEach(function (x) {
      if (chosen.length >= 4) return;
      if (chosen.some(function (y) { return clash(x, y, 'listen'); })) return;
      chosen.push(x);
    });
    if (chosen.length < 3) { api.next(); return; }
    api.begin();
    prompt(api, 'Zoek de paren.');
    var left = h('div.mcol'), right = h('div.mcol');
    var sel = null, matched = 0, mistakes = 0;
    function tile(it, side) {
      var el = side === 'l' ? h('button.mtile', { type: 'button' }, hzBlock(it, api.showPy(it, true)))
        : h('button.mtile', { type: 'button' }, picture(it), h('span.lbl', it.nl));
      el.dataset.id = it.id; el.dataset.side = side;
      el.addEventListener('click', function () {
        if (el.classList.contains('done')) return;
        if (side === 'l') Snd.play(au(it)); else Snd.fx('tap');
        if (!sel || sel.dataset.side === side) {
          if (sel) sel.classList.remove('sel');
          sel = el; el.classList.add('sel'); return;
        }
        if (sel.dataset.id === el.dataset.id) {
          sel.classList.remove('sel'); sel.classList.add('done'); el.classList.add('done');
          Snd.fx('pop'); matched++;
          sel = null;
          if (matched === chosen.length) {
            setTimeout(function () { api.answer(mistakes <= 1, { skill: 'H', label: mistakes ? 'Alle paren gevonden!' : 'Alle paren in één keer!', stars: 2 }); }, 400);
          }
        } else {
          mistakes++;
          var a = sel; a.classList.add('shake'); el.classList.add('shake');
          setTimeout(function () { a.classList.remove('shake', 'sel'); el.classList.remove('shake'); }, 450);
          sel = null;
        }
      });
      return el;
    }
    U.shuffle(chosen).forEach(function (x) { left.appendChild(tile(x, 'l')); });
    U.shuffle(chosen).forEach(function (x) { right.appendChild(tile(x, 'r')); });
    api.main.appendChild(h('div.match', left, right));
  };

  /* Zinnen bouwen. zbl = alleen luisteren (moeilijker) */
  function zinBouw(ex, api, listenOnly) {
    var it = item(ex.item);
    var file = au(it, 'any');
    var showPy = api.showPy(it, false);
    api.begin();
    if (listenOnly) prompt(api, 'Luister en maak de zin.', h('div.ex-listen', speakerBtn(file, { big: true }), slowBtn(file)));
    else prompt(api, 'Maak de zin: ' + it.nl, h('div.ex-listen', speakerBtn(file), slowBtn(file)));
    var line = h('div.zb-line');
    var bank = h('div.zb-bank');
    var tiles = it.tiles.map(function (t, i) { return { t: t, py: it.tilepy[i], i: i }; });
    // één extra tegel als het woord al goed gekend is
    if (Store.box(api.player, it.id) >= 2) {
      var other = distractors(api.ctx, it, 1, null)[0];
      if (other && other.tiles) {
        var cand = other.tiles.map(function (t, i) { return { t: t, py: other.tilepy[i], i: -1 }; })
          .filter(function (x) { return it.tiles.indexOf(x.t) < 0; });
        if (cand.length) tiles.push(U.pick(cand));
      }
    }
    var placed = [];
    U.shuffle(tiles).forEach(function (tl) {
      var b = h('button.zb-tile', { type: 'button' }, h('span.hz', { lang: 'zh-CN' }, tl.t), showPy ? h('span.zb-py', tl.py) : null);
      b.addEventListener('click', function () {
        Snd.fx('tap');
        if (b.parentNode === bank) { line.appendChild(b); placed.push(tl); }
        else { bank.appendChild(b); placed.splice(placed.indexOf(tl), 1); }
        check.disabled = placed.length === 0;
      });
      bank.appendChild(b);
    });
    api.main.appendChild(line);
    api.main.appendChild(bank);
    var check = h('button.btn.primary', { type: 'button', disabled: true }, 'Klaar');
    check.addEventListener('click', function () {
      var ok = placed.map(function (x) { return x.t; }).join('') === it.hz && placed.every(function (x) { return x.i >= 0; });
      check.disabled = true;
      U.$$('.zb-tile').forEach(function (x) { x.disabled = true; });
      line.classList.add(ok ? 'right' : 'wrong');
      api.answer(ok, { item: it.id, skill: listenOnly ? 'L' : 'H', assisted: !listenOnly && showPy });
    });
    api.main.appendChild(check);
    if (listenOnly) U.wait(250).then(function () { Snd.play(file); });
  }
  EX.zb = function (ex, api) { zinBouw(ex, api, false); };
  EX.zbl = function (ex, api) { zinBouw(ex, api, true); };

  /* ---------- spreken ---------- */
  function micButton(label) {
    return h('button.mic', { type: 'button', 'aria-label': label || 'Spreek' },
      h('span', { html: '<svg viewBox="0 0 24 24" width="100%" height="100%"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M8 21h8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>' }));
  }
  /* Tekent de toonlijn van de opname en (live) die van het kind. */
  function contourCanvas() {
    var cv = h('canvas.contour');
    var api = {
      el: cv,
      draw: function (model, child, live) {
        var r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
        cv.width = Math.max(10, r.width * dpr); cv.height = Math.max(10, r.height * dpr);
        var c = cv.getContext('2d'), W = cv.width, H = cv.height;
        c.clearRect(0, 0, W, H);
        function line(arr, color, width, dash) {
          if (!arr) return;
          var vals = arr.filter(function (v) { return v !== null && v !== undefined; });
          if (!vals.length) return;
          c.strokeStyle = color; c.lineWidth = width * dpr; c.lineCap = 'round'; c.lineJoin = 'round';
          c.setLineDash(dash ? [6 * dpr, 6 * dpr] : []);
          c.beginPath();
          var started = false;
          arr.forEach(function (v, i) {
            if (v === null || v === undefined) { started = false; return; }
            var x = 12 * dpr + (W - 24 * dpr) * i / Math.max(1, arr.length - 1);
            var y = H / 2 - (v / 8) * (H / 2 - 10 * dpr);
            if (!started) { c.moveTo(x, y); started = true; } else c.lineTo(x, y);
          });
          c.stroke();
        }
        line(model, '#9AA3B5', 6, true);
        line(child, getComputedStyle(cv).color || '#E0362C', 7, false);
        if (live !== undefined) { /* niets extra */ }
      }
    };
    return api;
  }

  /* Na-zeggen met toonlijn (werkt op elk toestel met een microfoon). */
  function echoFlow(api, it, area, opts) {
    opts = opts || {};
    var file = au(it);
    var model = it.pc || null;
    var cc = contourCanvas();
    var status = h('p.ex-hint', 'Tik op de microfoon en zeg het na.');
    var mic = micButton();
    var mine = null;
    var playMine = h('button.btn.ghost.small', { type: 'button', disabled: true }, '▶ Mijn stem');
    playMine.addEventListener('click', function () { if (mine) { var a = new Audio(mine); a.play(); } });
    var bothRow = h('div.echo-row', speakerBtn(file), playMine);
    area.appendChild(h('div.echo', cc.el, h('div.echo-legend', h('span.lg-model', 'opname'), h('span.lg-child', 'jij')), mic, status, bothRow));
    setTimeout(function () { cc.draw(model, null); }, 30);
    return new Promise(function (resolve) {
      var busy = false, tries = 0;
      mic.addEventListener('click', function () {
        if (busy) return; busy = true; tries++;
        Snd.stop();
        mic.classList.add('rec');
        status.textContent = 'Ik luister…';
        var live = [];
        var stopFn = null;
        Voice.record({ maxMs: 3500, onStopFn: function (f) { stopFn = f; },
          onFrame: function (f0) { live.push(f0); if (live.length % 3 === 0) cc.draw(model, Voice.toContour(live, 32)); } })
          .then(function (res) {
            mic.classList.remove('rec'); busy = false;
            if (!res.heard || !res.contour) {
              status.textContent = 'Ik hoorde niets. Spreek wat luider, dicht bij het toestel.';
              return;
            }
            mine = res.url; playMine.disabled = !mine;
            cc.draw(model, res.contour);
            var sim = Voice.similarity(model, res.contour);
            var toneOk = null;
            if (it.syl.length === 1 && it.syl[0].t !== 5) toneOk = Voice.classifyTone(res.contour) === it.syl[0].t;
            var good = toneOk === null ? sim >= 0.55 : (toneOk || sim >= 0.7);
            var stars = good ? (sim >= 0.75 ? 3 : 2) : 1;
            status.textContent = good ? (stars === 3 ? 'Prachtig! Jouw lijn lijkt goed op die van de opname.' : 'Goed! Je toon lijkt erop.')
              : 'Kijk naar de stippellijn en probeer nog eens.';
            if (good || tries >= 2) resolve({ good: good, stars: stars, sim: sim });
          })
          .catch(function () {
            mic.classList.remove('rec'); busy = false;
            status.textContent = 'De microfoon werkt niet. Geef toestemming in de browser, of zet spreken uit in de ouderhoek.';
            api.ctx.noMic = true;
            resolve({ good: false, stars: 0, failed: true });
          });
      });
    });
  }
  function echoInline(api, it, row) {
    var area = h('div.echo-inline');
    row.parentNode.insertBefore(area, row);
    return echoFlow(api, it, area).then(function (r) {
      if (r.good) { Snd.fx('good'); api.ctx.stars += 1; Store.addStars(api.player, 1); Store.save(); }
    });
  }

  EX.echo = function (ex, api) {
    var it = item(ex.item);
    api.begin();
    prompt(api, 'Luister en zeg het na.', h('div.ex-hz', hzBlock(it, true, 'lg')));
    var area = h('div');
    api.main.appendChild(area);
    var skip = h('button.btn.ghost.small.skip', { type: 'button' }, 'Nu niet spreken');
    skip.addEventListener('click', function () { Snd.stop(); api.next(); });
    api.main.appendChild(skip);
    Snd.play(au(it));
    echoFlow(api, it, area).then(function (r) {
      if (r.failed) { setTimeout(api.next, 1800); return; }
      api.answer(true, { item: it.id, skill: 'S', skillOk: r.good, stars: r.stars, noGrade: !r.good, noRetry: true, noAuto: true,
        almost: !r.good, noReplay: true });
    });
  };

  /* Zelf zeggen bij een plaatje (spraakherkenning als die er is, anders de toonlijn). */
  EX.speak = function (ex, api) {
    var it = item(ex.item);
    var online = navigator.onLine !== false;
    if (!Voice.hasASR() || !online) { EX.echo(ex, api); return; }
    api.begin();
    prompt(api, 'Hoe zeg je dit in het Chinees?', h('div.ex-pic', picture(it, true), h('p.intro-nl', it.nl)));
    var status = h('p.ex-hint', 'Tik op de microfoon en zeg het.');
    var mic = micButton();
    var heardEl = h('p.heard');
    var help = h('button.btn.ghost.small', { type: 'button' }, '👂 Hulp: luister eerst');
    help.addEventListener('click', function () { Snd.play(au(it)); });
    var skip = h('button.btn.ghost.small.skip', { type: 'button' }, 'Nu niet spreken');
    skip.addEventListener('click', function () { Snd.stop(); api.next(); });
    api.main.appendChild(h('div.speak', mic, status, heardEl, h('div.echo-row', help, skip)));
    var tries = 0, busy = false;
    Voice.loadPinyinMap();
    mic.addEventListener('click', function () {
      if (busy) return; busy = true; tries++;
      Snd.stop();
      mic.classList.add('rec'); status.textContent = 'Ik luister…';
      Voice.loadPinyinMap().then(function () { return Voice.listen({ maxMs: 5000 }); }).then(function (alts) {
        mic.classList.remove('rec'); busy = false;
        if (!alts.length) { status.textContent = 'Ik hoorde niets. Probeer nog eens.'; return; }
        var score = Voice.matchScore(it, alts);
        heardEl.textContent = 'Ik hoorde: ' + alts[0];
        if (score >= 0.6) {
          api.answer(true, { item: it.id, skill: 'S', stars: 2, noRetry: true });
        } else if (tries >= 2) {
          status.textContent = 'Goed geprobeerd! Luister hoe het klinkt.';
          api.answer(true, { item: it.id, skill: 'S', skillOk: false, stars: 1, noGrade: true, noRetry: true, noAuto: true, almost: true });
        } else {
          status.textContent = 'Bijna! Luister en probeer nog eens.';
          Snd.play(au(it));
        }
      }).catch(function (e) {
        mic.classList.remove('rec'); busy = false;
        var msg = String(e && e.message || '');
        if (/not-allowed|service-not-allowed/.test(msg)) {
          status.textContent = 'De microfoon mag niet. We gaan verder met na-zeggen.';
          setTimeout(function () { U.clear(api.main); EX.echo(ex, api); }, 1200);
        } else if (/network/.test(msg)) {
          status.textContent = 'Geen internet voor de spraakherkenning. We gaan verder met na-zeggen.';
          setTimeout(function () { U.clear(api.main); EX.echo(ex, api); }, 1200);
        } else {
          status.textContent = 'Ik hoorde niets. Probeer nog eens.';
        }
      });
    });
  };

  /* ---------- uitlegkaarten ---------- */
  var TONE_NL = {
    1: ['Toon 1', 'Hoog en recht, alsof je zingt: māāā.'],
    2: ['Toon 2', 'Omhoog, alsof je verbaasd vraagt: hè?'],
    3: ['Toon 3', 'Eerst omlaag, dan weer omhoog: hmmm?'],
    4: ['Toon 4', 'Kort en hard omlaag, alsof je zegt: nee!']
  };
  EX.toneintro = function (ex, api) {
    var card = h('div.tone-intro');
    card.appendChild(h('p.ex-q', ex.tones.length === 4 ? 'De vier tonen' : 'Twee tonen'));
    card.appendChild(h('p.ti-lead', 'In het Chinees zing je een beetje. Dezelfde klank met een andere toon is een ander woord. mā is mama, mǎ is paard!'));
    var rows = h('div.ti-rows');
    ex.tones.forEach(function (t) {
      var file = CONTENT.tones.ma[t] ? CONTENT.tones.ma[t][0] : null;
      var r = h('button.ti-row', { type: 'button' },
        h('span.ti-ic', { html: toneIcon(t, 56) }),
        h('span.ti-txt', h('strong', TONE_NL[t][0] + ' · ' + markTone('ma', t)), h('span', TONE_NL[t][1])),
        h('span.ti-play', '🔊'));
      r.addEventListener('click', function () {
        U.$$('.ti-row', rows).forEach(function (x) { x.classList.remove('on'); });
        r.classList.add('on');
        Snd.play(file);
      });
      rows.appendChild(r);
    });
    card.appendChild(rows);
    card.appendChild(h('p.ex-hint', 'Tik op elke toon en zeg hem na. Teken hem mee in de lucht met je hand!'));
    api.main.appendChild(card);
    var go = h('button.btn.primary', { type: 'button' }, 'Ik ben klaar');
    go.addEventListener('click', function () { api.next(); });
    api.main.appendChild(h('div.intro-actions', go));
  };

  EX.compintro = function (ex, api) {
    var c = CONTENT.comps[ex.comp];
    var card = h('div.comp-intro');
    card.appendChild(h('p.ex-q', 'Tekenfamilie'));
    card.appendChild(h('div.comp-big', h('span.hz.xl', { lang: 'zh-CN' }, ex.comp), h('span.emoji.big', c.em)));
    card.appendChild(h('p.intro-nl', 'Dit is ' + c.nl + '. Je vindt het in veel tekens die er iets mee te maken hebben.'));
    var ex2 = h('div.comp-examples');
    c.chars.slice(0, 6).forEach(function (ch) {
      var it = item(c.items[ch]);
      var b = h('button.comp-ex', { type: 'button' }, h('span.hz', { lang: 'zh-CN' }, ch), h('span.lbl', it ? it.nl : ''));
      b.addEventListener('click', function () { if (it) Snd.play(au(it)); });
      ex2.appendChild(b);
    });
    card.appendChild(ex2);
    api.main.appendChild(card);
    var go = h('button.btn.primary', { type: 'button' }, 'Verder');
    go.addEventListener('click', function () { api.next(); });
    api.main.appendChild(h('div.intro-actions', go));
  };

  /* Welk teken heeft het onderdeel? */
  EX.comp = function (ex, api) {
    var c = CONTENT.comps[ex.comp];
    var yes = U.pick(c.chars);
    // andere tekens uit de leerstof zonder dit onderdeel
    var others = [];
    Object.keys(CONTENT.items).forEach(function (id) {
      CONTENT.items[id].syl.forEach(function (s) {
        if (c.chars.indexOf(s.c) < 0 && others.indexOf(s.c) < 0 && s.c !== ex.comp) others.push(s.c);
      });
    });
    // liefst gekende tekens
    var known = {};
    Store.knownItems(api.player).forEach(function (id) { item(id).syl.forEach(function (s) { known[s.c] = 1; }); });
    others = U.shuffle(others).sort(function (a, b) { return (known[b] || 0) - (known[a] || 0); }).slice(0, 8);
    var opts = U.shuffle([yes].concat(U.shuffle(others).slice(0, 3)));
    prompt(api, 'Welk teken heeft ' + c.nl + '?', h('div.comp-big.sm', h('span.hz.lg', { lang: 'zh-CN' }, ex.comp), h('span.emoji', c.em)));
    var it = item(c.items[yes]);
    multiple(api, opts.map(function (ch) { return { el: h('span.card.hzc', h('span.hz', { lang: 'zh-CN' }, ch)), ok: ch === yes }; }),
      { skill: 'H', label: yes + ' heeft ' + ex.comp + (it ? ' (' + it.nl + ')' : ''), item: null });
  };

  window.Lesson = L;
})();
