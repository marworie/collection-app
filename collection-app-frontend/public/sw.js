// Service worker: tarayıcının arka planında çalışan yardımcı
// Uygulamanın kabuğunu (html, js, css) önbelleğe alır böylece daha hızlı açılır

const CACHE_NAME = 'koleksiyonum-v1'

// Yüklenince bekletmeden devreye gir
self.addEventListener('install', () => self.skipWaiting())

// Devreye girince eski sürüm önbellekleri temizle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // API isteklerine ve GET olmayan isteklere ASLA dokunma (veriler hep güncel gelsin)
  if (request.method !== 'GET' || url.pathname.startsWith('/api')) return

  // Sayfa açılışı: önce internetten dene, internet yoksa önbellekteki sayfayı göster
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put('/', copy))
          return response
        })
        .catch(() => caches.match('/'))
    )
    return
  }

  // JS/CSS dosyaları (/assets/...): adları her build'de değiştiği için önce önbellekten ver
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(response => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy))
          return response
        })
      )
    )
  }
})