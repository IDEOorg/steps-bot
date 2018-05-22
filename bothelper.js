require('dotenv').config();
const RiveScript = require('rivescript');

const self = this;
self.riveBot = setupRiveScript();

const getResponse = (platform, userId, userMessage) => {
  self.riveBot.setUservar(userId, 'topic', 'checkin');
  const botResponse = self.riveBot.reply(userId, userMessage, self);
  const messages = parseResponse(botResponse);
  return {
    messages
  };
};

module.exports = {
  getResponse
};

function setupRiveScript() {
  const bot = new RiveScript();
  bot.loadDirectory('scriptsv2', () => {
    bot.sortReplies();
  });
  return bot;
}

function parseResponse(response) {
  const sendRegex = /<send>/g;
  const regex = {
    image: /\^image\("(.*?)"\)/g,
    imageForSplit: /\^image\(".*"\)/g,
    template: /\^template\("(.*?)"\)/g,
    templateStrings: /`(.*?)`/g
  };
  const messages = response.split(sendRegex);
  const finalMessages = [];
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const messageType = getMessageType(message, regex);
    if (messageType === 'text') {
      prepareTextMessage(finalMessages, message);
    } else if (messageType === 'image') {
      prepareImageMessage(finalMessages, message, regex);
    } else if (messageType === 'template') {
      prepareTemplateMessage(finalMessages, message);
    }
  }
  return finalMessages;
}

function getMessageType(message, regex) {
  if (message.match(regex.image)) {
    return 'image';
  } else if (message.match(regex.template)) {
    return 'template';
  }
  return 'text';
}

function prepareTextMessage(finalMessages, message) {
  finalMessages.push({
    type: 'text',
    message
  });
}

function prepareImageMessage(finalMessages, message, regex) {
  const imageUrls = message.match(regex.image).map(tag => tag.replace(regex.image, '$1'));
  const textMessages = message.split(regex.imageForSplit);
  let text = null;
  const image = imageUrls[0];
  for (let j = 0; j < textMessages.length; j++) {
    if (textMessages[j] !== '') {
      text = textMessages[j];
      break;
    }
  }
  finalMessages.push({
    type: 'image',
    message: text,
    image
  });
}

function prepareTemplateMessage(finalMessages, message, regex) {
  const defaultErrorMessage = {
    type: 'text',
    message: 'There was an error on our side. Type START and try again.'
  };
  const templateArgs = message.replace(regex.template, '$1').match(regex.templateStrings);
  if (templateArgs.length === 0) {
    return defaultErrorMessage;
  }
  const templateType = templateArgs[0];
  if (templateType === 'quickreply') {
    return {
      type: templateType,
      buttons: templateArgs.slice(1)
    };
  } else if (templateType === 'genericurl' || templateType === 'generic') {
    if (templateArgs.length < 4) {
      return defaultErrorMessage;
    }
    const imageUrl = templateArgs[1];
    const content = templateArgs[2];
    const buttons = JSON.stringify(templateArgs[3]);
    return {
      type: templateType,
      imageUrl,
      content,
      buttons
    };
  } else if (templateType === 'button') {
    if (templateArgs.length < 3) {
      return defaultErrorMessage;
    }
    const content = templateArgs[1];
    const buttons = JSON.stringify(templateArgs[2]);
    return {
      type: templateType,
      content,
      buttons
    };
  }
  return defaultErrorMessage;
}
