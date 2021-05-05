const http = require('http');
const WebSocket = require('ws');

module.exports = (router) => {
  const server = http.createServer();
  const websocketServer = new WebSocket.Server({ server });

  websocketServer.on('connection', (ws) => {
    ws.on('message', (message) => {
      const { jsonrpc, method, params, id } = JSON.parse(message);
      const callback = (err, result) => ws.send(JSON.stringify({ jsonrpc, result, id }));
      router(method, params)(params, callback);
    });
  });

  return server;
};
