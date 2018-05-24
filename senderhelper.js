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
      const message = messages[i];
      const formattedMessage = formatMsgForFB(message);
      await sendFBMessage(userId, formattedMessage); // eslint-disable-line
    }
  }
}

function formatMsgForFB(message) {
  const { type } = message;
  if (type === 'text') {
    return {
      text: message.message
    };
  } else if (type === 'image') {
    const payload = {
      attachment: {
        type: 'image',
        payload: {
          url: message.image,
          is_reusable: true
        }
      }
    };
    if (message.message) {
      payload.text = message.message;
    }
    return payload;
  } else if (type === 'quickreply') {
    const quickReplies = message.buttons.map((text) => { // eslint-disable-line
      return {
        content_type: 'text',
        title: text,
        payload: text
      };
    });
    return {
      attachment: {
        type: 'image',
        payload: {
          url: message.image,
          is_reusable: true
        }
      },
      quick_replies: quickReplies
    };
  } else if (type === 'generic') {
    const buttons = message.buttons.map((title) => {
      return {
        type: 'postback',
        title: message.buttons[title],
        payload: title
      };
    });
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [
            {
              title: message.content,
              image_url: message.imageUrl,
              buttons
            }
          ]
        }
      }
    };
  }
  return {
    text: 'This message should not be showing up and is an error on our part.'
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
