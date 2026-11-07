// GymBro Lite: funziona offline. Cambia VERSIONE a ogni aggiornamento dell'app.
const VERSIONE = "gymbro-lite-v3";
const FILE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSIONE).then(c => c.addAll(FILE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== VERSIONE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
// Risponde subito dalla copia salvata e intanto scarica la versione nuova, se c'è rete.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  e.respondWith(caches.open(VERSIONE).then(async cache => {
    const salvato = await cache.match(req, { ignoreSearch: true });
    const rete = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    }).catch(() => salvato || (req.mode === "navigate" ? cache.match("./index.html") : undefined));
    return salvato || rete;
  }));
});
