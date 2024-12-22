// const CACHE_NAME = 'landing-game-v1';
// const ASSETS = [
//     'index.html',
//     'styles.css',
//     'script.js',
//     'manifest.json',
//     'assets/rocket.png'
// ];
//
// self.addEventListener('install', event => {
//     event.waitUntil(
//         caches.open(CACHE_NAME).then(cache => {
//             return cache.addAll(ASSETS);
//         })
//     );
// });
//
// self.addEventListener('activate', event => {
//     event.waitUntil(
//         caches.keys().then(keyList => {
//             return Promise.all(keyList.map(key => {
//                 if (key !== CACHE_NAME) {
//                     return caches.delete(key);
//                 }
//             }));
//         })
//     );
// });

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
