require('dotenv').config();
const api = require('./api');
const constants = require('./constants');
const rp = require('request-promise');
const twilio = require('twilio');

module.exports = class Messenger {
  constructor(opts) {
    this.platform = opts.platform;
    this.userPlatformId = opts.userPlatformId;
    this.messages = opts.messages;
    this.isMessageSentFromCheckIn = opts.isMessageSentFromCheckIn;
    this.client = opts.client;
  }
  
  // sends the message to the Facebook or SMS platform
  async sendReply() {
    if (this.messages === null) {
      return;
    }
    for (let i = 0; i < this.messages.length; i++) {
      const message = this.messages[i];
      let formattedMsg = null;
      if (this.platform === constants.FB) {
        formattedMsg = formatMsgForFB(message);
        try {
          await sendFBMessage(this.userPlatformId, formattedMsg, this.isMessageSentFromCheckIn); // eslint-disable-line
          await sleep(300); // eslint-disable-line
        } catch (e) {
          console.log(`There's been an error. sendFBMessage did not send message to ${this.userPlatformId}.`);
          continue; // eslint-disable-line
        }
      } else { // platform is sms
        formattedMsg = formatMsgForSMS(message);
        try {
          await sendSMSMessage(this.userPlatformId, formattedMsg, this.client.org_id); // eslint-disable-line
          if (message.type === 'image') {
            await sleep(3100); // eslint-disable-line
          } else {
            await sleep(800); // eslint-disable-line
          }
        } catch (e) {
          console.log(`There's been an error. sendSMSMessage did not send message: "${formattedMsg.body}" to ${this.userPlatformId}.This likely means the organisation's phone number is invalid`);
          continue; // eslint-disable-line
        }
      }
      this.addMessageToUserLog(message); // NOTE: the unformatted message is passed in as the argument here, NOT the formattedMsg
    }
  }
  // adds the message to the Admin API so it shows up in the user's message log
  addMessageToUserLog(message) {
    if (this.client) {
      let messageToUpload = null;
      if (this.platform === constants.FB) {
        switch (message.type) {
          case 'text':
            messageToUpload = message.message;
            break;
          case 'image':
            messageToUpload = message.image;
            break;
          case 'quickreply':
            messageToUpload = message.text;
            break;
          case 'generic':
            messageToUpload = message.content;
            break;
          case 'genericurl':
            messageToUpload = message.content;
            break;
          case 'button':
            messageToUpload = message.content;
            break;
          default:
            messageToUpload = constants.DEFAULT_ERR_MESSAGE;
        }
      } else { // platform is SMS
        if (message.type === 'text') { // eslint-disable-line
          messageToUpload = message.message;
        } else if (message.type === 'image') {
          messageToUpload = message.image;
        }
      }
      api.createMessage(null, process.env.BOT_ID, this.client.id, messageToUpload, this.client.topic);
    }
  }
};

function formatMsgForFB(message) {
  const { type } = message;
  if (type === 'text') {
    return {
      text: message.message
    };
  } else if (type === 'image') {
    if (message.image) {
      return {
        attachment: {
          type: 'image',
          payload: {
            url: message.image,
            is_reusable: true
          }
        }
      };
    }
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
    text: constants.DEFAULT_ERR_MESSAGE
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
      mediaUrl: message.image
    };
  }
  return {
    body: 'This message should not be showing up and is an error on our part.'
  };
}

function sendFBMessage(userId, message, isMessageSentFromCheckIn) {
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
      messaging_type: isMessageSentFromCheckIn ? 'MESSAGE_TAG' : 'RESPONSE',
      tag: isMessageSentFromCheckIn ? 'NON_PROMOTIONAL_SUBSCRIPTION' : null
    }
  });
}

/**
 * This functions sends SMS to the client from the bot via twilio
 * @param {number} userId the phone number of the user
 * @param {object} message the message object
 * @param {number} orgId The ID of the organization
 * @returns twilio promise
 */
async function sendSMSMessage(userId, message, orgId) {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_NUMBER,
    NODE_ENV,
  } = process.env;
  const orgCredentials = await api.getOrg(orgId);
  let twilioAccountSid = orgCredentials.account_sid;
  let twilioAuthToken = orgCredentials.auth_token;
  let twilioPhoneNumber = orgCredentials.twilio_number;

  if (NODE_ENV !== 'production') {
    twilioAccountSid = TWILIO_ACCOUNT_SID;
    twilioAuthToken = TWILIO_AUTH_TOKEN;
    twilioPhoneNumber = TWILIO_NUMBER;
  }

  const twilioClient = twilio(twilioAccountSid, twilioAuthToken);
  const twilioMessage = {
    from: twilioPhoneNumber,
    to: userId,
    ...message,
  };
  return twilioClient.messages.create(twilioMessage);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
