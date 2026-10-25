/* Kleine hulpfuncties. */
(function () {
  'use strict';
  var U = {};

  U.$ = function (sel, root) { return (root || document).querySelector(sel); };
  U.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* h('div.klasse', {attr}, kinderen...) */
  U.h = function (tag, attrs) {
    var parts = tag.split('.');
    var el = document.createElement(parts[0] || 'div');
    if (parts.length > 1) el.className = parts.slice(1).join(' ');
    var kids = Array.prototype.slice.call(arguments, 2);
    if (attrs && (typeof attrs !== 'object' || attrs.nodeType || Array.isArray(attrs))) {
      kids.unshift(attrs); attrs = null;
    }
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'onclick' || k === 'oninput' || k === 'onchange' || k.indexOf('on') === 0) {
          el.addEventListener(k.slice(2), v);
        } else if (k === 'html') {
          el.innerHTML = v;
        } else if (k === 'style' && typeof v === 'object') {
          Object.keys(v).forEach(function (s) { el.style.setProperty(s, v[s]); });
        } else if (k === 'cls') {
          el.className += (el.className ? ' ' : '') + v;
        } else {
          el.setAttribute(k, v === true ? '' : v);
        }
      });
    }
    U.append(el, kids);
    return el;
  };
  U.append = function (el, kids) {
    kids.forEach(function (k) {
      if (k === null || k === undefined || k === false) return;
      if (Array.isArray(k)) { U.append(el, k); return; }
      el.appendChild(k.nodeType ? k : document.createTextNode(String(k)));
    });
    return el;
  };
  U.clear = function (el) { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  U.shuffle = function (a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  U.pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  U.uid = function (n) {
    var s = '', c = 'abcdefghijkmnpqrstuvwxyz23456789';
    var buf = new Uint8Array(n || 10);
    (window.crypto || window.msCrypto).getRandomValues(buf);
    for (var i = 0; i < buf.length; i++) s += c[buf[i] % c.length];
    return s;
  };
  U.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* Datums als 'JJJJ-MM-DD' in lokale tijd, en dagnummers. */
  U.dayKey = function (d) {
    d = d || new Date();
    var m = d.getMonth() + 1, day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  };
  U.dayNum = function (d) {
    d = d || new Date();
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  };
  U.keyToNum = function (k) {
    var p = k.split('-');
    return Math.floor(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000);
  };
  U.numToKey = function (n) {
    var d = new Date(n * 86400000);
    var m = d.getUTCMonth() + 1, day = d.getUTCDate();
    return d.getUTCFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  };
  /* Maandag van de week van dag n (dagnummer). 1970-01-01 was een donderdag. */
  U.weekStart = function (n) { return n - ((n + 3) % 7); };

  U.storage = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) { /* niets */ } }
  };

  U.wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  U.isEink = function () { return document.documentElement.classList.contains('eink'); };

  /* base64url voor koppellinks */
  U.b64e = function (s) {
    return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  U.b64d = function (s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  };

  U.plural = function (n, een, meer) { return n + ' ' + (n === 1 ? een : meer); };

  window.U = U;
})();
