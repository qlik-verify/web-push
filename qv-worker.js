

self.addEventListener('push', (event) => {
    self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
    }).then((clients) => {
        if (clients && clients.length) {
            console.log(clients[0]);
            clients[0].postMessage({ payload: event.data.text() });
        }
    });
})