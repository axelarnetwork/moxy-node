'use strict';

const { getLastState, handleObjectResponse, handleNumberResponse } = require('./common');

const options = { ignoreUnset: true };

const getBestBlockHash = (params, transientState, time, original) => {
  const { blockHash } = getLastState(transientState, time, 'block') ?? {};
  return handleNumberResponse(original, blockHash, options);
};

const getBlockchainInfo = (params, transientState, time, original) => {
  const block = getLastState(transientState, time, 'block');
  const overrides = block ? Object.assign(block, { bestblockhash: block.blockHash }) : undefined;
  return handleObjectResponse(original, overrides, options);
};

const getTxOut = (params, transientState, time, original) => {
  const [txId, vout] = params;
  const txState = getLastState(transientState, time, txId);
  const overrides = txState ? Object.assign(txState, { ...txState?.txOuts?.[vout] }) : undefined;
  return handleObjectResponse(original, overrides, options);
};

const sendRawTransaction = (params, transientState, time, original) => {
  const [rawTx] = params;
  const { txHash } = getLastState(transientState, time, rawTx) ?? {};
  return handleNumberResponse(original, txHash, options);
};

module.exports = {
  getbestblockhash: getBestBlockHash,
  getblockchaininfo: getBlockchainInfo,
  gettxout: getTxOut,
  sendrawtransaction: sendRawTransaction,
};
