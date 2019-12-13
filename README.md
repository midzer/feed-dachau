# feed-dachau

Landing page showing feed of local authorities, communities and news papers. Customized for [Feed Dachau](https://feed-dachau.de/). Template based on [jekyll-boilerplate](https://github.com/midzer/jekyll-boilerplate). [feed-websocket](https://github.com/midzer/feed-websocket) is used as backend

## Requirements

* Ruby

## Development

```
gem install
bundle exec jekyll serve
# => Now browse to http://localhost:4000
```

## Build

```
bundle exec jekyll build
# => _site folder is ready for deployment
```

# Customization

Modify to fit your needs

* _config.yml (title, email, description, url, repo, SEO)
* _data/feeds.yml (this data generates feeds.json which will be fetched by the backend)
* assets/js/app.js (WebSocket URL = your backend)
* impressum.md
* datenschutz.md
* site.webmanifest
* SCSS colors in _sass/core files
