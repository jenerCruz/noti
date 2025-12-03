// Nombre de la caché y lista de archivos esenciales a precargar
const CACHE_NAME = 'notion-hr-cache-v1';
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",

  // CSS
  "./assets/css/tailwind.min.css",

  // JS internos
  "./assets/js/dexie.min.js",
  "./assets/js/index.global.min.js",

  // Íconos
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
];
// Activación
self.addEventListener("activate", event => {
  console.log("[SW] Activando service worker...");
  
  // Limpiar caches viejos
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Cache antiguo eliminado:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch → Estrategia: Cache first, fallback to network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      
      return fetch(event.request)
        .then(response => {
          // Guardar en cache dinámicamente
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Opcional: puedes devolver un offline.html aquí
          return caches.match("./index.html");
        });
    })
  );
});