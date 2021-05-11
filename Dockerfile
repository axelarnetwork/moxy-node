FROM node:14-alpine

RUN apk add --no-cache git
RUN npm install -g git+https://github.com/axelarnetwork/moxy-node.git

COPY ./entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
