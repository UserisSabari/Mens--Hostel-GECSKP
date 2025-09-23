const CACHE_NAME = 'mh-app-v3';
const STATIC_CACHE = 'mh-app-static-v3';

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('Opened static cache');
      return cache.addAll([
        '/',
        '/login',
        '/manifest.json',
        '/logo.png',
        '/icon-512.png'
      ]);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - implement different strategies for different types of requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // API requests - BYPASS SERVICE WORKER CACHE COMPLETELY to avoid
  // serving stale or user-mixed responses that depend on Authorization.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Navigation requests - avoid caching HTML shell; always network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(async () => {
      // Offline fallback to cached root if available
      const cache = await caches.open(STATIC_CACHE);
      return cache.match('/') || new Response('Offline', { status: 503 });
    }));
    return;
  }
  
  // Static assets - cache first
  event.respondWith(handleStaticRequest(event.request));
});

async function handleNavigationRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match('/');
  
  // Fetch fresh content in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  // Return cached version immediately, or fetch if no cache
  return cachedResponse || fetchPromise;
}

async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Handle background sync tasks
  console.log('Background sync triggered');
  return Promise.resolve();
} 