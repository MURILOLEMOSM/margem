// Margem service worker: app shell em cache, fontes e capas em cache de execução
const V = "margem-__VERSION__";
const SHELL = ["./", "index.html", "manifest.webmanifest", "styles.css", "app.js", "sync.js", "config.js", "vendor/supabase-2.116.0.js", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (u.hostname === "openlibrary.org") return; // busca sempre online
  if (u.origin === location.origin) {
    // rede primeiro para receber atualizações, cache se estiver offline
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$|covers\.openlibrary\.org$|archive\.org$/.test(u.hostname)) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { const c = r.clone(); caches.open(V + "-rt").then(x => x.put(e.request, c)); return r; })));
  }
});
