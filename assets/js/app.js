// urlB64ToUint8Array is a magic function that will encode the base64 public key
// to Array buffer which is needed by the subscription option
function urlB64ToUint8Array (base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function ping () {
  ws.send('ping')
  timeout = setTimeout(() => {
    console.log('WebSocket connection closed. Please reload page.')
  }, 5000)
}

function pong () {
  clearTimeout(timeout)
}

function createSVG (icon) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.classList.add('icon')
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use')
  use.setAttributeNS(
    'http://www.w3.org/1999/xlink',
    'href', 
    `/assets/icons/sprite.svg#${icon}`)
  svg.appendChild(use)
  
  return svg
}

function checkNotificationPromise () {
  try {
    Notification.requestPermission().then();
  } catch (e) {
    return false
  }
  return true
}

function handlePermission (permission) {
  // Whatever the user answers, we make sure Chrome stores the information
  if (!('permission' in Notification)) {
    Notification.permission = permission;
  }
  // set the button to shown or hidden, depending on what the user answers
  if (Notification.permission === 'denied' || Notification.permission === 'default') {
    pushButton.disabled = false
  }
  else {
    pushButton.disabled = true
  }
}

function askNotificationPermission() {
  // function to actually ask the permissions
  // Let's check if the browser supports notifications
  if (!'Notification' in window) {
    console.log('This browser does not support notifications.')
  }
  else {
    if (checkNotificationPromise()) {
      Notification.requestPermission().then((permission) => handlePermission(permission))
    }
    else {
      Notification.requestPermission(function(permission) {
        handlePermission(permission)
      })
    }
  }
}

const ws = new WebSocket('wss://feed-dachau.de/api/ws'),
  feedbox = document.getElementById('feedbox')

let timeout

ws.onopen = () => setInterval(ping, 30000)

ws.onmessage = message => {
  if (message.data === 'pong') {
    pong()
    return
  }
  const feedArray = JSON.parse(message.data)
  const frag = document.createDocumentFragment()
  feedArray.forEach(feed => {
    // Date
    const date = document.createElement('span')
    const feedDate = new Date(feed.date)
    const formattedDate = new Intl.DateTimeFormat('de-DE').format(feedDate)
    date.textContent = formattedDate

    // Time
    const time = document.createElement('span')
    const formattedTime = feedDate.toLocaleTimeString('de-De')
    time.textContent = formattedTime

    // Source
    const source = document.createElement('span')
    source.className = 'text-truncate'
    let hostname
    if (feed.link) {
      const url = new URL(feed.link)
      hostname = url.hostname
    }
    else {
      hostname = 'feed-dachau.de'
    }
    if (hostname.startsWith('www.')) {
      hostname = hostname.replace('www.', '')
    }
    source.textContent = hostname

    // Link
    const linkContainer = document.createElement('div')
    const linkHeading = document.createElement('h2')
    linkHeading.className = 'h6 d-inline'
    const link = document.createElement('a')
    link.href = feed.link
    link.textContent = feed.title
    link.dataset.toggle = 'tooltip'
    link.dataset.placement = 'bottom'
    link.title = feed.summary
    if (feedArray.length === 1) {
      // Show "NEU" badge
      const badge = document.createElement('span')
      badge.className = 'badge badge-secondary mr-2'
      badge.textContent = 'NEU'
      linkContainer.appendChild(badge)
    }
    linkHeading.appendChild(link)
    linkContainer.appendChild(linkHeading)

    // Plus button
    let id = `${formattedDate}-${formattedTime}`
    id = id.replace(/[\.:]+/g, '')
    if (feed.summary) {
      const plusLink = document.createElement('a')
      plusLink.className = 'badge badge-secondary ml-2'
      plusLink.dataset.toggle = 'collapse'
      plusLink.href = `#collapse-${id}`
      plusLink.setAttribute('role', 'button')
      plusLink.setAttribute('aria-expanded', false)
      plusLink.setAttribute('aria-label', 'Zusammenfassung anzeigen')
      plusLink.setAttribute('aria-controls', `#collapse-${id}`)
      plusLink.appendChild(createSVG('plus'))
      linkContainer.appendChild(plusLink)
    }
    // Social share
    if (navigator.share) {
      const shareLink = document.createElement('a')
      shareLink.className = 'badge badge-secondary ml-2'
      shareLink.setAttribute('role', 'button')
      shareLink.setAttribute('aria-label', 'Beitrag teilen')
      shareLink.onclick = () => {
        navigator.share({
          title: feed.title,
          url: feed.link
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error))
      }
      
      shareLink.appendChild(createSVG('share-2'))
      linkContainer.appendChild(shareLink)
    }
    const facebookLink = document.createElement('a')
    facebookLink.className = 'badge badge-secondary ml-2'
    facebookLink.href = `https://www.facebook.com/sharer/sharer.php?u=${feed.link}`
    facebookLink.rel = 'nofollow noopener'
    facebookLink.setAttribute('aria-label', 'Auf Facebook teilen')
    facebookLink.appendChild(createSVG('facebook'))
    linkContainer.appendChild(facebookLink)
    const twitterLink = document.createElement('a')
    twitterLink.className = 'badge badge-secondary ml-2'
    twitterLink.href = `https://twitter.com/share?text=${feed.title}&url=${feed.link}`
    twitterLink.rel = 'nofollow noopener'
    twitterLink.setAttribute('aria-label', 'Auf Twitter teilen')
    twitterLink.appendChild(createSVG('twitter'))
    linkContainer.appendChild(twitterLink)

    // Collapse
    if (feed.summary) {
      const collapse = document.createElement('div')
      collapse.className = 'collapse'
      collapse.id = `collapse-${id}`
      collapse.innerHTML = feed.summary
      linkContainer.appendChild(collapse)
    }
    // Append all to frag
    frag.insertBefore(linkContainer, frag.childNodes[0])
    frag.insertBefore(source, frag.childNodes[0])
    frag.insertBefore(time, frag.childNodes[0])
    frag.insertBefore(date, frag.childNodes[0])
  })
  window.requestAnimationFrame(() => {
    feedbox.insertBefore(frag, feedbox.childNodes[0])

    // Initialize plusButtons
    const plusButtons = Array.from(document.querySelectorAll('[data-toggle="collapse"]'))
    plusButtons.forEach(button => new Collapse(button))
  })
}
// Push button
const pushButton = document.getElementById('push-btn')
pushButton.onclick = subscribe

function setSubscribeButton() {
  pushButton.onclick = subscribe
  pushButton.innerHTML = pushButton.innerHTML.replace('deaktivieren', 'aktivieren')
  pushButton.dataset.title = 'Push-Benachrichtigungen aktivieren'
  pushButton.setAttribute('aria-label', 'Push-Benachrichtigungen aktivieren')
}

function setUnsubscribeButton() {
  pushButton.onclick = unsubscribe
  pushButton.innerHTML = pushButton.innerHTML.replace('aktivieren', 'deaktivieren')
  pushButton.dataset.title = 'Push-Benachrichtigungen deaktivieren'
  pushButton.setAttribute('aria-label', 'Push-Benachrichtigungen deaktivieren')
}

function postJSON (object) {
  fetch('https://feed-dachau.de/api/push', {
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
    }).then(setUnsubscribeButton)
  }).catch(function(e) {
    if (Notification.permission === 'denied') {
      // The user denied the notification permission which
      // means we failed to subscribe and the user will need
      // to manually change the notification permission to
      // subscribe to push messages
      console.log('Permission for Notifications was denied');
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
        }).then(setSubscribeButton)
      })
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
