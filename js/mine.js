/* Drakenexpeditie: missies, drakenmunten en verzamelingen. */
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
    { id: 'cloudboots', slot: 'feet', name: 'Wolkenlaarzen', price: 18, mission: 'days' },
    { id: 'starcrown', slot: 'head', name: 'Sterrenkroon', icon: '🌟', price: 24, mission: 'tower' },
    { id: 'skycape', slot: 'body', name: 'Nachtcape', icon: '🌙', price: 28, mission: 'master' }
  ];
  var missions = [
    { id: 'bridge', name: 'De oversteek', icon: '🌉', hint: 'Luister naar zes woorden om de brug te bouwen.', target: 1, reward: 6, route: 'bridge',
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
    { id: 'hout', name: 'Takbever', hz: '木', py: 'mù', word: 'hout', item: 'mu4', sky: '#f4ce8e', palette: ['#643c2c','#a66a46','#f4d198','#fff1ce'], art: ['..........','.11....11.','.12222221.','1222222221','1202222021','1223333221','.13300331.','..344443..','...1111...','..11..11..'] },
    { id: 'vuur', name: 'Vonkvos', hz: '火', py: 'huǒ', word: 'vuur', item: 'huo', sky: '#ffcb9d', palette: ['#6d2532','#ec6939','#ffc34e','#fff0cc'], art: ['..........','1........1','12......21','123....321','1222222221','.12222221.','.13022031.','..134431..','....11....','..........'] },
    { id: 'water', name: 'Spatvis', hz: '水', py: 'shuǐ', word: 'water', item: 'shui', sky: '#a5e9ef', palette: ['#174d7a','#2e98c6','#6be3ec','#fff4ac'], art: ['......4...','..332...4.','.322322...','32222221.1','3222222311','3230222321','3222222311','.3222221.1','..33331...','..........'] },
    { id: 'berg', name: 'Bergbok', hz: '山', py: 'shān', word: 'berg', item: 'shan', sky: '#bdd2fa', palette: ['#31374f','#797d99','#dbe4ec','#98cba2'], art: ['.2......2.','.3......3.','.33....33.','..333333..','.23333332.','.23033032.','..333333..','...3113...','....33....','44......44'] },
    { id: 'zon', name: 'Zonnebij', hz: '日', py: 'rì', word: 'zon', item: 'ri', sky: '#fff0ac', palette: ['#614514','#f5a72e','#ffe36b','#fff9e2'], art: ['.4......4.','444....444','.44333344.','..333333..','.33033033.','.33233233.','.11111111.','..222222..','...1111...','..........'] },
    { id: 'draak', name: 'Mijnendraak', hz: '龙', py: 'lóng', word: 'draak', item: 'long', sky: '#c3edc4', palette: ['#28474a','#329878','#78d49c','#ffdb68'], art: ['.3......3.','.13333331.','1333333331','1303333031','1334444331','.14444441.','..112211..','2112222112','1224444221','..11..11..'] }
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
    ['earned', 'spent', 'cards', 'practice', 'gear', 'missions', 'runs', 'trailDays', 'discoveries', 'bonuses', 'purchases'].forEach(function (key) {
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
    return Math.max(0, sum(wallet.earned) + bonus + explorer * 2 + sum(wallet.bonuses) - sum(wallet.spent) - sum(wallet.purchases));
  };

  function increment(map, amount) {
    var device = Store.device().id;
    map[device] = (map[device] || 0) + amount;
  }

  Mine.earn = function (player) { increment(data(player).earned, 1); };

  Mine.bonus = function (player, key, amount) {
    var bonuses = data(player).bonuses;
    if (bonuses[key]) return 0;
    bonuses[key] = amount;
    return amount;
  };

  Mine.claimMissions = function (player) {
    var claimed = data(player).missions;
    var earned = 0;
    missions.forEach(function (mission) {
      if (claimed[mission.id] || mission.progress(player) < mission.target) return;
      claimed[mission.id] = 1;
      earned += mission.reward;
    });
    if (earned) { Store.save(); App.syncSoon(); }
    return earned;
  };

  Mine.recordListening = function (player, itemId) {
    var card = cards.find(function (entry) { return entry.item === itemId; });
    if (!card) return;
    var practice = data(player).practice;
    if (!practice[card.id]) practice[card.id] = {};
    practice[card.id][U.dayKey()] = 1;
  };

  function collectCard(player, card) {
    var wallet = data(player);
    if (wallet.cards[card.id] || Mine.balance(player) < price) return false;
    wallet.purchases['card:' + card.id] = price;
    wallet.cards[card.id] = Date.now();
    Store.save();
    App.syncSoon();
    return true;
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

  function cardDays(player, card) {
    return Math.min(3, Object.keys(data(player).practice[card.id] || {}).length);
  }

  function reveal(player, card, message) {
    var body = h('div.mine-reveal', h('h2', message), picture(card), h('h3', card.name),
      h('p', h('span.hz', { lang: 'zh-CN' }, card.hz), ' · ', card.py, ' · ', card.word),
      button('🔊 Luister', function () { Snd.play(Snd.nextVoice(CONTENT.items[card.item])); }));
    var days = cardDays(player, card);
    body.appendChild(h('p', days === 3 ? '✦ Gouden kaart' : days + ' van 3 oefendagen voor goud'));
    App.modal(body);
  }

  Mine.collectionNav = function (view) {
    return h('nav.row.collection-nav', { 'aria-label': 'Verzameling' }, [['mine', 'Kaarten'], ['album', 'Stickers']].map(function (entry) {
      var tab = button(entry[1], function () { App.go(entry[0]); }, view === entry[0] ? 'primary' : 'ghost');
      if (view === entry[0]) tab.setAttribute('aria-current', 'page');
      return tab;
    }));
  };

  Mine.show = function () {
    var player = Store.current();
    if (!player) { App.go('chooser'); return; }
    var room = h('section.mine-room');
    U.clear(U.$('#app')).appendChild(room);
    room.appendChild(h('header.sub-top', button('← Kamp', function () { App.go('adventure'); }), h('h2', 'Verzameling')));
    room.appendChild(Mine.collectionNav('mine'));
    var balance = Mine.balance(player);
    var ownedCount = count(player);
    room.appendChild(h('p.mine-balance', balance + ' 🪙 · ' + ownedCount + ' van ' + cards.length + ' kaarten'));
    room.appendChild(h('p', ownedCount === cards.length ? 'Je hebt alle kaarten. Maak ze goud door te oefenen.' :
      balance >= price ? 'Kies een kaart voor ' + price + ' drakenmunten.' : 'Nog ' + (price - balance) + ' drakenmunten voor je volgende kaart.'));
    var album = h('div.mine-album');
    cards.forEach(function (card) {
      var owned = !!data(player).cards[card.id];
      if (!owned) {
        album.appendChild(h('button.mine-card', {
          type: 'button', disabled: balance < price, 'aria-label': 'Verzamel ' + card.name + ' voor ' + price + ' drakenmunten',
          onclick: function () {
            if (!collectCard(player, card)) return;
            Mine.show();
            Snd.fx('done');
            reveal(player, card, 'Nieuwe kaart!');
          }
        }, picture(card), h('strong', card.name), h('span', price + ' 🪙')));
        return;
      }
      album.appendChild(h('button.mine-card' + (cardDays(player, card) === 3 ? '.mine-gold' : ''),
        { type: 'button', onclick: function () { reveal(player, card, 'Jouw kaart'); } },
        picture(card), h('strong', card.name), h('span.hz', { lang: 'zh-CN' }, card.hz)));
    });
    room.appendChild(h('h3', 'Mijn kaarten'));
    room.appendChild(album);
    room.appendChild(h('p.small', 'Maak een kaart goud door het woord op drie verschillende dagen meteen te herkennen in een luisteroefening of in het brugspel.'));
    room.appendChild(button('Speel het brugspel', function () { App.go('adventure', { route: 'bridge' }); }));
  };

  Mine.wardrobe = function () {
    var player = Store.current();
    if (!player) { App.go('chooser'); return; }
    var wallet = data(player);
    var balance = Mine.balance(player);
    var room = h('section.mine-room');
    U.clear(U.$('#app')).appendChild(room);
    room.appendChild(h('header.sub-top', button('← Kamp', function () { App.go('adventure'); }), h('h2', 'Drakengarderobe')));
    room.appendChild(h('p.mine-balance', balance + ' 🪙'));
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
          wallet.purchases['gear:' + item.id] = item.price;
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
      var icon = item.id === 'cloudboots'
        ? h('span.wardrobe-icon', { 'aria-hidden': 'true', html: Dragon.cloudBootsIcon() })
        : h('span.wardrobe-icon', { 'aria-hidden': 'true' }, item.icon);
      list.appendChild(h('div.mine-card', icon,
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
    var earned = Mine.claimMissions(player);
    if (earned) App.toast('Missie volbracht! +' + earned + ' drakenmunten');
    room.appendChild(h('header.sub-top', button('← Leerpad', function () { App.go('home'); App.syncSoon(); }), h('h2', 'Expeditiekamp')));
    var claimed = missions.filter(function (mission) { return !!wallet.missions[mission.id]; }).length;
    var rank = claimed === missions.length ? 'Wolkenwachter' : claimed >= 3 ? 'Drakenridder' : 'Ontdekker';
    var next = missions.find(function (mission) { return !wallet.missions[mission.id]; });
    room.appendChild(h('div.adventure-banner',
      h('div.wardrobe-dragon', { html: Dragon.forPlayer(player, 'happy', { stage: Math.max(1, Store.stage(player)) }) }),
      h('div', h('strong', rank), h('p', claimed + ' van ' + missions.length + ' missies · ' + Mine.balance(player) + ' 🪙'),
        h('progress', { value: claimed, max: missions.length, 'aria-label': 'Voltooide missies' }))));
    room.appendChild(h('p', 'Met sterren groeit je draak. Met drakenmunten kies je kaarten en kleren.'));
    var places = h('div.camp-places');
    [
      ['mine', '🃏 Verzameling', count(player) + '/' + cards.length + ' kaarten · ' + Object.keys(player.stickers).length + '/' + CONTENT.stickers.length + ' stickers'],
      ['wardrobe', '👑 Drakengarderobe', 'Kies kleren voor je draak'],
      ['china', '🧭 Ontdek China', 'Verhalen en ontdekkingen']
    ].forEach(function (entry) {
      places.appendChild(button([h('strong', entry[1]), h('span.small', entry[2])], function () { App.go(entry[0]); }));
    });
    room.appendChild(places);
    if (next) room.appendChild(h('h3', 'Volgende missie'));
    function missionCard(mission) {
      var amount = Math.min(mission.target, mission.progress(player));
      var done = !!wallet.missions[mission.id];
      var card = h('section.adventure-card', h('h3', mission.icon + ' ' + mission.name), h('p', mission.hint),
        h('progress', { value: done ? mission.target : amount, max: mission.target, 'aria-label': mission.name }),
        h('span.small', (done ? '✓ Voltooid' : amount + ' / ' + mission.target) + ' · ' + mission.reward + ' 🪙'));
      if (!done || mission.route !== 'home') {
        card.appendChild(button(mission.route === 'home' ? 'Naar het leerpad' : done ? 'Speel opnieuw' : 'Start missie', function () {
          if (mission.route === 'home') App.go('home');
          else App.go('adventure', { route: mission.route });
        }, mission === next ? 'primary' : 'ghost'));
      }
      return card;
    }
    if (next) room.appendChild(missionCard(next));
    var list = h('div.adventure-list', missions.filter(function (mission) { return mission !== next; }).map(missionCard));
    room.appendChild(h('details.box.camp-missions', h('summary', next ? 'Alle andere missies' : 'Alle missies'), list));
    var training = h('details.box', h('summary', 'Beluister de zes woorden'));
    var previews = h('div.adventure-words');
    cards.forEach(function (card) {
      previews.appendChild(button(symbols[card.id] + ' ' + card.word + ' · ' + card.hz,
        function () { Snd.play(Snd.nextVoice(CONTENT.items[card.item])); }));
    });
    training.appendChild(previews);
    room.appendChild(training);
  };

  Mine.china = function () {
    var player = Store.current();
    if (!player) { App.go('chooser'); return; }
    var found = data(player).discoveries;
    var room = h('section.mine-room.adventure-room');
    U.clear(U.$('#app')).appendChild(room);
    room.appendChild(h('header.sub-top', button('← Kamp', function () { App.go('adventure'); App.syncSoon(); }), h('h2', 'Ontdek China')));
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
    var missionCoins = 0;

    function round() {
      U.clear(room);
      room.appendChild(h('header.sub-top', button('← Kamp', function () { App.go('adventure'); App.syncSoon(); }), h('h2', route.title)));
      var bridge = h('div.mine-bridge.route-' + route.className, { 'aria-label': index + ' van 6 opdrachten klaar' });
      for (var i = 0; i < order.length; i++) bridge.appendChild(h('span' + (i < index ? '.laid' : ''), ''));
      room.appendChild(bridge);
      if (index >= order.length) {
        room.appendChild(h('h3', id === 'bridge' ? 'Je bent aan de overkant!' : id === 'gate' ? 'De poort is open!' : 'Je staat boven op de toren!'));
        room.appendChild(h('p', '+' + earned + ' drakenmunten' + (missionCoins ? ' · +' + missionCoins + ' voor missies' : '')));
        room.appendChild(button('Naar het kamp', function () { App.go('adventure'); }, 'primary'));
        App.syncSoon();
        return;
      }
      var correct = order[index];
      var mistake = false;
      var answered = false;
      var file = id === 'gate' ? null : Snd.nextVoice(CONTENT.items[correct.item]);
      var audio = function () { Snd.play(file); };
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
          if (!mistake && id === 'bridge') Mine.recordListening(player, card.item);
          if (index + 1 === order.length) {
            data(player).runs[id] = 1;
            missionCoins = Mine.claimMissions(player);
          }
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
