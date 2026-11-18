// Service hors connexion du plan de salle (copié en sw.js par outils/construire-demo.mjs).
// La page s'ouvre même sans réseau, avec la dernière version vue ; en ligne, elle se met à jour toute seule.
const VERSION = 'plan-salle-codex-e3e1a9f565fe';
const COQUILLE = ['./', './index.html', './inscription.html', './fond-salle.png', './manifest.webmanifest', './icone-192.png', './icone-512.png', './icone-maskable-512.png', './icone-180.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(COQUILLE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((k) => k.startsWith('plan-salle-codex-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  // Polices et bibliothèque du code QR (version figée) : du cache d'abord, elles ne changent pas.
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com' || u.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(caches.open(VERSION).then(async (c) => (await c.match(req)) || fetch(req).then((r) => { c.put(req, r.clone()); return r; })));
    return;
  }
  // Le connecteur Veloce et tout autre site : toujours le réseau, jamais de cache.
  if (u.origin !== self.location.origin) return;
  // La page et ses fichiers : le réseau d'abord, le cache quand il n'y a pas de connexion.
  e.respondWith(
    fetch(req)
      .then((r) => { if (r.ok) { const copie = r.clone(); caches.open(VERSION).then((c) => c.put(req, copie)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))),
  );
});
