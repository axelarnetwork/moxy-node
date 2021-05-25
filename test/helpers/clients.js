const WebSocket = require('ws');
const EventEmitter = require('events');
const jayson = require('jayson');

const httpFromWs = (url) =>
  new Promise((resolve, reject) => {
    const client = new WebSocket(url);

    const close = (callback) => {
      client.once('close', () => callback());
      client.close();
    };

    client.on('open', () => {
      let id = 1;
      const emitter = new EventEmitter();

      client.on('message', (inboundMessage) => {
        const parsed = JSON.parse(inboundMessage);
        emitter.emit(`message${parsed.id ?? ''}`, parsed);
      });

      const request = (method, params, callback) => {
        emitter.once(`message${id}`, (inboundMessage) => {
          callback(null, inboundMessage);
        });

        client.send(JSON.stringify({ jsonrpc: '2.0', method, params, id: id++ }));
      };

      resolve({ request, close });
    });
  });

const ws = (url) =>
  new Promise((resolve, reject) => {
    const client = new WebSocket(url);

    client.on('open', () => {
      client.emitter = new EventEmitter();

      client.on('message', (inboundMessage) => {
        const parsed = JSON.parse(inboundMessage);
        client.emitter.emit(`message${parsed.id}`, parsed);
      });

      resolve(client);
    });
  });

const wsFromHttp = (url) => {
  const client = url.startsWith('https') ? jayson.client.https(url) : jayson.client.http(url);
  const emitter = new EventEmitter();

  const send = (message) => {
    const { jsonrpc, method, params, id } = JSON.parse(message);

    client.request(method, params, (err, response) => {
      const { result } = response;
      emitter.emit(`message${id}`, { jsonrpc, id, result });
    });
  };

  return { emitter, send };
};

module.exports = {
  httpFromWs,
  ws,
  wsFromHttp,
};
