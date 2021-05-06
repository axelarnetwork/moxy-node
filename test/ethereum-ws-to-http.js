if (process.env.SILENT) {
  console.log = () => {};
}

const assert = require('assert');
const WebSocket = require('ws');
const EventEmitter = require('events');
const jayson = require('jayson');
const getServer = require('../lib/server');
const { rpcUrl, httpPort, wsPort, transientState = [] } = require('../.test-config.json')['ethereum-http'];
const { testWsOverride } = require('./helpers/overrideTests');

const state = {
  emitter: new EventEmitter(),
  id: 1,
};

let moxyServer;
let hClient;
let wClient;

describe('Ethereum WS -> HTTP', () => {
  before((done) => {
    getServer({ rpcUrl, httpPort, wsPort, transientState }).then((server) => {
      moxyServer = server;
      moxyServer.start();
      hClient = jayson.client.http(`http://localhost:${httpPort}`);
      wClient = new WebSocket(`ws://localhost:${wsPort}`);

      wClient.on('open', () => {
        wClient.on('message', (inboundMessage) => {
          const parsed = JSON.parse(inboundMessage);
          state.emitter.emit(`message${parsed.id}`, parsed);
        });

        done();
      });
    });
  });

  after((done) => {
    wClient.close();
    moxyServer.stop(done);
  });

  it('can override block number', (done) => {
    const overrides = {
      blockNumber: {
        value: 1,
      },
    };

    testWsOverride(wClient, 'eth_blockNumber', [], 'block', overrides, hClient, state, done);
  });

  it('can override chain id', (done) => {
    testWsOverride(wClient, 'eth_chainId', [], 'chainId', { value: 7 }, hClient, state, done);
  });

  it('can override gas price', (done) => {
    testWsOverride(wClient, 'eth_gasPrice', [], 'gasPrice', { value: 5 }, hClient, state, done);
  });

  it('can override transaction by hash', (done) => {
    const txHash = '0xb99b05ef337e5aa320e3702363b6b41abfa5bdad0f5654db1490a7f27beb18ea';

    const overrides = {
      blockHash: {
        value: '0x9999999999999999999999999999999999999999999999999999999999999999',
      },
      blockNumber: {
        value: 38,
      },
      from: {
        value: '0x8888888888888888888888888888888888888888',
      },
      gas: {
        value: 111111,
      },
      gasPrice: {
        value: 777777,
      },
      input: {
        value: '0xffffffff',
      },
      nonce: {
        value: 44,
      },
      r: {
        value: '0x2222222222222222222222222222222222222222222222222222222222222222',
      },
      s: {
        value: '0x3333333333333333333333333333333333333333333333333333333333333333',
      },
      v: {
        value: '0x99',
      },
      to: {
        value: '0x7777777777777777777777777777777777777777',
      },
      transactionIndex: {
        value: 40,
      },
      value: {
        value: 11111111111,
      },
    };

    testWsOverride(wClient, 'eth_getTransactionReceipt', [txHash], txHash, overrides, hClient, state, done);
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

    testWsOverride(wClient, 'eth_getTransactionCount', [account, countType], account, overrides, hClient, state, done);
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

    testWsOverride(wClient, 'eth_getTransactionCount', [account, countType], account, overrides, hClient, state, done);
  });

  it('can override transaction count (at block number)', (done) => {
    hClient.request('eth_blockNumber', [], (err, error, blockNumber) => {
      const account = '0x4f9cd45a29af9a19ee6d67e03be4ee963e704dd8';
      const countType = blockNumber;

      const overrides = {
        transactionCount: {
          [countType]: {
            value: 1500,
          },
        },
      };

      testWsOverride(
        wClient,
        'eth_getTransactionCount',
        [account, countType],
        account,
        overrides,
        hClient,
        state,
        done
      );
    });
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

    testWsOverride(wClient, 'eth_getTransactionReceipt', [txHash], txHash, overrides, hClient, state, done);
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

    testWsOverride(wClient, 'sendrawtransaction', [], 'block', overrides, hClient, state, done);
  });

  it('can call non-overridden method', (done) => {
    state.emitter.once(`message${state.id}`, ({ result }) => {
      assert(result);
      done();
    });

    wClient.send(JSON.stringify({ jsonrpc: '2.0', method: 'net_peerCount', params: [], id: state.id++ }));
  });
});
