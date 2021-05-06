'use strict';

const { getLastState, getNumber, handleNumberResponse, handleObjectResponse } = require('./common');

const options = { prefix: true, ignoreUnset: true };

const ethBlockNumber = (params, transientState, time, original) => {
  const { blockNumber } = getLastState(transientState, time, 'block') ?? {};
  return handleNumberResponse(original, blockNumber, options);
};

const ethGetTransactionByHash = (params, transientState, time, original) =>
  handleObjectResponse(original, getLastState(transientState, time, params[0]), options);

const ethGetTransactionCount = (params, transientState, time, original) => {
  // countType is an integer (hex) block number, or the string "latest", "earliest" or "pending"
  const [account, countType] = params;
  const state = getLastState(transientState, time, account.toLowerCase());
  return handleNumberResponse(original, state?.transactionCount?.[countType], options);
};

const getTransactionReceipt = (params, transientState, time, original) =>
  handleObjectResponse(original, getLastState(transientState, time, params[0]), options);

const ethSendRawTransaction = (params, transientState, time, original) => {
  const [rawTx] = params;
  const { txId } = getLastState(transientState, time, rawTx) ?? {};
  return handleNumberResponse(original, txId, options);
};

module.exports = {
  eth_blockNumber: ethBlockNumber,
  eth_chainId: getNumber('chainId', options),
  eth_gasPrice: getNumber('gasPrice', options),
  eth_getTransactionByHash: ethGetTransactionByHash,
  eth_getTransactionCount: ethGetTransactionCount,
  eth_getTransactionReceipt: getTransactionReceipt,
  eth_sendRawTransaction: ethSendRawTransaction,
  // eth_sendTransaction,
  // eth_estimateGas,
};
