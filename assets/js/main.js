function ping () {
  ws.send('ping')
  timeout = setTimeout(() => {
    console.log('WebSocket connection closed. Please reload page')
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
    const url = new URL(feed.link)
    let hostname = url.hostname
    if (url.hostname.startsWith('www.')) {
      hostname = hostname.replace('www.', '')
    }
    source.textContent = hostname

    // Link
    const linkContainer = document.createElement('div')
    const link = document.createElement('a')
    link.href = feed.link
    link.textContent = feed.title
    if (feedArray.length === 1) {
      // Show "NEU" badge
      const badge = document.createElement('span')
      badge.className = 'badge badge-secondary mr-1'
      badge.textContent = 'NEU'
      linkContainer.appendChild(badge)

      // Show notification
      if (Notification.permission === "granted") {
        const options = {
          body: `${hostname} | ${feed.title}`
        }
        const n = new Notification('Feed Dachau', options)
      }
    }
    linkContainer.appendChild(link)

    frag.insertBefore(linkContainer, frag.childNodes[0])
    frag.insertBefore(source, frag.childNodes[0])
    frag.insertBefore(time, frag.childNodes[0])
    frag.insertBefore(date, frag.childNodes[0])
  })
  window.requestAnimationFrame(() => feedbox.insertBefore(frag, feedbox.childNodes[0]))
}
// Push button
const pushButton = document.getElementById('push-btn')
pushButton.onclick = () => {
  Notification.requestPermission().then(function(permission) {
    disablePushButton(permission) 
  })
}

disablePushButton(Notification.permission)
