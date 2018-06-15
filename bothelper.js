require('dotenv').config();
const RiveScript = require('rivescript');
const rp = require('request-promise');
const assetUrls = require('./data/assets-manifest.json');

const self = this;
self.riveBot = setupRiveScript();

module.exports = {
  getResponse,
  resetVariables
};

function resetVariables(userId) {
  const { riveBot } = self;
  riveBot.setUservar(userId, 'timeOfDay', null);
  riveBot.setUservar(userId, 'days', null);
  riveBot.setUservar(userId, 'hours', null);
  riveBot.setUservar(userId, 'nextTopic', null);
  riveBot.setUservar(userId, 'nextMessage', null);
  riveBot.setUservar(userId, 'contentViewed', null);
  riveBot.setUservar(userId, 'taskComplete', null);
  riveBot.setUservar(userId, 'resetHelp', null);
  riveBot.setUservar(userId, 'helpResponse', null);
  riveBot.setUservar(userId, 'sendHelpResponse', null);
}

async function getResponse(platform, userId, userMessage, topic) {
  const userInfo = await getUserDataFromDB(userId);
  if (!userInfo) {
    // user doesn't exist in db
    // TODO handle user doesn't exist in db
  }
  const tasks = getTasks(userInfo.id);
  userInfo.tasks = tasks;
  loadVarsToRiveBot(self.riveBot, userInfo, platform);
  self.riveBot.setUservar(userId, 'platform', platform);
  if (topic) {
    self.riveBot.setUservar(userId, 'topic', topic);
  }
  const botResponse = self.riveBot.reply(userId, userMessage, self);
  const messages = parseResponse(botResponse, platform);
  return {
    messages,
    variables: self.riveBot.getUservars(userId)
  };
}

// if there's a user, return api/client/id data, otherwise return null
async function getUserDataFromDB(userId) {
  let clients = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients'
  });
  clients = JSON.parse(clients);
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    if (client.phone === userId && client.coach_id !== null) {
      return client;
    }
  }
  return null;
}

async function loadVarsToRiveBot(riveBot, userInfo, platform) {
  const firstName = userInfo.first_name;
  const workplanUrl = '8th plan'; // TODO blocked
  const {
    tasks,
  } = userInfo;
  const userPlatform = userInfo.platform;
  let {
    topic
  } = userInfo;
  const orgName = await getOrgName(userInfo.org_id);
  const coachName = await getCoachName(userInfo.coach_id);
  let viewedMedia = null;
  let userId = null;
  if (topic === null) {
    userId = userInfo.phone;
    if (userPlatform === 'FBOOK') {
      topic = 'setupfb'; // TODO write rivescript
    } else {
      topic = 'welcome';
    }
  } else if (userPlatform === 'FBOOK') {
    if (platform === 'sms') { // user has registered fb account but sends SMS
      // TODO do nothing
    }
    if (!userInfo.fb_id) {
      // TODO first fb message
    }
    userId = userInfo.fb_id;
  } else { // is SMS
    userId = userInfo.phone;
  }

  let taskNum = 0;
  let incompleteTaskFound = false;
  let currentTask = null;
  for (let i = 0; i < tasks.length; i++) {
    if (!tasks[i].recurring) {
      taskNum = i + 1;
    }
    if (!tasks[i].complete && !tasks[i].recurring) {
      currentTask = tasks[i].text;
      incompleteTaskFound = true;
      break;
    }
  }
  // TODO handle all tasks completed scenario
  // console.log(incompleteTaskFound);

  let contentIdChosen = null;
  let contentText = null;
  let contentUrl = null;
  topic = 'content';
  if (topic === 'content') {
    viewedMedia = await getViewedMediaIds(userInfo.id);
    const allContent = await getAllMedia();
    for (let i = 0; i < allContent.length; i++) {
      const content = allContent[i];
      if (!viewedMedia || !viewedMedia.includes(content.id)) {
        contentIdChosen = content.id;
        contentText = content.title;
        contentUrl = content.url;
        break;
      }
    }
  }
  const storiesImgUrl = assetUrls.baseUrl + assetUrls.stories.path + getRandomItemFromArray(assetUrls.stories.images);
  const celebrationImgUrl = assetUrls.baseUrl + assetUrls.done.path + getRandomItemFromArray(assetUrls.done.images);
  const welcomeImgUrl = assetUrls.baseUrl + assetUrls.welcome.path + getRandomItemFromArray(assetUrls.welcome.images);
  const workplanImgUrl = assetUrls.baseUrl + assetUrls.welcome.path + assetUrls.welcome.workplanUrl;
  const clappingImgUrl = assetUrls.baseUrl + assetUrls.welcome.path + assetUrls.welcome.clappingUrl;
  const checkinImgUrl = assetUrls.baseUrl + assetUrls.checkin.path + getRandomItemFromArray(assetUrls.checkin.images);
  const taskNumUrl = assetUrls.baseUrl + assetUrls.tasks.path + taskNum + '.png'; // eslint-disable-line
  riveBot.setUservar(userId, 'topic', topic);
  riveBot.setUservar(userId, 'username', firstName);
  riveBot.setUservar(userId, 'coachName', coachName);
  riveBot.setUservar(userId, 'orgName', orgName);
  riveBot.setUservar(userId, 'taskNum', taskNum);
  riveBot.setUservar(userId, 'contentId', contentIdChosen);
  riveBot.setUservar(userId, 'content', contentText);
  riveBot.setUservar(userId, 'contentUrl', contentUrl);
  riveBot.setUservar(userId, 'currentTask', currentTask);
  riveBot.setUservar(userId, 'storiesImgUrl', storiesImgUrl);
  riveBot.setUservar(userId, 'celebrationImgUrl', celebrationImgUrl);
  riveBot.setUservar(userId, 'welcomeImgUrl', welcomeImgUrl);
  riveBot.setUservar(userId, 'workplanImgUrl', workplanImgUrl);
  riveBot.setUservar(userId, 'clappingImgUrl', clappingImgUrl);
  riveBot.setUservar(userId, 'taskNumImgUrl', taskNumUrl);
  riveBot.setUservar(userId, 'checkinImgUrl', checkinImgUrl);
  riveBot.setUservar(userId, 'workplanLink', workplanUrl);
  riveBot.setUservar(userId, 'introVideoLink', assetUrls.videoUrl);
}

function setupRiveScript() {
  const bot = new RiveScript();
  bot.loadDirectory('scriptsv2', () => {
    bot.sortReplies();
  });
  return bot;
}

function parseResponse(response, platform) {
  const sendRegex = /<send>/g;
  const regex = {
    image: /\^image\("(.*?)"\)/g,
    imageForSplit: /\^image\(".*"\)/g,
    template: /\^template\(([\s\S]*?)\)/g,
    templateForSplit: /\^template\(([\s\S]*)\)/g,
    templateStrings: /`([\s\S]*?)`/g,
    sms: /<sms>([\s\S]*?)<\/sms>/g,
    fb: /<fb>([\s\S]*?)<\/fb>/g,
    nonwhitespaceChars: /\S/
  };
  if (platform === 'fb') {
    response = response.replace(regex.sms, '');
    response = response.replace(regex.fb, '$1');
  } else if (platform === 'sms') {
    response = response.replace(regex.fb, '');
    response = response.replace(regex.sms, '$1');
  }
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
      prepareTemplateMessage(finalMessages, message, regex);
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
  finalMessages.push({
    type: 'image',
    image
  });
  for (let j = 0; j < textMessages.length; j++) {
    if (textMessages[j] && regex.nonwhitespaceChars.test(textMessages[j])) {
      text = textMessages[j];
      finalMessages.push({
        type: 'text',
        message: text
      });
      break;
    }
  }
}

function prepareTemplateMessage(finalMessages, message, regex) {
  const defaultErrorMessage = {
    type: 'text',
    message: 'There was an error on our side. Type START and try again.'
  };
  let templateArgs = message.replace(regex.template, '$1').match(regex.templateStrings);
  if (templateArgs.length === 0) {
    finalMessages.push(defaultErrorMessage);
    return;
  }
  templateArgs = templateArgs.map(arg => arg.replace(/`/g, ''));
  const templateType = templateArgs[0];
  let messageToPush = null;
  if (templateType === 'quickreply') {
    let introText = null;
    const introTextBits = message.split(regex.templateForSplit);
    for (let i = 0; i < introTextBits.length; i++) {
      if (regex.nonwhitespaceChars.test(introTextBits[i] && i !== 1)) {
        introText = introTextBits[i];
        break;
      }
    }
    messageToPush = {
      type: templateType,
      text: introText,
      buttons: templateArgs.slice(1)
    };
  } else if (templateType === 'genericurl' || templateType === 'generic') {
    if (templateArgs.length < 4) {
      messageToPush = defaultErrorMessage;
    }
    const imageUrl = templateArgs[1];
    const content = templateArgs[2];
    const buttons = JSON.parse(templateArgs[3]);
    messageToPush = {
      type: templateType,
      imageUrl,
      content,
      buttons
    };
  } else if (templateType === 'button') {
    if (templateArgs.length < 3) {
      messageToPush = defaultErrorMessage;
    }
    const content = templateArgs[1];
    const buttons = JSON.parse(templateArgs[2]);
    messageToPush = {
      type: templateType,
      content,
      buttons
    };
  } else {
    messageToPush = defaultErrorMessage;
  }
  finalMessages.push(messageToPush);
}

async function getTasks(id) {
  let tasks = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + id.toString() + '/tasks'
  });
  tasks = JSON.parse(tasks);
  return tasks;
}

async function getOrgName(id) {
  let org = await rp({
    method: 'GET',
    uri: assetUrls.url + '/orgs/' + id.toString()
  });
  org = JSON.parse(org);
  if (org) {
    return org.name;
  }
  return null;
}

async function getCoachName(id) {
  let coach = await rp({
    method: 'GET',
    uri: assetUrls.url + '/coaches/' + id.toString()
  });
  coach = JSON.parse(coach);
  if (coach) {
    return coach.first_name;
  }
  return null;
}
async function getAllMedia() {
  let listOfMedia = await rp({
    method: 'GET',
    uri: assetUrls.url + '/media'
  });
  listOfMedia = JSON.parse(listOfMedia);
  return listOfMedia.filter((media) => {
    return media.type === 'STORY' || media.type === 'GENERAL_EDUCATION';
  });
}

async function getViewedMediaIds(id) {
  let viewedMedia = await rp({
    method: 'GET',
    uri: assetUrls.url + '/clients/' + id.toString() + '/viewed_media'
  });
  viewedMedia = JSON.parse(viewedMedia);
  return viewedMedia.map((media) => {
    return media.id;
  });
}

function getRandomItemFromArray(array) {
  if (array.length) {
    return array[Math.floor(Math.random() * array.length)];
  }
  return null;
}
