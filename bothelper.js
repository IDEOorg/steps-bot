require('dotenv').config();
const RiveScript = require('rivescript');
const firebase = require('firebase');
const assetUrls = require('./data/assets-manifest.json');
const userData = require('./data/data.json');
const contentData = require('./data/content.json');

const self = this;
self.riveBot = setupRiveScript();

module.exports = {
  getResponse,
  setupFirebase,
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

async function getResponse(db, platform, userId, userMessage, topic) {
  const userInfo = await getUserDataFromFirebase(db, userId);
  formatTasks(userInfo);
  loadVarsToRiveBot(self.riveBot, userInfo);
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

function getUserDataFromFirebase(firebaseDatabase, userId) {
  const usersRef = firebaseDatabase.ref('users');
  const userIdRef = usersRef.child(userId).once('value');
  return userIdRef.then((snapshot) => {
    let userInfo = null;
    if (!snapshot.exists()) { // if new user, add to firebase
      userInfo = initNewUser(firebaseDatabase, userId);
    } else {
      userInfo = snapshot.val();
    }
    return userInfo;
  });
}

function initNewUser(db, userId) {
  const firstName = userData.username;
  const tasks = userData.workplan;
  const workplanUrl = userData.workplanLink;
  const coachName = userData.coachname;
  const orgName = userData.orgname;
  const userInfo = {
    user: userId,
    phone: userId,
    firstName,
    coachName,
    orgName,
    topic: 'welcome',
    tasks,
    workplanUrl,
    followUpCheckIns: {}
  };
  db.ref(`users/${userId}`).set(userInfo);
  return userInfo;
}

function loadVarsToRiveBot(riveBot, userInfo) {
  const {
    user,
    topic,
    firstName,
    coachName,
    orgName,
    tasks,
    viewedMedia,
    workplanUrl
  } = userInfo;
  const userId = user;
  let taskNum = null;
  let currentTask = null;
  for (let i = 0; i < tasks.length; i++) {
    if (!tasks[i].complete && !tasks[i].recurring) {
      currentTask = tasks[i].text;
      taskNum = i + 1;
      break;
    }
  }
  const allContent = contentData.content;
  const contentIds = Object.keys(allContent);
  let contentIdChosen = null;
  let contentText = null;
  let contentUrl = null;
  for (let i = 0; i < contentIds.length; i++) {
    const contentId = contentIds[i];
    if (!viewedMedia) {
      contentIdChosen = contentId;
      break;
    } else if (!Object.values(viewedMedia).includes(contentId)) {
      contentIdChosen = contentId;
      break;
    }
  }
  if (contentIdChosen) {
    const { content, url } = allContent[contentIdChosen];
    contentText = content || '';
    contentUrl = url || '';
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
    template: /\^template\((.*?)\)/g,
    templateForSplit: /\^template\((.*)\)/g,
    templateStrings: /`(.*?)`/g,
    sms: /<sms>([\s\S]*?)<\/sms>/g,
    fb: /<fb>([\s\S]*?)<\/fb>/g,
    nonwhitespaceChars: /\S/
  };
  if (platform === 'fb') {
    response = response.replace(regex.sms, '');
    console.log(response);
    response = response.replace(regex.fb, '$1');
    console.log(response);
    console.log('respoeeeeeeeeeeeeeeeeense');
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

function formatTasks(userInfo) {
  const taskIds = Object.keys(userInfo.tasks);
  userInfo.tasks = taskIds.map(id => userInfo.tasks[id]);
}

function getRandomItemFromArray(array) {
  if (array.length) {
    return array[Math.floor(Math.random() * array.length)];
  }
  return null;
}

async function setupFirebase() {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: 'bedstuy-bdf4e.firebaseapp.com',
    databaseURL: 'https://bedstuy-bdf4e.firebaseio.com',
    projectId: 'bedstuy-bdf4e',
    storageBucket: 'bedstuy-bdf4e.appspot.com'
  };
  firebase.initializeApp(config);
  await firebase.auth().signInWithEmailAndPassword(process.env.FIREBASE_EMAIL, process.env.FIREBASE_PASSWORD);
  return firebase.database();
}
