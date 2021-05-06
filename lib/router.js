const management = require('./api/management');
const ethereum = require('./api/ethereum');
const bitcoin = require('./api/bitcoin');

// Flatten nodeMethods
const nodeMethods = Object.assign({}, ethereum, bitcoin);

// Route call to existing proxy or management nodeMethods, if not, passthrough to real server
module.exports = (startTime, transientState, getFromNode) => (method, params) => {
  const time = Math.floor(new Date().getTime() - startTime);

  if (management[method]) {
    return (params, callback) => callback(null, management[method](params, transientState, time));
  }

  if (!nodeMethods[method]) {
    return (params, callback) => getFromNode(method, params, callback);
  }

  return (params, callback) =>
    getFromNode(method, params, (err, response) => {
      const { err: newErr, response: newResponse } = nodeMethods[method](params, transientState, time, {
        err,
        response,
      });

      callback(newErr, newResponse);
    });
};
