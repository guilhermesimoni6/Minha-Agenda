const CACHE_NAME = "atividades-shell-v103";
const SHELL_FILES = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = e.request.url;
  if (url.includes("googleapis.com") || url.includes("accounts.google.com") || url.includes("gstatic.com")) return;
  const isHTML = e.request.mode === "navigate" || url.endsWith("index.html") || url.endsWith("/");
  if (isHTML) {
    e.respondWith(fetch(e.request).then(r => {
      const c = r.clone();
      caches.open(CACHE_NAME).then(ca => ca.put(e.request, c));
      return r;
    }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).catch(() => c)));
});

// Abre o app ao clicar na notificação
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("./");
    })
  );
});
