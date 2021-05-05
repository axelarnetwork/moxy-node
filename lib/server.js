'use strict';

const httpClient = require('./clients/http-jrpc');
const wsClient = require('./clients/ws-jrpc');
const httpServer = require('./servers/http-jrpc');
const wsServer = require('./servers/ws-jrpc');
const management = require('./api/management');
const ethereum = require('./api/ethereum');
const bitcoin = require('./api/bitcoin');

module.exports = async (options = {}) => {
  const { rpcUrl, httpPort = 3000, wsPort = 3001, transientState = [] } = options;

  const startTime = new Date().getTime();

  const { getFromNode, close: closeClient } = rpcUrl.startsWith('http')
    ? await httpClient(rpcUrl)
    : await wsClient(rpcUrl);

  // Pull proxy and management methods
  const ethereumMethods = ethereum(getFromNode, transientState);
  const bitcoinMethods = bitcoin(getFromNode, transientState);
  const managementMethods = management(transientState);

  // Flatten methods
  const methods = Object.assign({}, ethereumMethods, bitcoinMethods, managementMethods);

  // Route call to existing proxy or management methods, if not, passthrough to real server
  const router = (method, params) =>
    typeof methods[method] === 'function'
      ? methods[method](Math.floor(new Date().getTime() - startTime))
      : (params, callback) => getFromNode(method, params, callback);

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
