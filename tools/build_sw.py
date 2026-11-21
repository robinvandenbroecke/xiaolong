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
audio_hash = hashlib.sha256()
for path in audio:
    with open(os.path.join(ROOT, path), "rb") as recording:
        audio_hash.update(path.encode("utf-8") + b"\0")
        audio_hash.update(hashlib.sha256(recording.read()).digest())
audio_version = audio_hash.hexdigest()[:12]

sw = """/* Gemaakt door tools/build_sw.py. Bewaart de app op het toestel, zodat ze zonder internet werkt. */
var VERSION = 'xiaolong-%s';
var AUDIO_CACHE = 'xiaolong-audio-%s';
var CORE = %s;
var AUDIO = %s;

function precacheRequest(path, version) {
  var url = new URL(path, self.registration.scope);
  url.searchParams.set('xl-version', version);
  return new Request(url, { cache: 'reload' });
}

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (cache) {
    return cache.addAll(CORE.map(function (path) { return precacheRequest(path, VERSION); }));
  }).then(function () { return self.skipWaiting(); }));
});

var audioJob;

function cacheAudio() {
  return caches.open(AUDIO_CACHE).then(function (cache) {
    var ready = new URL('audio/.offline-ready', self.registration.scope).href;
    return cache.match(ready).then(function (done) {
      if (done) return;
      var next = 0;
      var missing = false;
      function batch() {
        var paths = AUDIO.slice(next, next + 8);
        next += paths.length;
        if (!paths.length) {
          if (!missing) return cache.put(ready, new Response('ready'));
          return;
        }
        return Promise.all(paths.map(function (path) {
          var request = precacheRequest(path, AUDIO_CACHE);
          return cache.match(request, { ignoreSearch: true }).then(function (hit) {
            if (!hit) return cache.add(request);
          }).catch(function () { missing = true; });
        })).then(batch);
      }
      return batch();
    });
  });
}

self.addEventListener('message', function (e) {
  if (e.data !== 'CACHE_AUDIO') return;
  if (!audioJob) {
    audioJob = cacheAudio().catch(function () {}).then(function () { audioJob = null; });
  }
  e.waitUntil(audioJob);
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('xiaolong-') === 0 && k !== VERSION && k !== AUDIO_CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  var audioPath = new URL('audio/', self.registration.scope).pathname;
  var isAudio = url.pathname.indexOf(audioPath) === 0;
  e.respondWith(caches.open(isAudio ? AUDIO_CACHE : VERSION).then(function (cache) {
    return cache.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      var request = isAudio && !e.request.headers.has('Range') ?
        precacheRequest(e.request.url, AUDIO_CACHE) : e.request;
      return fetch(request).then(function (response) {
        if (!isAudio || response.status !== 200) return response;
        return cache.put(request, response.clone()).catch(function () {}).then(function () { return response; });
      }).catch(function (error) {
        if (e.request.mode !== 'navigate') throw error;
        return cache.match('index.html', { ignoreSearch: true });
      });
    });
  }));
});
""" % (version, audio_version, repr(core).replace("'", '"'), repr(audio).replace("'", '"'))
open(os.path.join(ROOT, "sw.js"), "w", encoding="utf-8").write(sw)
print("sw.js versie", version, "bestanden", len(files))
