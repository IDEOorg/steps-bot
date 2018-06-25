const KeenTracking = require('keen-tracking');

// Configure a client instance
const keen = new KeenTracking({
  projectId: process.env.KEEN_PROJECT_ID,
  writeKey: process.env.KEEN_WRITE_KEY,
});

exports.trackMediaSent = function trackMediaSent(content, user) {
  keen.recordEvent('mediaSent', {
    mediaId: content.id,
    mediaUrl: content.url,
    userId: user.id,
  });
};

exports.trackMediaClicked = function trackMediaClicked(req) {
  // query string = `${serverUrl}/redirect?contentId=${content.id}&contentUrl=${content.url}&userId=${user.id}`
  keen.recordEvent('mediaClicked', {
    mediaId: req.query.contentId,
    mediaUrl: req.query.contentUrl,
    userId: req.query.userId,
  });
};

/*
await api.createMessage(null, userInfo.id, BOT_ID, userMessage);
line 53 of bothelper.js I believe (edited)

and createMessage is in apihelper.js
*/
exports.trackClientResponse = function trackClientResponse() {
  keen.recordEvent('clientResponse', {
    userId: null,
    topic: null,
    text: null,
  });
};
