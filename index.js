require('dotenv').config();
const fs = require('fs');
const Botkit = require('botkit');
const firebase = require('firebase');
const RiveScript = require('rivescript');
const moment = require('moment-timezone');

const database = setupFirebase();
const usersRef = database.ref('users');
const self = this;
self.riveBot = setupRiveScript();
const controller = setupBotkitServer();
const checkInBot = controller.spawn({});
// setInterval(() => {
//   let currentTime = Date.now();
//
// }, 300000);
setInterval(() => {
  usersRef.once('value').then((snapshot) => {
    const usersData = snapshot.val();
    const users = Object.keys(usersData);
    for (let i = 0; i < users.length; i++) {
      const userId = users[i];
      const userData = usersData[userId];
      const { nextCheckInDate } = userData;
      if (nextCheckInDate && nextCheckInDate < Date.now()) {
        // send reply
        const topicToShow = userData.nextTopic;
        self.riveBot.setUservar(userId, 'topic', topicToShow);
        const botResponse = self.riveBot.reply(userId, 'initscript', self);
        const formattedResponses = parseResponse(botResponse);
        console.log(formattedResponses);
        for (let j = 0; j < formattedResponses.length; j++) {
          const response = formattedResponses[j];
          let formattedResponse = null;
          if (typeof response === 'string') {
            formattedResponse = {
              text: response,
              channel: userId
            };
          } else {
            formattedResponse = response;
            formattedResponse.channel = userId;
          }
          checkInBot.say(formattedResponse, () => {});
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
          nextTopic: null,
          nextCheckInDate: null
        };
        updates.nextCheckInDate = getNextCheckInDate(days, hours, timeOfDay);
        if (topic) {
          updates.topic = topic;
        }
        if (nextTopic) {
          updates.nextTopic = nextTopic;
        }
        const userIdRef = usersRef.child(userId);
        userIdRef.update(updates);
      }
    }
  });
}, 300000);


controller.hears('.*', 'message_received', (bot, message) => {
  const userId = message.user;
  // update chat log, timestamp, who sent message (bot or human), what message said
  // update next check in date
  const userIdRef = usersRef.child(userId);
  const userIdPromise = userIdRef.once('value');
  const workplan = JSON.parse(fs.readFileSync('./chatscripts/workplan.json')).tasks;
  userIdPromise.then((snapshot) => {
    let userInfo = null;
    if (!snapshot.exists()) { // if new user, add to firebase
      userInfo = {
        user: userId,
        phone: userId,
        topic: 'intro',
        nextTopic: null,
        nextCheckInDate: null, // fill this in
        workplan
      };
      database.ref(`users/${userId}`).set(userInfo);
    } else {
      userInfo = snapshot.val();
    }
    const currTask = userInfo.workplan[0];
    const currTopic = userInfo.topic;
    self.riveBot.setUservar(userId, 'topic', currTopic);
    self.riveBot.setUservar(userId, 'task', currTask);
    const userMessage = message.text;
    const botResponse = self.riveBot.reply(userId, userMessage, self);
    const formattedResponses = parseResponse(botResponse);
    for (let i = 0; i < formattedResponses.length; i++) {
      const response = formattedResponses[i];
      bot.reply(message, response);
    }

    // update data
    const {
      topic,
      days,
      hours,
      timeOfDay,
      nextTopic,
      nextTask
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
    if (nextTask) {
      const newWorkPlan = userInfo.workplan.slice(1, userInfo.workplan.length);
      updates.workplan = newWorkPlan;
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
  const imageRegexForSplit = /\^image\(".*"\)/g;
  const sendRegex = /<send>/g;
  const messages = response.split(sendRegex);
  const finalMessages = [];
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const imageTags = message.match(imageRegex);
    let imageUrls = null;
    if (imageTags) {
      imageUrls = imageTags.map(tag => tag.replace(imageRegex, '$1'));
    }
    const textMessages = message.split(imageRegexForSplit);
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
  return checkInDate.tz('America/New_York').valueOf();
}
