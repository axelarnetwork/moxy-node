const WebSocket = require('ws');
const EventEmitter = require('events');

module.exports = async (url) =>
  // Wrapped in a promise since we need to wait for the connection to be established
  new Promise((resolve, reject) => {
    const client = new WebSocket(url);

    // A close function as per the required interface
    const close = (callback) => {
      client.once('close', () => callback());
      client.close();
    };

    // On an established connection to the node at the provided url
    client.on('open', () => {
      // Sequencer for tracking responses from node
      let id = 1;

      // Emitter needed properly handle local filtering of inbound messages from the node
      const emitter = new EventEmitter();

      // On a message from the node, parse it and emit a local event tagged with the sequencer
      client.on('message', (inboundMessage) => {
        // console.log('Proxy Client Received');
        // console.log(inboundMessage);

        const parsed = JSON.parse(inboundMessage);
        emitter.emit(`message${parsed.id ?? ''}`, parsed);
      });

      // A simple proxy call to the node at the provided url
      const getFromNode = (method, params, callback) => {
        console.log(`Getting ${method} with params [${params}] from node via jrpc over ws.`);

        // Listen for the first local event tagged with the sequencer the current call will be using
        emitter.once(`message${id}`, (inboundMessage) => {
          const { error } = inboundMessage;
          error ? callback(error, inboundMessage) : callback(undefined, inboundMessage);
        });

        const outboundMessage = JSON.stringify({ jsonrpc: '2.0', method, params, id: id++ });

        // console.log('Going to send');
        // console.log(outboundMessage);

        client.send(outboundMessage);
      };

      resolve({ getFromNode, close, notifications: emitter });
    });
  });
