const rp = require('request-promise');
require('dotenv').config();
const sgMail = require('@sendgrid/mail');
const log4js = require('log4js');

const log = log4js.getLogger('get_started_button.js');

const apiUrl = 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token=' + process.env.FB_PAGE_ACCESS_TOKEN_STAGING;

/**
 * adds the "Get Started" button from a Facebook page
 * @param  {String} accessToken - the access token for the Facebook page
 * @param  {String} payload - the user defined payload for the webhook
 * @return {Object} - the promise for the request
 */

const addGetStarted = payload =>
  rp({
    uri: apiUrl,
    method: 'POST',
    body: {
      get_started: {
        payload
      }
    },
    json: true,
  }).then(res => log.debug(res.result)).catch((error) => {
    log.error(`ERROR: ${error}`);
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: 'Roo bot error',
      text: `An error occurred on the bot server: \n ${error}`,
    });
  });

// const deleteGetStarted = () =>
//   rp({
//     uri: apiUrl,
//     method: 'DELETE',
//     body: {
//       fields: [
//         'get_started'
//       ]
//     },
//     json: true,
//   }).then(res => log.debug(res.result)).catch((error) => {
//     log.error(`ERROR: ${error}`);
//     sgMail.send({
//       to: 'support@helloroo.zendesk.com',
//       from: 'no-reply@helloroo.org',
//       subject: 'Roo bot error',
//       text: `An error occurred on the bot server: \n ${error}`,
//     });
//   });
addGetStarted('getstarted');
