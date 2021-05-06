'use strict';

const httpClient = require('./clients/http-jrpc');
const wsClient = require('./clients/ws-jrpc');
const httpServer = require('./servers/http-jrpc');
const wsServer = require('./servers/ws-jrpc');
const getRouter = require('./router');

module.exports = async (options = {}) => {
  const { rpcUrl, httpPort = 3000, wsPort = 3001, transientState = [] } = options;

  const startTime = new Date().getTime();

  const { getFromNode, close: closeClient } = rpcUrl.startsWith('http')
    ? await httpClient(rpcUrl)
    : await wsClient(rpcUrl);

  const router = getRouter(startTime, transientState, getFromNode);
  const hServer = httpServer(router);
  const wServer = wsServer(router);

  return {
    start: () => {
      hServer.listen(httpPort);
      wServer.listen(wsPort);
    },
    stop: (callback) => hServer.close(() => wServer.close(() => closeClient(callback))),
  };
};
