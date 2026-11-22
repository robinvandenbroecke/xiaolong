/* Functionele taalmissies. Leeftijd past de opdracht aan, de voortgang opent het niveau. */
(function () {
  'use strict';
  var h = U.h;
  var Growth = {};
  var lessons = {};
  GROWTH_CONTENT.forEach(function (chapter) {
    var path = chapter.lessons.map(function (lesson) {
      lessons[lesson.id] = lesson;
      return { id: lesson.id, kind: 'groei', title: lesson.title, aim: lesson.aim, level: chapter.level };
    });
    CONTENT.units.push({ id: 'groei-' + chapter.level.toLowerCase(), zh: chapter.zh, nl: chapter.level + ' · ' + chapter.title,
      py: chapter.py, color: chapter.color, lessons: path, items: [] });
  });

  Growth.ageBand = function (player, year) {
    var born = player.set.growthBirth;
    var age = (year || new Date().getFullYear()) - born;
    if (!born || age < 0) return 1;
    return age <= 8 ? 0 : age <= 11 ? 1 : 2;
  };

  function evidence(player, id) {
    return (player.mine && player.mine.growth && player.mine.growth[id]) || {};
  }

  Growth.record = function (player, id, passed, production, day) {
    // Dit geneste blok blijft ook behouden bij synchronisatie met oudere clients.
    player.mine = player.mine || {};
    var growth = player.mine.growth = player.mine.growth || {};
    var state = growth[id] = growth[id] || {};
    var days = state.days = state.days || {};
    days[day] = Math.max(days[day] || 0, passed ? 2 : 1);
    if (production) {
      var attempts = state[production] = state[production] || {};
      attempts[day] = 1;
    }
  };

  function dueOn(player, id) {
    var days = evidence(player, id).days || {};
    var dates = Object.keys(days);
    if (!dates.length) return Infinity;
    var latest = Math.max.apply(null, dates.map(Number));
    if (days[latest] !== 2) return latest + 1;
    var success = dates.filter(function (day) { return days[day] === 2; }).length;
    return latest + [0, 1, 3, 7, 14, 30][Math.min(5, success)];
  }

  Growth.nextReview = function (player, day) {
    return Store.allNodes().filter(function (node) {
      return node.lesson.kind === 'groei' && Store.nodeDone(player, node.lesson.id) && dueOn(player, node.lesson.id) <= day;
    }).sort(function (a, b) { return dueOn(player, a.lesson.id) - dueOn(player, b.lesson.id); })[0];
  };

  function button(text, click, style) {
    return h('button.btn.' + (style || 'ghost'), { type: 'button', onclick: click }, text);
  }

  function normalizeReply(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z\u3400-\u9fff]/g, '');
  }

  function openConversation(card, controls, lesson, player, next) {
    var opening = GROWTH_OPENINGS[lesson.id];
    var model = opening[2].join('');
    var accepted = [model, opening[3]].concat(opening[4]).map(normalizeReply);
    var feedback = h('p.growth-feedback', { role: 'status' });
    var done = false;
    var finish = button('Ik heb het gezegd', finishReply, 'primary');
    function finishReply() {
      if (done || !card.isConnected) return;
      done = true;
      next();
    }
    card.appendChild(h('h3', 'Jij mag beginnen'));
    card.appendChild(h('p', opening[0]));
    card.appendChild(h('p.small', 'Antwoord hardop in het Chinees.'));
    if (player.set.speak && navigator.onLine !== false && Voice.hasASR()) {
      var mic = button('🎙 Spreek in · online', function () {
        if (done || mic.disabled) return;
        Snd.stop();
        mic.disabled = true;
        finish.disabled = true;
        feedback.textContent = 'Ik luister…';
        Voice.listen().then(function (replies) {
          if (!card.isConnected || done) return;
          if (replies.some(function (reply) { return accepted.indexOf(normalizeReply(reply)) >= 0; })) {
            feedback.textContent = '✓ Je reactie is herkend.';
            finish.textContent = 'Verder';
          } else {
            feedback.textContent = 'Je reactie is nog niet herkend. Probeer opnieuw of ga verder na je eigen poging.';
          }
        }).catch(function () {
          if (card.isConnected && !done) feedback.textContent = 'Inspreken lukt nu niet. Zeg je antwoord hardop en ga daarna verder.';
        }).then(function () { mic.disabled = false; finish.disabled = false; });
      }, 'primary');
      card.appendChild(mic);
    }
    card.appendChild(feedback);
    card.appendChild(h('details.box', h('summary', 'Hoor een voorbeeld'),
      button('🔊 Luister', function () { Snd.play(lesson.id + '-start.mp3'); }),
      h('p.growth-chinese', { lang: 'zh-CN' }, model),
      player.set.pinyin === 'never' ? null : h('details.box', h('summary', 'Pinyin als hulp'), h('p', opening[1]), h('p', opening[3]))));
    controls.appendChild(finish);
  }

  function missionScreen(title, subtitle, progress) {
    var root = h('main.growth');
    var card = h('section.card.growth-task', { tabindex: '0', 'aria-label': 'Opdracht' });
    var controls = h('div.growth-controls');
    root.appendChild(h('header.growth-header',
      h('div.sub-top', button('← Leerpad', function () { App.go('home'); }), h('h2', title)), subtitle, progress));
    root.appendChild(card);
    root.appendChild(controls);
    U.clear(U.$('#app')).appendChild(root);
    return { root: root, card: card, controls: controls };
  }

  Growth.show = function (opts) {
    var player = Store.current();
    if (player && opts && opts.quick) {
      var quick = missionScreen('Probeer een gesprek');
      var quickCard = quick.card;
      openConversation(quickCard, quick.controls, lessons['groei-a1-klas'], player, function () {
        U.clear(quickCard);
        U.clear(quick.controls);
        quickCard.scrollTop = 0;
        quickCard.appendChild(h('p.growth-chinese', { lang: 'zh-CN' }, '我叫小明。'));
        Snd.play('groei-gesprek-antwoord.mp3');
        quickCard.appendChild(button('🔊 Luister opnieuw', function () { Snd.play('groei-gesprek-antwoord.mp3'); }));
        quickCard.appendChild(h('p', 'Het andere kind antwoordt dat het Xiaoming heet.'));
        quick.controls.appendChild(button('Naar het leerpad', function () { App.go('home'); }, 'primary'));
      });
      return;
    }
    var node = opts && opts.lesson;
    var lesson = node && lessons[node.id];
    if (!player || !lesson || (!Store.nodeOpen(player, node.id) && !Store.nodeDone(player, node.id))) {
      App.go(player ? 'home' : 'chooser'); return;
    }
    var band = Growth.ageBand(player);
    var started = Date.now(), step = 0, score = 0, spoken = false;
    var progress = h('progress', { max: 5, value: 0, 'aria-label': 'Stappen in deze missie' });
    var view = missionScreen(lesson.title, h('p.small', node.level + ' · ' + lesson.aim), progress);
    var card = view.card, controls = view.controls;
    var plan = [
      ['Luisteren', 'Luister naar het fragment en beantwoord de vraag.'],
      ['Lezen', 'Lees de tekst en zoek het antwoord.'],
      ['Reageren', 'Kies wat je in deze situatie kunt zeggen.']
    ];

    function chinese(text) { return h('p.growth-chinese', { lang: 'zh-CN' }, text); }
    function help() {
      var meaning = lesson.gloss.split(' · ').map(function (entry) { return entry.replace(/(\S+) .+? — /, '$1 — '); }).join(' · ');
      return h('details.box', { open: band === 0 }, h('summary', 'Woordenhulp'), h('p', meaning),
        player.set.pinyin === 'never' ? null : h('details.box', h('summary', 'Pinyin als hulp'), h('p', lesson.gloss)));
    }
    function clearStep() {
      U.clear(card);
      U.clear(controls);
      card.scrollTop = 0;
    }
    function question() {
      Snd.stop();
      clearStep();
      progress.value = step + 1;
      var current = step;
      var task = lesson.questions[current];
      var response = h('p.growth-feedback', { role: 'status' });
      var text = h('div.growth-source');
      var prompt = h('div.growth-prompt');
      var grid = h('div.growth-question' + (current === 1 ? '.is-reading' : ''), text, prompt);

      card.appendChild(h('h3', plan[current][0]));
      card.appendChild(h('p', plan[current][1]));
      if (current === 0) {
        var fallback = h('details.box', h('summary', 'Lees mee'), chinese(lesson.text));
        var file = lesson.id + '.mp3';
        text.appendChild(h('div.row', button('🔊 Luister', function () { Snd.play(file); }, 'primary'),
          button('Langzaam', function () { Snd.play(file, { slow: true }); })));
        text.appendChild(fallback);
      } else if (current === 1) {
        var passage = chinese(lesson.text);
        passage.classList.add('growth-passage');
        passage.tabIndex = 0;
        text.appendChild(passage);
      }
      if (current < 2) text.appendChild(help());
      prompt.appendChild(h('h4', task[0]));
      var answers = h('div.growth-answers');
      var locked = false;
      U.shuffle(task.slice(1)).forEach(function (answer) {
        var choice = button(answer, function () {
          if (locked) return;
          locked = true;
          var correct = answer === task[1];
          Store.countExercise(player, correct, current === 0 ? 'L' : current === 1 ? 'H' : null);
          if (correct) { score += 1; Snd.fx('good'); } else Snd.fx('oops');
          Array.prototype.forEach.call(answers.children, function (b) {
            b.disabled = true;
            if (b.textContent === task[1]) b.classList.add('growth-correct');
          });
          response.textContent = correct ? '✓ Juist!' : 'Bekijk het gemarkeerde antwoord.';
          controls.appendChild(response);
          controls.appendChild(button('Verder', function () {
            if (step !== current) return;
            step += 1;
            if (step < plan.length) question();
            else produce();
          }, 'primary'));
        });
        if (current === 2) { choice.classList.add('growth-chinese'); choice.lang = 'zh-CN'; }
        answers.appendChild(choice);
      });
      prompt.appendChild(answers);
      card.appendChild(grid);
    }

    function produce() {
      Snd.stop();
      clearStep();
      progress.value = 4;
      card.appendChild(h('h3', 'Nu jij: spreek Chinees'));
      card.appendChild(h('p', lesson.tasks[band]));
      if (node.level === 'B1' && band > 0) card.appendChild(h('details.box', h('summary', 'Oefen met iemand'),
        h('p', 'Laat iemand deze vervolgvraag stellen. Geef daarna een reden of een voorbeeld.'), chinese('你为什么这么想？'),
        h('p', 'Waarom denk je dat?')));
      var criteria = band === 0 ? 'Beantwoord de opdracht met je eigen woorden.' :
        band === 1 ? 'Controleer of je alles hebt gezegd dat de opdracht vraagt.' :
          'Controleer of je zinnen samenhangen en of je je keuze of mening uitlegt wanneer dat gevraagd wordt.';
      card.appendChild(h('details.box', h('summary', 'Hoor een voorbeeld'), button('🔊 Luister', function () { Snd.play(lesson.id + '-voorbeeld.mp3'); }), chinese(lesson.model), h('p', criteria)));
      card.appendChild(h('details.box', h('summary', 'Vertaling van het fragment'), h('p', lesson.nl)));
      function finish(didSpeak) {
        if (step !== 3) return;
        step = 4;
        spoken = didSpeak;
        result();
      }
      controls.appendChild(button('Ik heb mijn antwoord gezegd', function () { finish(true); }, 'primary'));
      controls.appendChild(button('Later hardop oefenen', function () { finish(false); }));
    }

    function result() {
      var day = U.dayNum();
      var passed = score >= 2;
      Growth.record(player, lesson.id, passed, spoken ? 'spoken' : null, day);
      var stars = score * 2 + Number(spoken);
      Store.addStars(player, stars);
      for (var i = 0; i < score; i++) Mine.earn(player);
      Store.addSeconds(player, (Date.now() - started) / 1000);
      Store.lessonDone(player, lesson.id, score, passed);
      Store.save();
      App.syncSoon();
      var missionCoins = passed ? Mine.claimMissions(player) : 0;
      if (!player.hatch) Screens.hatch(showResult);
      else showResult();

      function showResult() {
        U.clear(U.$('#app')).appendChild(view.root);
        clearStep();
        progress.value = 5;
        card.appendChild(h('h3', passed ? 'Missie klaar!' : 'Probeer deze missie opnieuw'));
        card.appendChild(h('p', score + ' van 3 vragen juist · +' + stars + ' ★ · +' + score + ' 🪙'));
        if (missionCoins) card.appendChild(h('p.mine-reward', '+' + missionCoins + ' 🪙 voor een expeditiebeloning'));
        if (spoken) card.appendChild(h('p.small', 'Vergelijk je gesproken antwoord met het voorbeeld of bespreek het met iemand.'));
        card.appendChild(h('details.box', h('summary', 'Hoor het voorbeeld opnieuw'), button('🔊 Luister', function () { Snd.play(lesson.id + '-voorbeeld.mp3'); }), chinese(lesson.model)));
        if (!passed) controls.appendChild(button('Probeer opnieuw', function () { App.go('growth', { lesson: node }); }, 'primary'));
        controls.appendChild(button('Naar het leerpad', function () { App.go('home'); }, passed ? 'primary' : 'ghost'));
      }
    }

    openConversation(card, controls, lesson, player, question);
  };

  window.Growth = Growth;
})();
