/* Installeren via de browser, met uitleg als deze geen installatieprompt aanbiedt. */
(function () {
  'use strict';
  var pendingPrompt = null;
  var bar = null;
  var button = null;
  var installed = false;

  function standalone() {
    return installed || navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  }

  function refresh() {
    if (!bar) return;
    bar.hidden = !!standalone();
    button.textContent = pendingPrompt ? 'Installeer Xiǎolóng' : 'App installeren';
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    pendingPrompt = event;
    refresh();
  });
  window.addEventListener('appinstalled', function () {
    installed = true;
    pendingPrompt = null;
    refresh();
  });

  function help() {
    var h = U.h;
    var body = h('div.install-help', h('h2', 'Xiǎolóng installeren'));
    body.appendChild(h('p', 'Open deze website rechtstreeks in je browser. In het venster van ChatGPT, WhatsApp of een andere app is installeren vaak niet beschikbaar.'));
    body.appendChild(h('h3', 'Android'));
    body.appendChild(h('p', 'Open de link in Chrome. Tik op ⋮ en kies App installeren of Toevoegen aan startscherm. Kies daarna Installeren als die optie verschijnt. Gebruik een gewoon tabblad, geen incognitotabblad.'));
    body.appendChild(h('h3', 'iPhone of iPad'));
    body.appendChild(h('p', 'Open de link in Safari. Tik op Delen en daarna op Zet op beginscherm.'));
    body.appendChild(h('h3', 'Computer'));
    body.appendChild(h('p', 'Open de link in Chrome of Edge. Gebruik het installatiepictogram in de adresbalk of de installatieoptie in het browsermenu.'));
    var link = h('a', { href: 'https://robinvandenbroecke.github.io/xiaolong/', target: '_blank', rel: 'noopener', 'class': 'install-link' }, 'Open Xiǎolóng in een nieuw tabblad');
    body.appendChild(link);
    body.appendChild(h('p.small', 'Geen installatieoptie? Laat de pagina even open, vernieuw ze en probeer opnieuw. Verwijder de websitegegevens niet: daarin staat je lokale voortgang.'));
    App.modal(body);
  }

  function install() {
    if (!pendingPrompt) { help(); return; }
    var event = pendingPrompt;
    pendingPrompt = null;
    // prompt() moet rechtstreeks vanuit deze klik worden aangeroepen.
    try {
      Promise.resolve(event.prompt()).then(function () {
        return event.userChoice;
      }).then(function (choice) {
        if (choice && choice.outcome === 'accepted') {
          App.toast('Bevestig de installatie in je browser.');
        }
        refresh();
      }).catch(function () { refresh(); help(); });
    } catch (e) { refresh(); help(); }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var h = U.h;
    button = h('button.btn', { type: 'button', onclick: install }, 'App installeren');
    bar = h('aside.install-bar', { 'aria-label': 'Webapp installeren' },
      h('span', 'Xiǎolóng op je beginscherm'), button);
    document.body.insertBefore(bar, document.getElementById('app'));
    refresh();
    if (window.matchMedia) {
      var mode = window.matchMedia('(display-mode: standalone)');
      if (mode.addEventListener) mode.addEventListener('change', refresh);
      else if (mode.addListener) mode.addListener(refresh);
    }
  });
})();
