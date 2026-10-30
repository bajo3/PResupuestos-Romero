// Modo sin conexión: guarda la aplicación en el dispositivo para que abra sin internet.
// Los datos viven en el dispositivo y se suben a Supabase cuando vuelve la conexión.
const CACHE = 'crm-lg-v1'
const SHELL = ['/', '/manifest.webmanifest', '/logo-lucas-gallastagui.png']

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await cache.addAll(SHELL)
    try {
      const html = await (await fetch('/', { cache: 'reload' })).text()
      const urls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
      await cache.addAll(urls)
    } catch { /* se guardan después, a medida que se usan */ }
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key)
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // Supabase, dólar, etc. van siempre a la red

  // La pantalla principal: primero la red (para tener siempre la versión nueva), si no hay red, la guardada
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put('/', copy))
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  // Archivos de la app: primero lo guardado
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(req, copy))
          }
          return res
        }),
    ),
  )
})
