const CACHE = "stenograft-v1";

const PRECACHE = [
  "/",
  "/dashboard",
  "/manifest.webmanifest",
  "/icon-192x192.svg",
  "/icon-512x512.svg",
];

// ── Install: précache des ressources critiques ────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(PRECACHE).catch(() => {})
    )
  );
  self.skipWaiting();
});

// ── Activate: purge des anciens caches ───────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first pour la navigation, cache-first pour les assets ─────

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Ignore les requêtes Supabase et api.video (toujours réseau)
  if (
    url.hostname.includes("supabase.co") ||
    url.hostname.includes("api.video") ||
    url.hostname.includes("ws.api.video")
  ) return;

  if (event.request.mode === "navigate") {
    // Navigation : réseau d'abord, fallback dashboard si offline
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/dashboard").then((r) => r ?? caches.match("/"))
      )
    );
    return;
  }

  // Assets statiques : cache d'abord, puis réseau
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (
          response.ok &&
          url.origin === self.location.origin &&
          !url.pathname.startsWith("/api/")
        ) {
          caches.open(CACHE).then((cache) =>
            cache.put(event.request, response.clone())
          );
        }
        return response;
      });
    })
  );
});

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: "STENOGRAFT", body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title ?? "STENOGRAFT", {
      body: data.body ?? "",
      icon: "/icon-192x192.svg",
      badge: "/icon-192x192.svg",
      vibrate: [100, 50, 100],
      data: { url: data.url ?? "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus().then((c) => c.navigate(target));
      return clients.openWindow(target);
    })
  );
});
