/* Drakenexpeditie: missies, drakenmunten en verzamelingen. */
(function () {
  'use strict';
  var h = U.h;
  var Mine = {};
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
    tower: { title: 'Beklim de wolkentoren', clue: 'Luister en tik op het juiste teken.', choices: 4, className: 'tower' },
    practice: { title: 'Luisterproef', clue: 'Luister en kies de kaart die bij het woord hoort.', choices: 3, className: 'bridge' }
  };
  var symbols = { hout: '🪵', vuur: '🔥', water: '💧', berg: '⛰️', zon: '☀️', draak: '🐉' };
  var baseCards = [
    { id: 'hout', name: 'Takbever', hz: '木', py: 'mù', word: 'hout', item: 'mu4', sky: '#f4ce8e', palette: ['#643c2c','#a66a46','#f4d198','#fff1ce'], art: ['..........','.11....11.','.12222221.','1222222221','1202222021','1223333221','.13300331.','..344443..','...1111...','..11..11..'] },
    { id: 'vuur', name: 'Vonkvos', hz: '火', py: 'huǒ', word: 'vuur', item: 'huo', sky: '#ffcb9d', palette: ['#6d2532','#ec6939','#ffc34e','#fff0cc'], art: ['..........','1........1','12......21','123....321','1222222221','.12222221.','.13022031.','..134431..','....11....','..........'] },
    { id: 'water', name: 'Spatvis', hz: '水', py: 'shuǐ', word: 'water', item: 'shui', sky: '#a5e9ef', palette: ['#174d7a','#2e98c6','#6be3ec','#fff4ac'], art: ['......4...','..332...4.','.322322...','32222221.1','3222222311','3230222321','3222222311','.3222221.1','..33331...','..........'] },
    { id: 'berg', name: 'Bergbok', hz: '山', py: 'shān', word: 'berg', item: 'shan', sky: '#bdd2fa', palette: ['#31374f','#797d99','#dbe4ec','#98cba2'], art: ['.2......2.','.3......3.','.33....33.','..333333..','.23333332.','.23033032.','..333333..','...3113...','....33....','44......44'] },
    { id: 'zon', name: 'Zonnebij', hz: '日', py: 'rì', word: 'zon', item: 'ri', sky: '#fff0ac', palette: ['#614514','#f5a72e','#ffe36b','#fff9e2'], art: ['.4......4.','444....444','.44333344.','..333333..','.33033033.','.33233233.','.11111111.','..222222..','...1111...','..........'] },
    { id: 'draak', name: 'Mijnendraak', hz: '龙', py: 'lóng', word: 'draak', item: 'long', sky: '#c3edc4', palette: ['#28474a','#329878','#78d49c','#ffdb68'], art: ['.3......3.','.13333331.','1333333331','1303333031','1334444331','.14444441.','..112211..','2112222112','1224444221','..11..11..'] }
  ];

  function creature(id, name, item, sky, palette, art) {
    return { id: id, name: name, item: item, sky: sky, palette: palette, art: art.replace(/\s/g, '').split('/') };
  }
  var animalCards = [
    creature('mistkat', 'Mistkat', 'mao', '#dce6fc', ['#34436b','#9eacd0','#eaf2ff','#ffe5a4'], '.......... / .1......1. / .21....12. / .22222222. / 1222222221 / 1203333021 / .33444433. / .03300330. / ..332233.. / ...1111...'),
    creature('rotswachter', 'Rotswachter', 'gou', '#e3dacc', ['#5b3527','#b16b46','#f9c98a','#fff3d8'], '.......... / ..22..22.. / .23333332. / 1133333311 / 1303333031 / 1334444331 / .34400443. / ..333333.. / .22222222. / .11....11.'),
    creature('stormveertje', 'Stormveertje', 'niao', '#c5e6f6', ['#234f76','#2a81b7','#9de3fa','#ffcb54'], '.......... / .....333.. / ....33332. / ...3320344 / .22223334. / 22222333.. / .212333... / ..1222.... / ....44.... / ...44.....'),
    creature('bamboepanda', 'Bamboepanda', 'xiongmao', '#d6efc8', ['#343747','#fff9e9','#86ba66','#dccdba'], '.......... / .11....11. / .12222221. / 1222222221 / 1211221121 / 1210220121 / .22211222. / ..222222.. / 33.1111... / .333..3...'),
    creature('maanstreper', 'Maanstreper', 'laohu', '#fce4a6', ['#46302d','#df7f32','#ffd074','#ffefbd'], '.......... / .11....11. / .23233232. / 1233113321 / 1133333311 / 1304444031 / .34411443. / .13444431. / ..233332.. / ...1111...'),
    creature('mosdino', 'Mosdino', 'konglong', '#dce9b9', ['#35543b','#52835e','#9cd17d','#ffda74'], '.....444.. / ....33334. / ....33033. / ....33333. / ....33222. / .4..33.... / 3343332... / .333332... / ..32232... / ..22.22...')
  ];
  var chinaCards = [
    creature('rivierwacht', 'Rivierwacht', 'zhongguo', '#cdeef4', ['#1b4f78','#3783a3','#b4e9ef','#ffe1a2'], '.......... / ....44.... / ...4444... / ..444444.. / .....2.... / ..11.2.1.. / ..111111.. / 3321111233 / 2233332223 / 3332223333'),
    creature('muurwachter', 'Muurwachter', null, '#f1ddba', ['#594b4b','#a08b78','#e2c4a0','#6f8051'], '.......... / ..3.3.3... / ..33333... / ..32323... / 3333333333 / 3232323232 / 2222222222 / 4244444244 / 4444444444 / 4444444444'),
    creature('deegmeester', 'Deegmeester', 'jiaozi', '#ffe9bd', ['#885745','#e6b479','#fff0cc','#de8352'], '.......... / ....3..... / ...343.... / ..34343... / .3434343.. / .33333333. / .33033003. / .33300333. / ..333333.. / ...2222...')
  ];
  chinaCards[0].discovery = 'river';
  chinaCards[1].discovery = 'wall';
  chinaCards[2].discovery = 'festival';

  var sets = [
    { id: 'elements', title: 'De zes elementen', cards: baseCards, price: 6, gold: 3,
      trophy: creature('jadewachter', 'Jadewachter', 'senlin', '#dbedc8', ['#285649','#52937a','#9ce0b1','#ffe5a2'], '...4..4.../...4334.../..333333../.13333331./.13033031./.13344331./..344443../...3333.../.22333322./...2222...') },
    { id: 'animals', title: 'Wilde vrienden', cards: animalCards, price: 8, gold: 3,
      trophy: creature('maanfeniks', 'Maanfeniks', 'yue', '#d8dcf8', ['#414674','#8675b5','#cbbdf6','#ffdb71'], '....44..../...4444.../3...44...3/.33.33.33./.23343332./..334433../...3443.../..334433../..3.44.3../...3..3...') },
    { id: 'china', title: 'Schatten van China', cards: chinaCards, gold: 2,
      trophy: creature('goudlantaarn', 'Goudlantaarn', 'denglong', '#f7dfb9', ['#772d33','#cf4d45','#f48057','#ffdf80'], '....11..../...1441.../..133331../.13433431./.13433431./.13433431./..133331../...1441.../....44..../...4..4...') }
  ];
  var cards = [].concat.apply([], sets.map(function (set) { return set.cards.concat(set.trophy); }));

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

  function setProgress(player, set) {
    var wallet = data(player);
    var owned = set.cards.filter(function (card) {
      return card.discovery ? !!wallet.discoveries[card.discovery] : !!wallet.cards[card.id];
    });
    var gold = owned.filter(function (card) { return cardDays(player, card) === 3; }).length;
    return { owned: owned, gold: gold, complete: owned.length === set.cards.length && gold >= set.gold };
  }

  function count(player) {
    return sets.reduce(function (total, set) {
      var progress = setProgress(player, set);
      return total + progress.owned.length + Number(progress.complete);
    }, 0);
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
    if (card) recordCardDay(player, card);
  };

  function recordCardDay(player, card) {
    var practice = data(player).practice;
    if (!practice[card.id]) practice[card.id] = {};
    practice[card.id][U.dayKey()] = 1;
  }

  function collectCard(player, set, card) {
    var wallet = data(player);
    var cost = set.price;
    if (!cost || card === set.trophy || wallet.cards[card.id] ||
      (set.id === 'animals' && !wallet.runs.bridge) || Mine.balance(player) < cost) return false;
    wallet.purchases['card:' + card.id] = cost;
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

  function cardWord(card) {
    if (!card.item) {
      var entry = discoveries.find(function (discovery) { return discovery.id === card.discovery; });
      return { hz: entry.word, py: entry.py, nl: entry.nl };
    }
    var it = CONTENT.items[card.item];
    return { hz: card.hz || it.hz, py: card.py || it.py, nl: card.word || it.nl };
  }

  function cardAudio(card) {
    if (card.item) return Snd.nextVoice(CONTENT.items[card.item]);
    return discoveries.find(function (entry) { return entry.id === card.discovery; }).audio;
  }

  function reveal(player, card, message) {
    var word = cardWord(card);
    var body = h('div.mine-reveal', h('h2', message), picture(card), h('h3', card.name),
      h('p', h('span.hz', { lang: 'zh-CN' }, word.hz), ' · ', word.py, ' · ', word.nl),
      button('🔊 Luister', function () { Snd.play(cardAudio(card)); }));
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

  Mine.show = function (opts) {
    var player = Store.current();
    if (!player) { App.go('chooser'); return; }
    var room = h('section.mine-room');
    U.clear(U.$('#app')).appendChild(room);
    room.appendChild(h('header.sub-top', button('← Kamp', function () { App.go('adventure'); }), h('h2', 'Verzameling')));
    room.appendChild(Mine.collectionNav('mine'));
    var balance = Mine.balance(player);
    if (opts && opts.set) Mine.set = opts.set;
    var set = sets.find(function (entry) { return entry.id === Mine.set; }) || sets[0];
    var progress = setProgress(player, set);
    var bridge = !!data(player).runs.bridge;
    room.appendChild(h('p.mine-balance', balance + ' 🪙 · ' + count(player) + ' van ' + cards.length + ' kaarten'));
    room.appendChild(h('nav.row.collection-sets', { 'aria-label': 'Kaartreeksen' }, sets.map(function (entry) {
      var select = button(entry.title, function () { Mine.set = entry.id; Mine.show(); }, entry === set ? 'primary' : 'ghost');
      select.setAttribute('aria-pressed', String(entry === set));
      return select;
    })));
    var cost = set.price;
    var summary = set.id === 'china' ? 'Los de vragen bij Ontdek China op om de drie kaarten te vinden.' :
      set.id === 'animals' && !bridge ? 'Bouw eerst de brug om Wilde vrienden vrij te spelen.' : 'Kies een kaart voor ' + cost + ' drakenmunten.';
    room.appendChild(h('h3', set.title + ' · ' + progress.owned.length + '/' + set.cards.length));
    room.appendChild(h('p', progress.owned.length === set.cards.length ? 'Je hebt alle kaarten van deze reeks.' : summary));
    if (set.id === 'china' || set.id === 'animals' && !bridge) room.appendChild(button(set.id === 'china' ? 'Naar Ontdek China' : 'Bouw de brug', function () {
      if (set.id === 'china') App.go('china');
      else App.go('adventure', { route: 'bridge' });
    }));
    if (set.id !== 'animals' || bridge) room.appendChild(button('Luisterproef spelen', function () { App.go('adventure', { route: 'practice', set: set.id }); }, 'primary'));
    var album = h('div.mine-album');
    set.cards.forEach(function (card) {
      if (progress.owned.indexOf(card) < 0) {
        var locked = card.discovery || set.id === 'animals' && !bridge;
        if (locked) {
          album.appendChild(h('div.mine-card', picture(card), h('strong', card.name),
            h('span', card.discovery ? 'Te vinden in China' : 'Na het brugspel')));
          return;
        }
        album.appendChild(h('button.mine-card', {
          type: 'button', disabled: balance < cost, 'aria-label': 'Verzamel ' + card.name + ' voor ' + cost + ' drakenmunten',
          onclick: function () {
            if (!collectCard(player, set, card)) return;
            Mine.show();
            Snd.fx('done');
            reveal(player, card, 'Nieuwe kaart!');
          }
        }, picture(card), h('strong', card.name), h('span', cost + ' 🪙')));
        return;
      }
      album.appendChild(h('button.mine-card' + (cardDays(player, card) === 3 ? '.mine-gold' : ''),
        { type: 'button', onclick: function () { reveal(player, card, 'Jouw kaart'); } },
        picture(card), h('strong', card.name), h('span.hz', { lang: 'zh-CN' }, cardWord(card).hz),
        h('span.small', cardDays(player, card) === 3 ? '✦ Goud' : cardDays(player, card) + '/3 dagen')));
    });
    room.appendChild(album);
    var trophy = h('section.adventure-card.series-trophy' + (progress.complete ? '.mine-gold' : ''),
      h('h3', progress.complete ? '✦ ' + set.trophy.name : '🔒 Geheime kaart'));
    if (progress.complete) {
      trophy.appendChild(picture(set.trophy));
      trophy.appendChild(button('Bekijk je geheime kaart', function () { reveal(player, set.trophy, 'Geheime kaart'); }, 'primary'));
    } else trophy.appendChild(h('p', 'Verzamel de hele reeks en maak ' + set.gold + ' kaarten goud.',
      h('span.small', ' · ' + Math.min(progress.gold, set.gold) + '/' + set.gold + ' goud')));
    room.appendChild(trophy);
    room.appendChild(h('p.small', 'Een kaart wordt goud als je haar woord op drie verschillende dagen meteen herkent.'));
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
      play(player, room, opts.route, opts.set);
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
    baseCards.forEach(function (card) {
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
    var room = h('section.mine-room.adventure-room.china-room');
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
      var card = h('details.adventure-card', { name: 'china-discovery' },
        h('summary', entry.icon + ' ' + entry.title),
        h('p.small', entry.subject),
        h('p', entry.scene), h('p', entry.fact));
      var word = h('p', h('span.hz', { lang: 'zh-CN' }, entry.word), ' · ' + entry.py + ' · ' + entry.nl);
      card.appendChild(h('div.china-word', word, button('🔊 Luister', function () { Snd.play(entry.audio); })));
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
          var foundCard = chinaCards.find(function (card) { return card.discovery === entry.id; });
          feedback.textContent = first ? '✓ Juist! +2 munten en de kaart ' + foundCard.name + '.' : '✓ Juist!';
          if (first) card.appendChild(button('Bekijk je kaarten', function () { App.go('mine', { set: 'china' }); }));
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

  function play(player, room, id, setId) {
    room.classList.add('mine-round');
    var route = routes[id];
    var practice = id === 'practice';
    var set = sets.find(function (entry) { return entry.id === setId; }) || sets[0];
    var before = setProgress(player, set);
    var deck = practice ? set.cards.concat(before.complete ? [set.trophy] : []) : baseCards;
    var order = U.shuffle(deck);
    var index = 0;
    var earned = 0;
    var missionCoins = 0;
    var firstTry = 0;
    var newGold = 0;

    function back() {
      if (practice) App.go('mine', { set: set.id });
      else App.go('adventure');
      App.syncSoon();
    }

    function round() {
      U.clear(room);
      room.appendChild(h('header.sub-top', button(practice ? '← Kaarten' : '← Kamp', back), h('h2', route.title)));
      var bridge = h('div.mine-bridge.route-' + route.className, { 'aria-label': index + ' van ' + order.length + ' opdrachten klaar',
        style: { 'grid-template-columns': 'repeat(' + order.length + ', minmax(0, 1fr))' } });
      for (var i = 0; i < order.length; i++) bridge.appendChild(h('span' + (i < index ? '.laid' : ''), ''));
      var body = h('div.mine-round-body', { tabindex: '0', 'aria-label': 'Oefening' }, bridge);
      room.appendChild(body);
      if (index >= order.length) {
        body.appendChild(h('h3', practice ? 'Luisterproef klaar!' : id === 'bridge' ? 'Je bent aan de overkant!' :
          id === 'gate' ? 'De poort is open!' : 'Je staat boven op de toren!'));
        body.appendChild(h('p', practice ? firstTry + ' van ' + order.length + ' meteen goed' :
          '+' + earned + ' drakenmunten' + (missionCoins ? ' · +' + missionCoins + ' voor missies' : '')));
        if (newGold) body.appendChild(h('p.mine-reward', newGold === 1 ? '✦ Eén kaart werd goud!' : '✦ ' + newGold + ' kaarten werden goud!'));
        if (practice && !before.complete && setProgress(player, set).complete) body.appendChild(h('p.mine-reward', '✦ Je hebt de geheime kaart vrijgespeeld!'));
        room.appendChild(h('div.mine-round-footer', button(practice ? 'Naar mijn kaarten' : 'Naar het kamp', back, 'primary')));
        App.syncSoon();
        return;
      }
      var correct = order[index];
      var mistake = false;
      var answered = false;
      var file = id === 'gate' ? null : cardAudio(correct);
      var audio = function () { Snd.play(file); };
      body.appendChild(h('p', route.clue));
      if (id === 'gate') body.appendChild(h('p.route-hanzi.hz', { lang: 'zh-CN' }, correct.hz));
      else body.appendChild(button('🔊 Luister', audio, 'primary'));
      var options = h('div.mine-album');
      var feedback = h('p.mine-feedback.mine-round-footer', { role: 'status' });
      U.shuffle([correct].concat(U.shuffle(deck.filter(function (card) { return card !== correct; })).slice(0, route.choices - 1))).forEach(function (card) {
        var word = cardWord(card);
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
          if (!practice) {
            Mine.earn(player);
            earned += 1;
            data(player).trailDays[U.dayKey()] = 1;
          }
          if (!mistake && (practice || id === 'bridge')) {
            firstTry += 1;
            var days = cardDays(player, card);
            recordCardDay(player, card);
            if (days === 2 && cardDays(player, card) === 3 && (before.owned.indexOf(card) >= 0 || card === set.trophy)) newGold += 1;
          }
          if (!practice && index + 1 === order.length) {
            data(player).runs[id] = 1;
            missionCoins = Mine.claimMissions(player);
          }
          Store.save();
          Snd.fx('good');
          feedback.textContent = (practice ? (mistake ? '✓ Gevonden' : '✓ Meteen goed') : '+1 munt') + ' · ' + word.hz + ' ' + word.py;
          bridge.children[index].classList.add('laid');
          index += 1;
          setTimeout(function () {
            if (feedback.parentNode === room && room.isConnected) round();
          }, 900);
        } }, practice ? picture(card) : id === 'tower' ? h('span.route-hanzi.hz', { lang: 'zh-CN' }, word.hz) :
          h('span.wardrobe-icon', { 'aria-hidden': 'true' }, symbols[card.id]),
          id === 'tower' ? null : h('span', word.nl));
        options.appendChild(choice);
      });
      body.appendChild(options);
      room.appendChild(feedback);
      if (id !== 'gate') audio();
    }

    Snd.unlock();
    round();
  }

  window.Mine = Mine;
})();
