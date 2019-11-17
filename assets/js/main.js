const ws = new WebSocket('wss://feed-dachau/feed:63409'),
  feedbox = document.getElementById('feedbox')

ws.onmessage = message => {
    const feed = JSON.parse(message.data)

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
    const link = document.createElement('a')
    link.href = feed.link
    link.textContent = feed.title

    feedbox.insertBefore(link, feedbox.childNodes[0])
    feedbox.insertBefore(source, feedbox.childNodes[0])
    feedbox.insertBefore(time, feedbox.childNodes[0])
    feedbox.insertBefore(date, feedbox.childNodes[0])
}
