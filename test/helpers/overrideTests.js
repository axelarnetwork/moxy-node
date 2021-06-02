const assert = require('assert');
const { v4: uuidv4 } = require('uuid');

const testHttpOverride = (client, control, method, params, key, overrides, managementClient, done) => {
  control.request(method, params, (err, controlResponse) => {
    const { result: controlResult } = controlResponse;

    client.request(method, params, (err, firstResponse) => {
      const { result: firstResult } = firstResponse;
      assert.deepStrictEqual(firstResult, controlResult);

      const firstSetParams = [key, overrides];

      managementClient.request('setTransientState', firstSetParams, (err, firstSetResponse) => {
        const { result: firstSetTime } = firstSetResponse;

        client.request(method, params, (err, secondResponse) => {
          const { result: secondResult } = secondResponse;
          const secondSetParams = [key, {}];

          managementClient.request('setTransientState', secondSetParams, (err, secondSetResponse) => {
            const { result: secondSetTime } = secondSetResponse;

            client.request(method, params, (err, thirdResponse) => {
              const { result: thirdResult } = thirdResponse;

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

  control.emitter.once(`message${controlId}`, (controlResponse) => {
    const { result: controlResult } = controlResponse;

    client.emitter.once(`message${firstId}`, (firstResponse) => {
      const { result: firstResult } = firstResponse;
      assert.deepStrictEqual(firstResult, controlResult);

      const firstSetParams = [key, overrides];

      managementClient.request('setTransientState', firstSetParams, (err, firstSetResponse) => {
        const { result: firstSetTime } = firstSetResponse;

        client.emitter.once(`message${secondId}`, (secondResponse) => {
          const { result: secondResult } = secondResponse;
          const secondSetParams = [key, {}];

          managementClient.request('setTransientState', secondSetParams, (err, secondSetResponse) => {
            const { result: secondSetTime } = secondSetResponse;

            client.emitter.once(`message${thirdId}`, (thirdResponse) => {
              const { result: thirdResult } = thirdResponse;

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
