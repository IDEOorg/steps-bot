require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { trackMediaClicked } = require('./tracker');

module.exports = function server(fbEndpoint, twilioController) {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/static', express.static(path.join(__dirname, 'static')));
  app.listen(process.env.PORT || 3000, null, () => {
  });

  // sets up webhook routes for Twilio and Facebook
  routes(app, fbEndpoint, twilioController);

  twilioController.webserver = app; // eslint-disable-line
  return app;
};

function routes(app, fbEndpoint, twilioController) {
  app.post('/helpresponse', (req, res) => {
    console.log(req);
    console.log(res);
  });
  app.post('/facebook/receive', fbEndpoint);
  // Perform the FB webhook verification handshake with your verify token
  app.get('/facebook/receive', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe') {
      if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
      } else {
        res.send('OK');
      }
    }
  });


  app.get('/redirect', (req, res) => {
    trackMediaClicked(req);
    res.redirect(req.query.contentUrl);
  });

  const bot = twilioController.spawn({});
  twilioController.createWebhookEndpoints(app, bot, () => {
  });
}
