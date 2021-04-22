# moxy-node

A JSON-RPC mocker and proxy, intended to mock and override blockchain state via a static "transtient state" configutation or "just-in-time" via a simple management API.

## Supported RPC overrides (all other calls are proxied untouched)

### Bitcoin

- [x] getbestblockhash
- [x] getblockchaininfo
- [x] gettxout
- [ ] sendrawtransaction (incomplete)

### Ethereum

- [x] eth_blockNumber
- [x] eth_gasPrice
- [x] eth_chainId
- [x] eth_getTransactionCount
- [x] eth_getTransactionReceipt
- [ ] eth_sendRawTransaction (incomplete)

## TODO

- [ ] mocks errors where there aren't any
- [ ] mocks results when there should be errors
- [ ] error code/message overriding
- [ ] output/save in-memory transient state
- [ ] https support

## Install and test

1. `npm install`

2. Create a `.test-config.json` in the root directory with the following:

```json
{
  "bitcoin": {
    "rpcUrl": "http://username:password@some-bitcoin-node.com:8332",
    "rpcPort": 3330
  },
  "ethereum": {
    "rpcUrl": "http://some-ethereum-node.com:8545/",
    "rpcPort": 3330
  }
}
```

3. `npm run test`

## Usage

Locally:

`npm run start --rpc ACTUAL_NODE_RPC_URL [--port MOXY_PORT]`

Globally

`npm install -g https://github.com/axelarnetwork/moxy-node`

`moxy-node --rpc ACTUAL_NODE_RPC_URL [--port MOXY_PORT]`

Default listening port (i.e. MOXY_PORT) is 3330.

Once running, will proxy all JSON RPC calls to node URl specified.

Calling `setTransientState` method with state key and overrides will result in overridden reposnses for relevant calls.

### Example

```console
$ npm run --rpc http://username:password@bitcoin-node.domain.com:8332


$ curl --data '{"method":"getbestblockhash","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3330

{"jsonrpc":"2.0","id":1,"result":"00000000d57ddbdc287abf8b5c42a96b87eeea4ef7e92b18478daf737545b03f"}


$ curl --data '{"method":"setTransientState","params":["block",{"blockHash":{"value":"0000000000000005555555555555555555555555555555555555555555555555"}}],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3330

{"jsonrpc":"2.0","id":1,"result":141357}


$ curl --data '{"method":"getbestblockhash","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3330

{"jsonrpc":"2.0","id":1,"result":"0000000000000005555555555555555555555555555555555555555555555555"}


$ curl --data '{"method":"setTransientState","params":["block",{"blockHash":{"offset":1}}],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3330

{"jsonrpc":"2.0","id":1,"result":192226}


$ curl --data '{"method":"getbestblockhash","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3330

{"jsonrpc":"2.0","id":1,"result":"00000000d57ddbdc287abf8b5c42a96b87eeea4ef7e92b18478daf737545b040"}


$ curl --data '{"method":"setTransientState","params":["block",{}],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3330

{"jsonrpc":"2.0","id":1,"result":242451}


$ curl --data '{"method":"getbestblockhash","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3330

{"jsonrpc":"2.0","id":1,"result":"00000000d57ddbdc287abf8b5c42a96b87eeea4ef7e92b18478daf737545b03f"}
```
