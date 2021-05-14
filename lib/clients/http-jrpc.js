const { http, https } = require('jayson').client;

module.exports = (url) =>
  // Wrapped in a promise to ensure compatibility with counterparts that require connections (i.e. ws)
  new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https(url) : http(url);

    // A dud close function as per the required interface
    const close = (callback = () => {}) => callback();

    // A simple proxy call to the node at the provided url
    const getFromNode = (method, params, callback) => {
      console.log(`Getting ${method} with params [${params}] from node via jrpc over http.`);
      client.request(method, params, callback);
    };

    resolve({ getFromNode, close });
  });
