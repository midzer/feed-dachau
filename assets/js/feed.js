let ws, timeout, pingInterval, main, reconnectAttempts = 0

const WEBSOCKET_URL = 'wss://api.feed-dachau.de/ws/'
const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_BASE_DELAY = 1000 // 1s

function ping() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
        timeout = setTimeout(() => {
            console.warn('WebSocket ping timeout. Connection likely dead.')
            cleanupWebSocket()
            scheduleReconnect()
        }, 10000)
    }
}

function pong() {
    clearTimeout(timeout)
}

function cleanupWebSocket() {
    if (!ws) return
    clearInterval(pingInterval)
    clearTimeout(timeout)
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
    }
    ws = null
}

function scheduleReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max WebSocket reconnect attempts reached. Please reload page.')
        return
    }

    const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts)
    const jitter = Math.random() * 1000

    console.log(`Reconnecting in ${delay + jitter}ms (attempt ${reconnectAttempts + 1})`)
    reconnectAttempts++

    setTimeout(() => {
        initWebSocket()
    }, delay + jitter)
}

function initWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return
    }

    ws = new WebSocket(WEBSOCKET_URL)

    ws.onopen = () => {
        console.log('WebSocket connected')
        reconnectAttempts = 0
        clearInterval(pingInterval)
        pingInterval = setInterval(ping, 30000)
        ping()
    }

    ws.onmessage = message => {
        if (message.data === 'pong') {
            pong()
            return
        }
        createFeed(message)
    }

    ws.onclose = event => {
        console.log(`WebSocket closed: code=${event.code}, reason=${event.reason}`)
        cleanupWebSocket()
        scheduleReconnect()
    }

    ws.onerror = error => {
        console.error('WebSocket error:', error)
    }
}

// Close WS when page is hidden / going to bfcache
window.addEventListener('pagehide', () => {
    cleanupWebSocket()
})

// Reopen WS when page is restored from bfcache
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        reconnectAttempts = 0
        initWebSocket()
    }
})

// Handle network status
window.addEventListener('offline', () => {
    console.log('Network offline. Closing WebSocket.')
    cleanupWebSocket()
})

window.addEventListener('online', () => {
    console.log('Network online. Attempting reconnect.')
    reconnectAttempts = 0
    initWebSocket()
})

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(pingInterval)
    }
    else {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            reconnectAttempts = 0
            initWebSocket()
        }
        else {
            clearInterval(pingInterval)
            pingInterval = setInterval(ping, 30000)
        }
        if (navigator.clearAppBadge) {
            navigator.clearAppBadge().catch(err => console.warn('Badge clear failed:', err))
        }
    }
})

// urlB64ToUint8Array is a magic function that will encode the base64 public key
// to Array buffer which is needed by the subscription option
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

function createSVG(icon) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.classList.add('icon')
    svg.classList.add(`icon--${icon}`)
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use')
    use.setAttributeNS(
        'http://www.w3.org/1999/xlink',
        'href', 
        `/assets/icons/sprite.svg#${icon}`)
    svg.appendChild(use)

    return svg
}

function appendBadge(parent) {
    const badge = document.createElement('span')
    badge.className = 'badge badge-pill badge-secondary ml-2'
    badge.textContent = 'NEU'
    parent.appendChild(badge)
}

function createFeed(message) {
    const feedArray = JSON.parse(message.data)
    const frag = document.createDocumentFragment()
    feedArray.forEach(feed => {
        // Date
        const date = document.createElement('span')
        const feedDate = new Date(feed.date)
        const today = new Date()
        const isToday =
            feedDate.getFullYear() === today.getFullYear() &&
            feedDate.getMonth() === today.getMonth() &&
            feedDate.getDate() === today.getDate();
        const formattedDate = new Intl.DateTimeFormat('de-DE', {
            day: '2-digit',
            month: '2-digit'
        }).format(feedDate)

        date.className = isToday ? 'text-white' : 'font-weight-light'
        date.textContent = isToday ? 'Heute' : formattedDate

        // Time
        const time = document.createElement('span')
        time.className = 'font-weight-light'
        const formattedTime = feedDate.toLocaleTimeString('de-De',
            { hour: "2-digit", minute: "2-digit" })
        time.textContent = formattedTime

        // Source
        const source = document.createElement('span')
        source.className = 'font-weight-light text-truncate'
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

        // Action buttons
        const btnContainer = document.createElement('div')
        btnContainer.className = 'btn-container'

        // Link
        if (feed.link) {
            const externalLink = document.createElement('a')
            externalLink.className = 'badge badge-primary'
            externalLink.href = feed.link
            externalLink.rel = 'nofollow noopener'
            externalLink.setAttribute('title', 'Beitrag öffnen')
            externalLink.setAttribute('aria-label', 'Beitrag öffnen')
            externalLink.appendChild(createSVG('external-link'))
            btnContainer.appendChild(externalLink)
        }
        // Social
        if (navigator.share) {
            const shareLink = document.createElement('a')
            shareLink.className = 'badge badge-primary ml-2'
            shareLink.setAttribute('role', 'button')
            shareLink.setAttribute('title', 'Beitrag teilen')
            shareLink.setAttribute('aria-label', 'Beitrag teilen')
            shareLink.onclick = () => {
                navigator.share({
                    title: feed.title,
                    url: feed.link
                }).then(() => console.log('Successful share'))
                .catch((error) => console.log('Error sharing', error))
            }
            shareLink.appendChild(createSVG('share-2'))
            btnContainer.appendChild(shareLink)
        }
        // Append all to frag
        frag.insertBefore(time, frag.childNodes[0])
        frag.insertBefore(date, frag.childNodes[0])
        frag.insertBefore(source, frag.childNodes[0])
        frag.insertBefore(btnContainer, frag.childNodes[0]);

        if (feed.summary) {
            const summary = document.createElement('summary')
            summary.className = 'h6 m-0'
            summary.textContent = feed.title
            summary.setAttribute('title', 'Details zeigen')
            if (feedArray.length === 1) {
                appendBadge(summary)
            }

            const details = document.createElement('details')
            details.textContent = feed.summary
            details.addEventListener('toggle', () => {
                if (details.open) {
                    summary.setAttribute('title', 'Details schließen')
                } else {
                    summary.setAttribute('title', 'Details öffnen')
                }
            });
            details.appendChild(summary)
            frag.insertBefore(details, frag.childNodes[0])
        }
        else {
            const heading = document.createElement('div')
            heading.className = 'h6 m-0'
            heading.textContent = feed.title
            if (feedArray.length === 1) {
                appendBadge(heading)
            }
            frag.insertBefore(heading, frag.childNodes[0])
        }
    })
    if (!main) {
        main = document.querySelector('main')
    }
    main.insertBefore(frag, main.childNodes[0])
}

initWebSocket()
