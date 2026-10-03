const version = '1.9.1';
const cacheName = `feed-dachau-${version}`;

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(
        [
          '/index.html',
          '/assets/css/main.css',
          '/assets/js/app.js'
        ]
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== "POST") {
    event.respondWith(
      caches.open(cacheName).then(function(cache) {
        return fetch(event.request).then(function(response) {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    );
  }
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) {
            return name.startsWith('feed-dachau-') && name !== cacheName;
          })
          .map(function(name) {
            return caches.delete(name);
          })
      );
    })
  );
});

self.addEventListener('push', event => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '../../android-chrome-192x192.png',
    data: data.link
  });
  if (navigator.setAppBadge) {
    navigator.setAppBadge();
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action !== 'close') {
    clients.openWindow(event.notification.data);
  }
});
