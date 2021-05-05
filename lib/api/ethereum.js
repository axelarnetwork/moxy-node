'use strict';

const { getLastState, getNumber, handleNumberResponse, handleObjectResponse } = require('./common');

const ethBlockNumber = (getFromNode, transientState) => (time) => (args, callback) => {
  const { blockNumber } = getLastState(transientState, time, 'block') ?? {};
  handleNumberResponse(getFromNode, 'eth_blockNumber', args, callback, blockNumber, { prefix: true });
};

const ethGetTransactionByHash = (getFromNode, transientState) => (time) => (args, callback) => {
  handleObjectResponse(
    getFromNode,
    'eth_getTransactionByHash',
    args,
    callback,
    getLastState(transientState, time, args[0]),
    { prefix: true }
  );
};

const ethGetTransactionCount = (getFromNode, transientState) => (time) => (args, callback) => {
  // countType is an integer block number, or the string "latest", "earliest" or "pending"
  const [account, countType] = args;
  const state = getLastState(transientState, time, account.toLowerCase());

  handleNumberResponse(getFromNode, 'eth_getTransactionCount', args, callback, state?.transactionCount?.[countType], {
    prefix: true,
  });
};

const getTransactionReceipt = (getFromNode, transientState) => (time) => (args, callback) => {
  handleObjectResponse(
    getFromNode,
    'eth_getTransactionReceipt',
    args,
    callback,
    getLastState(transientState, time, args[0]),
    { prefix: true }
  );
};

const ethSendRawTransaction = (getFromNode, transientState) => (time) => (args, callback) => {
  const [rawTx] = args;
  const { txId } = getLastState(transientState, time, rawTx) ?? {};
  handleNumberResponse(getFromNode, 'eth_sendRawTransaction', args, callback, txId);
};

module.exports = (getFromNode, transientState) => ({
  eth_blockNumber: ethBlockNumber(getFromNode, transientState),
  eth_chainId: getNumber(getFromNode, transientState, 'eth_chainId', 'chainId'),
  eth_gasPrice: getNumber(getFromNode, transientState, 'eth_gasPrice', 'gasPrice'),
  eth_getTransactionByHash: ethGetTransactionByHash(getFromNode, transientState),
  eth_getTransactionCount: ethGetTransactionCount(getFromNode, transientState),
  eth_getTransactionReceipt: getTransactionReceipt(getFromNode, transientState),
  eth_sendRawTransaction: ethSendRawTransaction(getFromNode, transientState),
  // eth_sendTransaction,
  // eth_estimateGas,
});
