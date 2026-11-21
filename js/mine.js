/* Blokkenmijn: munten, kaarten en een luisterspel. */
(function () {
  'use strict';
  var h = U.h;
  var Mine = {};
  var price = 6;
  var cards = [
    { id: 'hout', name: 'Takbever', hz: '木', py: 'mù', word: 'hout', audio: 'mu-h.mp3', sky: '#f4ce8e', palette: ['#643c2c','#a66a46','#f4d198','#fff1ce'], art: ['..........','.11....11.','.12222221.','1222222221','1202222021','1223333221','.13300331.','..344443..','...1111...','..11..11..'] },
    { id: 'vuur', name: 'Vonkvos', hz: '火', py: 'huǒ', word: 'vuur', audio: 'huo-h.mp3', sky: '#ffcb9d', palette: ['#6d2532','#ec6939','#ffc34e','#fff0cc'], art: ['..........','1........1','12......21','123....321','1222222221','.12222221.','.13022031.','..134431..','....11....','..........'] },
    { id: 'water', name: 'Spatvis', hz: '水', py: 'shuǐ', word: 'water', audio: 'shui-h.mp3', sky: '#a5e9ef', palette: ['#174d7a','#2e98c6','#6be3ec','#fff4ac'], art: ['......4...','..332...4.','.322322...','32222221.1','3222222311','3230222321','3222222311','.3222221.1','..33331...','..........'] },
    { id: 'berg', name: 'Bergbok', hz: '山', py: 'shān', word: 'berg', audio: 'shan-h.mp3', sky: '#bdd2fa', palette: ['#31374f','#797d99','#dbe4ec','#98cba2'], art: ['.2......2.','.3......3.','.33....33.','..333333..','.23333332.','.23033032.','..333333..','...3113...','....33....','44......44'] },
    { id: 'zon', name: 'Zonnebij', hz: '日', py: 'rì', word: 'zon', audio: 'ri-h.mp3', sky: '#fff0ac', palette: ['#614514','#f5a72e','#ffe36b','#fff9e2'], art: ['.4......4.','444....444','.44333344.','..333333..','.33033033.','.33233233.','.11111111.','..222222..','...1111...','..........'] },
    { id: 'draak', name: 'Mijnendraak', hz: '龙', py: 'lóng', word: 'draak', audio: 'long-h.mp3', sky: '#c3edc4', palette: ['#28474a','#329878','#78d49c','#ffdb68'], art: ['.3......3.','.13333331.','1333333331','1303333031','1334444331','.14444441.','..112211..','2112222112','1224444221','..11..11..'] }
  ];

  function data(player) {
    if (!player.mine) player.mine = {};
    ['earned', 'spent', 'cards', 'practice'].forEach(function (key) {
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
    return Math.max(0, sum(wallet.earned) - sum(wallet.spent));
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
    room.appendChild(h('div.row', pack, button('Bouw de brug', function () { play(player, room); })));
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

  function play(player, room) {
    var order = U.shuffle(cards);
    var index = 0;
    var earned = 0;

    function round() {
      U.clear(room);
      room.appendChild(h('header.sub-top', button('← Mijn', function () { Snd.stop(); Mine.show(); App.syncSoon(); }), h('h2', 'Bouw de brug')));
      var bridge = h('div.mine-bridge', { 'aria-label': index + ' van 6 brugdelen gelegd' });
      for (var i = 0; i < order.length; i++) bridge.appendChild(h('span' + (i < index ? '.laid' : ''), ''));
      room.appendChild(bridge);
      if (index >= order.length) {
        room.appendChild(h('h3', 'Je bent aan de overkant!'));
        room.appendChild(h('p', '+' + earned + ' munten · ' + Mine.balance(player) + ' gespaard'));
        room.appendChild(button('Naar mijn kaarten', Mine.show, 'primary'));
        App.syncSoon();
        return;
      }
      var correct = order[index];
      var mistake = false;
      var answered = false;
      var audio = function () { Snd.play(correct.audio); };
      room.appendChild(h('p', 'Luister en kies de juiste tekening om een brugdeel te leggen.'));
      room.appendChild(button('🔊 Luister', audio, 'primary'));
      var options = h('div.mine-album');
      var feedback = h('p.mine-feedback', { role: 'status' });
      U.shuffle([correct].concat(U.shuffle(cards.filter(function (card) { return card !== correct; })).slice(0, 2))).forEach(function (card) {
        var choice = h('button.mine-card', { type: 'button', onclick: function () {
          if (answered) return;
          if (card !== correct) {
            mistake = true;
            choice.disabled = true;
            Snd.fx('oops');
            feedback.textContent = 'Luister nog eens. Je mag opnieuw kiezen.';
            return;
          }
          answered = true;
          Mine.earn(player);
          earned += 1;
          if (!mistake) {
            var practice = data(player).practice;
            if (!practice[card.id]) practice[card.id] = {};
            practice[card.id][U.dayKey()] = 1;
          }
          Store.save();
          Snd.fx('good');
          feedback.textContent = '+1 munt · ' + card.hz + ' ' + card.py;
          bridge.children[index].classList.add('laid');
          index += 1;
          setTimeout(function () {
            if (feedback.parentNode === room && room.isConnected) round();
          }, 900);
        } }, picture(card), h('span', card.word));
        options.appendChild(choice);
      });
      room.appendChild(options);
      room.appendChild(feedback);
      audio();
    }

    Snd.unlock();
    round();
  }

  window.Mine = Mine;
})();
