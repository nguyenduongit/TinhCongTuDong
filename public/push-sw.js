self.addEventListener('push', function (event) {
  let title = 'Thông báo Tự động';
  let options = { 
    body: 'Bạn có một thông báo mới',
    data: '/'
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options.body = data.body || options.body;
      if (data.url) options.data = data.url;
    } catch (e) {
      options.body = event.data.text() || options.body;
    }
  }
  
  const promise = self.registration.showNotification(title, options);
  event.waitUntil(promise);
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
