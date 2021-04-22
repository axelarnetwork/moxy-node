'use strict';

const { getLastState, getNumber, getNumberFromArg, handleNumberResponse, handleObjectResponse } = require('./common');

const ethBlockNumber = (realClient, transientState) => (time) => (args, callback) => {
  const { blockNumber } = getLastState(transientState, time, 'block') ?? {};
  handleNumberResponse(realClient, 'eth_blockNumber', args, callback, blockNumber, { prefix: true });
};

const ethGetTransactionCount = (realClient, transientState) => (time) => (args, callback) => {
  // countType is an integer block number, or the string "latest", "earliest" or "pending"
  const [account, countType] = args;
  const state = getLastState(transientState, time, account.toLowerCase());

  handleNumberResponse(realClient, 'eth_getTransactionCount', args, callback, state?.transactionCount?.[countType], {
    prefix: true,
  });
};

const getTransactionReceipt = (realClient, transientState) => (time) => (args, callback) => {
  const txHash = args[0];
  handleObjectResponse(
    realClient,
    'eth_getTransactionReceipt',
    args,
    callback,
    getLastState(transientState, time, txHash),
    { prefix: true }
  );
};

const ethSendRawTransaction = (realClient, transientState) => (time) => (args, callback) => {
  const [rawTx] = args;
  const { txId } = getLastState(transientState, time, rawTx) ?? {};
  handleNumberResponse(realClient, 'eth_sendRawTransaction', args, callback, txId);
};

module.exports = (realClient, transientState) => ({
  eth_blockNumber: ethBlockNumber(realClient, transientState),
  eth_gasPrice: getNumber(realClient, transientState, 'eth_gasPrice', 'gasPrice'),
  eth_chainId: getNumber(realClient, transientState, 'eth_chainId', 'chainId'),
  eth_getTransactionCount: ethGetTransactionCount(realClient, transientState),
  eth_getTransactionReceipt: getTransactionReceipt(realClient, transientState),
  eth_sendRawTransaction: ethSendRawTransaction(realClient, transientState),
  // eth_sendTransaction,
  // eth_estimateGas,
});
