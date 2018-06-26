const KeenTracking = require('keen-tracking');

// Configure a client instance
const keen = new KeenTracking({
  projectId: process.env.KEEN_PROJECT_ID,
  writeKey: process.env.KEEN_WRITE_KEY,
});

// see `buildContentUrl()` in bothelper.js
exports.trackMediaSent = function trackMediaSent(content, user) {
  keen.recordEvent('mediaSent', {
    mediaId: content.id,
    mediaUrl: content.url,
    userId: user.id,
  });
};

// see app.get('/redirect', ...) in server.js
exports.trackMediaClicked = function trackMediaClicked(req) {
  // query string = `${serverUrl}/redirect?contentId=${content.id}&contentUrl=${content.url}&userId=${user.id}`
  keen.recordEvent('mediaClicked', {
    mediaId: req.query.contentId,
    mediaUrl: req.query.contentUrl,
    userId: req.query.userId,
  });
};

// see buildContentUrl() in bothelper.js
exports.trackClientResponse = function trackClientResponse() {
  keen.recordEvent('clientResponse', {
    userId,
    topic,
    text,
  });
};
