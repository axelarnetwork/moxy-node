const management = require('./api/management');
const ethereum = require('./api/ethereum');
const bitcoin = require('./api/bitcoin');

// Flatten nodeMethods
const nodeMethods = Object.assign({}, ethereum, bitcoin);

const getTimeDelta = (startTime) => Math.floor(new Date().getTime() - startTime);

const proxyOverrideCallback = (method, params, transientState, time, err, response, callback) => {
  const proxyResponse = nodeMethods[method](params, transientState, time)(err, response);
  callback(proxyResponse.err, proxyResponse.response);
};

// First call returns a router with baked in start time, transient state, and node client
// Next, allow
const getRequestRouter = (startTime, transientState, getFromNode) => (method, params) => {
  const time = getTimeDelta(startTime);

  // If a management method is called, return a route to it
  if (management[method]) {
    console.log(`${method} management method called (${time}).`);

    return (params, callback) => callback(null, management[method](params, transientState, time));
  }

  // Return a route through that will first fetch from the node, then may return simple or be piped through override proxy
  return (params, callback) =>
    getFromNode(method, params, (err, response) => {
      // If a proxy node method does not exists, return result
      if (!nodeMethods[method]) {
        console.log(`No override functionality exists for ${method} (${time}).`);
        callback(err, response.result);
        return;
      }

      console.log(`Attempting override for ${method} (${time}).`);

      // Proxy result through override
      proxyOverrideCallback(method, params, transientState, time, err, response, callback);
    });
};

const getNotificationRouter = (startTime, transientState) => (response, callback) => {
  const { method, params } = response;
  const time = getTimeDelta(startTime);

  // If a proxy node method does not exists, callback immediately
  if (!nodeMethods[method]) return callback(null, response);

  proxyOverrideCallback(method, [params.subscription], transientState, time, null, response, callback);
};

module.exports = {
  getRequestRouter,
  getNotificationRouter,
};
