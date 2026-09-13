var CACHE = "galaga-coop-v31";
var PRECACHE = [
  "/",
  "/index.html",
  "/css/app.css",
  "/js/galaga.js",
  "/js/pvp.js",
  "/js/touchpad.js",
  "/js/net.js",
  "/js/netcodec.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(PRECACHE.map(function (url) {
        return fetch(url, { cache: "reload" }).then(function (res) {
          if (!res || res.status !== 200) throw new Error("precached failed");
          return cache.put(url, res);
        });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf("/api/") === 0) return;
  event.respondWith(
    fetch(req).then(function (res) {
      if (!res || res.status !== 200 || res.type === "opaque") return res;
      var copy = res.clone();
      caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (cached) {
        if (cached) return cached;
        if (req.mode === "navigate") return caches.match("/index.html");
        return cached;
      });
    })
  );
});
