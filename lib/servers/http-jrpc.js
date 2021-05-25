const jayson = require('jayson');

module.exports = (router, { version = 2 } = {}) => jayson.server({}, { router, version }).http();
