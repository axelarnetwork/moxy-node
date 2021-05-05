const assert = require('assert');

const testHttpOverride = (client, method, params, key, overrides, managementClient, done) => {
  client.request(method, params, (err, error, firstResult) => {
    const firstSetParams = [key, overrides];

    managementClient.request('setTransientState', firstSetParams, (err, error, firstSetTime) => {
      client.request(method, params, (err, error, secondResult) => {
        const secondSetParams = [key, {}];

        managementClient.request('setTransientState', secondSetParams, (err, error, secondSetTime) => {
          client.request(method, params, (err, error, thirdResult) => {
            assert.deepStrictEqual(firstResult, thirdResult);
            assert.notDeepStrictEqual(firstResult, secondResult);
            assert(secondSetTime > firstSetTime);

            done();
          });
        });
      });
    });
  });
};

const testWsOverride = (client, method, params, key, overrides, managementClient, state, done) => {
  state.emitter.once(`message${state.id}`, ({ result: firstResult }) => {
    const firstSetParams = [key, overrides];

    managementClient.request('setTransientState', firstSetParams, (err, error, firstSetTime) => {
      state.emitter.once(`message${state.id}`, ({ result: secondResult }) => {
        const secondSetParams = [key, {}];

        managementClient.request('setTransientState', secondSetParams, (err, error, secondSetTime) => {
          state.emitter.once(`message${state.id}`, ({ result: thirdResult }) => {
            assert.deepStrictEqual(firstResult, thirdResult);
            assert.notDeepStrictEqual(firstResult, secondResult);
            assert(secondSetTime > firstSetTime);

            done();
          });

          client.send(JSON.stringify({ jsonrpc: '2.0', method, params, id: state.id++ }));
        });
      });

      client.send(JSON.stringify({ jsonrpc: '2.0', method, params, id: state.id++ }));
    });
  });

  client.send(JSON.stringify({ jsonrpc: '2.0', method, params, id: state.id++ }));
};

module.exports = {
  testHttpOverride,
  testWsOverride,
};
