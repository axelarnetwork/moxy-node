#!/bin/sh
set -e

exec moxy-node --rpc $ACTUAL_NODE_RPC_URL --httpPort $MOXY_HTTP_PORT --wsPort $MOXY_WS_PORT --jsonRpcVersion $JSON_RPC_VERSION --transientState $TRANSIENT_STATE
