require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const log4js = require('log4js');

const { trackMediaClicked } = require('./src/tracker');

/**
 * makes a log directory, just in case it isn't there.
 */
try {
  fs.mkdirSync('./log');
} catch (e) {
  if (e.code !== 'EEXIST') {
    log.error('Could not set up log directory, error was: ', e);
    process.exit(1);
  }
}

/**
 * Initialises log4js first, so we don't miss any log messages
 */
log4js.configure('./config/log4js.json');

const log = log4js.getLogger('startup');

module.exports = function server(
  fbEndpoint,
  twilioController,
  getCoachResponse
) {
  const app = express();
  const port = process.env.PORT || 3002;
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/static', express.static(path.join(__dirname, 'static')));
  app.listen(port, null, () => {
    log.info('Express server listening on port ', port);
  });

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
