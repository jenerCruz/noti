// Aumentar la versión del caché a 'v4' para forzar la actualización de todos los usuarios
// Si ya tenías 'v3', usa 'v4'. Si tenías 'v2', usa 'v3', etc.
const CACHE_NAME = 'notion-hr-pwa-v9'; 

// Lista de todos los archivos del App Shell. Incluye el motor SQLite.
const APP_SHELL = [
    // --- Archivos de Base ---
    './',
    './index.html',
    './manifest.json',
    
    // --- CSS ---
    './assets/css/tailwind.min.css',
    
    // --- 1. Motor de DB (CRÍTICO para SQLite) ---
    './assets/js/sql-wasm.min.js',
    './assets/js/sql-wasm.wasm', // El archivo WebAssembly debe ser cacheado
    './assets/js/db-sqlite.js',
    
    // --- 2. Lógica Core ---
    './assets/js/properties.js',
    './assets/js/rules.js',
    
    // --- 3. Utilidades UI ---
    './assets/js/responsive.js',
    './assets/js/zoom.js',
    
    // --- 4. Orquestador Principal ---
    './assets/js/views.js',
    
    // --- 5. Vistas de Extensión ---
    './assets/js/agendaView.js',
    './assets/js/kanbanNative.js',
    './assets/js/menuInject.js',
    
    // --- Imágenes/Iconos (Ajustar rutas si es necesario) ---
    // 'assets/icons/favicon.ico',
    // ... otros iconos definidos en el manifest
];


// ===============================================
// 1. EVENTO INSTALL (Instalación y Caching)
// ===============================================
self.addEventListener('install', (e) => {
    console.log('[Service Worker] Instalando. Cacheando App Shell...');
    e.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('[Service Worker] Archivos precacheados:', APP_SHELL.length);
            return cache.addAll(APP_SHELL);
        })
        .catch(err => {
            console.error('[Service Worker] Fallo al pre-cachear:', err);
        })
    );
    self.skipWaiting(); // Forzar la activación inmediata del nuevo SW
});


// ===============================================
// 2. EVENTO ACTIVATE (Limpieza de Cachés Viejos)
// ===============================================
self.addEventListener('activate', (e) => {
    console.log('[Service Worker] Activando. Limpiando cachés viejos...');
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Eliminando caché antiguo:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim(); // Tomar control de las páginas no controladas
});


// ===============================================
// 3. EVENTO FETCH (Estrategia de Caching)
// ===============================================
self.addEventListener('fetch', (e) => {
    // Solo cachear peticiones GET
    if (e.request.method !== 'GET') return;

    // Estrategia: Cache-First para el App Shell (lo más rápido)
    e.respondWith(
        caches.match(e.request)
        .then((response) => {
            // Si el archivo está en caché, lo sirve inmediatamente
            if (response) {
                return response;
            }
            
            // Si no está en caché (ej. nuevos datos, recursos externos)
            return fetch(e.request).catch(() => {
                // Aquí podrías servir una página de "Offline" si la petición falla
                console.log('[Service Worker] Fallo de red para:', e.request.url);
            });
        })
    );
});
