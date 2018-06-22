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

exports.trackMediaClicked = function trackMediaClicked(contentId, contentUrl, userId) {
  keen.recordEvent('mediaClicked', {
    mediaId: contentId,
    mediaUrl: contentUrl,
    userId,
  });
};

exports.trackClientResponse = function trackClientResponse() {
  keen.recordEvent('clientResponse', {
    userId: null,
    topic: null,
    text: null,
  });
};
