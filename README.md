# moxy-node

A JSON-RPC mocker and proxy, intended to mock and override blockchain state via a static "transient state" configuration or "just-in-time" via a simple management API.

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
- [ ] eth_subscribe (incomplete)

## TODO

- [ ] mocks errors where there aren't any
- [ ] mocks results when there should be errors
- [ ] error code/message overriding
- [ ] output/save in-memory transient state
- [ ] https support
- [ ] JSON RPC 1.0 support via WebSockets

## Install and test

1. `npm install`

2. Create a `.test-config.json` in the root directory with the following:

```json
{
  "bitcoin-http": {
    "rpcUrl": "http://username:password@some-bitcoin-node.com:8332",
    "httpPort": 3000,
    "wsPort": 3001
  },
  "ethereum-http": {
    "rpcUrl": "http://some-ethereum-node.com:8545/",
    "httpPort": 3000,
    "wsPort": 3001
  },
  "ethereum-ws": {
    "rpcUrl": "ws://some-ethereum-node.com:8546/",
    "httpPort": 3000,
    "wsPort": 3001
  }
}
```

3. `npm run test`

## Usage

Locally:

`npm run start --rpc ACTUAL_NODE_RPC_URL [--httpPort MOXY_HTTP_PORT] [--wsPort MOXY_WS_PORT] [--jsonRpcVersion JSON_RPC_VERSION]`

Globally

`npm install -g https://github.com/axelarnetwork/moxy-node`

`moxy-node --rpc ACTUAL_NODE_RPC_URL [--httpPort MOXY_HTTP_PORT] [--wsPort MOXY_WS_PORT] [--jsonRpcVersion JSON_RPC_VERSION]`

Default http listening port (i.e. MOXY_HTTP_PORT) is 3000.
Default http listening port (i.e. MOXY_WS_PORT) is 3001.
Default json rpc version (i.e. JSON_RPC_VERSION) is 2.

Once running, will proxy all JSON RPC calls to node URL specified.

Calling `setTransientState` method with state key and overrides will result in overridden responses for relevant calls.

### Example

```console
$ npm run --rpc http://username:password@bitcoin-node.domain.com:8332


$ curl --data '{"method":"getbestblockhash","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3000

{"jsonrpc":"2.0","id":1,"result":"00000000d57ddbdc287abf8b5c42a96b87eeea4ef7e92b18478daf737545b03f"}


$ curl --data '{"method":"setTransientState","params":["block",{"blockHash":{"value":"0000000000000005555555555555555555555555555555555555555555555555"}}],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3000

{"jsonrpc":"2.0","id":1,"result":141357}


$ curl --data '{"method":"getbestblockhash","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3000

{"jsonrpc":"2.0","id":1,"result":"0000000000000005555555555555555555555555555555555555555555555555"}


$ curl --data '{"method":"setTransientState","params":["block",{"blockHash":{"offset":1}}],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3000

{"jsonrpc":"2.0","id":1,"result":192226}


$ curl --data '{"method":"getbestblockhash","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3000

{"jsonrpc":"2.0","id":1,"result":"00000000d57ddbdc287abf8b5c42a96b87eeea4ef7e92b18478daf737545b040"}


$ curl --data '{"method":"setTransientState","params":["block",{}],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3000

{"jsonrpc":"2.0","id":1,"result":242451}


$ curl --data '{"method":"getbestblockhash","params":[],"id":1,"jsonrpc":"2.0"}' -H "Content-Type: application/json" -X POST localhost:3000

{"jsonrpc":"2.0","id":1,"result":"00000000d57ddbdc287abf8b5c42a96b87eeea4ef7e92b18478daf737545b03f"}
```
