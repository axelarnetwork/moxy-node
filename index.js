const assert = require('assert');
const nodeCleanup = require('node-cleanup');
const jayson = require('jayson');

const args = require('minimist')(process.argv.slice(2));
assert(args['rpc'], 'RPC URL Required (--rpc).');

const transientState = args['transientState'] ? require(args['transientState']) : [];
const getServer = require('./src/server');

const server = getServer(transientState, args['rpc'], args['port'] ?? 3330);

nodeCleanup(function (exitCode, signal) {
  server.stop(() => {
    console.log('\nShutting Down...');
    process.kill(process.pid, signal);
  });

  nodeCleanup.uninstall();

  return false;
});

server.start();
