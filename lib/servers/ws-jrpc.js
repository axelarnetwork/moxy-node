const http = require('http');
const WebSocket = require('ws');

module.exports = (requestRouter, notifications, notificationRouter) => {
  // Create a http server for the WebSocket connection upgrade
  const server = http.createServer();
  const websocketServer = new WebSocket.Server({ server });

  // On a client connection, handle the specific websocket channel
  websocketServer.on('connection', (ws) => {
    // On a message received from the client
    ws.on('message', (message) => {
      const { jsonrpc, method, params, id } = JSON.parse(message);

      // Create a callback function that bakes in `jsonrpc` and `id` (to match generic response callback)
      const callback = (err, result) => ws.send(JSON.stringify({ jsonrpc, result, id }));

      // Get the correct request router method and route the call
      requestRouter(method, params)(params, callback);
    });

    if (!notifications) return;

    notifications.on('message', (message) => {
      const { jsonrpc } = message;

      // Create a callback function that bakes in `jsonrpc` and `id` (to match generic response callback)
      const callback = (err, { method, params }) => ws.send(JSON.stringify({ jsonrpc, method, params }));

      notificationRouter(message, callback);
    });
  });

  return server;
};
