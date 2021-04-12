const assert = require('assert');
const jayson = require('jayson');
const getServer = require('../src/server');
const { rpcUrl, rpcPort = 3000, transientState = [] } = require('../.test-config.json').ethereum;

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

describe('Ethereum', () => {
  before(() => {
    server.start(transientState, rpcUrl, rpcPort);
  });

  after(() => {
    server.stop();
  });

  it('can override block number', (done) => {
    const overrides = {
      blockNumber: {
        value: 1,
      },
    };

    testOverride('eth_blockNumber', [], 'block', overrides, done);
  });

  it('can override gas price', (done) => {
    testOverride('eth_gasPrice', [], 'gasPrice', { value: 5 }, done);
  });

  it('can override chain id', (done) => {
    testOverride('eth_chainId', [], 'chainId', { value: 7 }, done);
  });

  it('can override transaction count (pending)', (done) => {
    const account = '0x4f9cd45a29af9a19ee6d67e03be4ee963e704dd8';
    const countType = 'pending';

    const overrides = {
      transactionCount: {
        [countType]: {
          value: 1500,
        },
      },
    };

    testOverride('eth_getTransactionCount', [account, countType], account, overrides, done);
  });

  it('can override transaction count (latest)', (done) => {
    const account = '0x4f9cd45a29af9a19ee6d67e03be4ee963e704dd8';
    const countType = 'latest';

    const overrides = {
      transactionCount: {
        [countType]: {
          value: 1500,
        },
      },
    };

    testOverride('eth_getTransactionCount', [account, countType], account, overrides, done);
  });

  it('can override transaction count (at block number)', (done) => {
    const account = '0x4f9cd45a29af9a19ee6d67e03be4ee963e704dd8';
    const countType = 48241;

    const overrides = {
      transactionCount: {
        [countType]: {
          value: 1500,
        },
      },
    };

    testOverride('eth_getTransactionCount', [account, countType], account, overrides, done);
  });

  it('can override transaction receipt', (done) => {
    const txHash = '0xb99b05ef337e5aa320e3702363b6b41abfa5bdad0f5654db1490a7f27beb18ea';

    const overrides = {
      blockHash: {
        value: '0x9999999999999999999999999999999999999999999999999999999999999999',
      },
      blockNumber: {
        value: 38,
      },
      cumulativeGasUsed: {
        value: 100000,
      },
      from: {
        value: '0x8888888888888888888888888888888888888888',
      },
      gasUsed: {
        value: 88000,
      },
      status: {
        value: false,
      },
      to: {
        value: '0x7777777777777777777777777777777777777777',
      },
      transactionIndex: {
        value: 40,
      },
      type: {
        value: 1,
      },
    };

    testOverride('eth_getTransactionReceipt', [txHash], txHash, overrides, done);
  });

  it.skip('can override send raw transaction', (done) => {
    const rawTransaction = '0xd46e8dd67c5d32be8d46e8dd67c5d32be8058bb8eb970870f072445675058bb8eb970870f072445675';

    const overrides = {
      [rawTransaction]: {
        txId: {
          value: '0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331',
        },
      },
    };

    testOverride('sendrawtransaction', [], 'block', overrides, done);
  });
});
