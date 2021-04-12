const assert = require('assert');
const jayson = require('jayson');
const getServer = require('../src/server');
const { rpcUrl, rpcPort = 3000, transientState = [] } = require('../.test-config.json').bitcoin;

const server = getServer(transientState, rpcUrl, rpcPort);
const client = jayson.client.http(`http://localhost:${rpcPort}`);

const testOverride = (method, args, key, overrides, done) => {
  client.request(method, args, (err, error, firstResult) => {
    const firstSetParams = [key, overrides];

    client.request('setTransientState', firstSetParams, (err, error, firstSetTime) => {
      client.request(method, args, (err, error, secondResult) => {
        const secondSetParams = [key, {}];

        client.request('setTransientState', secondSetParams, (err, error, secondSetTime) => {
          client.request(method, args, (err, error, thirdResult) => {
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

describe('Bitcoin', () => {
  before(() => {
    server.start(transientState, rpcUrl, rpcPort);
  });

  after(() => {
    server.stop();
  });

  it('can override block hash', (done) => {
    const overrides = {
      blockHash: {
        value: '0000000000000005555555555555555555555555555555555555555555555555',
      },
    };

    testOverride('getbestblockhash', [], 'block', overrides, done);
  });

  it('can override blockchain info', (done) => {
    const overrides = {
      blockHash: {
        value: '0000000000000005555555555555555555555555555555555555555555555555',
      },
      blocks: {
        value: 1919191,
      },
      headers: {
        value: 1919191,
      },
      mediantime: {
        value: 1631631631,
      },
      chainwork: {
        value: '0000000000000000000000000000000000000000000004444444444444444444',
      },
    };

    testOverride('getbestblockhash', [], 'block', overrides, done);
  });

  it('can override txout', (done) => {
    const txHash = '329559aea176bc09c51f86f396f173b31cea241175ba0f37faefdc478f4d2870';

    const overrides = {
      confirmations: {
        value: 2,
      },
      coinbase: {
        value: true,
      },
      txOuts: [
        {
          value: {
            value: 5.555,
          },
          scriptPubKey: {
            value: {
              asm: 'OP_HASH160 7777777777777777777777777777777777777777 OP_EQUAL',
              hex: 'a914777777777777777777777777777777777777777787',
              reqSigs: 1,
              type: 'scripthash',
              addresses: ['22222222222222222222222222222222222'],
            },
          },
        },
        {
          value: {
            value: 0.88888,
          },
          scriptPubKey: {
            value: {
              asm: 'OP_HASH160 4444444444444444444444444444444444444444 OP_EQUAL',
              hex: 'a914444444444444444444444444444444444444444487',
              reqSigs: 1,
              type: 'scripthash',
              addresses: ['33333333333333333333333333333333333'],
            },
          },
        },
      ],
    };

    testOverride('gettxout', [txHash, 0], txHash, overrides, done);
  });

  it.skip('can override send raw transaction', (done) => {
    const rawTransaction =
      '01000000000102e5a57529592b241b85998f7b2e1e160ef0b146d97e2749f242ea37ae356cf6c000000000171600141c530c4a6567a7c91791550ad9b5ea47452d748fffffffffe5a57529592b241b85998f7b2e1e160ef0b146d97e2749f242ea37ae356cf6c00100000017160014e1a2a309fe1433ff921ad27858a5f93c7152cd96ffffffff0270820300000000001976a9141f2b9223b9977f7be6e546c153e31b54621152da88ac7b7d00000000000017a9142975858c865f91d6d818ba45e083a7eb85d383f58702483045022100b3acf1acc3ab05c93d0e5f193046d865eb6950cc5ed99a7141eb473c86f31cb802201be3fecfc2cfc88849166679931e2b2282b4715cf5163b61352e47c27011ec1f012102130301578181d27f7158c2e73c92247a89c8806c7abf8f12e0d5bc570e98f9b202483045022100b3acf1acc3ab05c93d0e5f193046d865eb6950cc5ed99a7141eb473c86f31cb802204ab2c9d39fa526c0b5c8b04f1f75172fb082e16e37416d2b735c2f97fccaf973012103548c612d84926a37622c9a3bfec8759a208f37cf760a8c81f1a9e463e0724b9900000000';

    const overrides = {
      [rawTransaction]: {
        txHash: {
          value: '329559aea176bc09c51f86f396f173b31cea241175ba0f37faefdc478f4d2870',
        },
      },
    };

    testOverride('sendrawtransaction', [], 'block', overrides, done);
  });
});
