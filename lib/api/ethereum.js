const { getLastState, getNumber, numberResponseOverride, objectResponseOverride } = require('./common');

const options = { prefix: true, ignoreUnset: true };

const subscriptions = new Map();

const ethBlockNumber = (params, transientState, time) => (err, response) => {
  const { blockNumber } = getLastState(transientState, time, 'block') ?? {};
  return numberResponseOverride(blockNumber, options)(err, response);
};

const ethGetTransactionByHash = (params, transientState, time) => (err, response) =>
  objectResponseOverride(getLastState(transientState, time, params[0]), options)(err, response);

const ethGetTransactionCount = (params, transientState, time) => (err, response) => {
  // countType is an integer (hex) block number, or the string "latest", "earliest" or "pending"
  const [account, countType] = params;
  const state = getLastState(transientState, time, account.toLowerCase());
  return numberResponseOverride(state?.transactionCount?.[countType], options)(err, response);
};

const getTransactionReceipt = (params, transientState, time) => (err, response) =>
  objectResponseOverride(getLastState(transientState, time, params[0]), options)(err, response);

const ethSendRawTransaction = (params, transientState, time) => (err, response) => {
  const [rawTx] = params;
  const { txId } = getLastState(transientState, time, rawTx) ?? {};
  return numberResponseOverride(txId, options)(err, response);
};

const ethSubscribe = (params, transientState, time) => (err, response) => {
  subscriptions.set(response.result, params);
  return original;
};

const ethSubscription = (params, transientState, time) => (err, response) => {
  const [subscriptionId] = params;
  const topics = subscriptions.get(subscriptionId);

  if (topics?.[0] !== 'newHeads') return { err, response };

  const { response: newResult } = objectResponseOverride(getLastState(transientState, time, 'block'), options)(
    err,
    response.params.result
  );

  const newResponse = {
    method: 'eth_subscription',
    params: {
      subscription: params[0],
      result: newResult,
    },
  };

  return { err, response: newResponse };
};

module.exports = {
  eth_blockNumber: ethBlockNumber,
  eth_chainId: getNumber('chainId', options),
  eth_gasPrice: getNumber('gasPrice', options),
  eth_getTransactionByHash: ethGetTransactionByHash,
  eth_getTransactionCount: ethGetTransactionCount,
  eth_getTransactionReceipt: getTransactionReceipt,
  eth_sendRawTransaction: ethSendRawTransaction,
  eth_subscribe: ethSubscribe,
  eth_subscription: ethSubscription,
  // eth_sendTransaction,
  // eth_estimateGas,
};
