#!/usr/bin/env node

const assert = require('assert');
const nodeCleanup = require('node-cleanup');

const args = require('minimist')(process.argv.slice(2));
assert(args['rpc'], 'RPC URL Required (--rpc).');
assert(args['protocol'], 'Listen Protocol Required (--protocol).');

const transientState = args['transientState'] ? require(args['transientState']) : [];
const getServer = require('../lib/server');

const options = {
  rpcUrl: args['rpc'],
  httpPort: args['httpPort'] ?? 3000,
  wsPort: args['wsPort'] ?? 3001,
  transientState,
};

getServer(options).then((server) => {
  nodeCleanup(function (exitCode, signal) {
    server.stop(() => {
      console.log('\nShutting Down...');
      process.kill(process.pid, signal);
    });

    nodeCleanup.uninstall();

    return false;
  });

  server.start();
});
