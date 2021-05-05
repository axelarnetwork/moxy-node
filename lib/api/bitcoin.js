'use strict';

const { getLastState, handleObjectResponse, handleNumberResponse, getNumberFromArg } = require('./common');

const getBestBlockHash = (getFromNode, transientState) => (time) => (args, callback) => {
  const { blockHash } = getLastState(transientState, time, 'block') ?? {};
  handleNumberResponse(getFromNode, 'getbestblockhash', args, callback, blockHash);
};

const getBlockchainInfo = (getFromNode, transientState) => (time) => (args, callback) => {
  const block = getLastState(transientState, time, 'block');
  const overrides = block ? Object.assign(block, { bestblockhash: block.blockHash }) : undefined;
  handleObjectResponse(getFromNode, 'getblockchaininfo', args, callback, overrides);
};

const getTxOut = (getFromNode, transientState) => (time) => (args, callback) => {
  const [txId, vout] = args;
  const txState = getLastState(transientState, time, txId);
  const overrides = txState ? Object.assign(txState, { ...txState?.txOuts?.[vout] }) : undefined;

  handleObjectResponse(getFromNode, 'gettxout', args, callback, overrides);
};

const sendRawTransaction = (getFromNode, transientState) => (time) => (args, callback) => {
  const [rawTx] = args;
  const { txHash } = getLastState(transientState, time, rawTx) ?? {};
  handleNumberResponse(getFromNode, 'sendrawtransaction', args, callback, txHash);
};

module.exports = (getFromNode, transientState) => ({
  getbestblockhash: getBestBlockHash(getFromNode, transientState),
  getblockchaininfo: getBlockchainInfo(getFromNode, transientState),
  gettxout: getTxOut(getFromNode, transientState),
  sendrawtransaction: sendRawTransaction(getFromNode, transientState),
});
