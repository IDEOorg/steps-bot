require('dotenv').config();
const express = require('express');

module.exports = function server(fbController, twilioController) {
  const app = express();
  app.listen(process.env.PORT || 3000, null, () => {
  });

  // sets up webhook routes for Twilio and Facebook
  routes(app, fbController, twilioController);

  twilioController.webserver = app; // eslint-disable-line
  fbController.webserver = app; // eslint-disable-line
  return app;
};

function routes(app, fbController, twilioController) {
  app.post('/facebook/receive', (req, res) => {
    // respond to FB that the webhook has been received.
    res.status(200);
    res.send('ok');

    const bot = fbController.spawn({});

    // Now, pass the webhook into be processed
    fbController.handleWebhookPayload(req, res, bot);
  });
  // Perform the FB webhook verification handshake with your verify token
  app.get('/facebook/receive', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe') {
      if (req.query['hub.verify_token'] === fbController.config.verify_token) {
        res.send(req.query['hub.challenge']);
      } else {
        res.send('OK');
      }
    }
  });
  app.post('/sms/receive', (req, res) => {
    const bot = twilioController.spawn({});
    twilioController.handleWebhookPayload(req, res, bot);
  });
}
