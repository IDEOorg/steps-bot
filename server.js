require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

module.exports = function server(fbController, twilioController) {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.listen(process.env.PORT || 3000, null, () => {
  });

  // sets up webhook routes for Twilio and Facebook
  routes(app, fbController, twilioController);

  twilioController.webserver = app; // eslint-disable-line
  twilioController.setTickDelay(5000);
  fbController.webserver = app; // eslint-disable-line
  return app;
};

function routes(app, fbController, twilioController) {
  app.post('/facebook/receive', (req, res) => {
    // respond to FB that the webhook has been received.
    res.status(200);
    res.send('ok');

    const bot = fbController.spawn({});

    // Now, pass the webhook in to be processed
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
  const bot = twilioController.spawn({});
  console.log('spawned');
  twilioController.createWebhookEndpoints(app, bot, () => {
    console.log('TwilioSMSBot is online!');
  });
  console.log('webhook');
}
