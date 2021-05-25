#!/usr/bin/env node

const assert = require('assert');
const nodeCleanup = require('node-cleanup');

const args = require('minimist')(process.argv.slice(2));
assert(args['rpc'], 'RPC URL Required (--rpc).');

const transientState = args['transientState'] ? require(args['transientState']) : [];
const getServer = require('../lib/server');

const options = {
  rpcUrl: args['rpc'],
  httpPort: args['httpPort'] ?? 3000,
  wsPort: args['wsPort'] ?? 3001,
  transientState,
  jsonRpcVersion: args['jsonRpcVersion'] ?? 2,
};

getServer(options).then((server) => {
  nodeCleanup(function (exitCode, signal) {
    console.log('Shutting down moxy gracefully...');

    server.stop(() => {
      console.log('Shut down.');
      process.kill(process.pid, signal);
    });

    nodeCleanup.uninstall();

    return false;
  });

  console.log('Starting moxy...');
  server.start();
});
