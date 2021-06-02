const { getLastState, objectResponseOverride, numberResponseOverride } = require('./common');

const options = { ignoreUnset: true };

const getBestBlockHash = (params, transientState, time) => (err, response) => {
  const { blockHash } = getLastState(transientState, time, 'block') ?? {};
  return numberResponseOverride(blockHash, options)(err, response);
};

const getBlockchainInfo = (params, transientState, time) => (err, response) => {
  const block = getLastState(transientState, time, 'block');

  const overrides = block
    ? block.blockHash
      ? Object.assign(block, { bestblockhash: block.blockHash })
      : block
    : undefined;

  return objectResponseOverride(overrides, options)(err, response);
};

const getTxOut = (params, transientState, time) => (err, response) => {
  const [txId, vout] = params;
  const txState = getLastState(transientState, time, txId);
  const overrides = txState ? Object.assign(txState, { ...txState?.txOuts?.[vout] }) : undefined;
  return objectResponseOverride(overrides, options)(err, response);
};

const sendRawTransaction = (params, transientState, time) => (err, response) => {
  const [rawTx] = params;
  const { txHash } = getLastState(transientState, time, rawTx) ?? {};
  return numberResponseOverride(txHash, options)(err, response);
};

module.exports = {
  getbestblockhash: getBestBlockHash,
  getblockchaininfo: getBlockchainInfo,
  gettxout: getTxOut,
  sendrawtransaction: sendRawTransaction,
};
