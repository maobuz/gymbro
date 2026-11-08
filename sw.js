// GymBro Lite: funziona offline e prende subito le versioni nuove quando c'è rete.
const VERSIONE = "gymbro-lite-v11";
const FILE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  // cache: "reload" salta la cache del browser, così non si salva una copia vecchia.
  e.waitUntil(caches.open(VERSIONE)
    .then(c => Promise.all(FILE.map(u => fetch(u, { cache: "reload" }).then(r => { if (r.ok) return c.put(u, r); }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== VERSIONE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const pagina = req.mode === "navigate" || /\/(index\.html)?$/.test(new URL(req.url).pathname);
  e.respondWith(caches.open(VERSIONE).then(async cache => {
    const salvato = await cache.match(req, { ignoreSearch: true });
    const rete = fetch(req, { cache: "no-cache" }).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    });
    if (pagina) {
      // La pagina: prima la rete (versione aggiornata), senza rete la copia salvata.
      return rete.catch(() => salvato || cache.match("./index.html"));
    }
    // Icone, font e il resto: subito dalla copia salvata, aggiornata in background.
    return salvato || rete.catch(() => undefined);
  }));
});
