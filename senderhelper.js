require('dotenv').config();
const rp = require('request-promise');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;
const twilioClient = require('twilio')(accountSid, authToken);
const api = require('./apihelper');

const BOT_ID = 41;

module.exports = {
  sendReply
};

async function sendReply(platform, fsad, messages) {
  const client = await api.getUserDataFromDB(platform, userPlatformId);
  console.log('messages*************************');
  console.log(messages);
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    let formattedMsg = null;
    if (platform === 'fb') {
      formattedMsg = formatMsgForFB(message);
      await sendFBMessage(userPlatformId, formattedMsg); // eslint-disable-line
      await sleep(5100); // eslint-disable-line
    } else if (platform === 'sms') {
      formattedMsg = formatMsgForSMS(message);
      await sendSMSMessage(userPlatformId, formattedMsg); // eslint-disable-line
      if (message.type === 'image') {
        await sleep(5100); // eslint-disable-line
      } else {
        await sleep(1100); // eslint-disable-line
        api.createMessage(null, BOT_ID, client.id, formattedMsg.body);
      }
    }
    break;
  }
}

function formatMsgForFB(message) {
  const { type } = message;
  if (type === 'text') {
    return {
      text: message.message
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
      text: message.text,
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

function formatMsgForSMS(message) {
  const { type } = message;
  if (type === 'text') {
    return {
      body: message.message
    };
  } else if (type === 'image') {
    return {
      body: message.message,
      mediaUrl: message.image
    };
  }
  return {
    body: 'This message should not be showing up and is an error on our part.'
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

function sendSMSMessage(userId, message) {
  const twilioMessage = Object.assign({
    from: twilioNumber,
    to: userId
  }, message);
  return twilioClient.messages.create(twilioMessage);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
