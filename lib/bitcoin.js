'use strict';

const { getLastState, handleObjectResponse, handleNumberResponse, getNumberFromArg } = require('./common');

const getBestBlockHash = (realClient, transientState) => (time) => (args, callback) => {
  const { blockHash } = getLastState(transientState, time, 'block') ?? {};
  handleNumberResponse(realClient, 'getbestblockhash', args, callback, blockHash);
};

const getBlockchainInfo = (realClient, transientState) => (time) => (args, callback) => {
  const block = getLastState(transientState, time, 'block');
  const overrides = block ? Object.assign(block, { bestblockhash: block.blockHash }) : undefined;
  handleObjectResponse(realClient, 'getblockchaininfo', args, callback, overrides);
};

const getTxout = (realClient, transientState) => (time) => (args, callback) => {
  const [txId, vout] = args;
  const txState = getLastState(transientState, time, txId);
  const overrides = txState ? Object.assign(txState, { ...txState?.txOuts?.[vout] }) : undefined;

  handleObjectResponse(realClient, 'gettxout', args, callback, overrides);
};

const sendRawTransaction = (realClient, transientState) => (time) => (args, callback) => {
  const [rawTx] = args;
  const { txHash } = getLastState(transientState, time, rawTx) ?? {};
  handleNumberResponse(realClient, 'sendrawtransaction', args, callback, txHash);
};

module.exports = (realClient, transientState) => ({
  getbestblockhash: getBestBlockHash(realClient, transientState),
  getblockchaininfo: getBlockchainInfo(realClient, transientState),
  gettxout: getTxout(realClient, transientState),
  sendrawtransaction: sendRawTransaction(realClient, transientState),
});
