# -*- coding: utf-8 -*-
"""Schrijft sw.js met de lijst van alle bestanden, zodat de app zonder internet werkt."""
import hashlib, os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

files = ["./", "index.html", "manifest.webmanifest", "sync/Code.gs"]
for d in ["css", "js", "fonts", "icons", "audio"]:
    for f in sorted(os.listdir(os.path.join(ROOT, d))):
        if f.startswith(".") or f.endswith(".json"):
            continue
        files.append(d + "/" + f)

h = hashlib.sha256(open(__file__, "rb").read())
for f in files[1:]:
    p = os.path.join(ROOT, f)
    if os.path.isfile(p):
        h.update(f.encode("utf-8") + b"\0")
        h.update(hashlib.sha256(open(p, "rb").read()).digest())
version = h.hexdigest()[:10]

core = [f for f in files if not f.startswith("audio/")]
audio = [f for f in files if f.startswith("audio/")]

sw = """/* Gemaakt door tools/build_sw.py. Bewaart de app op het toestel, zodat ze zonder internet werkt. */
var VERSION = 'xiaolong-%s';
var CORE = %s;
var AUDIO = %s;

function precacheRequest(path) {
  var url = new URL(path, self.registration.scope);
  url.searchParams.set('xl-version', VERSION);
  return new Request(url, { cache: 'reload' });
}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return c.addAll(CORE.map(precacheRequest)).then(function () {
      // geluid in stukjes, zodat één fout niet alles tegenhoudt
      return Promise.all(AUDIO.map(function (u) { return c.add(precacheRequest(u)).catch(function () {}); }));
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('xiaolong-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(function (cache) {
    return cache.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).catch(function (error) {
        if (e.request.mode !== 'navigate') throw error;
        return cache.match('index.html', { ignoreSearch: true });
      });
    });
  }));
});
""" % (version, repr(core).replace("'", '"'), repr(audio).replace("'", '"'))
open(os.path.join(ROOT, "sw.js"), "w", encoding="utf-8").write(sw)
print("sw.js versie", version, "bestanden", len(files))
