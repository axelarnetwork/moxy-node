const WebSocket = require('ws');
const EventEmitter = require('events');

module.exports = async (url) =>
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
        // console.log('Proxy Client Received');
        // console.log(inboundMessage);

        const parsed = JSON.parse(inboundMessage);
        emitter.emit(`message${parsed.id}`, parsed);
      });

      const getFromNode = (method, params, callback) => {
        emitter.once(`message${id}`, (inboundMessage) => {
          const { error } = inboundMessage;
          error ? callback(error, inboundMessage) : callback(undefined, inboundMessage);
        });

        const test = JSON.stringify({ jsonrpc: '2.0', method, params, id: id++ });

        // console.log('Going to send');
        // console.log(test);

        client.send(test);
      };

      resolve({ getFromNode, close });
    });
  });
