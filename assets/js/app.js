function ping () {
  ws.send('ping')
  timeout = setTimeout(() => {
    console.log('WebSocket connection closed. Please reload page.')
  }, 5000)
}

function pong () {
  clearTimeout(timeout)
}

function disablePushButton (permission) {
  if (permission === "granted") {
    pushButton.disabled = true
  }
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

const ws = new WebSocket('wss://feed-dachau.de/api:63409'),
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
    source.className = 'text-break'
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

      // Show notification
      if (Notification.permission === "granted") {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification('1 neuer Feed', {
            body: `${hostname} | ${feed.title}`,
            icon: '../../android-chrome-192x192.png',
          })
        })
      }
    }
    linkContainer.appendChild(link)

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
pushButton.onclick = () => {
  Notification.requestPermission().then(permission => disablePushButton(permission))
}
disablePushButton(Notification.permission)

// Install Service Worker
navigator.serviceWorker.register('sw.js')
