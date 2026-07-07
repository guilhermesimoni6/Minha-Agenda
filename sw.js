// Service Worker - Atividades Diárias
// Faz cache do "esqueleto" do app pra abrir rápido / funcionar offline.
// Chamadas pro Google (Calendar/Drive) sempre vão direto pra rede.
// O HTML principal usa "network-first": sempre busca a versão mais nova primeiro,
// e só cai pro cache se estiver sem internet. Assim, atualizações no GitHub chegam
// no app sem precisar reinstalar.

const CACHE_NAME = "atividades-shell-v36";
const SHELL_FILES = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  // Nunca cacheia chamadas de API do Google (precisa sempre ser atual)
  if (url.includes("googleapis.com") || url.includes("accounts.google.com")) {
    return;
  }

  const isHTML = event.request.mode === "navigate" || url.endsWith("index.html") || url.endsWith("/");

  if (isHTML) {
    // Network-first: tenta buscar a versão mais nova; se falhar (sem internet), usa o cache
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Demais arquivos (ícones, manifest): cache-first, normal
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});
