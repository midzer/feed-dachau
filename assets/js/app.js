function setSubscribeButton() {
  pushButton.onclick = subscribe
  pushButton.textContent = pushButton.textContent.replace('deaktivieren', 'aktivieren')
  pushButton.title = 'Push-Benachrichtigungen aktivieren'
  pushButton.setAttribute('aria-label', 'Push-Benachrichtigungen aktivieren')
}

function setUnsubscribeButton() {
  pushButton.onclick = unsubscribe
  pushButton.textContent = pushButton.textContent.replace('aktivieren', 'deaktivieren')
  pushButton.title = 'Push-Benachrichtigungen deaktivieren'
  pushButton.setAttribute('aria-label', 'Push-Benachrichtigungen deaktivieren')
}

function postJSON (object) {
  fetch('https://api.feed-dachau.de/push/', {
    method: 'post',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(object)
  })
}

function subscribe() {
  navigator.serviceWorker.ready.then(function(registration) {
    const applicationServerKey = urlB64ToUint8Array(
      'BAIOTVIHDn1kCY89skxRsSrGKBaqIXiVYWQwMSMVEORVcKL2uo4NErbfOUQxJhfXcygNP_xKV7QVH7blt2nKpwo'
    )
    const options = { applicationServerKey, userVisibleOnly: true }
    return registration.pushManager.subscribe(options)
  }).then(function(subscription) {
    return postJSON({
      do: 'subscribe',
      subscription: JSON.stringify(subscription)
    })
  }).then(setUnsubscribeButton)
  .catch(function(e) {
    if (Notification.permission === 'denied') {
      // The user denied the notification permission which
      // means we failed to subscribe and the user will need
      // to manually change the notification permission to
      // subscribe to push messages
      alert('Genehmigung für Push-Benachrichtigungen wurde abgelehnt.')
      console.log('Permission for Notifications was denied.');
    }
    else {
      // A problem occurred with the subscription
      alert('Fehler beim Aktivieren der Push-Benachrichtigungen')
      console.log('Unable to subscribe to push.', e);
    }
  })
}

function unsubscribe() {
  navigator.serviceWorker.ready.then(function(registration) {
    return registration.pushManager.getSubscription()
  })
  .then(function(subscription) {
    return subscription.unsubscribe()
      .then(function() {
        return postJSON({
          do: 'unsubscribe',
          endpoint: subscription.endpoint
        })
      }).then(setSubscribeButton)
  })
}

// Install Service Worker
if ('serviceWorker' in navigator) {
  // Delay registration until after the page has loaded, to ensure that our
  // precaching requests don't degrade the first visit experience.
  // See https://developers.google.com/web/fundamentals/instant-and-offline/service-worker/registration
  window.addEventListener('load', function () {
    // Your service-worker.js *must* be located at the top-level directory relative to your site.
    // It won't be able to control pages unless it's located at the same level or higher than them.
    // *Don't* register service worker file in, e.g., a scripts/ sub-directory!
    // See https://github.com/slightlyoff/ServiceWorker/issues/468
    
    navigator.serviceWorker.register('/sw.js')
    
    navigator.serviceWorker.ready.then(function(registration) {
      console.log('Service worker registered')
      return registration.pushManager.getSubscription()
    }).then(function(subscription) {
      if (subscription) {
        setUnsubscribeButton()
      }
    }).catch(function (e) {
      console.error('Error during service worker registration, possibly cookies are blocked:', e)
    })
  })
}
// Push button
const pushButton = document.getElementById('push-btn')
pushButton.onclick = subscribe

// Install app
const dialog = document.getElementById('install-app-dialog');
const trigger = document.getElementById('install-app-trigger');

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
});

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    dialog.close();
});

trigger.addEventListener('click', async (event) => {
    event.preventDefault();

    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
            deferredInstallPrompt = null;
        }

        return;
    }

    dialog.showModal();
});
