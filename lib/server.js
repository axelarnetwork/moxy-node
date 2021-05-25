const httpClient = require('./clients/http-jrpc');
const wsClient = require('./clients/ws-jrpc');
const httpServer = require('./servers/http-jrpc');
const wsServer = require('./servers/ws-jrpc');
const { getRequestRouter, getNotificationRouter } = require('./routers');

module.exports = async (options = {}) => {
  const { rpcUrl, httpPort = 3000, wsPort = 3001, transientState = [], jsonRpcVersion = 2 } = options;

  // Start time needed to track transient state from the start of the server
  const startTime = new Date().getTime();

  console.log(`\nInitiating moxy client to node at ${rpcUrl}...`);

  const { getFromNode, close: closeClient, notifications } = rpcUrl.startsWith('http')
    ? await httpClient(rpcUrl, { version: jsonRpcVersion })
    : await wsClient(rpcUrl);

  console.log('Initiated moxy client to node.');

  if (transientState.length) {
    console.log('Transient state is pre-populated.');
  }

  // Get a request router with the start time baked in, and a reference to the transient state and node client
  const requestRouter = getRequestRouter(startTime, transientState, getFromNode);

  // Get a notification router with the start time baked in, and a reference to the transient state
  const notificationRouter = getNotificationRouter(startTime, transientState);

  const hServer = httpServer(requestRouter, { version: jsonRpcVersion });
  const wServer = wsServer(requestRouter, notifications, notificationRouter);

  return {
    start: () => {
      hServer.listen(httpPort);
      wServer.listen(wsPort);
      console.log(`Listening on ${httpPort} for HTTP and ${wsPort} for WS.`);
    },
    stop: (callback) => hServer.close(() => wServer.close(() => closeClient(callback))),
  };
};
