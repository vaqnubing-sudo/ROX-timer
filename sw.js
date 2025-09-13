// sw.js - Service Worker

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installed');
  self.skipWaiting(); // Activate immediately
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activated');
  return self.clients.claim();
});

// Listen for push messages from your main app
self.addEventListener('push', (event) => {
  let data = {
    title: 'Timer',
    body: 'Timer finished!',
    icon: 'images/Phreeoni.png'
  };

  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.icon,
    vibrate: [200, 100, 200],
    tag: 'timer-notification'
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        self.clients.openWindow('https://vaqnubing-sudo.github.io/ROX-timer/');
      }
    })
  );
});
