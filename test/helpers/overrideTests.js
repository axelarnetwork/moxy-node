const assert = require('assert');
const { v4: uuidv4 } = require('uuid');

const testHttpOverride = (client, control, method, params, key, overrides, managementClient, done) => {
  control.request(method, params, (err, error, controlResult) => {
    client.request(method, params, (err, error, firstResult) => {
      assert.deepStrictEqual(firstResult, controlResult);

      const firstSetParams = [key, overrides];

      managementClient.request('setTransientState', firstSetParams, (err, error, firstSetTime) => {
        client.request(method, params, (err, error, secondResult) => {
          const secondSetParams = [key, {}];

          managementClient.request('setTransientState', secondSetParams, (err, error, secondSetTime) => {
            client.request(method, params, (err, error, thirdResult) => {
              assert.deepStrictEqual(firstResult, controlResult);
              assert.deepStrictEqual(firstResult, thirdResult);
              assert.notDeepStrictEqual(firstResult, secondResult);
              assert(secondSetTime > firstSetTime);

              done();
            });
          });
        });
      });
    });
  });
};

const testWsOverride = (client, control, method, params, key, overrides, managementClient, done) => {
  const controlId = uuidv4();
  const firstId = uuidv4();
  const secondId = uuidv4();
  const thirdId = uuidv4();

  control.emitter.once(`message${controlId}`, ({ result: controlResult }) => {
    client.emitter.once(`message${firstId}`, ({ result: firstResult }) => {
      assert.deepStrictEqual(firstResult, controlResult);

      const firstSetParams = [key, overrides];

      managementClient.request('setTransientState', firstSetParams, (err, error, firstSetTime) => {
        client.emitter.once(`message${secondId}`, ({ result: secondResult }) => {
          const secondSetParams = [key, {}];

          managementClient.request('setTransientState', secondSetParams, (err, error, secondSetTime) => {
            client.emitter.once(`message${thirdId}`, ({ result: thirdResult }) => {
              assert.deepStrictEqual(firstResult, thirdResult);
              assert.notDeepStrictEqual(firstResult, secondResult);
              assert(secondSetTime > firstSetTime);

              done();
            });

            client.send(JSON.stringify({ jsonrpc: '2.0', method, params, id: thirdId }));
          });
        });

        client.send(JSON.stringify({ jsonrpc: '2.0', method, params, id: secondId }));
      });
    });

    client.send(JSON.stringify({ jsonrpc: '2.0', method, params, id: firstId }));
  });

  control.send(JSON.stringify({ jsonrpc: '2.0', method, params, id: controlId }));
};

module.exports = {
  testHttpOverride,
  testWsOverride,
};
