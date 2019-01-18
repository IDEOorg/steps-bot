require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { trackMediaClicked } = require('./src/tracker');

module.exports = function server(
  fbEndpoint,
  twilioController,
  getCoachResponse
) {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/static', express.static(path.join(__dirname, 'static')));
  app.listen(process.env.PORT || 3002, null, () => {});

  // sets up webhook routes for Twilio and Facebook
  routes(app, fbEndpoint, twilioController, getCoachResponse);

  twilioController.webserver = app;
  return app;
};

function routes(app, fbEndpoint, twilioController, getCoachResponse) {
  app.get('/helpresponse', getCoachResponse);
  app.post('/facebook/receive', fbEndpoint);

  // Perform the FB webhook verification handshake with your verify token. This is solely so FB can verify that you are the same person
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

  twilioController.createWebhookEndpoints(
    app,
    twilioController.spawn({}),
    () => {}
  );
}
