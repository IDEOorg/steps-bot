require('dotenv').config();
const rp = require('request-promise');
const utf8 = require('utf8');

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
  const { type } = message;
  if (type === 'text') {
    console.log(utf8.encode(message.message));
    return {
      text: utf8.encode(message.message)
    };
  } else if (type === 'image') {
    return {
      attachment: {
        type: 'image',
        payload: {
          url: message.image,
          is_reusable: true
        }
      }
    };
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
  } else if (type === 'generic' || type === 'genericurl') {
    let buttons = null;
    if (type === 'generic') {
      buttons = Object.keys(message.buttons).map((title) => {
        return {
          type: 'postback',
          title: message.buttons[title],
          payload: title
        };
      });
    } else if (type === 'genericurl') {
      buttons = Object.keys(message.buttons).map((url) => {
        return {
          type: 'web_url',
          title: message.buttons[url],
          url
        };
      });
    }
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
  } else if (type === 'button') {
    const buttons = Object.keys(message.buttons).map((action) => {
      return {
        type: 'postback',
        title: message.buttons[action],
        payload: action
      };
    });
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: message.content,
          buttons
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
