const version = '1.4.1'
const cacheName = `feed-dachau-${version}`

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
        cacheNames.filter(function(cacheName) {
          // Return true if you want to remove this cache,
          // but remember that caches are shared across
          // the whole origin
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('push', event => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '../../android-chrome-192x192.png'
  });
  if (navigator.setAppBadge) {
    navigator.setAppBadge(++newCount)
  }
})
// Set the name of the hidden property and the change event for visibility
let hidden, visibilityChange
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden"
  visibilityChange = "visibilitychange"
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden"
  visibilityChange = "msvisibilitychange"
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden"
  visibilityChange = "webkitvisibilitychange"
}
// Handle page visibility change
let newCount = 0
document.addEventListener(visibilityChange, function() {
  if (!document[hidden] && navigator.clearAppBadge) {
    navigator.clearAppBadge()
    newCount = 0
  }
}, false)
