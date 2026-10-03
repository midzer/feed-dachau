const version = '2.0.5';
const cacheName = `feed-dachau-${version}`;

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(
        [
          '/assets/css/main.css',
          '/assets/js/feed.js',
          '/assets/js/app.js'
        ]
      );
    })
  );
  self.skipWaiting();
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
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('push', event => {
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/android-chrome-192x192.png',
      data: data.link
    }).then(() => {
      if (navigator.setAppBadge) {
        return navigator.setAppBadge();
      }
    })
  );
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/android-chrome-192x192.png',
    data: data.link
  });
  if (navigator.setAppBadge) {
    navigator.setAppBadge();
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (navigator.clearAppBadge) {
    event.waitUntil(navigator.clearAppBadge());
  }

  if (!event.action || event.action === '' || event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(new URL(event.notification.data)) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data);
        }
      })
    );
  }
});
