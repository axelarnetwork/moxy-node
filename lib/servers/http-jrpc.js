const jayson = require('jayson');

module.exports = (router) => jayson.server({}, { router }).http();
