require('dotenv').config();
const jwt = require('express-jwt');
const { expressJwtSecret } = require('jwks-rsa');
const cors = require('cors');
const swaggerUI = require('swagger-ui-express');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { trackMediaClicked } = require('./src/tracker');
const YAML = require('yamljs');

const swaggerDocument = YAML.load('./swagger.yaml');

// Auth0 Config
const { AUTH0_AUDIENCE, AUTH0_DOMAIN } = process.env;
const AUTH0_ISSUER = `https://${AUTH0_DOMAIN}/`;

/**
 * @description Checks the request headers for an auth token.
 * This is used to secure routes that require authorization.
 */
const checkJwt = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).json({
      status: 'error',
      message: 'you are unauthorized to view this resource',
    });
  }

  // Authentication middleware. Please see:
  // https://auth0.com/docs/quickstart/backend/nodejs
  // for implementation details
  jwt({
    // Retrieve the signing key from the server
    secret: expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `${AUTH0_ISSUER}.well-known/jwks.json`,
      handleSigningKeyError: (error, callback) => {
        return callback(error);
      },
    }),

    // Validate the audience of the issuer
    audience: AUTH0_AUDIENCE || 'http://steps-admin.herokuapp.com',
    issuer: AUTH0_ISSUER,
    algorithms: ['RS256'],
    complete: true,
    requestProperty: 'token',
  });

  return next();
};

module.exports = function server(
  fbEndpoint,
  twilioReceiveSmsController,
  getCoachResponse,
  testTwilioCredentials
) {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/static', express.static(path.join(__dirname, 'static')));
  app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
  app.listen(process.env.PORT || 3002, null, () => {
    console.log(`listening on server port ${process.env.PORT || 3002}`);
  });

  // sets up webhook routes for Twilio and Facebook
  routes(app, fbEndpoint, twilioReceiveSmsController, getCoachResponse, testTwilioCredentials);

  return app;
};

function routes(
  app,
  fbEndpoint,
  twilioReceiveSmsController,
  getCoachResponse,
  testTwilioCredentials
) {
  app.get('/helpresponse', checkJwt, getCoachResponse);
  app.post('/facebook/receive', fbEndpoint);
  app.post('/sms/receive', twilioReceiveSmsController);
  app.post('/sms/test', testTwilioCredentials);

  // Perform the FB webhook verification handshake with your verify token. This is solely so FB can verify that you are the same person
  app.get('/facebook/receive', (req, res) => {
    if (req.query['hub.mode'] === 'subscribe') {
      if (req.query['hub.verify_token'] === process.env.FB_VERIFY_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
      } else {
        res.sendStatus(403);
      }
    }
  });

  app.get('/redirect', (req, res) => {
    trackMediaClicked(req);
    res.redirect(req.query.contentUrl);
  });
}
