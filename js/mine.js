/* Blokkenmijn: munten, kaarten en een luisterspel. */
(function () {
  'use strict';
  var h = U.h;
  var Mine = {};
  var price = 6;
  var gear = [
    { id: 'band', slot: 'head', name: 'Ontdekkersband', icon: '🧢', price: 4 },
    { id: 'boots', slot: 'feet', name: 'Rode springlaarzen', icon: '🥾', price: 6 },
    { id: 'scarf', slot: 'neck', name: 'Jadesjaal', icon: '🧣', price: 7 },
    { id: 'medal', slot: 'neck', name: 'Drakenmedaille', icon: '🏅', price: 8 },
    { id: 'glasses', slot: 'head', name: 'Vliegbril', icon: '🥽', price: 10, mission: 'bridge' },
    { id: 'crown', slot: 'head', name: 'Gouden kroon', icon: '👑', price: 12 },
    { id: 'cape', slot: 'body', name: 'Rode heldencape', icon: '🦸', price: 16 },
    { id: 'lantern', slot: 'neck', name: 'Lantaarnhanger', icon: '🏮', price: 14, mission: 'lessons' },
    { id: 'armor', slot: 'body', name: 'Jadeharnas', icon: '🛡', price: 18, mission: 'gate' },
    { id: 'cloudboots', slot: 'feet', name: 'Wolkenlaarzen', icon: '☁️', price: 18, mission: 'days' },
    { id: 'starcrown', slot: 'head', name: 'Sterrenkroon', icon: '🌟', price: 24, mission: 'tower' },
    { id: 'skycape', slot: 'body', name: 'Nachtcape', icon: '🌙', price: 28, mission: 'master' }
  ];
  var missions = [
    { id: 'bridge', name: 'De oversteek', icon: '🌉', hint: 'Bouw de brug in de Blokkenmijn.', target: 1, reward: 6, route: 'bridge',
      progress: function (p) { return Number(!!data(p).runs.bridge); } },
    { id: 'lessons', name: 'Het lantaarnpad', icon: '🏮', hint: 'Speel drie verschillende lessen op het leerpad.', target: 3, reward: 8, route: 'home',
      progress: function (p) { return Store.allNodes().filter(function (node) { return Store.nodeDone(p, node.lesson.id); }).length; } },
    { id: 'gate', name: 'De tekenpoort', icon: '⛩', hint: 'Lees zes Chinese tekens om de poort te openen.', target: 1, reward: 10, route: 'gate',
      progress: function (p) { return Number(!!data(p).runs.gate); } },
    { id: 'days', name: 'Drie dagen op pad', icon: '☁️', hint: 'Oefen op drie verschillende dagen. Je mag dagen overslaan.', target: 3, reward: 10, route: 'home',
      progress: function (p) {
        var days = {};
        Object.keys(p.days || {}).forEach(function (day) { if (Store.dayTotals(p, day).k > 0) days[day] = true; });
        Object.keys(data(p).trailDays).forEach(function (day) { days[day] = true; });
        return Object.keys(days).length;
      } },
    { id: 'tower', name: 'De wolkentoren', icon: '🗼', hint: 'Luister en kies telkens het juiste Chinese teken.', target: 1, reward: 12, route: 'tower',
      progress: function (p) { return Number(!!data(p).runs.tower); } },
    { id: 'master', name: 'Op eigen vleugels', icon: '✨', hint: 'Herken acht tekens zelfstandig in je lessen, telkens op meerdere dagen.', target: 8, reward: 16, route: 'home',
      progress: function (p) {
        var hanzi = (p.ability && p.ability.H) || {};
        return Object.keys(hanzi).filter(function (id) { return hanzi[id].streak >= 2; }).length;
      } }
  ];

  var routes = {
    bridge: { title: 'Bouw de brug', clue: 'Luister en kies de juiste tekening.', choices: 2, className: 'bridge' },
    gate: { title: 'Open de tekenpoort', clue: 'Lees het teken en kies wat het betekent.', choices: 3, className: 'gate' },
    tower: { title: 'Beklim de wolkentoren', clue: 'Luister en tik op het juiste teken.', choices: 4, className: 'tower' }
  };
  var symbols = { hout: '🪵', vuur: '🔥', water: '💧', berg: '⛰️', zon: '☀️', draak: '🐉' };
  var cards = [
    { id: 'hout', name: 'Takbever', hz: '木', py: 'mù', word: 'hout', audio: 'mu-h.mp3', sky: '#f4ce8e', palette: ['#643c2c','#a66a46','#f4d198','#fff1ce'], art: ['..........','.11....11.','.12222221.','1222222221','1202222021','1223333221','.13300331.','..344443..','...1111...','..11..11..'] },
    { id: 'vuur', name: 'Vonkvos', hz: '火', py: 'huǒ', word: 'vuur', audio: 'huo-h.mp3', sky: '#ffcb9d', palette: ['#6d2532','#ec6939','#ffc34e','#fff0cc'], art: ['..........','1........1','12......21','123....321','1222222221','.12222221.','.13022031.','..134431..','....11....','..........'] },
    { id: 'water', name: 'Spatvis', hz: '水', py: 'shuǐ', word: 'water', audio: 'shui-h.mp3', sky: '#a5e9ef', palette: ['#174d7a','#2e98c6','#6be3ec','#fff4ac'], art: ['......4...','..332...4.','.322322...','32222221.1','3222222311','3230222321','3222222311','.3222221.1','..33331...','..........'] },
    { id: 'berg', name: 'Bergbok', hz: '山', py: 'shān', word: 'berg', audio: 'shan-h.mp3', sky: '#bdd2fa', palette: ['#31374f','#797d99','#dbe4ec','#98cba2'], art: ['.2......2.','.3......3.','.33....33.','..333333..','.23333332.','.23033032.','..333333..','...3113...','....33....','44......44'] },
    { id: 'zon', name: 'Zonnebij', hz: '日', py: 'rì', word: 'zon', audio: 'ri-h.mp3', sky: '#fff0ac', palette: ['#614514','#f5a72e','#ffe36b','#fff9e2'], art: ['.4......4.','444....444','.44333344.','..333333..','.33033033.','.33233233.','.11111111.','..222222..','...1111...','..........'] },
    { id: 'draak', name: 'Mijnendraak', hz: '龙', py: 'lóng', word: 'draak', audio: 'long-h.mp3', sky: '#c3edc4', palette: ['#28474a','#329878','#78d49c','#ffdb68'], art: ['.3......3.','.13333331.','1333333331','1303333031','1334444331','.14444441.','..112211..','2112222112','1224444221','..11..11..'] }
  ];

  var discoveries = [
    { id: 'river', subject: 'Aardrijkskunde', title: 'Waar gaat de rivier heen?', icon: '🌊',
      word: '水', py: 'shuǐ', nl: 'water', audio: 'shui-h.mp3',
      scene: 'Xiǎolóng laat een papieren bootje los. “Waar zou het water heen stromen?” vraagt de panda.',
      fact: 'De Jangtse is de langste rivier van Azië. Bij Shanghai stroomt ze de Oost-Chinese Zee in.',
      ask: 'Waar komt het rivierwater uiteindelijk terecht?', answers: ['In de zee', 'Op een bergtop', 'In een tunnel'], correct: 0 },
    { id: 'wall', subject: 'Geschiedenis', title: 'De muur met veel bouwers', icon: '🧱',
      word: '长城', py: 'Chángchéng', nl: 'de Chinese Muur', audio: 'st_changcheng-a.mp3',
      scene: 'De panda stapelt blokken over een bergrug. “Dit lukt nooit in één dag!” lacht Xiǎolóng.',
      fact: 'Verschillende Chinese dynastieën bouwden en herbouwden delen van de Chinese Muur. Sommige delen zijn van aangestampte aarde, andere van steen of baksteen.',
      ask: 'Hoe is de Chinese Muur ontstaan?', answers: ['Alles werd in één keer gebouwd', 'Bouwers werkten eraan in verschillende tijden', 'De wind maakte de muur'], correct: 1 },
    { id: 'festival', subject: 'Cultuur', title: 'Samen aan tafel met Nieuwjaar', icon: '🥟',
      word: '饺子', py: 'jiǎozi', nl: 'dumplings', audio: 'st_jiaozi-h.mp3',
      scene: 'Bij oma vouwt Xiǎolóng deeg rond de vulling. Zijn eerste dumpling ziet eruit als een bootje.',
      fact: 'Met Chinees Nieuwjaar komen veel families samen. In delen van Noord-China eten ze bij het feest vaak jiǎozi. Gewoontes verschillen per streek.',
      ask: 'Wat vouwt Xiǎolóng met oma?', answers: ['Een lantaarn', 'Een muts', 'Een dumpling'], correct: 2 }
  ];

  function data(player) {
    if (!player.mine) player.mine = {};
    ['earned', 'spent', 'cards', 'practice', 'gear', 'missions', 'runs', 'trailDays', 'discoveries'].forEach(function (key) {
      if (!player.mine[key]) player.mine[key] = {};
    });
    return player.mine;
  }

  function sum(values) {
    return Object.keys(values).reduce(function (total, key) { return total + values[key]; }, 0);
  }

  function count(player) {
    return cards.filter(function (card) { return !!data(player).cards[card.id]; }).length;
  }

  Mine.balance = function (player) {
    var wallet = data(player);
    var bonus = missions.reduce(function (total, mission) {
      return total + (wallet.missions[mission.id] ? mission.reward : 0);
    }, 0);
    var explorer = discoveries.filter(function (entry) { return !!wallet.discoveries[entry.id]; }).length;
    return Math.max(0, sum(wallet.earned) + bonus + explorer * 2 - sum(wallet.spent));
  };

  function increment(map, amount) {
    var device = Store.device().id;
    map[device] = (map[device] || 0) + amount;
  }

  Mine.earn = function (player) { increment(data(player).earned, 1); };

  function openPack(player) {
    if (Mine.balance(player) < price) return null;
    var wallet = data(player);
    var unowned = cards.filter(function (card) { return !wallet.cards[card.id]; });
    var card = U.pick(unowned.length ? unowned : cards);
    var duplicate = !!wallet.cards[card.id];
    increment(wallet.spent, price);
    if (duplicate) increment(wallet.earned, 2);
    else wallet.cards[card.id] = Date.now();
    Store.save();
    App.syncSoon();
    return { card: card, duplicate: duplicate };
  }

  function button(label, click, style) {
    return h('button.btn.' + (style || 'ghost'), { type: 'button', onclick: click }, label);
  }

  function picture(card) {
    var canvas = h('canvas.mine-art', { width: 10, height: 10, 'aria-hidden': 'true' });
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = card.sky;
    ctx.fillRect(0, 0, 10, 10);
    card.art.forEach(function (row, y) {
      row.split('').forEach(function (pixel, x) {
        if (pixel === '.') return;
        ctx.fillStyle = pixel === '0' ? '#172438' : card.palette[Number(pixel) - 1];
        ctx.fillRect(x, y, 1, 1);
      });
    });
    return canvas;
  }

  function gold(player, card) {
    return Object.keys(data(player).practice[card.id] || {}).length >= 3;
  }

  function reveal(player, card, message) {
    var body = h('div.mine-reveal', h('h2', message), picture(card), h('h3', card.name),
      h('p', h('span.hz', { lang: 'zh-CN' }, card.hz), ' · ', card.py, ' · ', card.word),
      button('🔊 Luister', function () { Snd.play(card.audio); }));
    if (gold(player, card)) body.appendChild(h('p', '✦ Gouden kaart'));
    App.modal(body);
  }

  Mine.label = function (player) {
    var coins = Mine.balance(player);
    return coins + ' 🪙 · ' + count(player) + '/6 kaarten' +
      (coins >= price ? ' · Pakje klaar!' : ' · Nog ' + (price - coins) + ' voor een pakje');
  };

  Mine.show = function () {
    var player = Store.current();
    if (!player) { App.go('chooser'); return; }
    var room = h('section.mine-room');
    U.clear(U.$('#app')).appendChild(room);
    room.appendChild(h('header.sub-top', button('← Terug', function () { App.go('home'); App.syncSoon(); }), h('h2', 'Blokkenmijn')));
    var balance = Mine.balance(player);
    room.appendChild(h('p.mine-balance', balance + ' 🪙 · ' + count(player) + ' van 6 kaarten'));
    room.appendChild(h('p', balance >= price ? 'Je kunt een pakje openen.' : 'Nog ' + (price - balance) + ' munten voor een pakje.'));
    var pack = button('Open pakje · 6 🪙', function () {
      var result = openPack(player);
      if (!result) return;
      Mine.show();
      Snd.fx('done');
      reveal(player, result.card, result.duplicate ? 'Dubbele kaart · 2 munten terug' : 'Nieuwe kaart!');
    }, 'primary');
    pack.disabled = balance < price;
    room.appendChild(h('div.row', pack, button('Bouw de brug', function () { App.go('adventure', { route: 'bridge' }); }), button('Drakengarderobe', function () { App.go('wardrobe'); })));
    var album = h('div.mine-album');
    cards.forEach(function (card) {
      var owned = !!data(player).cards[card.id];
      if (!owned) {
        album.appendChild(h('div.mine-card.mine-locked', h('span', '?'), h('span', 'Nog te vinden')));
        return;
      }
      album.appendChild(h('button.mine-card' + (gold(player, card) ? '.mine-gold' : ''),
        { type: 'button', onclick: function () { reveal(player, card, 'Jouw kaart'); } },
        picture(card), h('strong', card.name), h('span.hz', { lang: 'zh-CN' }, card.hz)));
    });
    room.appendChild(h('h3', 'Mijn kaarten'));
    room.appendChild(album);
    room.appendChild(h('p.small', 'Een gouden kaart verdien je door het woord op drie verschillende dagen meteen goed te herkennen in het brugspel.'));
  };

  Mine.wardrobe = function () {
    var player = Store.current();
    if (!player) { App.go('chooser'); return; }
    var wallet = data(player);
    var balance = Mine.balance(player);
    var room = h('section.mine-room');
    U.clear(U.$('#app')).appendChild(room);
    room.appendChild(h('header.sub-top', button('← Terug', function () { App.go('home'); App.syncSoon(); }), h('h2', 'Drakengarderobe')));
    room.appendChild(h('p.mine-balance', balance + ' 🪙'));
    room.appendChild(button('Naar de missies', function () { App.go('adventure'); }));
    room.appendChild(h('div.wardrobe-dragon', { html: Dragon.forPlayer(player, 'happy', { stage: Math.max(1, Store.stage(player)) }) }));
    if (!player.hatch) room.appendChild(h('p.small', 'Zo ziet je draak eruit zodra hij uit het ei komt.'));
    var filters = [['all', 'Alles'], ['head', 'Hoofd'], ['body', 'Lijf'], ['neck', 'Hals'], ['feet', 'Voeten']];
    var filter = Mine.wardrobeFilter || 'all';
    var tabbar = h('div.row');
    filters.forEach(function (entry) {
      var tab = button(entry[1], function () { Mine.wardrobeFilter = entry[0]; Mine.wardrobe(); }, filter === entry[0] ? 'primary' : 'ghost');
      tab.setAttribute('aria-pressed', String(filter === entry[0]));
      tabbar.appendChild(tab);
    });
    room.appendChild(tabbar);
    var list = h('div.wardrobe-items');
    gear.filter(function (item) { return filter === 'all' || item.slot === filter; }).forEach(function (item) {
      var owned = !!wallet.gear[item.id];
      var locked = !owned && item.mission && !wallet.missions[item.mission];
      var mission = locked ? missions.filter(function (m) { return m.id === item.mission; })[0] : null;
      var choice = player.outfit && player.outfit[item.slot];
      var worn = owned && choice && choice.id === item.id;
      var label = owned ? (worn ? 'Uitdoen' : 'Aandoen') : 'Koop · ' + item.price + ' 🪙';
      var action = button(label, function () {
        if (!wallet.gear[item.id]) {
          if (locked || Mine.balance(player) < item.price) return;
          increment(wallet.spent, item.price);
          wallet.gear[item.id] = Date.now();
        }
        player.outfit = player.outfit || {};
        player.outfit[item.slot] = { id: worn ? '' : item.id, t: Date.now() };
        Store.save();
        App.syncSoon();
        Mine.wardrobe();
      }, 'primary');
      action.disabled = !!locked || (!owned && balance < item.price);
      if (locked) action.textContent = item.price + ' 🪙 na missie';
      else if (!owned && action.disabled) action.textContent = 'Nog ' + (item.price - balance) + ' 🪙 sparen';
      action.setAttribute('aria-label', item.name + ' · ' + action.textContent);
      list.appendChild(h('div.mine-card', h('span.wardrobe-icon', { 'aria-hidden': 'true' }, item.icon),
        h('strong', item.name), mission ? h('span', 'Missie: ' + mission.name) : null, action));
    });
    room.appendChild(list);
  };

  Mine.adventure = function (opts) {
    var player = Store.current();
    if (!player) { App.go('chooser'); return; }
    var wallet = data(player);
    var room = h('section.mine-room.adventure-room');
    U.clear(U.$('#app')).appendChild(room);
    if (opts && Object.prototype.hasOwnProperty.call(routes, opts.route)) {
      play(player, room, opts.route);
      return;
    }
    room.appendChild(h('header.sub-top', button('← Terug', function () { App.go('home'); App.syncSoon(); }), h('h2', 'Drakenexpeditie')));
    var claimed = missions.filter(function (mission) { return !!wallet.missions[mission.id]; }).length;
    var rank = claimed === missions.length ? 'Wolkenwachter' : claimed >= 3 ? 'Drakenridder' : 'Ontdekker';
    room.appendChild(h('div.adventure-banner',
      h('div.wardrobe-dragon', { html: Dragon.forPlayer(player, 'happy', { stage: Math.max(1, Store.stage(player)) }) }),
      h('div', h('strong', rank), h('p', claimed + ' van ' + missions.length + ' missies · ' + Mine.balance(player) + ' 🪙'))));
    room.appendChild(h('div.row',
      button('Drakengarderobe', function () { App.go('wardrobe'); }),
      button('Kaarten & pakjes', function () { App.go('mine'); }),
      button('🧭 Ontdek China', function () { App.go('china'); })));
    var training = h('details.box', h('summary', 'Beluister de zes woorden'));
    var previews = h('div.adventure-words');
    cards.forEach(function (card) {
      previews.appendChild(button(symbols[card.id] + ' ' + card.word + ' · ' + card.hz,
        function () { Snd.play(card.audio); }));
    });
    training.appendChild(previews);
    room.appendChild(training);
    var list = h('div.adventure-list');
    missions.forEach(function (mission) {
      var amount = Math.min(mission.target, mission.progress(player));
      var done = !!wallet.missions[mission.id];
      var card = h('section.adventure-card', h('h3', mission.icon + ' ' + mission.name), h('p', mission.hint),
        h('progress', { value: done ? mission.target : amount, max: mission.target, 'aria-label': mission.name }),
        h('span.small', done ? '✓ Voltooid' : amount + ' / ' + mission.target));
      if (!done && amount >= mission.target) {
        card.appendChild(button('Pak ' + mission.reward + ' 🪙', function () {
          if (wallet.missions[mission.id] || mission.progress(player) < mission.target) return;
          wallet.missions[mission.id] = 1;
          Store.save();
          App.syncSoon();
          Snd.fx('done');
          App.toast('+' + mission.reward + ' munten');
          Mine.adventure();
        }, 'primary'));
      } else if (!done || mission.route !== 'home') {
        card.appendChild(button(mission.route === 'home' ? 'Naar het leerpad' : done ? 'Speel opnieuw' : 'Start missie', function () {
          if (mission.route === 'home') App.go('home');
          else App.go('adventure', { route: mission.route });
        }));
      }
      list.appendChild(card);
    });
    room.appendChild(list);
  };

  Mine.china = function () {
    var player = Store.current();
    if (!player) { App.go('chooser'); return; }
    var found = data(player).discoveries;
    var room = h('section.mine-room.adventure-room');
    U.clear(U.$('#app')).appendChild(room);
    room.appendChild(h('header.sub-top', button('← Missies', function () { App.go('adventure'); App.syncSoon(); }), h('h2', 'Ontdek China')));
    var progress = h('p.mine-balance', { role: 'status' });
    function report() {
      var n = discoveries.filter(function (entry) { return !!found[entry.id]; }).length;
      progress.textContent = n + ' van ' + discoveries.length + ' ontdekt · ' + Mine.balance(player) + ' 🪙';
    }
    report();
    room.appendChild(progress);
    var list = h('div.adventure-list');
    discoveries.forEach(function (entry) {
      var card = h('details.adventure-card',
        h('summary', entry.icon + ' ' + entry.title),
        h('p.small', entry.subject),
        h('p', entry.scene), h('p', entry.fact));
      var word = h('p', h('span.hz', { lang: 'zh-CN' }, entry.word), ' · ' + entry.py + ' · ' + entry.nl);
      card.appendChild(word);
      card.appendChild(button('🔊 Luister naar het woord', function () { Snd.play(entry.audio); }));
      card.appendChild(h('p', h('strong', entry.ask)));
      var answers = h('div.china-answers');
      var feedback = h('p.small', { role: 'status' }, found[entry.id] ? '✓ Al ontdekt' : '');
      var solved = false;
      entry.answers.forEach(function (label, index) {
        var answer = button(label, function () {
          if (solved) return;
          if (index !== entry.correct) {
            answer.disabled = true;
            feedback.textContent = 'Lees het weetje nog eens en probeer opnieuw.';
            return;
          }
          solved = true;
          U.$$('button', answers).forEach(function (choice) { choice.disabled = true; });
          var first = !found[entry.id];
          if (first) {
            found[entry.id] = 1;
            Store.save();
            App.syncSoon();
            report();
          }
          feedback.textContent = first ? '✓ Juist! +2 munten.' : '✓ Juist!';
          Snd.fx('good');
        });
        answers.appendChild(answer);
      });
      card.appendChild(answers);
      card.appendChild(feedback);
      list.appendChild(card);
    });
    room.appendChild(list);
  };

  function play(player, room, id) {
    var route = routes[id];
    var order = U.shuffle(cards);
    var index = 0;
    var earned = 0;

    function round() {
      U.clear(room);
      room.appendChild(h('header.sub-top', button('← Missies', function () { App.go('adventure'); App.syncSoon(); }), h('h2', route.title)));
      var bridge = h('div.mine-bridge.route-' + route.className, { 'aria-label': index + ' van 6 opdrachten klaar' });
      for (var i = 0; i < order.length; i++) bridge.appendChild(h('span' + (i < index ? '.laid' : ''), ''));
      room.appendChild(bridge);
      if (index >= order.length) {
        room.appendChild(h('h3', id === 'bridge' ? 'Je bent aan de overkant!' : id === 'gate' ? 'De poort is open!' : 'Je staat boven op de toren!'));
        room.appendChild(h('p', '+' + earned + ' munten · ' + Mine.balance(player) + ' gespaard'));
        room.appendChild(button('Naar de missies', function () { App.go('adventure'); }, 'primary'));
        App.syncSoon();
        return;
      }
      var correct = order[index];
      var mistake = false;
      var answered = false;
      var audio = function () { Snd.play(correct.audio); };
      room.appendChild(h('p', route.clue));
      if (id === 'gate') room.appendChild(h('p.route-hanzi.hz', { lang: 'zh-CN' }, correct.hz));
      else room.appendChild(button('🔊 Luister', audio, 'primary'));
      var options = h('div.mine-album');
      var feedback = h('p.mine-feedback', { role: 'status' });
      U.shuffle([correct].concat(U.shuffle(cards.filter(function (card) { return card !== correct; })).slice(0, route.choices - 1))).forEach(function (card) {
        var choice = h('button.mine-card', { type: 'button', onclick: function () {
          if (answered) return;
          if (card !== correct) {
            mistake = true;
            choice.disabled = true;
            Snd.fx('oops');
            feedback.textContent = id === 'gate' ? 'Kijk nog eens. Je mag opnieuw kiezen.' : 'Luister nog eens. Je mag opnieuw kiezen.';
            return;
          }
          answered = true;
          Mine.earn(player);
          earned += 1;
          data(player).trailDays[U.dayKey()] = 1;
          if (!mistake && id === 'bridge') {
            var practice = data(player).practice;
            if (!practice[card.id]) practice[card.id] = {};
            practice[card.id][U.dayKey()] = 1;
          }
          if (index + 1 === order.length) data(player).runs[id] = 1;
          Store.save();
          Snd.fx('good');
          feedback.textContent = '+1 munt · ' + card.hz + ' ' + card.py;
          bridge.children[index].classList.add('laid');
          index += 1;
          setTimeout(function () {
            if (feedback.parentNode === room && room.isConnected) round();
          }, 900);
        } }, id === 'tower' ? h('span.route-hanzi.hz', { lang: 'zh-CN' }, card.hz) :
          h('span.wardrobe-icon', { 'aria-hidden': 'true' }, symbols[card.id]),
          id === 'tower' ? null : h('span', card.word));
        options.appendChild(choice);
      });
      room.appendChild(options);
      room.appendChild(feedback);
      if (id !== 'gate') audio();
    }

    Snd.unlock();
    round();
  }

  window.Mine = Mine;
})();
