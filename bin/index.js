#!/usr/bin/env node

const assert = require('assert');
const path = require('path');
const nodeCleanup = require('node-cleanup');

const isSet = (arg) => typeof arg === 'string' || typeof arg === 'number';

const args = require('minimist')(process.argv.slice(2));
assert(isSet(args['rpc']), 'RPC URL Required (--rpc).');

const transientState = isSet(args['transientState']) ? require(path.join(process.cwd(), args['transientState'])) : [];
const getServer = require('../lib/server');

const options = {
  rpcUrl: args['rpc'],
  httpPort: isSet(args['httpPort']) ? args['httpPort'] : 3000,
  wsPort: isSet(args['wsPort']) ? args['wsPort'] : 3001,
  transientState,
  jsonRpcVersion: isSet(args['jsonRpcVersion']) ? args['jsonRpcVersion'] : 2,
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
