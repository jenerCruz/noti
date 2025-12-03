// Aumentar la versión para forzar la actualización del caché
CACHE_NAME = "notion-hr-cache-v6";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",

  // CSS
  "./assets/css/tailwind.min.css",

  // JS internos (¡ACTUALIZADO PARA SQLITE!)
  "./assets/js/sql-wasm-browser.min.js", // Nuevo motor JS
  "./assets/js/sql-wasm.wasm",           // Nuevo motor WebAssembly (CRUCIAL)
  "./assets/js/db-sqlite.js",            // Nuevo adaptador de DB
  
  "./assets/js/properties.js",
  "./assets/js/rules.js",
  "./assets/js/views.js",
  "./assets/js/agendaView.js",
  "./assets/js/kanbanNative.js",
  "./assets/js/menuInject.js",
  "./assets/js/zoom.js",
  "./assets/js/responsive.js", // Añadido
  
  // Íconos
  "./assets/icons/icon-32.png", // Incluido en HTML original
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];

// INSTALACIÓN (PRECACHE)
self.addEventListener("install", event => {
  console.log("[SW] Instalando...");

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[SW] Pre-cache app shell");
      return cache.addAll(APP_SHELL);
    })
  );

  self.skipWaiting();
});

// ACTIVACIÓN (Elimina cachés viejos como v2)
self.addEventListener("activate", event => {
  console.log("[SW] Activando service worker...");

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Eliminando cache viejo:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// FETCH - cache first + fallback network
self.addEventListener("fetch", event => {
  let req = event.request;

  // Normalizar GET requests (evita fallos con ?v=123)
  if (req.method !== "GET") {
    event.respondWith(fetch(req));
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(res => {
          // Guardar dinámico
          return caches.open(CACHE_NAME).then(cache => {
            // Evitar cachear peticiones externas / no seguras
            if (req.url.startsWith(self.location.origin)) {
              cache.put(req, res.clone());
            }
            return res;
          });
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
