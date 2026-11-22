/* Gemaakt door tools/build_sw.py. Bewaart de app op het toestel, zodat ze zonder internet werkt. */
var VERSION = 'xiaolong-aa87ec35dc';
var AUDIO_CACHE = 'xiaolong-audio-30ecf4510ec7';
var CORE = ["./", "index.html", "manifest.webmanifest", "sync/Code.gs", "css/style.css", "js/app.js", "js/content.js", "js/dragon.js", "js/family.js", "js/hanzi_py.js", "js/install.js", "js/lesson.js", "js/merge.js", "js/mine.js", "js/parent.js", "js/qrcode.js", "js/screens.js", "js/sound.js", "js/store.js", "js/sync.js", "js/util.js", "js/voice.js", "fonts/OFL-Andika.txt", "fonts/OFL-Fredoka.txt", "fonts/OFL-LXGW-WenKai-GB.txt", "fonts/andika-bold.woff", "fonts/andika-regular.woff", "fonts/fredoka.woff", "fonts/wenkai.woff", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];
var AUDIO = ["audio/ba1-h.mp3", "audio/ba1-s.mp3", "audio/ba4-s.mp3", "audio/baba-h.mp3", "audio/baise-a.mp3", "audio/baise-b.mp3", "audio/bilishi-a.mp3", "audio/bilishi-b.mp3", "audio/bingqilin-b.mp3", "audio/bingqilin-h.mp3", "audio/bizi-b.mp3", "audio/bizi-h.mp3", "audio/bu-h.mp3", "audio/bu-s.mp3", "audio/bugongping-a.mp3", "audio/bugongping-b.mp3", "audio/che-h.mp3", "audio/che-s.mp3", "audio/chi-h.mp3", "audio/chi-s.mp3", "audio/da-h.mp3", "audio/da-s.mp3", "audio/denglong-b.mp3", "audio/denglong-h.mp3", "audio/dengyixia-a.mp3", "audio/dengyixia-b.mp3", "audio/didi-b.mp3", "audio/didi-h.mp3", "audio/dui-h.mp3", "audio/dui-s.mp3", "audio/er4-h.mp3", "audio/er4-s.mp3", "audio/erduo-b.mp3", "audio/erduo-h.mp3", "audio/gege-b.mp3", "audio/gege-h.mp3", "audio/geiwo-b.mp3", "audio/gou-h.mp3", "audio/gou-s.mp3", "audio/hao-h.mp3", "audio/hao-s.mp3", "audio/haochi-b.mp3", "audio/haochi-h.mp3", "audio/haode-a.mp3", "audio/haode-b.mp3", "audio/haowan-a.mp3", "audio/haowan-b.mp3", "audio/he-h.mp3", "audio/he-s.mp3", "audio/he2-h.mp3", "audio/he2-s.mp3", "audio/heise-a.mp3", "audio/heise-b.mp3", "audio/hongbao-a.mp3", "audio/hongbao-b.mp3", "audio/hongse-a.mp3", "audio/hongse-b.mp3", "audio/houzi-h.mp3", "audio/huangse-b.mp3", "audio/huangse-h.mp3", "audio/huaxue-b.mp3", "audio/huaxue-h.mp3", "audio/hui-h.mp3", "audio/hui-s.mp3", "audio/huo-h.mp3", "audio/huo-s.mp3", "audio/jian-h.mp3", "audio/jian-s.mp3", "audio/jiao-h.mp3", "audio/jiao-s.mp3", "audio/jiaozi-b.mp3", "audio/jiaozi-h.mp3", "audio/jiayou-b.mp3", "audio/jiayou-h.mp3", "audio/jiejie-b.mp3", "audio/jiejie-h.mp3", "audio/jiu3-h.mp3", "audio/jiu3-s.mp3", "audio/kaixin-b.mp3", "audio/kaixin-h.mp3", "audio/kan-h.mp3", "audio/kan-s.mp3", "audio/konglong-a.mp3", "audio/konglong-b.mp3", "audio/kou-h.mp3", "audio/kou-s.mp3", "audio/kuaidian-a.mp3", "audio/kuaidian-b.mp3", "audio/lanse-a.mp3", "audio/lanse-b.mp3", "audio/laohu-b.mp3", "audio/laohu-h.mp3", "audio/laoshi-b.mp3", "audio/laoshi-h.mp3", "audio/legao-a.mp3", "audio/legao-b.mp3", "audio/lei-h.mp3", "audio/lei-s.mp3", "audio/lin-s.mp3", "audio/liu4-h.mp3", "audio/liu4-s.mp3", "audio/long-h.mp3", "audio/long-s.mp3", "audio/lundaowole-a.mp3", "audio/lundaowole-b.mp3", "audio/lvse-a.mp3", "audio/lvse-b.mp3", "audio/ma1-s.mp3", "audio/ma3-h.mp3", "audio/ma3-s.mp3", "audio/mama-b.mp3", "audio/mama-h.mp3", "audio/mao-h.mp3", "audio/mao-s.mp3", "audio/meiguanxi-b.mp3", "audio/meiguanxi-h.mp3", "audio/meimei-b.mp3", "audio/meimei-h.mp3", "audio/meiwenti-a.mp3", "audio/meiwenti-b.mp3", "audio/meiyou-b.mp3", "audio/meiyou-h.mp3", "audio/miantiao-a.mp3", "audio/miantiao-b.mp3", "audio/mifan-b.mp3", "audio/mifan-h.mp3", "audio/ming-s.mp3", "audio/mo-h.mp3", "audio/mo-s.mp3", "audio/momonidebizi-a.mp3", "audio/momonidebizi-b.mp3", "audio/momonidetou-a.mp3", "audio/momonidetou-b.mp3", "audio/mu-h.mp3", "audio/mu-s.mp3", "audio/mu4-h.mp3", "audio/mu4-s.mp3", "audio/nainai-b.mp3", "audio/nainai-h.mp3", "audio/nanguo-b.mp3", "audio/nanguo-h.mp3", "audio/ni-h.mp3", "audio/ni-s.mp3", "audio/niao-h.mp3", "audio/niao-s.mp3", "audio/nihao-a.mp3", "audio/nihao-b.mp3", "audio/nihaoma-a.mp3", "audio/nihaoma-b.mp3", "audio/nihuiyouyongma-a.mp3", "audio/nihuiyouyongma-b.mp3", "audio/nijisui-a.mp3", "audio/nijisui-b.mp3", "audio/nine-a.mp3", "audio/nine-b.mp3", "audio/niu-h.mp3", "audio/niu-s.mp3", "audio/niunai-b.mp3", "audio/niunai-h.mp3", "audio/nixihuanshenmeyanse-a.mp3", "audio/nixihuanshenmeyanse-b.mp3", "audio/niyouqiuma-a.mp3", "audio/niyouqiuma-b.mp3", "audio/nizenmele-a.mp3", "audio/nizenmele-b.mp3", "audio/p_duile-long.mp3", "audio/p_henhao-long.mp3", "audio/p_jiayou-long.mp3", "audio/p_meiguanxi-long.mp3", "audio/p_taibangle-long.mp3", "audio/p_zaishi-long.mp3", "audio/p_zhenlihai-long.mp3", "audio/pa-h.mp3", "audio/pa-s.mp3", "audio/pao-h.mp3", "audio/pao-s.mp3", "audio/pengyou-b.mp3", "audio/pengyou-h.mp3", "audio/pingguo-b.mp3", "audio/pingguo-h.mp3", "audio/qi1-h.mp3", "audio/qi1-s.mp3", "audio/qiaokeli-a.mp3", "audio/qiaokeli-b.mp3", "audio/qiu-h.mp3", "audio/qiu-s.mp3", "audio/qu-h.mp3", "audio/qu-s.mp3", "audio/ren-h.mp3", "audio/ren-s.mp3", "audio/ri-h.mp3", "audio/ri-s.mp3", "audio/san1-h.mp3", "audio/san1-s.mp3", "audio/senlin-b.mp3", "audio/senlin-h.mp3", "audio/shan-h.mp3", "audio/shan-s.mp3", "audio/shanhenda-a.mp3", "audio/shanhenda-b.mp3", "audio/shengqi-b.mp3", "audio/shengqi-h.mp3", "audio/shengrikuaile-a.mp3", "audio/shengrikuaile-b.mp3", "audio/shenme-b.mp3", "audio/shenme-h.mp3", "audio/shi2-h.mp3", "audio/shi2-s.mp3", "audio/shi4-h.mp3", "audio/shi4-s.mp3", "audio/shou-h.mp3", "audio/shou-s.mp3", "audio/shu-h.mp3", "audio/shu-s.mp3", "audio/shui-h.mp3", "audio/shui-s.mp3", "audio/shuijiao-b.mp3", "audio/shuijiao-h.mp3", "audio/shuo-h.mp3", "audio/shuo-s.mp3", "audio/shutiao-a.mp3", "audio/si4-h.mp3", "audio/si4-s.mp3", "audio/st_bianpao-h.mp3", "audio/st_cha-h.mp3", "audio/st_changcheng-a.mp3", "audio/st_denglong-h.mp3", "audio/st_gongfu-h.mp3", "audio/st_gou-h.mp3", "audio/st_hou-s.mp3", "audio/st_hu-s.mp3", "audio/st_ji-h.mp3", "audio/st_jiaozi-h.mp3", "audio/st_jingju-h.mp3", "audio/st_kuaizi-h.mp3", "audio/st_long-h.mp3", "audio/st_longzhou-a.mp3", "audio/st_ma-h.mp3", "audio/st_maobi-h.mp3", "audio/st_niu-h.mp3", "audio/st_she-h.mp3", "audio/st_shu-s.mp3", "audio/st_tu-s.mp3", "audio/st_xiongmao-h.mp3", "audio/st_yang-h.mp3", "audio/st_yuebing-a.mp3", "audio/st_zhu-h.mp3", "audio/syl_ba1-s.mp3", "audio/syl_ba2-s.mp3", "audio/syl_ba3-s.mp3", "audio/syl_ba4-s.mp3", "audio/syl_bao1-s.mp3", "audio/syl_bao2-s.mp3", "audio/syl_bao3-s.mp3", "audio/syl_bao4-s.mp3", "audio/syl_da1-s.mp3", "audio/syl_da2-s.mp3", "audio/syl_da3-s.mp3", "audio/syl_da4-s.mp3", "audio/syl_di1-s.mp3", "audio/syl_di2-s.mp3", "audio/syl_di3-s.mp3", "audio/syl_di4-s.mp3", "audio/syl_fu1-s.mp3", "audio/syl_fu2-s.mp3", "audio/syl_fu3-s.mp3", "audio/syl_fu4-s.mp3", "audio/syl_ge1-s.mp3", "audio/syl_ge2-s.mp3", "audio/syl_ge3-s.mp3", "audio/syl_ge4-s.mp3", "audio/syl_hu1-s.mp3", "audio/syl_hu2-s.mp3", "audio/syl_hu3-s.mp3", "audio/syl_hu4-s.mp3", "audio/syl_ji1-s.mp3", "audio/syl_ji2-s.mp3", "audio/syl_ji3-s.mp3", "audio/syl_ji4-s.mp3", "audio/syl_li1-s.mp3", "audio/syl_li2-s.mp3", "audio/syl_li3-s.mp3", "audio/syl_li4-s.mp3", "audio/syl_ma1-s.mp3", "audio/syl_ma2-s.mp3", "audio/syl_ma3-s.mp3", "audio/syl_ma4-s.mp3", "audio/syl_mao1-s.mp3", "audio/syl_mao2-s.mp3", "audio/syl_mao3-s.mp3", "audio/syl_mao4-s.mp3", "audio/syl_qi1-s.mp3", "audio/syl_qi2-s.mp3", "audio/syl_qi3-s.mp3", "audio/syl_qi4-s.mp3", "audio/syl_shi1-s.mp3", "audio/syl_shi2-s.mp3", "audio/syl_shi3-s.mp3", "audio/syl_shi4-s.mp3", "audio/syl_tang1-s.mp3", "audio/syl_tang2-s.mp3", "audio/syl_tang3-s.mp3", "audio/syl_tang4-s.mp3", "audio/syl_tu1-s.mp3", "audio/syl_tu2-s.mp3", "audio/syl_tu3-s.mp3", "audio/syl_tu4-s.mp3", "audio/syl_wu1-s.mp3", "audio/syl_wu2-s.mp3", "audio/syl_wu3-s.mp3", "audio/syl_wu4-s.mp3", "audio/syl_xian1-s.mp3", "audio/syl_xian2-s.mp3", "audio/syl_xian3-s.mp3", "audio/syl_xian4-s.mp3", "audio/syl_yi1-s.mp3", "audio/syl_yi2-s.mp3", "audio/syl_yi3-s.mp3", "audio/syl_yi4-s.mp3", "audio/syl_yu1-s.mp3", "audio/syl_yu2-s.mp3", "audio/syl_yu3-s.mp3", "audio/syl_yu4-s.mp3", "audio/syl_zhu1-s.mp3", "audio/syl_zhu2-s.mp3", "audio/syl_zhu3-s.mp3", "audio/syl_zhu4-s.mp3", "audio/ta1-h.mp3", "audio/ta1-s.mp3", "audio/ta2-h.mp3", "audio/ta2-s.mp3", "audio/taibangle-b.mp3", "audio/tashiwodepengyou-a.mp3", "audio/tashiwodepengyou-b.mp3", "audio/tashiwogege-a.mp3", "audio/tashiwogege-b.mp3", "audio/tashiwomeimei-a.mp3", "audio/tashiwomeimei-b.mp3", "audio/tiao-h.mp3", "audio/tiao-s.mp3", "audio/ting-h.mp3", "audio/ting-s.mp3", "audio/tizuqiu-a.mp3", "audio/tizuqiu-b.mp3", "audio/tou-h.mp3", "audio/tou-s.mp3", "audio/tuzi-b.mp3", "audio/tuzi-h.mp3", "audio/u10s_0-long.mp3", "audio/u10s_1-yuan.mp3", "audio/u10s_2-hou.mp3", "audio/u10s_3-long.mp3", "audio/u10s_4-yuan.mp3", "audio/u11s_0-long.mp3", "audio/u11s_1-yuan.mp3", "audio/u11s_2-long.mp3", "audio/u11s_3-yuan.mp3", "audio/u11s_4-long.mp3", "audio/u11s_5-yuan.mp3", "audio/u12s_0-hou.mp3", "audio/u12s_1-long.mp3", "audio/u12s_2-hou.mp3", "audio/u12s_3-long.mp3", "audio/u12s_4-hou.mp3", "audio/u12s_5-all.mp3", "audio/u13s_0-yuan.mp3", "audio/u13s_1-long.mp3", "audio/u13s_2-long.mp3", "audio/u13s_3-yuan.mp3", "audio/u13s_4-long.mp3", "audio/u14s_0-long.mp3", "audio/u14s_1-nai.mp3", "audio/u14s_2-long.mp3", "audio/u14s_3-yuan.mp3", "audio/u14s_4-all.mp3", "audio/u2s_0-long.mp3", "audio/u2s_1-yuan.mp3", "audio/u2s_2-long.mp3", "audio/u2s_3-yuan.mp3", "audio/u2s_4-long.mp3", "audio/u2s_5-yuan.mp3", "audio/u3s_0-yuan.mp3", "audio/u3s_1-long.mp3", "audio/u3s_2-yuan.mp3", "audio/u3s_3-hou.mp3", "audio/u3s_4-long.mp3", "audio/u4s_0-yuan.mp3", "audio/u4s_1-yuan.mp3", "audio/u4s_2-long.mp3", "audio/u4s_3-yuan.mp3", "audio/u4s_4-long.mp3", "audio/u4s_5-yuan.mp3", "audio/u5s_0-long.mp3", "audio/u5s_1-yuan.mp3", "audio/u5s_2-long.mp3", "audio/u5s_3-yuan.mp3", "audio/u5s_4-long.mp3", "audio/u5s_5-yuan.mp3", "audio/u6s_0-long.mp3", "audio/u6s_1-nai.mp3", "audio/u6s_2-long.mp3", "audio/u6s_3-nai.mp3", "audio/u6s_4-long.mp3", "audio/u6s_5-long.mp3", "audio/u7s_0-long.mp3", "audio/u7s_1-hou.mp3", "audio/u7s_2-long.mp3", "audio/u7s_3-hou.mp3", "audio/u7s_4-long.mp3", "audio/u7s_5-hou.mp3", "audio/u8s_0-yuan.mp3", "audio/u8s_1-long.mp3", "audio/u8s_2-yuan.mp3", "audio/u8s_3-long.mp3", "audio/u9s_0-long.mp3", "audio/u9s_1-long.mp3", "audio/u9s_2-long.mp3", "audio/u9s_3-long.mp3", "audio/u9s_4-yuan.mp3", "audio/wan-s.mp3", "audio/wanju-b.mp3", "audio/wanju-h.mp3", "audio/wo-h.mp3", "audio/wo-s.mp3", "audio/wobupa-a.mp3", "audio/wobupa-b.mp3", "audio/wode-a.mp3", "audio/wode-b.mp3", "audio/woele-a.mp3", "audio/woele-b.mp3", "audio/wohenhao-a.mp3", "audio/wohenhao-b.mp3", "audio/wohenkaixin-a.mp3", "audio/wohenkaixin-b.mp3", "audio/wohenlei-a.mp3", "audio/wohenlei-b.mp3", "audio/wohuihuaxue-a.mp3", "audio/wohuihuaxue-b.mp3", "audio/wojiao-a.mp3", "audio/wojiao-b.mp3", "audio/women-b.mp3", "audio/women-h.mp3", "audio/womenquwanba-a.mp3", "audio/womenquwanba-b.mp3", "audio/woqisui-a.mp3", "audio/woqisui-b.mp3", "audio/woshibilishiren-a.mp3", "audio/woshibilishiren-b.mp3", "audio/woxihuanhongse-a.mp3", "audio/woxihuanhongse-b.mp3", "audio/woyao-a.mp3", "audio/woyaochijiaozi-a.mp3", "audio/woyaochijiaozi-b.mp3", "audio/woyaoheshui-a.mp3", "audio/woyaoheshui-b.mp3", "audio/woyeyao-a.mp3", "audio/woyeyao-b.mp3", "audio/woyingle-a.mp3", "audio/woyingle-b.mp3", "audio/woyoulegao-a.mp3", "audio/woyoulegao-b.mp3", "audio/wu3-h.mp3", "audio/wu3-s.mp3", "audio/xiangjiao-b.mp3", "audio/xiangjiao-h.mp3", "audio/xiao-h.mp3", "audio/xiao-s.mp3", "audio/xiaxuele-a.mp3", "audio/xiaxuele-b.mp3", "audio/xiayule-a.mp3", "audio/xiayule-b.mp3", "audio/xiexie-b.mp3", "audio/xiexie-h.mp3", "audio/xihuan-b.mp3", "audio/xihuan-h.mp3", "audio/xinniankuaile-a.mp3", "audio/xinniankuaile-b.mp3", "audio/xiongmao-h.mp3", "audio/xuexiao-b.mp3", "audio/xuexiao-h.mp3", "audio/yanjing-b.mp3", "audio/yanjing-h.mp3", "audio/yanse-b.mp3", "audio/yanse-h.mp3", "audio/yeye-b.mp3", "audio/yeye-h.mp3", "audio/yi1-h.mp3", "audio/yi1-s.mp3", "audio/you-h.mp3", "audio/you-s.mp3", "audio/youyong-b.mp3", "audio/youyong-h.mp3", "audio/yu2-h.mp3", "audio/yu2-s.mp3", "audio/yue-h.mp3", "audio/yue-s.mp3", "audio/zaijian-b.mp3", "audio/zaijian-h.mp3", "audio/zheshi-a.mp3", "audio/zheshi-b.mp3", "audio/zheshishenme-a.mp3", "audio/zheshishenme-b.mp3", "audio/zheshiwomama-a.mp3", "audio/zheshiwomama-b.mp3", "audio/zheshixiongmao-a.mp3", "audio/zheshixiongmao-b.mp3", "audio/zhongguo-a.mp3", "audio/zhongguo-b.mp3", "audio/zou-h.mp3", "audio/zou-s.mp3", "audio/zuiba-b.mp3", "audio/zuiba-h.mp3", "audio/zuo-h.mp3", "audio/zuo-s.mp3"];

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
