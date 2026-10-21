/* UcaBiba service worker.
   - Halaman (index.html): jaringan dulu, supaya pembaruan langsung terbaca; jika offline, pakai salinan terakhir.
   - File statis (ikon, logo, manifest): cache dulu, diperbarui di belakang layar.
   - Firebase/Firestore dan semua permintaan lintas domain TIDAK disentuh (selalu data terbaru).
   Naikkan nomor VERSI setiap kali Anda mengganti file ikon/logo supaya cache lama dibuang. */
const VERSI = "ucabiba-v1";
const INTI = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./favicon.png", "./logo.png"];

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(VERSI).then(c => Promise.all(INTI.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", ev => {
  ev.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", ev => {
  const r = ev.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if (r.mode === "navigate") {
    ev.respondWith(
      fetch(r).then(res => {
        if (res.ok) { const cp = res.clone(); caches.open(VERSI).then(c => c.put("./index.html", cp)); }
        return res;
      }).catch(() => caches.match("./index.html").then(m => m || caches.match("./")))
    );
    return;
  }
  ev.respondWith(
    caches.match(r).then(m => {
      const net = fetch(r).then(res => {
        if (res.ok) { const cp = res.clone(); caches.open(VERSI).then(c => c.put(r, cp)); }
        return res;
      }).catch(() => m);
      return m || net;
    })
  );
});
