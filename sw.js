// sw.js - Service Worker

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

// Push event (FCM / Web Push)
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Timer Alert',
    body: 'Your timer is about to finish.',
    icon: '/images/Phreeoni.png',
    url: '/'
  };

  if (event.data) {
    const data = event.data.json();

    // Handle both notification & data payloads
    payload.title = data.title || data.notification?.title || payload.title;
    payload.body  = data.body  || data.notification?.body  || payload.body;
    payload.icon  = data.icon  || payload.icon;
    payload.url   = data.url   || payload.url;
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.icon,
    vibrate: [200, 100, 200],
    tag: 'timer-alert',
    requireInteraction: true, // IMPORTANT for timers
    data: {
      url: payload.url
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(url)) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
