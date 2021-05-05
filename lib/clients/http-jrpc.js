const { http, https } = require('jayson').client;

module.exports = async (url, { verbose = false } = {}) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https(url) : http(url);
    const close = (callback = () => {}) => callback();
    const getFromNode = (method, params, callback) => client.request(method, params, callback);

    resolve({ getFromNode, close });
  });
