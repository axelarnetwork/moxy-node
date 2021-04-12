'use strict';

const jayson = require('jayson');
const management = require('./management');
const ethereum = require('./ethereum');
const bitcoin = require('./bitcoin');

module.exports = (transientState, realRpcUrl, listenPort) => {
  const realClient = jayson.client.http(realRpcUrl);
  const startTime = new Date().getTime();

  const ethereumMethods = ethereum(realClient, transientState);
  const bitcoinMethods = bitcoin(realClient, transientState);
  const managementMethods = management(transientState);

  const methods = Object.assign({}, ethereumMethods, bitcoinMethods, managementMethods);

  const router = (method, params) =>
    typeof methods[method] === 'function' ? methods[method](Math.floor(new Date().getTime() - startTime)) : realClient;

  const server = jayson.server(methods, { router }).http();

  return {
    start: () => server.listen(listenPort),
    stop: (callback) => server.close(callback),
  };
};
