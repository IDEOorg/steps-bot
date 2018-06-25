require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { trackMediaClicked } = require('./tracker');

module.exports = function server(fbController, twilioController) {
  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/static', express.static(path.join(__dirname, 'static')));
  app.listen(process.env.PORT || 3000, null, () => {
  });

  // sets up webhook routes for Twilio and Facebook
  routes(app, fbController, twilioController);

  twilioController.webserver = app; // eslint-disable-line
  fbController.webserver = app; // eslint-disable-line
  return app;
};

function routes(app, fbController, twilioController) {
  app.post('/helpresponse', (req, res) => {
    // console.log('response received');
    // console.log(req.body.MessageStatus);
    // console.log(new Date());
  });
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


  app.get('/redirect', (req, res) => {
    trackMediaClicked(req);
    res.redirect(req.query.contentUrl);
  });

  const bot = twilioController.spawn({});
  twilioController.createWebhookEndpoints(app, bot, () => {
  });
}
