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

  Growth.show = function (opts) {
    var player = Store.current();
    var node = opts && opts.lesson;
    var lesson = node && lessons[node.id];
    if (!player || !lesson || (!Store.nodeOpen(player, node.id) && !Store.nodeDone(player, node.id))) {
      App.go(player ? 'home' : 'chooser'); return;
    }
    var band = Growth.ageBand(player);
    var before = Store.stage(player);
    var goalBefore = Store.dayTotals(player).s >= player.set.goal;
    var started = Date.now(), step = 0, score = 0, spoken = false, written = '';
    var root = h('main.growth');
    U.clear(U.$('#app')).appendChild(root);
    root.appendChild(h('header.sub-top', button('← Leerpad', function () { App.go('home'); }), h('h2', lesson.title)));
    root.appendChild(h('p.small', node.level + ' · ' + lesson.aim));
    var progress = h('progress', { max: 4, value: 0, 'aria-label': 'Stappen in deze missie' });
    var card = h('section.card.growth-task');
    root.appendChild(progress);
    root.appendChild(card);
    var plan = [
      ['Luisteren', 'Luister naar het fragment en beantwoord de vraag.'],
      ['Lezen', 'Lees de tekst en zoek het antwoord.'],
      ['Reageren', 'Kies wat je in deze situatie kunt zeggen.']
    ];

    function chinese(text) { return h('p.growth-chinese', { lang: 'zh-CN' }, text); }
    function help() {
      return h('details.box', { open: band === 0 }, h('summary', 'Woordenhulp'), h('p', lesson.gloss));
    }
    function question() {
      Snd.stop();
      U.clear(card);
      progress.value = step;
      var current = step;
      var task = lesson.questions[current];
      var response = h('p.growth-feedback', { role: 'status' });

      card.appendChild(h('h3', plan[current][0]));
      card.appendChild(h('p', plan[current][1]));
      if (current === 0) {
        var fallback = h('details.box', h('summary', 'Lees mee'), chinese(lesson.text));
        var file = lesson.id + '.mp3';
        card.appendChild(h('div.row', button('🔊 Luister', function () { Snd.play(file); }, 'primary'),
          button('Langzaam', function () { Snd.play(file, { slow: true }); })));
        card.appendChild(fallback);
      } else if (current === 1) card.appendChild(chinese(lesson.text));
      if (current < 2) card.appendChild(help());
      card.appendChild(h('h4', task[0]));
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
          response.textContent = correct ? '✓ Juist!' : 'Het juiste antwoord is ' + task[1];
          card.appendChild(button('Verder', function () {
            if (step !== current) return;
            step += 1;
            if (step < plan.length) question();
            else produce();
          }, 'primary'));
        });
        if (current === 2) { choice.classList.add('growth-chinese'); choice.lang = 'zh-CN'; }
        answers.appendChild(choice);
      });
      card.appendChild(answers);
      card.appendChild(response);
    }

    function produce() {
      Snd.stop();
      U.clear(card);
      progress.value = 3;
      card.appendChild(h('h3', 'Nu jij'));
      card.appendChild(h('p', lesson.tasks[band]));
      if (node.level === 'B1' && band > 0) card.appendChild(h('details.box', h('summary', 'Oefen met iemand'),
        h('p', 'Laat iemand deze vervolgvraag stellen. Geef daarna een reden of een voorbeeld.'), chinese('你为什么这么想？'),
        h('p', 'Waarom denk je dat?')));
      var field = h('textarea.growth-chinese', {
        rows: band ? 5 : 3, lang: 'zh-CN', maxlength: 1200, placeholder: 'Chinees of pinyin'
      });
      var say = h('input', { type: 'checkbox' });
      card.appendChild(h('label.growth-writing', 'Schrijf je antwoord', field));
      card.appendChild(h('label.growth-speak', say, ' Ik heb mijn antwoord hardop gezegd.'));
      var criteria = band === 0 ? 'Beantwoord de opdracht met je eigen woorden.' :
        band === 1 ? 'Controleer of je alles hebt gezegd dat de opdracht vraagt.' :
          'Controleer of je zinnen samenhangen en of je je keuze of mening uitlegt wanneer dat gevraagd wordt.';
      card.appendChild(h('details.box', h('summary', 'Bekijk een voorbeeld'), chinese(lesson.model), h('p', criteria)));
      card.appendChild(h('details.box', h('summary', 'Vertaling van het fragment'), h('p', lesson.nl)));
      var finish = button('Rond de missie af', function () {
        if (step !== 3) return;
        step = 4;
        spoken = say.checked;
        written = field.value.trim();
        result();
      }, 'primary');
      card.appendChild(finish);
    }

    function result() {
      var day = U.dayNum();
      var passed = score >= 2;
      var submitted = /[a-zA-Z\u00C0-\u024F\u3400-\u9FFF]/.test(written);
      Growth.record(player, lesson.id, passed, submitted ? 'written' : null, day);
      if (spoken) Growth.record(player, lesson.id, passed, 'spoken', day);
      var stars = score * 2 + Number(submitted || spoken);
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
        U.clear(U.$('#app')).appendChild(root);
        U.clear(card);
        progress.value = 4;
        card.appendChild(h('h3', passed ? 'Missie klaar!' : 'Probeer deze missie opnieuw'));
        card.appendChild(h('p', score + ' van 3 vragen juist · +' + stars + ' ★ · +' + score + ' 🪙'));
        if (missionCoins) card.appendChild(h('p.mine-reward', '+' + missionCoins + ' 🪙 voor een expeditiebeloning'));
        if (submitted || spoken) card.appendChild(h('p.small', 'Je eigen antwoord telt als oefening. Vergelijk het met het voorbeeld of bespreek het met iemand.'));
        card.appendChild(h('details.box', h('summary', 'Bekijk het voorbeeld opnieuw'), chinese(lesson.model)));
        if (!passed) card.appendChild(button('Probeer opnieuw', function () { App.go('growth', { lesson: node }); }, 'primary'));
        card.appendChild(button('Naar het leerpad', function () { App.go('home'); }, passed ? 'primary' : 'ghost'));
      }
    }

    question();
  };

  window.Growth = Growth;
})();
