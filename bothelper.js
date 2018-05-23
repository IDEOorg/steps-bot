require('dotenv').config();
const RiveScript = require('rivescript');
const firebase = require('firebase');

const self = this;
self.riveBot = setupRiveScript();
const firebaseDatabase = setupFirebase();

async function getResponse(platform, userId, userMessage) {
  getUserDataFromFirebase(userId);
  self.riveBot.setUservar(userId, 'topic', 'content');
  const botResponse = self.riveBot.reply(userId, userMessage, self);
  const messages = parseResponse(botResponse);
  return {
    messages
  };
}

function getUserDataFromFirebase(userId) {
  const usersRef = firebaseDatabase.ref('users');
  const userIdRef = usersRef.child(userId).once('value');
  return userIdRef.then((snapshot) => {
    let userInfo = null;
    if (!snapshot.exists()) { // if new user, add to firebase
      userInfo = initNewUser(userId);
    } else {
      userInfo = snapshot.val();
    }
    return userInfo;
  });
}

function initNewUser(userId) {
  const userInfo = {
    user: userId,
    phone: userId,
    topic: 'intro',
    nextTopic: null,
    workplan,
    viewedMedia: [],
    followUpCheckIns: {}
  };
  firebaseDatabase.ref(`users/${userId}`).set(userInfo);
  return userInfo;
}

const setupFirebase = () => {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: 'bedstuy-bdf4e.firebaseapp.com',
    databaseURL: 'https://bedstuy-bdf4e.firebaseio.com',
    projectId: 'bedstuy-bdf4e',
    storageBucket: 'bedstuy-bdf4e.appspot.com'
  };
  firebase.initializeApp(config);
  firebase.auth().signInWithEmailAndPassword(process.env.FIREBASE_EMAIL, process.env.FIREBASE_PASSWORD);
  return firebase.database();
};

module.exports = {
  getResponse,
  setupFirebase
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
    template: /\^template\((.*?)\)/g,
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
  let templateArgs = message.replace(regex.template, '$1').match(regex.templateStrings);
  if (templateArgs.length === 0) {
    finalMessages.push(defaultErrorMessage);
    return;
  }
  templateArgs = templateArgs.map(arg => arg.replace(/`/g, ''));
  const templateType = templateArgs[0];
  let messageToPush = null;
  console.log(templateType);
  if (templateType === 'quickreply') {
    messageToPush = {
      type: templateType,
      buttons: templateArgs.slice(1)
    };
  } else if (templateType === 'genericurl' || templateType === 'generic') {
    if (templateArgs.length < 4) {
      messageToPush = defaultErrorMessage;
    }
    const imageUrl = templateArgs[1];
    const content = templateArgs[2];
    const buttons = JSON.stringify(templateArgs[3]);
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
    const buttons = JSON.stringify(templateArgs[2]);
    messageToPush = {
      type: templateType,
      content,
      buttons
    };
  } else {
    console.log('hey');
    messageToPush = defaultErrorMessage;
  }
  finalMessages.push(messageToPush);
}
