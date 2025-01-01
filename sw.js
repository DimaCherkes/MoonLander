const CACHE_NAME = 'moon-lander-cache-v1';
const urlsToCache = [
    'index.html',
    'game.html',
    'css/styles.css',
    'css/menu.css',
    'css/global.css',
    'js/script.js',
    'js/menu.js',
    'js/physicController.js',
    'js/gameController.js',
    'assets/rocket.png',
    'assets/surface.png',
    'assets/background_canvas.png',
    'assets/icon.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

// Обработка запросов
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});

// Удаление старых кэшей
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
});
