const version = '1.0.1'
const cacheName = `feed-dachau-${version}`
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/assets/css/main.css',
        '/assets/js/bootstrap-native-v4.min.js',
        '/assets/js/app.js',
        '/assets/icons/sprite.svg'
      ])
      .then(() => self.skipWaiting())
    })
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.open(cacheName)
        .then(cache => cache.match(event.request, {ignoreSearch: true}))
        .then(response => {
            return response || fetch(event.request)
        })
    )
    console.log(event.request.url)
})
