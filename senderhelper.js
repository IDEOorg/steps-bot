require('dotenv').config();
const rp = require('request-promise');

module.exports = {
  sendReply
};

async function sendReply(platform, userId, messages) {
  console.log('reply being sent');
  console.log(messages);
  if (platform === 'fb') {
    for (let i = 0; i < messages.length; i++) {
      console.log('message ' + i);
      const message = messages[i];
      const formattedMessage = formatMsgForFB(message);
      await sendFBMessage(userId, formattedMessage); // eslint-disable-line
    }
  }
}

function formatMsgForFB(message) {
  if (message.type === 'text') {
    return {
      text: message.message
    };
  }
  return {
    text: 'invalid response sent'
  };
}

function sendFBMessage(userId, message) {
  return rp({
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
