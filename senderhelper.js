require('dotenv').config();
const rp = require('request-promise');

module.exports = {
  sendReply
};

async function sendReply(platform, userId, messages) {
  if (platform === 'fb') {
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const formattedMessage = formatMsgForFB(message);
      await sendFBMessage(userId, formattedMessage); // eslint-disable-line
    }
  }
}

function formatMsgForFB(message) {
  if (message.type === 'text') {
    return {
      text: message
    };
  }
  return {
    text: 'invalid response sent'
  };
}

function sendFBMessage(userId, message) {
  rp({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: process.env.FB_PAGE_ACCESS_TOKEN
    },
    method: 'POST',
    json: {
      recipient: {
        id: userId
      },
      message,
    }
  });
}
