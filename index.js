require('dotenv').config();
const Botkit = require('botkit');
const firebase = require('firebase');
const RiveScript = require('rivescript');
const moment = require('moment');

const database = setupFirebase();
const self = this;
self.riveBot = setupRiveScript();
const controller = setupBotkitServer();
// setInterval(() => {
//   console.log('hey');
// }, 300000);

controller.hears('.*', 'message_received', (bot, message) => {
  const userId = message.user;
  // update chat log, timestamp, who sent message (bot or human), what message said
  // update next check in date
  const userIdRef = database.ref('users').child(userId);
  const userIdPromise = userIdRef.once('value');
  userIdPromise.then((snapshot) => {
    let userInfo = null;
    if (!snapshot.exists()) { // if new user, add to firebase
      userInfo = {
        user: userId,
        phone: userId,
        topic: 'intro',
        nextTopic: null,
        nextCheckInDate: null // fill this in
      };
      database.ref(`users/${userId}`).set(userInfo);
    } else {
      userInfo = snapshot.val();
    }
    const currTopic = userInfo.topic;
    self.riveBot.setUservar(userId, 'topic', currTopic);
    const userMessage = message.text;
    const botResponse = self.riveBot.reply(userId, userMessage, self);
    // userIdRef.remove();
    const formattedResponses = parseResponse(botResponse);
    console.log(formattedResponses);
    for (let i = 0; i < formattedResponses.length; i++) {
      const response = formattedResponses[i];
      if (typeof response === 'string') {
        bot.reply(message, response);
      } else if (typeof response === 'object') {
        bot.reply(message, response);
      }
    }

    // update data
    const {
      topic,
      days,
      hours,
      timeOfDay,
      nextTopic
    } = self.riveBot.getUservars(userId);
    const updates = {
    };
    updates.nextCheckInDate = getNextCheckInDate(days, hours, timeOfDay);
    if (topic) {
      updates.topic = topic;
    }
    if (nextTopic) {
      updates.nextTopic = nextTopic;
    }
    userIdRef.update(updates);
  });
});

function setupBotkitServer() {
  const newController = Botkit.twiliosmsbot({
    account_sid: process.env.TWILIO_ACCOUNT_SID,
    auth_token: process.env.TWILIO_AUTH_TOKEN,
    twilio_number: process.env.TWILIO_NUMBER,
    debug: true
  });

  const instance = newController.spawn({});

  newController.setupWebserver(process.env.PORT || 3000, () => {
    newController.createWebhookEndpoints(newController.webserver, instance, () => {
      console.log('TwilioSMSBot is online!');
    });
  });
  return newController;
}

function setupRiveScript() {
  const bot = new RiveScript();
  bot.loadDirectory('chatscripts', (batchNum) => {
    console.log(batchNum);
    bot.sortReplies();
  });
  return bot;
}

function setupFirebase() {
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
}

function parseResponse(response) {
  const imageRegex = /\^image\("(.*?)"\)/g;
  const sendRegex = /<send>/g;
  const messages = response.split(sendRegex);
  const finalMessages = [];
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    console.log('message');
    console.log(message);
    const imageTags = message.match(imageRegex);
    let imageUrls = null;
    if (imageTags) {
      imageUrls = imageTags.map(tag => tag.replace(imageRegex, '$1'));
    }
    const textMessages = message.split(imageRegex);
    for (let j = 0; j < textMessages.length; j++) {
      if (textMessages[j] !== '') {
        finalMessages.push(textMessages[j]);
      }
    }
    if (imageUrls) {
      for (let j = 0; j < imageUrls.length; j++) {
        finalMessages.push({
          mediaUrl: imageUrls[j]
        });
      }
    }
  }
  return finalMessages;
}

function getNextCheckInDate(days, hours, timeOfDay) {
  if (!days && !hours && !timeOfDay) {
    return null;
  }
  let checkInDate = moment();
  if (days) {
    checkInDate = checkInDate.add(parseInt(days, 10), 'days');
  }
  if (hours) {
    checkInDate = checkInDate.add(parseInt(hours, 10), 'hours');
    return checkInDate.valueOf();
  }
  if (timeOfDay) {
    if (timeOfDay.toUpperCase() === 'MORNING') {
      checkInDate = checkInDate.hours(9).minutes(0).seconds(0);
    } else if (timeOfDay.toUpperCase() === 'AFTERNOON') {
      checkInDate = checkInDate.hours(14).minutes(30).seconds(0);
    }
  }
  return checkInDate.valueOf();
}
