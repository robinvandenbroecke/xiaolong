/* Zelfde gezinsaccount als Tafelberg en RekenRinkel, met eigen Chinese voortgang. */
(function () {
  'use strict';
  var Family = {};
  var base = 'https://sjzbgdhxtibnbyutlyas.supabase.co';
  var publishableKey = 'sb_publishable_lVYM3XzTp1LrYYyyLJxwOQ_7tNOy93T';
  var sessionKey = 'xiaolong.family.v1';
  var session;
  var roster;
  var busy;

  function readSession() {
    try {
      var value = JSON.parse(U.storage.get(sessionKey));
      return value && /^[0-9a-f-]{36}$/.test(value.account) && value.token && value.refresh ? value : null;
    } catch (e) { return null; }
  }

  Family.load = function () { session = readSession(); };
  Family.account = function () { return session && session.account; };
  Family.active = function () { return !!session; };

  function saveSession(value) {
    session = value;
    if (value) U.storage.set(sessionKey, JSON.stringify(value));
    else U.storage.set(sessionKey, 'null');
  }

  function request(path, method, body, headers) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller && setTimeout(function () { controller.abort(); }, 20000);
    return fetch(base + path, {
      method: method, headers: headers, body: body === null ? undefined : JSON.stringify(body),
      signal: controller ? controller.signal : undefined
    }).then(function (response) {
      return response.json().then(function (data) {
        clearTimeout(timer);
        return { status: response.status, ok: response.ok, data: data };
      });
    }).catch(function (error) { clearTimeout(timer); throw error; });
  }

  function auth(body) {
    return request('/functions/v1/tafelberg', 'POST', body, { 'Content-Type': 'application/json' })
      .then(function (result) {
        if (!result.ok || !result.data.ok) {
          throw new Error(result.data.message || 'Het gezinsaccount is tijdelijk niet bereikbaar.');
        }
        return result.data;
      });
  }

  function freshToken(account) {
    if (Family.account() !== account) return Promise.reject(new Error('Het account is gewisseld.'));
    var latest = readSession();
    if (!latest || latest.account !== account) return Promise.reject(new Error('Meld je opnieuw aan.'));
    if (latest.expires > session.expires) session = latest;
    var previous = session;
    if (previous.expires > Date.now() + 60000) return Promise.resolve(previous.token);
    return auth({ action: 'refresh', refresh: previous.refresh }).then(function (value) {
      var stored = readSession();
      if (session !== previous || !stored || stored.account !== account) throw new Error('Het account is gewisseld.');
      saveSession({ account: account, email: previous.email, token: value.token, refresh: value.refresh, expires: value.expires });
      return session.token;
    });
  }

  function progress(token, method, query, body) {
    return request('/rest/v1/xiaolong_progress' + query, method, body, {
      apikey: publishableKey, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json',
      Prefer: 'return=representation'
    });
  }

  function directory(result, account) {
    if (result.account !== account || !Array.isArray(result.profiles)) throw new Error('Ongeldige gezinslijst.');
    var players = {}, aliases = {};
    result.profiles.forEach(function (entry) {
      var id = 'family-' + entry.user;
      if (!Store.familyPlayer(id) || !entry.profile || typeof entry.profile.name !== 'string' || !entry.profile.name.trim()) return;
      players[id] = { name: entry.profile.name, created: Number(entry.profile.created) || 0 };
      (Array.isArray(entry.merged) ? entry.merged : []).forEach(function (old) {
        var alias = 'family-' + old;
        if (alias !== id && Store.familyPlayer(alias)) aliases[alias] = id;
      });
    });
    return { players: players, aliases: aliases };
  }

  function safeToApply() {
    return ['lesson', 'story', 'growth', 'results', 'hongbao', 'mine', 'wardrobe', 'adventure', 'china', 'newplayer'].indexOf(App.screen()) === -1;
  }

  function familyProgress(local, remote) {
    if (!roster) return XLMerge.mergePlayers(local, remote);
    function canonical(list) {
      return list.reduce(function (out, player) {
        if (!player || !player.id) return out;
        var id = roster.aliases[player.id] || player.id;
        // Een oude lokale verwijdering mag een actief gezinslid niet verbergen.
        if (!roster.players[id] || !player.del) out.push(Object.assign({}, player, { id: id }));
        return out;
      }, []);
    }
    var players = XLMerge.mergePlayers(canonical(local), canonical(remote));
    var present = {};
    players.forEach(function (player) {
      var entry = roster.players[player.id];
      if (!entry) return;
      player.prof = Object.assign({}, player.prof || Store.newFamilyPlayer(player.id, entry.name, entry.created).prof, { name: entry.name });
      present[player.id] = true;
    });
    Object.keys(roster.players).forEach(function (id) {
      var entry = roster.players[id];
      if (!present[id]) players.push(Store.newFamilyPlayer(id, entry.name, entry.created));
    });
    return players.sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
  }

  function applyPlayers(players) {
    return safeToApply() && Store.replacePlayers(players, roster && roster.aliases);
  }

  function syncProgress(token, state, account, tries) {
    var filter = '?owner_id=eq.' + account;
    return progress(token, 'GET', filter + '&select=players,revision', null).then(function (result) {
      if (state !== Store.state()) return false;
      if (!result.ok) throw new Error('Online voortgang ophalen lukt niet.');
      var row = result.data[0];
      var remote = row ? row.players : [];
      var current = Object.keys(state.players).map(function (id) { return state.players[id]; });
      var players = familyProgress(current, remote);
      if (!safeToApply()) return false;
      var changed = applyPlayers(players);
      if (XLMerge.same(players, remote)) return changed;
      return progress(token, row ? 'PATCH' : 'POST',
        row ? filter + '&revision=eq.' + row.revision : '',
        row ? { players: players, revision: row.revision + 1 } : { players: players }).then(function (saved) {
        if (state !== Store.state()) return false;
        if (saved.ok && saved.data.length) return changed;
        if (tries < 3 && (saved.status === 409 || saved.ok)) {
          return syncProgress(token, state, account, tries + 1).then(function (later) { return changed || later; });
        }
        throw new Error('Online voortgang bewaren lukt niet.');
      });
    });
  }

  Family.sync = function (manual) {
    if (!session || navigator.onLine === false) {
      if (manual) App.toast('Geen verbinding. Je kunt lokaal verder oefenen.');
      return Promise.resolve(false);
    }
    if (!safeToApply()) return Promise.resolve(false);
    var state = Store.state();
    if (busy && busy.state === state) return busy.promise;
    var account = session.account;
    var before = state.players;
    var operation = { state: state };
    busy = operation;
    var listFailed = false;
    operation.promise = freshToken(account).then(function (token) {
      return auth({ action: 'list', token: token }).then(function (result) {
        if (state === Store.state()) roster = directory(result, account);
      }).catch(function () { listFailed = true; }).then(function () {
        if (state !== Store.state() || !safeToApply()) return false;
        return syncProgress(token, state, account, 0);
      });
    }).then(function (changed) {
      if (manual && state === Store.state()) App.toast(listFailed ? 'De gezinslijst kon niet worden bijgewerkt.' : 'Gesynchroniseerd.');
      return changed;
    }).catch(function () {
      if (state !== Store.state()) return false;
      if (manual) App.toast('Synchroniseren lukt niet. Controleer je verbinding of meld je opnieuw aan.');
      var changed = roster && applyPlayers(familyProgress(Object.keys(state.players).map(function (id) { return state.players[id]; }), []));
      return !!changed || before !== state.players;
    }).then(function (changed) {
      if (busy === operation) busy = null;
      return changed;
    });
    return operation.promise;
  };

  function switchAccount(value) {
    Store.save();
    roster = value ? directory(value, value.account) : null;
    saveSession(value ? {
      account: value.account, email: value.email, token: value.token,
      refresh: value.refresh, expires: value.expires
    } : null);
    Store.load(Family.account());
    App.applyDevice();
    if (value) {
      applyPlayers(familyProgress(Object.keys(Store.state().players).map(function (id) { return Store.state().players[id]; }), []));
      App.go('chooser');
      Family.sync(false).then(App.refreshPlayers);
    } else App.go('parent', { tab: 'sync' });
  }

  function button(label, click) {
    return U.h('button.btn.ghost', { type: 'button', onclick: click }, label);
  }

  function rosterOptions() {
    var h = U.h;
    var choices = h('select', { 'aria-label': 'Gezinsprofiel' }, h('option', { value: '' }, 'Kies een gezinsprofiel'));
    Store.players().filter(function (p) { return Store.familyPlayer(p.id); }).forEach(function (p) {
      choices.appendChild(h('option', { value: p.id }, p.prof.name));
    });
    return choices;
  }

  Family.show = function (body) {
    var h = U.h;
    var section = h('section.card', h('h3', 'Gezinsaccount'));
    body.appendChild(section);
    section.appendChild(h('p.small', 'Gebruik hetzelfde e-mailadres en wachtwoord als in Tafelberg en RekenRinkel.'));
    if (session) {
      section.appendChild(h('p', session.email));
      if (session.expires <= Date.now()) {
        section.appendChild(h('p.small', 'Werkt synchroniseren niet meer? Meld je af en opnieuw aan.'));
      }
      section.appendChild(h('p.small', 'Je gezinsleden verschijnen vanzelf bij ‘Wie speelt er?’.'));
      section.appendChild(button('Nu synchroniseren', function () {
        Family.sync(true).then(function (changed) { if (changed && section.isConnected) Parent.show(); });
      }));
      section.appendChild(h('p.small', h('a', { href: 'https://robinvandenbroecke.github.io/tafelberg/', target: '_blank', rel: 'noopener' }, 'Gezinsleden beheren in Tafelberg')));
      section.appendChild(button('Afmelden', function () {
        var old = session;
        switchAccount(null);
        auth({ action: 'logout', token: old.token }).catch(function () {});
      }));
      var local = Store.localPlayers();
      var source = h('select', { 'aria-label': 'Lokale speler' }, h('option', { value: '' }, 'Kies een lokale speler'));
      local.forEach(function (p) { source.appendChild(h('option', { value: p.id }, p.prof.name)); });
      var target = rosterOptions();
      if (local.length) {
        section.appendChild(h('p.small', 'Kopieer een speler van dit toestel. Kies eventueel hetzelfde kind in het gezinsaccount.'));
        section.appendChild(h('div.row', source, target, button('Lokale voortgang kopiëren', function () {
          var player = local.filter(function (p) { return p.id === source.value; })[0];
          if (!player) return;
          var id = target.value || player.id;
          var existing = Store.state().players[id];
          if (existing && existing.del) { App.toast('Kies een profiel dat niet is verwijderd.'); return; }
          var captured = Store.state();
          App.confirm('Voortgang van ' + player.prof.name + ' kopiëren naar ' + (target.value ?
            target.options[target.selectedIndex].text : player.prof.name) + '?', 'Kopiëren', 'Annuleren').then(function (ok) {
            if (!ok || captured !== Store.state()) return;
            var copy = JSON.parse(JSON.stringify(player));
            copy.id = id;
            if (target.value && existing) copy.prof.name = existing.prof.name;
            Store.mergePlayers([copy]);
            if (Store.save()) Family.sync(true);
            else App.toast('Bewaren op dit toestel lukt niet.');
          });
        })));
      }
    } else {
      var email = h('input', { type: 'email', autocomplete: 'username', required: true });
      var password = h('input', { type: 'password', autocomplete: 'current-password', required: true, maxlength: 128 });
      var submit = h('button.btn.primary', { type: 'submit' }, 'Aanmelden');
      var status = h('p.small', { role: 'status' });
      section.appendChild(h('form', { onsubmit: function (event) {
        event.preventDefault();
        submit.disabled = true;
        status.textContent = 'Bezig met aanmelden…';
        auth({ action: 'login', email: email.value.trim(), password: password.value }).then(function (value) {
          if (!section.isConnected) return;
          if (!/^[0-9a-f-]{36}$/.test(value.account) || !value.token || !value.refresh) {
            throw new Error('Het account kon niet worden geopend.');
          }
          switchAccount(value);
        }).catch(function (error) {
          status.textContent = error.message || 'Aanmelden lukt niet.';
          submit.disabled = false;
        });
      } }, h('label', 'E-mailadres ', email), h('label', 'Wachtwoord ', password), submit, status));
      section.appendChild(h('p.small', h('a', { href: 'https://robinvandenbroecke.github.io/tafelberg/' }, 'Account maken of wachtwoord herstellen in Tafelberg')));
    }
  };

  window.Family = Family;
})();
