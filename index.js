require('dotenv').config();
const Botkit = require('botkit');
const firebase = require('firebase');
const RiveScript = require('rivescript');

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
        nextCheckInDate: null // fill this in
      };
      database.ref(`users/${userId}`).set(userInfo);
    } else {
      userInfo = snapshot.val();
    }
    const { topic } = userInfo;
    console.log(topic);
    self.riveBot.setUservar(userId, 'topic', topic);
    const userMessage = message.text;
    const botResponse = self.riveBot.reply(userId, userMessage, self);
    // userIdRef.remove();
    console.log(self.riveBot.getUservars(userId));
    const botResponseFormatted = parseResponse(botResponse);
    bot.reply(message, botResponseFormatted);

    // update data
    const newTopic = self.riveBot.getUservar(userId, 'topic');
    const updates = {
      topic: newTopic // new topic
    };
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
  return response;
}
