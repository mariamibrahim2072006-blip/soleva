const { createApp } = require('./index');
let app = null;
module.exports = function handler(req, res) {
  app ??= createApp();
  return app(req, res);
};
