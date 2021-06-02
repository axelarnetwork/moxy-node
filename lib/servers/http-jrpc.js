const jayson = require('jayson');
const jsonParser = require('body-parser').json;
const express = require('express');
const app = express();
app.disable('x-powered-by');
app.disable('etag');

const getBodyBuffer = (data) => Buffer.concat([Buffer.from(JSON.stringify(data)), Buffer.from('0a', 'hex')]);

module.exports = (router, { version = 2 } = {}) => {
  const server = new jayson.server({}, { router, version });

  if (version === 2) return server.http();

  app.use(jsonParser());

  app.use((req, res, next) => {
    server.call(req.body, (err, response) => {
      const { id } = req.body;

      if (err) {
        if (err instanceof Error) return next(err);

        const { error = {} } = err;
        const { code = 400, message } = error;
        const data = JSON.parse(message).error;

        res.status(code);
        res.setHeader('content-type', 'application/json');
        res.send(getBodyBuffer({ result: null, error: data, id }));

        return;
      }

      if (response) {
        res.setHeader('Content-Type', 'application/json');
        res.removeHeader('connection');
        res.removeHeader('keep-alive');
        res.send(getBodyBuffer(response));

        return;
      }

      res.status(204);
      res.send('');
    });
  });

  const listen = (port) => {
    const hServer = app.listen(port);
    app.close = (callback) => hServer.close(callback);
  };

  const close = (callback) => app.close(callback);

  return { listen, close };
};
