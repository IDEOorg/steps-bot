require('dotenv').config();
const KeenTracking = require('keen-tracking');
const assetUrls = require('./assets-manifest.json');
// Bitly used for tracking Media links - uses v3 of the Bitly API
const { BitlyClient } = require('bitly');
const sgMail = require('@sendgrid/mail');

const token = process.env.BITLY_TOKEN; // see mepler if you don't have this in your .env file
const bitly = new BitlyClient(token);

// Configure a client instance
const keen = new KeenTracking({
  projectId: process.env.KEEN_PROJECT_ID,
  writeKey: process.env.KEEN_WRITE_KEY,
});

function trackMediaSent(content, user) {
  keen.recordEvent('mediaSent', {
    mediaId: content.id,
    mediaUrl: content.url,
    userId: user.id,
  });
}

exports.trackMediaSent = trackMediaSent;

// see app.get('/redirect', ...) in server.js
exports.trackMediaClicked = function trackMediaClicked(req) {
  // query string = `${serverUrl}/redirect?contentId=${content.id}&contentUrl=${content.url}&userId=${user.id}`
  keen.recordEvent('mediaClicked', {
    mediaId: req.query.contentId,
    mediaUrl: req.query.contentUrl,
    userId: req.query.userId,
  });
};

// see api.js
exports.trackMessageSent = function trackMessageSent(body) {
  keen.recordEvent('clientResponse', body);
};

// see Chatbot.js
exports.buildContentUrl = async function buildContentUrl(content, user) {
  // redirect (on this server) URL is wrapped in a bit.ly link with the content.id, content.url, and user.id
  // user clicks bit.ly link and is taken to redirect URL
  // the "view" is recorded in analytics with the params in the bit.ly link
  // user is redirected to content.url
  if (content === null) {
    return null;
  }
  // create redirect Url to send them to our sever for tracking before being sent to final destination
  const redirectUrl = `${assetUrls.baseUrl}/redirect?contentId=${content.id}&contentUrl=${content.url}&userId=${user.id}`;

  // wrap redirect url in a bitly link
  let bitlyUrl = null;
  try {
    bitlyUrl = await bitly.shorten(redirectUrl);
  } catch (err) {
    console.error('Unable to create Bitly link');
    sgMail.send({
      to: 'support@helloroo.zendesk.com',
      from: 'no-reply@helloroo.org',
      subject: `Bitly error - ${Date.now()}`,
      text: `Unable to create Bitly link for ${content.url}. \n Here is the error: ${err}`,
    });
  }

  trackMediaSent(content, user);
  return bitlyUrl.url;
};
