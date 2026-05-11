const APP_VERSION = '202605112215';
const APP_SHELL_CACHE = `libretv-shell-${APP_VERSION}`;
const OFFLINE_URL = '/offline.html';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/player.html',
  '/watch.html',
  '/about.html',
  '/diagnostics.html',
  OFFLINE_URL,
  '/manifest.json',
  '/css/styles.css',
  '/css/index.css',
  '/css/player.css',
  '/css/watch.css',
  '/js/config.js',
  '/js/proxy-auth.js',
  '/js/customer_site.js',
  '/js/ui.js',
  '/js/api.js',
  '/js/douban.js',
  '/js/password.js',
  '/js/search.js',
  '/js/config-manager.js',
  '/js/source-health.js',
  '/js/onboarding.js',
  '/js/app.js',
  '/js/player-errors.js',
  '/js/player.js',
  '/js/diagnostics.js',
  '/js/watch.js',
  '/js/index-page.js',
  '/js/version-check.js',
  '/js/pwa-register.js',
  '/libs/tailwindcss.min.js',
  '/libs/sha256.min.js',
  '/libs/hls.min.js',
  '/libs/artplayer.min.js',
  '/image/logo.png',
  '/image/logo-black.png',
  '/image/icon-192.png',
  '/image/icon-512-maskable.png'
];

function isNetworkOnlyRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();

  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/proxy/') ||
    pathname.includes('/api.php/') ||
    pathname.endsWith('.m3u8') ||
    pathname.endsWith('.ts') ||
    pathname.endsWith('.m4s') ||
    pathname.endsWith('.mp4') ||
    pathname.endsWith('.webm') ||
    request.destination === 'video' ||
    request.destination === 'audio'
  );
}

async function networkFirst(request) {
  const cache = await caches.open(APP_SHELL_CACHE);

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    return cached || cache.match(OFFLINE_URL) || cache.match('/');
  }
}

async function cacheFirstWithRefresh(request) {
  const cache = await caches.open(APP_SHELL_CACHE);
  const cached = await cache.match(request);

  const refresh = fetch(request)
    .then(response => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || refresh || fetch(request);
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then(cache => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('libretv-shell-') && cacheName !== APP_SHELL_CACHE)
          .map(cacheName => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || isNetworkOnlyRequest(event.request)) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirstWithRefresh(event.request));
});
